'use strict';

// All public coordinates are logical 1920 × 1080. The caller owns output scale.
// Affine orthographic projection deliberately keeps UI text in a single draw:
// no texture tessellation, seams, double edges or per-frame blur.
let canvas;
try { canvas = require('@napi-rs/canvas'); }
catch (_) {
  const path = require('node:path');
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw _;
  canvas = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas } = canvas;
const TAU = Math.PI * 2;
let backdrop, glow, shadow, laptopSkin, phoneSkin;

function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function poly(c, points) {
  c.beginPath(); c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.closePath();
}
function fillRound(c, x, y, w, h, r, color) {
  rr(c, x, y, w, h, r); c.fillStyle = color; c.fill();
}
function strokeRound(c, x, y, w, h, r, color, width = 1) {
  rr(c, x, y, w, h, r); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function grad(c, y1, y2, stops) {
  const g = c.createLinearGradient(0, y1, 0, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color)); return g;
}
function rng(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function initAtmosphere() {
  if (backdrop) return;
  backdrop = createCanvas(1920, 1080);
  const c = backdrop.getContext('2d');
  c.fillStyle = grad(c, 0, 1080, [[0, '#07131e'], [.55, '#102731'], [1, '#061018']]);
  c.fillRect(0, 0, 1920, 1080);
  let g = c.createRadialGradient(1110, 470, 10, 1110, 470, 1000);
  g.addColorStop(0, 'rgba(39,91,99,0.28)'); g.addColorStop(.6, 'rgba(17,56,69,0.15)');
  g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  const rand = rng(40823);
  // Fixed, extremely fine texture prevents a flat synthetic gradient without flicker.
  for (let i = 0; i < 36000; i++) {
    c.fillStyle = rand() > .5 ? 'rgba(205,231,234,0.012)' : 'rgba(0,0,0,0.018)';
    c.fillRect(rand() * 1920, rand() * 1080, 1, 1);
  }
  g = c.createRadialGradient(960, 500, 300, 960, 500, 1100);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,5,10,0.1)');
  g.addColorStop(1, 'rgba(0,3,9,0.58)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  glow = createCanvas(1000, 1000);
  const gc = glow.getContext('2d');
  g = gc.createRadialGradient(500, 500, 0, 500, 500, 500);
  g.addColorStop(0, 'rgba(63,180,191,0.095)'); g.addColorStop(.35, 'rgba(37,126,144,0.04)');
  g.addColorStop(1, 'rgba(18,71,86,0)'); gc.fillStyle = g; gc.fillRect(0, 0, 1000, 1000);
  shadow = createCanvas(1200, 280);
  const sc = shadow.getContext('2d'); sc.scale(1, 280 / 1200);
  g = sc.createRadialGradient(600, 600, 0, 600, 600, 590);
  g.addColorStop(0, 'rgba(0,3,9,0.72)'); g.addColorStop(.42, 'rgba(0,3,9,0.38)');
  g.addColorStop(.75, 'rgba(0,3,9,0.1)'); g.addColorStop(1, 'rgba(0,3,9,0)');
  sc.fillStyle = g; sc.fillRect(0, 0, 1200, 1200);
}

function drawBackdrop(ctx, t = 0) {
  initAtmosphere(); ctx.save(); ctx.drawImage(backdrop, 0, 0);
  ctx.drawImage(glow, 450 + Math.sin(t * .055) * 75, 35 + Math.cos(t * .041) * 35, 1200, 1000);
  // Quiet network geometry lives near the edge, leaving the content area clean.
  ctx.lineWidth = .8;
  const drift = Math.sin(t * .065) * 15;
  const nets = [
    [[-100, 145], [180, 240], [315, 78], [430, 348], [190, 477], [-80, 660]],
    [[1495, 50], [1720, 275], [1990, 185], [1782, 495], [2015, 735]],
    [[-40, 926], [220, 806], [420, 1010], [675, 922]],
    [[1370, 1015], [1570, 833], [1780, 935], [1980, 830]],
  ];
  nets.forEach((points, n) => {
    ctx.strokeStyle = `rgba(112,198,205,${n < 2 ? .085 : .052})`;
    ctx.beginPath(); points.forEach(([x, y], i) => {
      const px = x + drift * (n % 2 ? -1 : 1), py = y + Math.cos(t * .05 + n) * 9;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }); ctx.stroke();
    for (let i = 1; i < points.length - 1; i += 2) {
      ctx.beginPath(); ctx.moveTo(points[i - 1][0] + drift, points[i - 1][1]);
      ctx.lineTo(points[i + 1][0] + drift, points[i + 1][1]); ctx.stroke();
    }
  });
  const rand = rng(19023);
  for (let i = 0; i < 34; i++) {
    const x0 = rand() * 1920, y0 = rand() * 1080, depth = rand();
    const x = x0 + Math.sin(t * .035 + i) * (5 + depth * 9);
    const y = y0 + Math.cos(t * .04 + i * .5) * (4 + depth * 8);
    ctx.fillStyle = `rgba(133,219,224,${.07 + depth * .09})`;
    ctx.fillRect(x, y, depth > .8 ? 4.5 : 1.7, depth > .8 ? 1.6 : 1.7);
  }
  ctx.restore();
}

function pose(ctx, opts, baseWidth) {
  const yaw = opts.yaw || 0, pitch = opts.pitch || 0, roll = opts.roll || 0;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll), s = (opts.w || baseWidth) / baseWidth;
  ctx.translate(opts.x == null ? 960 : opts.x, opts.y == null ? 540 : opts.y);
  ctx.transform(cy * cr, cy * sr, sp * sy * cr - cp * sr, sp * sy * sr + cp * cr, 0, 0);
  ctx.scale(s, s);
}
function drawTexture(ctx, source, x, y, w, h, radius) {
  if (!source) return;
  ctx.save(); rr(ctx, x, y, w, h, radius); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, x, y, w, h); ctx.restore();
}

