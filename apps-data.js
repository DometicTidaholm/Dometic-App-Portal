/* Appkatalog. Varje app kan ha en egen mapp under apps/. */
window.PORTAL_APPS = [
  {
    "id": "20CycleCheck",
    "category": "process",
    "icon": "⏱️",
    "sv": {
      "name": "Twenty Cycle Check",
      "description": "Mät 20 produktionscykler, registrera störningar och analysera cykeltid och variation."
    },
    "en": {
      "name": "Twenty Cycle Check",
      "description": "Measure 20 production cycles, log disruptions and analyze cycle times and variation."
    },
    "de": {
      "name": "Twenty Cycle Check",
      "description": "20 Produktionszyklen messen, Störungen erfassen und Zykluszeit sowie Streuung analysieren."
    },
    "url": "./apps/20CycleCheck/",
    "external": false,
    "featured": true
  },
  {
    "id": "steptimer",
    "category": "process",
    "icon": "🕒",
    "sv": {
      "name": "Moment & tider",
      "description": "Tidsstudera arbetsmoment steg för steg. Dokumentera momenttider och arbetsfördelning."
    },
    "en": {
      "name": "Worksteps & Times",
      "description": "Time individual work steps and document cycle elements and task distribution."
    },
    "de": {
      "name": "Arbeitsschritte & Zeiten",
      "description": "Einzelne Arbeitsschritte messen und Ablaufzeiten sowie Aufgabenverteilung dokumentieren."
    },
    "url": "./apps/steptimer/",
    "external": false,
    "featured": true
  },
  {
    "id": "Frekvensanalys",
    "category": "process",
    "icon": "📊",
    "sv": {
      "name": "Frekvensanalys",
      "description": "Registrera aktiviteter under en observation och se hur tiden fördelas mellan processarbete, logistik, problem och administration."
    },
    "en": {
      "name": "Frequency Analysis",
      "description": "Record observed activities and analyze time spent on process work, logistics, problems and administration."
    },
    "de": {
      "name": "Tätigkeitsanalyse",
      "description": "Tätigkeiten erfassen und Zeitanteile für Prozessarbeit, Logistik, Probleme und Verwaltung auswerten."
    },
    "url": "./apps/Frekvensanalys/",
    "external": false,
    "featured": false
  },
  {
    "id": "Dometic-AnalyzeMovements",
    "category": "process",
    "icon": "🗺️",
    "sv": {
      "name": "Rörelser & gångvägar",
      "description": "Rita spagettidiagram och följ operatörens gångvägar, uppskattad gångtid och sträcka vid en processobservation."
    },
    "en": {
      "name": "Movements & Walking Paths",
      "description": "Create spaghetti diagrams and analyze walking routes, estimated walking time and distance."
    },
    "de": {
      "name": "Bewegungen & Wege",
      "description": "Spaghetti-Diagramme erstellen und Gehwege, geschätzte Gehzeit und Strecken analysieren."
    },
    "url": "./apps/Dometic-AnalyzeMovements/",
    "external": false,
    "featured": false
  },
  {
    "id": "ErgonomicAnalysis",
    "category": "ergonomi",
    "icon": "🏋️",
    "sv": {
      "name": "Ergonomianalys – KIM 1",
      "description": "Riskbedömning av lyft och bärarbete enligt KIM 1, med riskpoäng och rapportfunktion."
    },
    "en": {
      "name": "Ergonomic Analysis – KIM 1",
      "description": "Assess lifting and carrying risks using KIM 1, with risk scoring and reporting."
    },
    "de": {
      "name": "Ergonomieanalyse – KIM 1",
      "description": "Hebe- und Tragetätigkeiten nach KIM 1 mit Risikobewertung und Berichtsfunktion beurteilen."
    },
    "url": "./apps/ErgonomicAnalysis/",
    "external": false,
    "featured": true
  },
  {
    "id": "KIM2",
    "category": "ergonomi",
    "icon": "↔️",
    "sv": {
      "name": "Ergonomianalys – KIM 2",
      "description": "Riskbedömning av skjuta- och draarbete enligt KIM 2 med poängsättning och rapport."
    },
    "en": {
      "name": "Ergonomic Analysis – KIM 2",
      "description": "Assess pushing and pulling work using KIM 2, with risk scoring and a report."
    },
    "de": {
      "name": "Ergonomieanalyse – KIM 2",
      "description": "Schiebe- und Ziehtätigkeiten nach KIM 2 bewerten und einen Bericht erstellen."
    },
    "url": "./apps/KIM2/",
    "external": false,
    "featured": false
  },
  {
    "id": "KIM3",
    "category": "ergonomi",
    "icon": "✋",
    "sv": {
      "name": "Ergonomianalys – KIM 3",
      "description": "Bedöm risker vid repetitivt hand- och arm arbete, arbetsställningar och belastning."
    },
    "en": {
      "name": "Ergonomic Analysis – KIM 3",
      "description": "Assess repetitive hand and arm work, postures and physical strain."
    },
    "de": {
      "name": "Ergonomieanalyse – KIM 3",
      "description": "Repetitive Hand-Arm-Tätigkeiten, Körperhaltungen und Belastungen bewerten."
    },
    "url": "./apps/KIM3/",
    "external": false,
    "featured": false
  },
  {
    "id": "Funktionsplaneraren",
    "category": "production",
    "icon": "👥",
    "sv": {
      "name": "Resursfördelning",
      "description": "Planera och visualisera bemanning och resursfördelning mellan arbetsuppgifter och funktioner."
    },
    "en": {
      "name": "Resource Planning",
      "description": "Plan staffing and visualize allocation of people across tasks and functions."
    },
    "de": {
      "name": "Ressourcenplanung",
      "description": "Personal- und Ressourcenverteilung zwischen Aufgaben und Funktionen planen."
    },
    "url": "./apps/Funktionsplaneraren/",
    "external": false,
    "featured": false
  },
  {
    "id": "Tolkkalibrering",
    "category": "production",
    "icon": "📏",
    "sv": {
      "name": "Kalibrering av håltolk",
      "description": "Digitalt formulär för kontroll och dokumentation av kalibrering av håltolkar."
    },
    "en": {
      "name": "Gauge Calibration",
      "description": "Digital form for checking and documenting bore gauge calibration."
    },
    "de": {
      "name": "Lehrenkalibrierung",
      "description": "Digitales Formular zur Kontrolle und Dokumentation der Kalibrierung von Bohrungslehren."
    },
    "url": "./apps/Tolkkalibrering/",
    "external": false,
    "featured": false
  },
  {
    "id": "Flagg-generator",
    "category": "production",
    "icon": "🚩",
    "sv": {
      "name": "Flagg-generator",
      "description": "Skapa och anpassa flaggor och visuella markeringar för användning i produktionen."
    },
    "en": {
      "name": "Flag Generator",
      "description": "Create and customize flags and visual labels for shopfloor use."
    },
    "de": {
      "name": "Flaggen-Generator",
      "description": "Flaggen und visuelle Markierungen für den Produktionsbereich gestalten."
    },
    "url": "./apps/Flagg-generator/",
    "external": false,
    "featured": false
  },
  {
    "id": "DometicPersonalHandbok",
    "category": "info",
    "icon": "📚",
    "sv": {
      "name": "Personalhandbok",
      "description": "Hitta rutiner, information och blanketter. Sök och öppna dokument direkt i webbläsaren."
    },
    "en": {
      "name": "Employee Handbook",
      "description": "Find policies, procedures and forms. Search and open documents in the browser."
    },
    "de": {
      "name": "Personalhandbuch",
      "description": "Regelungen, Anweisungen und Formulare durchsuchen und im Browser öffnen."
    },
    "url": "./apps/DometicPersonalHandbok/",
    "external": false,
    "featured": true
  },
  {
    "id": "market-intelligence",
    "category": "info",
    "icon": "🌍",
    "sv": {
      "name": "Marknad & bransch",
      "description": "Europeisk RV-marknadsöversikt med registreringar, branschnyheter, produktnyheter och benchmark."
    },
    "en": {
      "name": "Market & Industry",
      "description": "European RV market overview with registrations, industry news, product updates and benchmarks."
    },
    "de": {
      "name": "Markt & Branche",
      "description": "Europäischer RV-Marktüberblick mit Zulassungen, Branchennews und Benchmarks."
    },
    "url": "./apps/market-intelligence/",
    "external": false,
    "featured": false
  },
  {
    "id": "lunchkollen",
    "category": "info",
    "icon": "🍽️",
    "sv": {
      "name": "Lunchkollen Tidaholm",
      "description": "Lunchmenyer från lokala restauranger, favoriter och uppgift om Dometics lunchkuponger."
    },
    "en": {
      "name": "Lunch Menus Tidaholm",
      "description": "Local lunch menus, favorites and information about Dometic lunch vouchers."
    },
    "de": {
      "name": "Mittagsmenüs Tidaholm",
      "description": "Lokale Mittagsmenüs, Favoriten und Informationen zu Dometic-Essensgutscheinen."
    },
    "url": "./apps/lunchkollen/",
    "external": false,
    "featured": false
  },
  {
    "id": "RTM",
    "category": "info",
    "icon": "📈",
    "sv": {
      "name": "RTM 3.0 – Produktionsuppföljning",
      "description": "Följ produktion, säkerhet, kvalitet och nyckeltal i den befintliga Power BI-rapporten."
    },
    "en": {
      "name": "RTM 3.0 – Production Performance",
      "description": "View production, safety, quality and KPIs in the existing Power BI report."
    },
    "de": {
      "name": "RTM 3.0 – Produktionssteuerung",
      "description": "Produktion, Sicherheit, Qualität und Kennzahlen im bestehenden Power-BI-Bericht verfolgen."
    },
    "url": "https://app.powerbi.com/links/PhqzYzhymt?ctid=c83e430b-cad8-46eb-b0c7-47e6cb3eb387&pbi_source=linkShare",
    "external": true,
    "featured": false
  },
  {
    "id": "Fotoapp",
    "category": "info",
    "icon": "📸",
    "sv": {
      "name": "Dometic Fotoapp",
      "description": "Fotografera personal, skapa standardiserade porträtt och exportera magnetbilder via den befintliga webbappen."
    },
    "en": {
      "name": "Dometic Photo App",
      "description": "Photograph employees, standardize portraits and export magnetic cards in the existing web app."
    },
    "de": {
      "name": "Dometic Foto-App",
      "description": "Mitarbeiter fotografieren, Porträts standardisieren und Magnetkarten exportieren."
    },
    "url": "https://dometic-fotoapp.vercel.app",
    "external": true,
    "featured": false
  }
];
