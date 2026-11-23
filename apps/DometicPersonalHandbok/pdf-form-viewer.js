import {
  AnnotationLayer, AnnotationMode, AnnotationType, GlobalWorkerOptions,
  getDocument, version as pdfjsVersion,
} from './vendor/pdfjs/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.mjs', import.meta.url).href;

const pagesElement = document.querySelector('#pdf-pages');
const statusElement = document.querySelector('#viewer-status');
const printButton = document.querySelector('#viewer-print');
const printElement = document.querySelector('#print-pages');
const embedded = window.parent !== window;
const parameters = new URLSearchParams(location.search);
const state = { loading: null, pdf: null, fields: null, pages: [], layers: [], ready: false, printing: false, rendering: false, resizePending: false, width: 0, destroyed: false };
let printStyle = null;
let printURLs = [];
let resizeTimer;
let ignoredPrintTimer;
let printStarted = false;

function notify(type, detail = {}) {
  if (embedded) window.parent.postMessage({ type, ...detail }, location.origin);
}
function status(message, error = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', error);
  statusElement.hidden = !message;
}
function clearPrintPages() {
  printElement.replaceChildren();
  printURLs.forEach(url => URL.revokeObjectURL(url));
  printURLs = [];
  printStyle?.remove();
  printStyle = null;
  delete document.body.dataset.printReady;
}
function finishPrint({ clearPages = true } = {}) {
  clearTimeout(ignoredPrintTimer);
  if (clearPages) clearPrintPages();
  if (!state.printing) return;
  state.printing = false;
  printButton.disabled = !state.ready;
  delete document.body.dataset.printing;
  notify('pdf-form-print-finished');
}
function documentURL() {
  const supplied = parameters.get('file');
  if (!supplied) throw new Error('Ingen blankett har valts.');
  const url = new URL(supplied, location.href);
  const allowed = new URL('./blanketter/', location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith(allowed.pathname) || !/\.pdf$/i.test(url.pathname)) {
    throw new Error('Blankettens adress är inte giltig.');
  }
  url.hash = '';
  return url;
}

// The source forms have ordinary AcroForm widgets. PDF actions and attachments
// are deliberately not installed; controls are confined to filling and printing.
const linkService = {
  eventBus: { dispatch() {} },
  externalLinkEnabled: false,
  getAnchorUrl: anchor => anchor,
  getDestinationHash: () => '#',
  addLinkAttributes(link) { link.removeAttribute('href'); },
  executeNamedAction(action) { if (action === 'Print') void printPDF(); },
  async goToDestination() {},
  async executeSetOCGState() {},
};