function getLaptopSkin() {
  if (laptopSkin) return laptopSkin;
  laptopSkin = createCanvas(2600, 1860);
  const c = laptopSkin.getContext('2d'); c.scale(2, 2); c.translate(650, 355);
  const W = 1000, H = 625, F = 21, hinge = H / 2 + F;
  // Machined lower case and its visible front thickness.
  poly(c, [[-523, hinge - 1], [523, hinge - 1], [594, 503], [578, 514], [-578, 514], [-594, 503]]);
  c.fillStyle = grad(c, hinge, 514, [[0, '#687984'], [.87, '#86949e'], [.9, '#d4dce0'], [1, '#596771']]); c.fill();
  poly(c, [[-521, hinge], [521, hinge], [591, 501], [-591, 501]]);
  c.fillStyle = grad(c, hinge, 501, [[0, '#b9c4ca'], [.28, '#d1d9dd'], [.8, '#bac5cb'], [1, '#95a4ae']]); c.fill();
  c.strokeStyle = 'rgba(242,251,255,.55)'; c.lineWidth = 1.2; c.stroke();
  // Hinge, shallow keyboard well and low profile graphite keys.
  fillRound(c, -462, hinge + 4, 924, 8, 4, '#364750');
  poly(c, [[-430, 351], [430, 351], [464, 430], [-464, 430]]);
  c.fillStyle = '#52616b'; c.fill(); c.strokeStyle = '#94a2ab'; c.lineWidth = 1; c.stroke();
  for (let row = 0; row < 5; row++) {
    const count = [14, 14, 13, 12, 11][row], y = 355 + row * 14.2;
    const half = 419 + row * 7.2, gap = 4.2, kw = (2 * half - (count - 1) * gap) / count;
    for (let col = 0; col < count; col++) {
      const x = -half + col * (kw + gap);
      fillRound(c, x, y, kw, 10.1, 1.6, '#1d2a33');
      fillRound(c, x + .8, y + .5, kw - 1.6, 8.3, 1.4, row % 2 ? '#374550' : '#32414c');
      if (row < 4) { c.fillStyle = 'rgba(215,228,235,.4)'; c.fillRect(x + kw * .46, y + 3.3, 3, .8); }
    }
  }
  // Trackpad and a small front opening, all unbranded.
  fillRound(c, -121, 439, 242, 48, 5, grad(c, 439, 487, [[0, '#c1cbd0'], [1, '#aab7c0']]));
  strokeRound(c, -121, 439, 242, 48, 5, '#8a9aa5', .9);
  c.beginPath(); c.moveTo(-113, 440); c.lineTo(113, 440); c.strokeStyle = 'rgba(247,252,255,.55)'; c.stroke();
  c.beginPath(); c.moveTo(-61, 502); c.bezierCurveTo(-56, 507, 56, 507, 61, 502);
  c.strokeStyle = '#627581'; c.lineWidth = 1.5; c.stroke();
  // Display lid has a fine metal rim, graphite bezel, camera and hinge seam.
  fillRound(c, -W / 2 - F - 2, -H / 2 - F - 2, W + F * 2 + 4, H + F * 2 + 4, 20,
    grad(c, -335, 335, [[0, '#b6c4cd'], [.15, '#73838f'], [.76, '#4e626e'], [1, '#9babba']]));
  fillRound(c, -W / 2 - F, -H / 2 - F, W + F * 2, H + F * 2, 18, '#15212a');
  strokeRound(c, -W / 2 - F + 1, -H / 2 - F + 1, W + F * 2 - 2, H + F * 2 - 2, 17,
    'rgba(209,231,240,.2)', .75);
  fillRound(c, -503, -315.5, 1006, 631, 8, '#03090e');
  c.beginPath(); c.arc(0, -324, 2.5, 0, TAU); c.fillStyle = '#060c11'; c.fill();
  c.beginPath(); c.arc(.6, -324.5, .85, 0, TAU); c.fillStyle = '#264954'; c.fill();
  return laptopSkin;
}

