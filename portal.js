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
      eyebrow:"DIGITALA VERKTYG · TIDAHOLM",heroFirst:"Rätt verktyg.",heroSecond:"Direkt till arbetet.",
      heroDescription:"Mät, analysera och förbättra. Alla våra appar och arbetsverktyg samlade på ett ställe – för dator, surfplatta och mobil.",
      explore:"Utforska appar",hint:"Fungerar direkt i webbläsaren. Ingen GitHub-inloggning krävs.",
      appCount:"appar & verktyg",categoryCount:"arbetsområden",platform:"Webb & mobil",platformSub:"samma verktyg, överallt",
      sectionKicker:"APPBIBLIOTEK",sectionTitle:"Hitta ditt verktyg",sectionDescription:"Sök efter app eller välj arbetsområde.",
      search:"Sök app, process eller funktion…",searchLabel:"Sök bland apparna",
      resultCount:"appar visas",clear:"Rensa filter",open:"Öppna app",external:"Extern tjänst",internal:"I portalen",none:"Inga appar matchar din sökning.",
      helpTitle:"En portal, alla verktyg.",helpDescription:"Spara portalen på skrivbordet eller hemskärmen så hittar du tillbaka med ett tryck.",
      install:"Installera app",installShort:"Installera",installed:"Appen är redan installerad",
      footer:"Digitala verktyg & kontinuerliga förbättringar",footerNote:"Endast information avsedd för offentlig webbpublicering.",
      dialogBadge:"SNABBÅTKOMST",dialogTitle:"Installera Dometic App Portal",dialogIntro:"Välj anvisningen för din enhet. Portalen är en vanlig webbplats och kräver inget program från IT.",
      dialogDone:"Klart",dialogClose:"Stäng",ios:["Öppna den här sidan i Safari på iPhone eller iPad.","Tryck på Dela-knappen (fyrkant med pil upp).","Välj Lägg till på hemskärmen och sedan Lägg till."],
      android:["Öppna sidan i Chrome på telefonen eller surfplattan.","Tryck på menyn med tre punkter.","Välj Installera app eller Lägg till på startskärmen."],
      desktop:["Öppna sidan i Chrome eller Microsoft Edge.","Klicka på installationssymbolen i adressfältet, eller välj Installera den här webbplatsen som en app i webbläsarens meny.","Bekräfta installationen. Appen visas sedan i Start-menyn eller bland apparna."],
      doneMessage:"Installationen styrs av webbläsaren.",countSingular:"app visas"
    },
    en:{
      eyebrow:"DIGITAL TOOLS · TIDAHOLM",heroFirst:"The right tool.",heroSecond:"Ready when you are.",
      heroDescription:"Measure, analyze and improve. All our apps and shopfloor tools in one place – on desktop, tablet and mobile.",
      explore:"Explore apps",hint:"Use directly in your browser. No GitHub account required.",
      appCount:"apps & tools",categoryCount:"work areas",platform:"Web & mobile",platformSub:"the same tools everywhere",
      sectionKicker:"APP LIBRARY",sectionTitle:"Find your tool",sectionDescription:"Search for an app or filter by work area.",
      search:"Search app, process or function…",searchLabel:"Search the apps",
      resultCount:"apps shown",clear:"Clear filters",open:"Open app",external:"External service",internal:"In portal",none:"No apps match your search.",
      helpTitle:"One portal. Every tool.",helpDescription:"Install a shortcut on your desktop or home screen for instant access.",
      install:"Install app",installShort:"Install",installed:"The app is already installed",
      footer:"Digital tools & continuous improvement",footerNote:"Only information suitable for public web publishing.",
      dialogBadge:"QUICK ACCESS",dialogTitle:"Install Dometic App Portal",dialogIntro:"Follow the steps for your device. The portal is a normal website and requires no additional IT software.",
      dialogDone:"Done",dialogClose:"Close",ios:["Open this page in Safari on your iPhone or iPad.","Tap Share (the square with an up arrow).","Select Add to Home Screen, then Add."],
      android:["Open this page in Chrome on your phone or tablet.","Open the three-dot menu.","Choose Install app or Add to Home screen."],
      desktop:["Open the page in Chrome or Microsoft Edge.","Click the install icon in the address bar, or choose Install this site as an app from the browser menu.","Confirm. The app appears in your Start menu or app launcher."],
      doneMessage:"Installation is controlled by your browser.",countSingular:"app shown"
    },
    de:{
      eyebrow:"DIGITALE WERKZEUGE · TIDAHOLM",heroFirst:"Das richtige Werkzeug.",heroSecond:"Direkt zur Arbeit.",
      heroDescription:"Messen, analysieren und verbessern. Alle Apps und Werkzeuge an einem Ort – für Desktop, Tablet und Smartphone.",
      explore:"Apps entdecken",hint:"Direkt im Browser nutzbar. Kein GitHub-Konto erforderlich.",
      appCount:"Apps & Werkzeuge",categoryCount:"Arbeitsbereiche",platform:"Web & Mobil",platformSub:"gleiche Werkzeuge, überall",
      sectionKicker:"APP-ÜBERSICHT",sectionTitle:"Werkzeug finden",sectionDescription:"Nach App suchen oder Arbeitsbereich auswählen.",
      search:"App, Prozess oder Funktion suchen…",searchLabel:"Apps durchsuchen",
      resultCount:"Apps angezeigt",clear:"Filter zurücksetzen",open:"App öffnen",external:"Externer Dienst",internal:"Im Portal",none:"Keine passenden Apps gefunden.",
      helpTitle:"Ein Portal. Alle Werkzeuge.",helpDescription:"Portal auf Desktop oder Startbildschirm speichern und mit einem Klick öffnen.",
      install:"App installieren",installShort:"Installieren",installed:"Die App ist bereits installiert",
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
    $("language").value=language;
    setText("eyebrow",t.eyebrow);
    const heading=$("heroHeading");
    heading.replaceChildren(document.createTextNode(t.heroFirst));
    const span=document.createElement("span");span.textContent=t.heroSecond;heading.appendChild(span);
    setText("heroDescription",t.heroDescription);
    const explore=$("exploreLink");explore.replaceChildren(document.createTextNode(t.explore+" "));
    const arrow=document.createElement("span");arrow.setAttribute("aria-hidden","true");arrow.textContent="↗";explore.appendChild(arrow);
    setText("installHint",t.hint);
    setText("appCount",String(apps.length));
    setText("appCountLabel",t.appCount);
    setText("categoryCountLabel",t.categoryCount);
    setText("platformLabel",t.platform);
    setText("platformSubLabel",t.platformSub);
    setText("sectionKicker",t.sectionKicker);setText("sectionTitle",t.sectionTitle);setText("sectionDescription",t.sectionDescription);
    setText("searchLabel",t.searchLabel);$("search").placeholder=t.search;
    setText("resetFilter",t.clear);
    setText("emptyMessage",t.none);
    setText("helpTitle",t.helpTitle);setText("helpDescription",t.helpDescription);
    setText("installLabel",t.install);
    const bottom=$("installButtonBottom");bottom.replaceChildren(document.createTextNode(t.installShort+" "));
    const bottomArrow=document.createElement("span");bottomArrow.setAttribute("aria-hidden","true");bottomArrow.textContent="↗";bottom.appendChild(bottomArrow);
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
    const link=document.createElement("a");link.className="open-link";link.href=app.url;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=t.open+" ↗";link.setAttribute("aria-label",t.open+": "+copy.name);
    bottom.append(category,link);
    article.append(top,heading,desc,bottom);
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
  $("language").addEventListener("change",event=>{language=translations[event.target.value]?event.target.value:"sv";try{localStorage.setItem("dometic-portal-language",language);}catch{}applyLanguage();});
  $("resetFilter").addEventListener("click",()=>{query="";activeCategory="all";$("search").value="";renderFilters();renderApps();});
  $("installButton").addEventListener("click",install);
  $("installButtonBottom").addEventListener("click",install);
  $("dialogClose").addEventListener("click",()=>$("installDialog").close());
  $("dialogDone").addEventListener("click",()=>$("installDialog").close());
  $("installDialog").addEventListener("click",e=>{if(e.target===$("installDialog"))$("installDialog").close();});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event;});
  window.addEventListener("appinstalled",()=>{deferredPrompt=null;toast(tr().installed);});
  applyLanguage();
  if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"}).catch(()=>{});
})();