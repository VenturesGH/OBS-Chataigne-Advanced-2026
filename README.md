# OBS Chataigne Advanced 2026

Chataigne-module voor OBS WebSocket 5.x. OpenAI Codex heeft de WebSocket-integratie met AI herschreven, rechtstreeks vanaf commit `d30e873` van de originele [Chataigne-Module-OBS-Websocket-Advanced](https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced) van KopiasCsaba. Die module bouwt voort op de [OBS WebSocket-module van Edrig](https://github.com/Edrig/OBS-Websocket-Chataigne-Module).

## Installatie

1. Pak de module uit in een lokale map onder `Documents/Chataigne/modules`. De map bevat rechtstreeks `module.json`, `OBSAdvanced.js` en `icon.png`.
2. Kies `File → Reload Custom Modules` en voeg onder `Software` **OBS Chataigne Advanced 2026** toe. Maak de betreffende acties opnieuw aan als je overstapt van een oudere versie, zodat ze de actuele parametertypen krijgen.
3. Stel `Server Path` in op de OBS-host en poort, standaard `127.0.0.1:4455`. Vul bij een OBS-server met authenticatie het WebSocket-wachtwoord in. De module vraagt bij het verbinden automatisch de initiële waarden op.

## Acties

- **OpenSourceProjector** biedt onder **sourceName (OBS)** de gevonden OBS-bronnen. Kies **Enter a name or use UUID** voor een handmatige `sourceName` of `sourceUuid`. Wacht tot OBS verbonden is voordat je de actie aanmaakt. Vul `monitorIndex` in voor fullscreen of laat het leeg voor een venster. `-1` opent ook een venster. Gebruik alleen `projectorGeometry` als je Qt-geometrie wilt opgeven.
- **GetMonitorList** toont de OBS-index en de monitorgegevens per monitor onder `Values → Responses → GetMonitorList`.
- **SetSourceVisibility** staat onder `Scene Items`. Kies onder **Scene** de actuele programmascène, alle scènes of een gevonden OBS-scène. Kies onder **Source** een gevonden bron of vink **All Sources** aan. De bronlijst volgt de geselecteerde scène en toont de directe scène-items. Bij **All scenes** toont de lijst alle OBS-inputs, scènes en groepen uit de actieve scènecollectie. **All Sources** past de actie toe op alle directe items binnen de gekozen scope. Gebruik **Enter a scene name** of **Enter a source name** voor handmatige invoer. Wacht tot OBS verbonden is vóór je de actie aanmaakt. Maak na wijzigingen in de OBS-scènecollectie een nieuwe actie aan om de keuzelijsten bij te werken. Kies **Show**, **Hide** of **Toggle**. De actie werkt op directe scène-items en behandelt iedere kopie van een bron afzonderlijk. Voor items binnen groepen zijn de aparte OBS-groepsrequests beschikbaar.
- Optionele getallen en booleans zijn tekstvelden. Leeg laat OBS de standaard kiezen. `0`, `-1`, `true` en `false` kunnen expliciet worden opgegeven.

Zie de [wijzigingen en testresultaten](docs/IMPLEMENTATION_AUDIT.md) en de [gebruikersprompt](docs/USER_PROMPT.md).

De gegenereerde OBS-definities zijn reproduceerbaar met `python3 tools/regenerate.py`. De module gebruikt de [Chataigne-modulestructuur](https://benkuper.notion.site/Making-your-own-Module-f892f4150bc74dc1b851ba1a3c99510d) met `module.json` en een WebSocket Client-script.
