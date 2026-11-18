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

## Innehåll och uppdateringar på organisationskontot
- **Marknad & bransch** läser `apps/market-intelligence/brief.json` från detta organisationsrepo, med den publicerade filen som reserv. GitHub Actions uppdaterar underlaget dagligen kl. **07:00 Europe/Stockholm**, med reservkörning kl. 07:17.
- **Lunchkollen** läser `apps/lunchkollen/data.json` från detta organisationsrepo och menybilder från appens egen `images/`-mapp. Ett separat GitHub Actions-flöde hämtar menyer på samma tider som tidigare.
- **Frekvensanalys** hämtar Excel-mallarna från mappen `apps/Frekvensanalys/` i det nya organisationsrepot, via GitHubs publika innehålls-API.
- **Personalhandboken:** Alla katalogens originaldokument, inklusive `PERS 032  - Kontorslandskap.pptx`, finns i `apps/DometicPersonalHandbok/dokument/`.
- **Instruktionsfilmer:** Filmer, undertexter och förhandsbilder finns i detta repos `media/`-mapp.
- Schemalagda uppdateringar och deras skript finns i detta repo och skriver endast hit. De använder GitHubs automatiska token; inga personliga API-nycklar behöver kopieras. Efter en uppdatering begär flödena en ny GitHub Pages-publicering.
- **RTM 3.0** öppnar fortfarande Power BI. **Dometic Fotoapp** öppnar fortfarande den befintliga Vercel-appen.
- Den gamla portalen, dess originalfiler och dess uppdateringsflöden har lämnats kvar oförändrade. Den nya portalens innehåll hämtas inte längre från det personliga kontot.

## Säkerhet
Repositoryt och GitHub Pages är publika. Lägg därför inte in lösenord, access tokens, företagshemligheter eller personuppgifter i denna kodbas. En installerad PWA ger snabbåtkomst – den skapar **inte** åtkomstkontroll till sidor eller filer.

Inga privata repos eller interna Power BI-/Dataverse-data har kopierats till denna publika portal.

## Portalens utseende och instruktionsfilmer
- Tre språkknappar, mörkt Dometic-tema och diskret CSS-animation på startsidan.
- De två Lean-korten har tagits bort från katalogen och deras kopior har rensats ur `apps/DometicLean/`. Originalet på personliga kontot påverkas inte.
- Twenty Cycle Check har svenska och engelska instruktionsfilmer via portalens filmspelare; RTM har en introduktionsfilm. Samtliga filer hämtas från den nya portalens egen `media/`-mapp.

## Introduktionsfilm om portalen
- **Svensk presentationsfilm, 1:10 i Full HD, 60 bilder/s**: `media/app-portal-intro-sv-smooth-60fps.mp4` (optimerad för uppspelning i webbläsaren).
- **4K-version, 60 bilder/s**: `media/Dometic-App-Portal-4K-60fps.mp4`.
- Filmen spelas i portalens befintliga filmfönster via knappen **Se presentationsfilmen** i välkomstfältet. Övriga instruktionsfilmer påverkas inte.
- Riktiga appvyer visas i animerade dator- och telefonramar. Originalets Dometic-logga används oförändrad. Mätvärden i demonstrationerna är märkta som exempeldata.
- Bildväxlingar följer den godkända berättarröstens ordtider. Hela ljudspåret, inklusive musik och effekter, har kopierats utan omkodning eller tidsförskjutning från den föregående 70-sekundersfilmen.
- Svenska undertexter kan väljas i spelaren. Filmerna har konstant bildfrekvens och MP4-huvudet i början för snabb uppstart.

### Filmversioner
- Aktuell film: `media/app-portal-intro-sv-smooth-60fps.mp4` – **1920 × 1080, 60 bilder/s, 70 sekunder**. Motsvarande 4K-fil finns ovan.
- Föregående 70-sekundersfilm: `media/app-portal-intro-sv.mp4` – bevarad som källa till den godkända voiceovern.
- Tidigare film: `media/archive/app-portal-intro-sv-original-93s.mp4` – originalet på 93 sekunder, bevarat för nedladdning.
- Den tillfälliga bygg-workflowen med signerade ljudlänkar är borttagen efter publiceringen.