function drawLaptop(ctx, screenCanvas, opts = {}) {
  initAtmosphere(); ctx.save(); ctx.globalAlpha *= opts.opacity == null ? 1 : opts.opacity;
  pose(ctx, opts, 1000);
  ctx.drawImage(shadow, -690, 430, 1380, 220);
  ctx.drawImage(getLaptopSkin(), -650, -355, 1300, 930);
  drawTexture(ctx, screenCanvas, -500, -312.5, 1000, 625, 6);
  // One subpixel boundary contains the texture cleanly, with no image glare.
  strokeRound(ctx, -500, -312.5, 1000, 625, 6, 'rgba(0,5,10,.65)', .8);
  ctx.restore();
}

function getPhoneSkin() {
  if (phoneSkin) return phoneSkin;
  phoneSkin = createCanvas(1440, 2790);
  const c = phoneSkin.getContext('2d'); c.scale(3, 3); c.translate(240, 465);
  // Polished side buttons are behind the body, with restrained cool highlights.
  fillRound(c, -215, -272, 5, 31, 2, '#98aab5');
  fillRound(c, -216, -213, 6, 57, 2.5, '#6f8391');
  fillRound(c, -216, -139, 6, 57, 2.5, '#6f8391');
  fillRound(c, 210, -183, 6, 105, 2.5, '#92a2ad');
  fillRound(c, -213, -447, 426, 894, 51,
    grad(c, -447, 447, [[0, '#ced9df'], [.035, '#8298a6'], [.35, '#526b7a'], [.8, '#90a4b0'], [1, '#506775']]));
  strokeRound(c, -212, -446, 424, 892, 50, 'rgba(221,242,250,.6)', 1);
  fillRound(c, -208, -442, 416, 884, 47, '#0b151e');
  strokeRound(c, -207, -441, 414, 882, 46, 'rgba(138,179,197,.26)', .8);
  fillRound(c, -198, -425, 396, 850, 32, '#01070c');
  fillRound(c, -29, -435, 58, 3.6, 1.8, '#354650');
  c.beginPath(); c.arc(43, -433, 2.8, 0, TAU); c.fillStyle = '#03090e'; c.fill();
  c.beginPath(); c.arc(43.4, -433.5, .9, 0, TAU); c.fillStyle = '#274d60'; c.fill();
  // Metal antenna breaks and the lower lip complete the physical silhouette.
  c.fillStyle = 'rgba(5,16,23,.5)'; c.fillRect(-213, -345, 5, 2); c.fillRect(208, 343, 5, 2);
  fillRound(c, -56, 432, 112, 3.5, 1.8, '#576671');
  return phoneSkin;
}

function drawPhone(ctx, screenCanvas, opts = {}) {
  initAtmosphere(); ctx.save(); ctx.globalAlpha *= opts.opacity == null ? 1 : opts.opacity;
  pose(ctx, opts, 390);
  ctx.drawImage(shadow, -335, 395, 670, 130);
  ctx.drawImage(getPhoneSkin(), -240, -465, 480, 930);
  drawTexture(ctx, screenCanvas, -195, -422, 390, 844, 29);
  strokeRound(ctx, -195, -422, 390, 844, 29, 'rgba(0,5,10,.75)', 1);
  ctx.restore();
}

function drawGlassPanel(ctx, screenCanvas, opts = {}) {
  initAtmosphere(); ctx.save(); ctx.globalAlpha *= opts.opacity == null ? 1 : opts.opacity;
  const w = opts.w || 1000;
  const h = opts.h || (screenCanvas ? w * screenCanvas.height / screenCanvas.width : w * .625);
  pose(ctx, opts, w);
  ctx.drawImage(shadow, -w * .7, h / 2 - w * .045, w * 1.4, w * .23);
  const pad = Math.max(8, w * .01), rad = Math.max(12, w * .018);
  fillRound(ctx, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, rad,
    grad(ctx, -h / 2, h / 2, [[0, 'rgba(80,121,136,.52)'], [.45, 'rgba(18,43,56,.91)'], [1, 'rgba(36,76,91,.83)']]));
  strokeRound(ctx, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, rad,
    'rgba(173,228,236,.34)', 1.1);
  drawTexture(ctx, screenCanvas, -w / 2, -h / 2, w, h, Math.max(7, rad - pad));
  ctx.restore();
}

module.exports = { drawBackdrop, drawLaptop, drawPhone, drawGlassPanel };