async function renderPages() {
  if (state.destroyed || !state.pdf) return;
  if (state.rendering) { state.resizePending = true; return; }
  state.rendering = true;
  state.ready = false;
  notify('pdf-form-loading');
  printButton.disabled = true;
  pagesElement.setAttribute('aria-busy', 'true');
  state.layers.forEach(layer => layer.destroy());
  state.layers = [];
  pagesElement.replaceChildren();
  try {
    const availableWidth = Math.max(240, pagesElement.clientWidth - (innerWidth <= 600 ? 8 : 24));
    state.width = availableWidth;
    const optionalContentConfig = await state.pdf.getOptionalContentConfig({ intent: 'display' });
    let widgets = 0;
    for (let index = 0; index < state.pages.length; index++) {
      if (state.destroyed) return;
      const page = state.pages[index];
      const unitViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.6, availableWidth / unitViewport.width);
      const viewport = page.getViewport({ scale });
      const wrapper = document.createElement('section');
      wrapper.className = 'pdf-page';
      wrapper.dataset.pageNumber = String(index + 1);
      wrapper.setAttribute('aria-label', `Sida ${index + 1} av ${state.pages.length}`);
      wrapper.style.width = `${viewport.width}px`;
      wrapper.style.height = `${viewport.height}px`;
      wrapper.style.setProperty('--scale-factor', String(viewport.scale));
      wrapper.style.setProperty('--total-scale-factor', String(viewport.scale));
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * pixelRatio);
      canvas.height = Math.ceil(viewport.height * pixelRatio);
      wrapper.append(canvas);
      pagesElement.append(wrapper);
      await page.render({
        canvas, viewport,
        transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        annotationMode: AnnotationMode.ENABLE_FORMS,
      }).promise;
      const annotations = (await page.getAnnotations({ intent: 'display' }))
        .filter(annotation => annotation.annotationType === AnnotationType.WIDGET && !annotation.pushButton);
      widgets += annotations.length;
      if (annotations.length) {
        const div = document.createElement('div');
        div.className = 'annotationLayer';
        wrapper.append(div);
        const layer = new AnnotationLayer({
          div, page, viewport: viewport.clone({ dontFlip: true }),
          annotationStorage: state.pdf.annotationStorage, linkService,
        });
        await layer.render({
          annotations, renderForms: true, enableScripting: false,
          enableAnnotationEditing: false, enableComment: false,
          fieldObjects: state.fields, optionalContentConfig,
        });
        state.layers.push(layer);
        div.querySelectorAll('input, textarea, select').forEach(control => {
          control.setAttribute('autocomplete', 'off');
          control.setAttribute('spellcheck', 'false');
          if (!control.getAttribute('aria-label')) control.setAttribute('aria-label', control.name || 'Formulärfält');
        });
      }
    }
    pagesElement.dataset.pageCount = String(state.pages.length);
    pagesElement.dataset.fieldCount = String(widgets);
    pagesElement.dataset.ready = 'true';
    state.ready = true;
    printButton.disabled = false;
    status('');
    notify('pdf-form-ready', { pages: state.pages.length, fields: widgets, fillable: widgets > 0, pdfjsVersion });
  } catch (error) {
    status('Blanketten kunde inte visas. Stäng den och försök igen.', true);
    notify('pdf-form-error', { message: 'Blanketten kunde inte visas.' });
    console.error('PDF rendering failed', error);
  } finally {
    state.rendering = false;
    pagesElement.setAttribute('aria-busy', 'false');
    if (state.resizePending && !state.destroyed) {
      state.resizePending = false;
      void renderPages();
    }
  }
}

