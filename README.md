# Dometic App Portal – Tidaholm

Gemensam startsida med processanalys, ergonomi, produktionsstöd och information.
Portal och kopierade webbappar ligger **i ett enda GitHub-repository**, i mappen `apps/`.

## Publicera webbplatsen (görs en gång)
1. Öppna [Settings → Pages](https://github.com/DometicTidaholm/Dometic-App-Portal/settings/pages).
2. Välj **Build and deployment → Source: Deploy from a branch**.
3. Välj **Branch: main** och **Folder: /(root)**, klicka **Save**.

Webbadress efter publicering:
https://dometictidaholm.github.io/Dometic-App-Portal/

## Mappstruktur
- `index.html` – portalens startsida.
- `styles.css` – portalens design.
- `apps-data.js` – alla appkort med beskrivningar på svenska, engelska och tyska.
- `portal.js` – sökning, filtrering, språk och installationsknapp.
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` – installation på hemskärm/desktop och offline-reserv för portalens startsida.
- `apps/<appnamn>/` – separata kopior av de offentligt publicerade webbapparna.

## Lägg till eller ändra en app
1. Lägg appens filer i en ny mapp under `apps/`. Huvudfilen ska heta `index.html`.
2. Lägg till ett objekt i listan `window.PORTAL_APPS` i `apps-data.js` med namn, beskrivning, kategori, ikon och länk.
3. Använd relativa länkar som `./apps/MinApp/`.
4. Commit – startsidan uppdateras vid nästa GitHub Pages-publicering.

## Installera portalen
- **Windows / Mac:** Öppna i Edge eller Chrome och klicka på portalens **Installera app**. Om installationsdialogen inte visas finns manuella instruktioner.
- **iPhone / iPad:** Öppna i Safari → Dela → Lägg till på hemskärmen.
- **Android:** Öppna i Chrome → menyn → Installera app eller Lägg till på startskärmen.

## Viktiga beroenden före eventuell radering av gamla repos
- **Marknad & bransch** läser sin dagligen uppdaterade `brief.json` från det gamla `MrMartinPet/Dometic`, med lokal kopia som reserv.
- **Lunchkollen** läser uppdaterad `data.json` och nya menybilder från den gamla portalen, med lokal JSON-reserv.
- **Frekvensanalys** hämtar Excel-mallarna från mappen `apps/Frekvensanalys/` i det nya organisationsrepot, via GitHubs publika innehålls-API.
- **Personalhandboken:** Dokumentet `PERS 032 - Kontorslandskap.pptx` är större än kopieringsanslutningens gräns och hämtas därför från den befintliga publicerade personalhandboken. Den trasiga nollbyteskopian har tagits bort.
- **RTM 3.0** öppnar fortfarande Power BI. **Dometic Fotoapp** öppnar fortfarande den befintliga Vercel-appen.
- Schemalagda GitHub Actions från gamla portalen har **inte duplicerats** för att undvika parallella uppdateringar. Filmerna från den gamla portalens `media/` har inte flyttats till detta repo.
- Originalrepos och befintliga webbplatser ska **behållas** tills datakällor, uppdateringar, dokument och länkar har verifierats.

## Säkerhet
Repositoryt och GitHub Pages är publika. Lägg därför inte in lösenord, access tokens, företagshemligheter eller personuppgifter i denna kodbas. En installerad PWA ger snabbåtkomst – den skapar **inte** åtkomstkontroll till sidor eller filer.

Inga privata repos eller interna Power BI-/Dataverse-data har kopierats till denna publika portal.

## Portalens utseende och instruktionsfilmer
- Tre språkknappar, mörkt Dometic-tema och diskret CSS-animation på startsidan.
- De två Lean-korten har tagits bort från katalogen och deras kopior har rensats ur `apps/DometicLean/`. Originalet på personliga kontot påverkas inte.
- Twenty Cycle Check har svenska och engelska instruktionsfilmer via portalens filmspelare; RTM har en introduktionsfilm. Filerna är för närvarande länkade till äldre portalen `MrMartinPet/Dometic/media/` och behöver flyttas separat innan originalet kan stängas.
- Ny film om själva App Portal har inte skapats; det görs senare.

## Introduktionsfilm om portalen
- **Svensk presentationsfilm, 1:10 (4K)** från ElevenLabs: `media/app-portal-intro-sv.mp4` (optimerad för GitHub Pages).
- Filmen spelas i portalens befintliga filmfönster via knappen **Se presentationsfilmen** i välkomstfältet. Övriga instruktionsfilmer påverkas inte.

### Filmversioner
- Aktuell film: `media/app-portal-intro-sv.mp4` – **3840 × 2160, 70 sekunder**, live-skärmbilder från organisationens publicerade appar, ElevenLabs v4 Kurt_speaker, instrumentalmusik och ljudeffekter.
- Tidigare film: `media/archive/app-portal-intro-sv-original-93s.mp4` – originalet på 93 sekunder, bevarat för nedladdning.
- Den tillfälliga bygg-workflowen med signerade ljudlänkar är borttagen efter publiceringen.
