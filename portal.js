(() => {
  "use strict";
  const apps = Array.isArray(window.PORTAL_APPS) ? window.PORTAL_APPS : [];
  const categories = {
    sv: {all:"Alla appar",process:"Processanalys",ergonomi:"Ergonomi",production:"Produktionsstöd",info:"Information"},
    en: {all:"All apps",process:"Process analysis",ergonomi:"Ergonomics",production:"Production support",info:"Information"},
    de: {all:"Alle Apps",process:"Prozessanalyse",ergonomi:"Ergonomie",production:"Produktionsunterstützung",info:"Information"}
  };
  const translations = {
    sv:{
      eyebrow:"DIGITALA VERKTYG · TIDAHOLM",heroFirst:"Från analys till förbättring.",heroSecond:"Allt på ett ställe.",
      heroDescription:"Från cykeltidsmätning och ergonomi till produktionsstöd och information. Hitta rätt verktyg och kom igång direkt.",
      explore:"Utforska appar",hint:"Fungerar direkt i webbläsaren. Ingen GitHub-inloggning krävs.",
      appCount:"appar & verktyg",categoryCount:"arbetsområden",platform:"Webb & mobil",platformSub:"samma verktyg, överallt",
      sectionKicker:"APPBIBLIOTEK",sectionTitle:"Hitta ditt verktyg",sectionDescription:"Sök efter app eller välj arbetsområde.",
      search:"Sök app, process eller funktion…",searchLabel:"Sök bland apparna",
      resultCount:"appar visas",clear:"Rensa filter",open:"Öppna app",external:"Extern tjänst",internal:"I portalen",none:"Inga appar matchar din sökning.",
      helpTitle:"En portal, alla verktyg.",helpDescription:"Spara portalen på skrivbordet eller hemskärmen så hittar du tillbaka med ett tryck.",
      install:"Installera app",introVideo:"Se presentationsfilmen",installShort:"Installera",installed:"Appen är redan installerad",
      footer:"Digitala verktyg & kontinuerliga förbättringar",footerNote:"Endast information avsedd för offentlig webbpublicering.",
      dialogBadge:"SNABBÅTKOMST",dialogTitle:"Installera Dometic App Portal",dialogIntro:"Välj anvisningen för din enhet. Portalen är en vanlig webbplats och kräver inget program från IT.",
      dialogDone:"Klart",dialogClose:"Stäng",ios:["Öppna den här sidan i Safari på iPhone eller iPad.","Tryck på Dela-knappen (fyrkant med pil upp).","Välj Lägg till på hemskärmen och sedan Lägg till."],
      android:["Öppna sidan i Chrome på telefonen eller surfplattan.","Tryck på menyn med tre punkter.","Välj Installera app eller Lägg till på startskärmen."],
      desktop:["Öppna sidan i Chrome eller Microsoft Edge.","Klicka på installationssymbolen i adressfältet, eller välj Installera den här webbplatsen som en app i webbläsarens meny.","Bekräfta installationen. Appen visas sedan i Start-menyn eller bland apparna."],
      doneMessage:"Installationen styrs av webbläsaren.",countSingular:"app visas"
    },
    en:{
      eyebrow:"DIGITAL TOOLS · TIDAHOLM",heroFirst:"From analysis to improvement.",heroSecond:"All your tools in one place.",
      heroDescription:"From cycle-time studies and ergonomics to production support and information. Find the right tool and get started.",
      explore:"Explore apps",hint:"Use directly in your browser. No GitHub account required.",
      appCount:"apps & tools",categoryCount:"work areas",platform:"Web & mobile",platformSub:"the same tools everywhere",
      sectionKicker:"APP LIBRARY",sectionTitle:"Find your tool",sectionDescription:"Search for an app or filter by work area.",
      search:"Search app, process or function…",searchLabel:"Search the apps",
      resultCount:"apps shown",clear:"Clear filters",open:"Open app",external:"External service",internal:"In portal",none:"No apps match your search.",
      helpTitle:"One portal. Every tool.",helpDescription:"Install a shortcut on your desktop or home screen for instant access.",
      install:"Install app",introVideo:"Watch introduction",installShort:"Install",installed:"The app is already installed",
      footer:"Digital tools & continuous improvement",footerNote:"Only information suitable for public web publishing.",
      dialogBadge:"QUICK ACCESS",dialogTitle:"Install Dometic App Portal",dialogIntro:"Follow the steps for your device. The portal is a normal website and requires no additional IT software.",
      dialogDone:"Done",dialogClose:"Close",ios:["Open this page in Safari on your iPhone or iPad.","Tap Share (the square with an up arrow).","Select Add to Home Screen, then Add."],
      android:["Open this page in Chrome on your phone or tablet.","Open the three-dot menu.","Choose Install app or Add to Home screen."],
      desktop:["Open the page in Chrome or Microsoft Edge.","Click the install icon in the address bar, or choose Install this site as an app from the browser menu.","Confirm. The app appears in your Start menu or app launcher."],
      doneMessage:"Installation is controlled by your browser.",countSingular:"app shown"
    },
    de:{
      eyebrow:"DIGITALE WERKZEUGE · TIDAHOLM",heroFirst:"Von der Analyse zur Verbesserung.",heroSecond:"Alle Werkzeuge an einem Ort.",
      heroDescription:"Von Zykluszeitmessungen und Ergonomie bis zu Produktionsunterstützung und Informationen. Das passende Werkzeug direkt finden.",
      explore:"Apps entdecken",hint:"Direkt im Browser nutzbar. Kein GitHub-Konto erforderlich.",
      appCount:"Apps & Werkzeuge",categoryCount:"Arbeitsbereiche",platform:"Web & Mobil",platformSub:"gleiche Werkzeuge, überall",
      sectionKicker:"APP-ÜBERSICHT",sectionTitle:"Werkzeug finden",sectionDescription:"Nach App suchen oder Arbeitsbereich auswählen.",
      search:"App, Prozess oder Funktion suchen…",searchLabel:"Apps durchsuchen",
      resultCount:"Apps angezeigt",clear:"Filter zurücksetzen",open:"App öffnen",external:"Externer Dienst",internal:"Im Portal",none:"Keine passenden Apps gefunden.",
      helpTitle:"Ein Portal. Alle Werkzeuge.",helpDescription:"Portal auf Desktop oder Startbildschirm speichern und mit einem Klick öffnen.",
      install:"App installieren",introVideo:"Präsentationsfilm ansehen",installShort:"Installieren",installed:"Die App ist bereits installiert",
      footer:"Digitale Werkzeuge & kontinuierliche Verbesserung",footerNote:"Nur Informationen für die öffentliche Webveröffentlichung.",
      dialogBadge:"SCHNELLZUGRIFF",dialogTitle:"Dometic App Portal installieren",dialogIntro:"Folgen Sie den Schritten für Ihr Gerät. Das Portal ist eine normale Website und benötigt keine zusätzliche IT-Software.",
      dialogDone:"Fertig",dialogClose:"Schließen",ios:["Diese Seite auf dem iPhone oder iPad in Safari öffnen.","Auf Teilen (Quadrat mit Pfeil nach oben) tippen.","Zum Home-Bildschirm wählen und hinzufügen."],
      android:["Diese Seite in Chrome öffnen.","Menü mit den drei Punkten öffnen.","App installieren oder Zum Startbildschirm hinzufügen wählen."],
      desktop:["Diese Seite in Chrome oder Microsoft Edge öffnen.","Auf das Installationssymbol in der Adressleiste klicken oder im Browsermenü Diese Website als App installieren wählen.","Bestätigen. Die App erscheint im Startmenü oder App-Launcher."],
      doneMessage:"Die Installation wird vom Browser gesteuert.",countSingular:"App angezeigt"
    }
  };
  const $ = id => document.getElementById(id);
  let language = "sv";
  try { const saved = localStorage.getItem("dometic-portal-language"); if(translations[saved]) language = saved; } catch {}
  let activeCategory = "all";
  let query = "";
  let deferredPrompt = null;
  const categoriesOrder = ["all","process","ergonomi","production","info"];
  function tr() { return translations[language]; }
  function setText(id,value) { const node=$(id); if(node) node.textContent = value; }
  function applyLanguage(){
    const t=tr();
    document.documentElement.lang=language;
    document.querySelectorAll(".language-button").forEach(button => {
      const selected=button.dataset.lang===language;
      button.setAttribute("aria-pressed",String(selected));
      button.classList.toggle("selected",selected);
    });

    const heading=$("heroHeading");
    heading.replaceChildren(document.createTextNode(t.heroFirst));
    const span=document.createElement("span");span.textContent=t.heroSecond;heading.appendChild(span);
    setText("heroDescription",t.heroDescription);

    setText("sectionKicker",t.sectionKicker);setText("sectionTitle",t.sectionTitle);setText("sectionDescription",t.sectionDescription);
    setText("searchLabel",t.searchLabel);$("search").placeholder=t.search;
    setText("resetFilter",t.clear);
    setText("emptyMessage",t.none);
    setText("installLabel",t.install);setText("portalIntroButtonText",t.introVideo);
    setText("footerText",t.footer);setText("footerNote",t.footerNote);
    setText("dialogBadge",t.dialogBadge);setText("dialogHeading",t.dialogTitle);setText("dialogIntro",t.dialogIntro);setText("dialogDone",t.dialogDone);
    $("dialogClose").setAttribute("aria-label",t.dialogClose);
    renderFilters();renderApps();
  }
  function renderFilters(){
    const holder=$("filters");
    holder.replaceChildren();
    for(const key of categoriesOrder){
      const btn=document.createElement("button");
      btn.type="button";btn.className="filter-button"+(activeCategory===key?" active":"");
      btn.setAttribute("aria-pressed",String(activeCategory===key));
      btn.textContent=categories[language][key];
      btn.addEventListener("click",()=>{activeCategory=key;renderFilters();renderApps();});
      holder.appendChild(btn);
    }
    holder.setAttribute("aria-label",tr().sectionDescription);
  }
  function matches(app){
    if(activeCategory!=="all"&&app.category!==activeCategory)return false;
    if(!query)return true;
    const terms=[app.id,app.category,app.sv.name,app.sv.description,app.en.name,app.en.description,app.de.name,app.de.description].join(" ").toLocaleLowerCase();
    return terms.includes(query);
  }

  const videoText={
    sv:{sv:"🇸🇪 Svensk film",en:"🇬🇧 Engelsk film",rtm:"▶ Se filmen om RTM",title20:"Twenty Cycle Check – introduktion",titleRtm:"RTM 3.0 – introduktion",about20:"Instruktionsfilm om processobservation med Twenty Cycle Check.",aboutRtm:"Presentationsfilm om RTM 3.0 i Tidaholm.",titlePortal:"Dometic App Portal – presentationsfilm",aboutPortal:"Svensk berättarröst · 1 minut och 10 sekunder. Riktiga appvyer i 4K.",label:"INTRODUKTIONSFILM",close:"Stäng film"},
    en:{sv:"🇸🇪 Swedish video",en:"🇬🇧 English video",rtm:"▶ Watch RTM video",title20:"Twenty Cycle Check – introduction",titleRtm:"RTM 3.0 – introduction",about20:"An introduction to process observations using Twenty Cycle Check.",aboutRtm:"Introduction to RTM 3.0 in Tidaholm.",titlePortal:"Dometic App Portal – introduction",aboutPortal:"Swedish narration · 1 minute and 10 seconds. Real app screens in 4K.",label:"INTRODUCTION VIDEO",close:"Close video"},
    de:{sv:"🇸🇪 Schwedisches Video",en:"🇬🇧 Englisches Video",rtm:"▶ RTM-Film ansehen",title20:"Twenty Cycle Check – Einführung",titleRtm:"RTM 3.0 – Einführung",about20:"Einführung in die Prozessbeobachtung mit Twenty Cycle Check.",aboutRtm:"Einführung in RTM 3.0 in Tidaholm.",titlePortal:"Dometic App Portal – Präsentationsfilm",aboutPortal:"Schwedische Sprecherstimme · 1 Minute und 10 Sekunden. Echte App-Ansichten in 4K.",label:"EINFÜHRUNGSVIDEO",close:"Video schließen"}
  };
  const mediaBase="https://mrmartinpet.github.io/Dometic/media/";
  const films={
    sv:{file:"20-cycle-check-tutorial-sv-modern-m3.mp4",caption:"20-cycle-check-tutorial-sv-modern-m3.vtt",poster:"20-cycle-check-tutorial-poster-modern-m3.jpg",lang:"sv"},
    en:{file:"20-cycle-check-tutorial-en-morph-e2.mp4",caption:"20-cycle-check-tutorial-en-morph-e2.vtt",poster:"20-cycle-check-tutorial-poster-en-morph-e2.jpg",lang:"en"},
    rtm:{file:"rtm-tidaholm-en.mp4",caption:"rtm-tidaholm-en.vtt",poster:"rtm-tidaholm-poster-en.jpg",lang:"en"},
    portal:{file:"app-portal-intro-sv.mp4",local:true,lang:"sv"}
  };
  function openFilm(key){
    const movie=films[key],labels=videoText[language],player=$("videoPlayer"),dialog=$("videoDialog");
    if(!movie)return;
    player.pause();player.replaceChildren();
    if(movie.poster){player.poster=mediaBase+movie.poster;}else{player.removeAttribute("poster");}
    const source=document.createElement("source");
    source.src=movie.local?"./media/"+movie.file:mediaBase+movie.file;
    source.type="video/mp4";player.appendChild(source);
    if(movie.caption){
      const caption=document.createElement("track");caption.src=mediaBase+movie.caption;caption.kind="captions";
      caption.srclang=movie.lang;caption.label=movie.lang==="sv"?"Svenska":"English";
      player.appendChild(caption);
    }
    setText("videoEyebrow",labels.label);
    setText("videoTitle",key==="portal"?labels.titlePortal:key==="rtm"?labels.titleRtm:labels.title20);
    setText("videoDescription",key==="portal"?labels.aboutPortal:key==="rtm"?labels.aboutRtm:labels.about20);
    $("videoClose").setAttribute("aria-label",labels.close);
    player.load();
    dialog.showModal();
  }
  function makeFilmButton(label,key){
    const button=document.createElement("button");button.type="button";
    button.className="video-choice";button.textContent=label;
    button.addEventListener("click",()=>openFilm(key));
    return button;
  }

  function addCard(app){
    const t=tr();const copy=app[language]||app.sv;
    const article=document.createElement("article");article.className="app-card";article.dataset.category=app.category;
    const top=document.createElement("div");top.className="card-top";
    const pic=document.createElement("span");pic.className="card-icon";pic.textContent=app.icon;pic.setAttribute("aria-hidden","true");
    const kind=document.createElement("span");kind.className="card-kind"+(app.external?" external":"");kind.textContent=app.external?t.external:t.internal;
    top.append(pic,kind);
    const heading=document.createElement("h3");heading.textContent=copy.name;
    const desc=document.createElement("p");desc.textContent=copy.description;
    const bottom=document.createElement("div");bottom.className="card-bottom";
    const category=document.createElement("span");category.className="category-name";category.textContent=categories[language][app.category];
    const arrow=document.createElement("span");arrow.className="card-arrow";
    arrow.textContent="↗";arrow.setAttribute("aria-hidden","true");
    bottom.append(category,arrow);
    const hit=document.createElement("a");hit.className="card-click-target";
    hit.href=app.url;hit.target="_blank";hit.rel="noopener noreferrer";
    hit.setAttribute("aria-label",t.open+": "+copy.name);
    article.append(top,heading,desc);
    if(app.id==="20CycleCheck"){
      const row=document.createElement("div");row.className="video-actions";
      row.append(makeFilmButton(videoText[language].sv,"sv"),makeFilmButton(videoText[language].en,"en"));
      article.appendChild(row);
    }else if(app.id==="RTM"){
      const row=document.createElement("div");row.className="video-actions";
      row.append(makeFilmButton(videoText[language].rtm,"rtm"));article.appendChild(row);
    }
    article.appendChild(bottom);
    article.appendChild(hit);
    return article;
  }
  function renderApps(){
    const visible=apps.filter(matches);
    visible.sort((a,b)=>Number(b.featured)-Number(a.featured)||categoriesOrder.indexOf(a.category)-categoriesOrder.indexOf(b.category)||a.sv.name.localeCompare(b.sv.name,"sv"));
    const holder=$("cards");holder.replaceChildren(...visible.map(addCard));
    $("emptyMessage").hidden=visible.length>0;
    setText("resultCount",String(visible.length)+" "+(visible.length===1?tr().countSingular:tr().resultCount));
    $("resetFilter").hidden=activeCategory==="all"&&!query;
  }
  function toast(message){
    const node=$("toast");node.textContent=message;node.hidden=false;
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,3500);
  }
  function installSteps(){
    const ua=navigator.userAgent||"";
    const ios=/iPhone|iPad|iPod/.test(ua)||((navigator.platform||"")==="MacIntel"&&navigator.maxTouchPoints>1);
    const android=/Android/i.test(ua);
    const steps=ios?tr().ios:android?tr().android:tr().desktop;
    const ol=document.createElement("ol");
    for(const step of steps){const li=document.createElement("li");li.textContent=step;ol.appendChild(li);}
    $("installInstructions").replaceChildren(ol);
    const dialog=$("installDialog");
    if(typeof dialog.showModal==="function")dialog.showModal();else alert(steps.join("\n"));
  }
  async function install(){
    if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true){toast(tr().installed);return;}
    if(deferredPrompt){
      const p=deferredPrompt;deferredPrompt=null;
      try{await p.prompt();await p.userChoice;}catch{installSteps();}
    }else installSteps();
  }
  $("search").addEventListener("input",event=>{query=event.target.value.trim().toLocaleLowerCase();renderApps();});
  document.querySelectorAll(".language-button").forEach(button=>{
    button.addEventListener("click",()=>{
      language=translations[button.dataset.lang]?button.dataset.lang:"sv";
      try{localStorage.setItem("dometic-portal-language",language);}catch{}
      applyLanguage();
    });
  });
  $("resetFilter").addEventListener("click",()=>{query="";activeCategory="all";$("search").value="";renderFilters();renderApps();});
  $("installButton").addEventListener("click",install);
  $("portalIntroButton").addEventListener("click",()=>openFilm("portal"));
  $("dialogClose").addEventListener("click",()=>$("installDialog").close());
  $("dialogDone").addEventListener("click",()=>$("installDialog").close());
  $("installDialog").addEventListener("click",e=>{if(e.target===$("installDialog"))$("installDialog").close();});
  $("videoClose").addEventListener("click",()=>$("videoDialog").close());
  $("videoDialog").addEventListener("close",()=>{
    const player=$("videoPlayer");
    player.pause();player.replaceChildren();player.removeAttribute("poster");player.load();
  });
  $("videoDialog").addEventListener("click",event=>{
    if(event.target===$("videoDialog"))$("videoDialog").close();
  });
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event;});
  window.addEventListener("appinstalled",()=>{deferredPrompt=null;toast(tr().installed);});
  applyLanguage();
  if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"}).catch(()=>{});
})();