async function printPDF() {
  if (!state.ready || state.printing || state.destroyed) return;
  state.printing = true;
  printStarted = false;
  printButton.disabled = true;
  document.body.dataset.printing = 'true';
  notify('pdf-form-printing');
  try {
    // Commit an input that still has focus, including when the parent dialog's
    // print button initiates this operation through postMessage.
    const focused = document.activeElement;
    if (focused && pagesElement.contains(focused)) {
      focused.dispatchEvent(new Event('input', { bubbles: true }));
      focused.dispatchEvent(new Event('change', { bubbles: true }));
      focused.blur();
    }
    await Promise.resolve();
    const printAnnotationStorage = state.pdf.annotationStorage.print;
    const optionalContentConfigPromise = state.pdf.getOptionalContentConfig({ intent: 'print' });
    clearPrintPages();
    printStyle = document.createElement('style');
    const printRules = [];
    for (let index = 0; index < state.pages.length; index++) {
      status(`Förbereder utskrift, sida ${index + 1} av ${state.pages.length}…`);
      const page = state.pages[index];
      const viewport = page.getViewport({ scale: 1 });
      const printScale = 150 / 72;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * printScale);
      canvas.height = Math.ceil(viewport.height * printScale);
      await page.render({
        canvas, viewport, transform: [printScale, 0, 0, printScale, 0, 0],
        intent: 'print', annotationMode: AnnotationMode.ENABLE_STORAGE,
        printAnnotationStorage, optionalContentConfigPromise,
      }).promise;
      const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Utskriftssidan kunde inte skapas.')), 'image/png'));
      const url = URL.createObjectURL(blob);
      printURLs.push(url);
      const image = document.createElement('img');
      image.alt = `Sida ${index + 1}`;
      image.src = url;
      await image.decode();
      const wrapper = document.createElement('div');
      wrapper.className = 'printed-page';
      wrapper.style.width = `${viewport.width}pt`;
      wrapper.style.height = `${viewport.height}pt`;
      wrapper.style.page = `pdfpage${index + 1}`;
      wrapper.append(image);
      printElement.append(wrapper);
      printRules.push(`@page pdfpage${index + 1} { size: ${viewport.width}pt ${viewport.height}pt; margin: 0; }`);
      if (index === 0) printRules.unshift(`@page { size: ${viewport.width}pt ${viewport.height}pt; margin: 0; }`);
      canvas.width = canvas.height = 0;
    }
    printStyle.textContent = printRules.join('\n');
    document.head.append(printStyle);
    document.body.dataset.printReady = 'true';
    status('');
    notify('pdf-form-print-prepared', { pages: state.pages.length });
    window.focus();
    window.print();
    // Nonblocking print dialogs keep the lock and image URLs until afterprint.
    // A browser may ignore print() entirely and fire neither lifecycle event.
    if (state.printing && !printStarted) {
      ignoredPrintTimer = setTimeout(() => {
        if (state.printing && !printStarted && !window.matchMedia('print').matches) {
          // Unlock a suppressed print request without destroying prepared pages.
          finishPrint({ clearPages: false });
        }
      }, 2000);
    }
  } catch (error) {
    status('Utskriften kunde inte förberedas. Försök igen.', true);
    notify('pdf-form-error', { message: 'Utskriften kunde inte förberedas.' });
    finishPrint();
    console.error('PDF print preparation failed', error);
  }
}

window.addEventListener('beforeprint', () => {
  if (state.printing) {
    printStarted = true;
    clearTimeout(ignoredPrintTimer);
  }
});
window.addEventListener('afterprint', () => finishPrint());
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'print-pdf') void printPDF();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    void printPDF();
  }
});
pagesElement.addEventListener('input', () => { if (!state.printing) clearPrintPages(); });
pagesElement.addEventListener('change', () => { if (!state.printing) clearPrintPages(); });
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!state.printing && Math.abs(state.width - (pagesElement.clientWidth - (innerWidth <= 600 ? 8 : 24))) > 2) void renderPages();
  }, 200);
});
window.addEventListener('pagehide', () => {
  state.destroyed = true;
  clearTimeout(resizeTimer);
  clearTimeout(ignoredPrintTimer);
  clearPrintPages();
  state.layers.forEach(layer => layer.destroy());
  state.layers = [];
  state.pages = [];
  state.fields = null;
  void state.loading?.destroy();
  state.loading = null;
  state.pdf = null;
});
printButton.addEventListener('click', () => void printPDF());
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

if (embedded) document.querySelector('#viewer-toolbar').hidden = true;
try {
  const url = documentURL();
  const title = parameters.get('title') || decodeURIComponent(url.pathname.split('/').pop());
  document.title = title;
  document.querySelector('#viewer-title').textContent = title;
  const loading = getDocument({
    url: url.href,
    standardFontDataUrl: new URL('./vendor/pdfjs/standard_fonts/', import.meta.url).href,
    useWasm: false, enableXfa: false, isEvalSupported: false,
  });
  state.loading = loading;
  state.pdf = await loading.promise;
  state.fields = await state.pdf.getFieldObjects();
  for (let page = 1; page <= state.pdf.numPages; page++) state.pages.push(await state.pdf.getPage(page));
  await renderPages();
} catch (error) {
  status('Blanketten kunde inte öppnas. Stäng den och försök igen.', true);
  notify('pdf-form-error', { message: 'Blanketten kunde inte öppnas.' });
  console.error('PDF loading failed', error);
}
