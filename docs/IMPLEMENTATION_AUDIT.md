# Implementatie-audit OBS Chataigne Advanced 2026

## Referentiebasis

- Officiële OBS WebSocket-definitie: [`protocol.md`](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md) en [`protocol.json`](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.json).
- Gebruikte protocolgeneratie: commit [`bc50ba19b7007c84647bf2afbfac9ac42503fc34`](https://github.com/obsproject/obs-websocket/commit/bc50ba19b7007c84647bf2afbfac9ac42503fc34), 27 februari 2026.
- Chataigne-module-eisen: [Making your own Module](https://benkuper.notion.site/Making-your-own-Module-f892f4150bc74dc1b851ba1a3c99510d) en [Module Scripts](https://benkuper.notion.site/Module-Scripts-3f47b4f6127f498baa0567afb5ca150f).
- Ingebedde dekking: 147 requests, 60 events en 7 enums.

## Wijzigingentabel

| WebSocket-integratiepunt | Wijziging | Motivatie / eerder probleem |
|---|---|---|
| Hello (op 0) | Versies worden vastgelegd; RPC-versie wordt onderhandeld; Identify wordt als object geserialiseerd. | De oude code bouwde JSON met stringconcatenatie en controleerde de aangeboden RPC-versie niet. |
| Authenticatie | Het protocolrecept `SHA256(password + salt)` → Base64 → `SHA256(secret + challenge)` → Base64 blijft behouden, maar het authenticatieveld wordt alleen toegevoegd wanneer OBS dit vraagt en de moduleoptie is ingeschakeld. | Zonder authenticatie stuurde de module ten onrechte de tekst `Chataigne` als authenticatiewaarde; de schakelaar werd feitelijk genegeerd. |
| Identify (op 1) | Alleen geldige velden worden verstuurd; eventbitmask wordt centraal berekend. | Voorkomt afwijking tussen eerste verbinding en latere subscriptionwijzigingen. |
| Identified (op 2) | Verbindingsstatus wordt gepubliceerd en parameterloze Get-requests worden pas daarna verstuurd. | Voldoet aan de eis dat vóór Identified slechts één Identify mag worden gestuurd. |
| Opstartvolgorde Chataigne/OBS | `init()` heropent een reeds ingeschakelde moduleverbinding nadat het script volledig geladen is. | Chataigne kon eerst de socket openen en pas enkele milliseconden later het script laden. Omdat OBS Hello slechts eenmaal direct na connectie stuurt, bleef de module dan groen verbonden zonder ooit Identify of requests te verzenden. |
| Reidentify (op 3) | Wijzigingen aan eventsubscriptions worden live met Reidentify toegepast. | Voorheen vereiste elke subscriptionwijziging een reconnect. |
| Event (op 5) | Events blijven protocolgestuurd; onbekende velden in object-arrays blijven zichtbaar. | Nieuwe OBS-velden werden eerder stilzwijgend verwijderd. |
| Request (op 6) | `requestId` wordt altijd een string; `requestData` wordt protocolbewust opgebouwd. | OBS specificeert een string-id; de module stuurde een Integer. |
| RequestResponse (op 7) | Succes, statuscode, comment en request-id worden gepubliceerd. Foutresponses zonder `responseData` worden apart afgehandeld. | De oude handler derefereerde ontbrekende `responseData` en kon daardoor op een normale OBS-fout crashen. |
| RequestBatch (op 8) | Nieuw Chataigne-command met request-id, halt-on-failure, execution type en JSON-requestlijst. | Dit officiële protocolintegratiepunt ontbrak behalve via het volledig ruwe command. |
| RequestBatchResponse (op 9) | Batchresultaten worden per item onder `Responses > Batch` zichtbaar. | Batchresponses werden niet herkend. |
| EventSubscription::Canvases | Canvasbit 11 en een Chataigne-parameter toegevoegd. | OBS WebSocket 5.7 voegde canvas-events toe; de module kende deze bit niet. |
| Protocolsnapshot | `protocol.json` opnieuw ingebed en `module.json` opnieuw gegenereerd. | De oude snapshot had 142 requests en 57 events; vijf requests en drie events ontbraken. |
| GetCanvasList | Command, responsemapping en volledige row-JSON toegevoegd. | Nieuw in 5.7; canvasnaam/UUID/flags/videosettings waren afwezig. |
| CanvasCreated / CanvasRemoved / CanvasNameChanged | Events en subscriptiondekking toegevoegd via de actuele snapshot. | Deze drie 5.7-events ontbraken. |
| Input deinterlace | Get/Set mode en Get/Set field order toegevoegd. | Deze vier actuele requests ontbraken. |
| Optionele Strings/Objecten | Lege waarde, `undefined` en niet-toegestane `null` worden niet geserialiseerd. | OBS weigert lege optionele identifiers; dit veroorzaakte onder andere projectorerrors. |
| Optionele Numbers | Worden in Chataigne als tekstveld aangeboden; leeg = weglaten, `0`/`-1` = expliciet getal. | Een numeriek Chataigne-veld heeft standaard `0`, waardoor “niet ingevuld” niet van de geldige waarde nul te onderscheiden was. |
| Optionele Booleans | Generator gebruikt het protocol-default en laat exact die default weg; de tegengestelde waarde wordt expliciet verzonden. | Behield een normale checkbox zonder onbedoeld de OBS-default te overschrijven. |
| Vereiste velden | Lege vereiste strings en ontbrekende waarden worden lokaal afgewezen en gelogd. | Voorkomt voorspelbare `MissingRequestField`/`RequestFieldEmpty`-responses. |
| Naam/UUID-paren | Input-, scene- en source-commands vereisen minstens één bruikbare naam of UUID. | Het protocol markeert elk veld afzonderlijk optioneel, maar OBS' acquire-functies vereisen conditioneel één identifier. |
| OpenSourceProjector | Ondersteunt `canvasUuid`; lege bronvelden worden weggelaten; bronidentifier wordt gevalideerd; geometry wint van de standaard monitorwaarde. | De oude action stuurde alle vier velden, inclusief lege strings, en OBS wees die af. |
| OpenVideoMixProjector | `projectorGeometry` en `monitorIndex` worden niet samen verstuurd. | OBS retourneert `TooManyRequestFields` voor deze combinatie. |
| SetInputVolume | `inputVolumeMul` en `inputVolumeDb` mogen niet gelijktijdig worden verstuurd. | Beide velden zijn conditioneel optioneel maar onderling alternatief. |
| Nullable transition override | De tekst `null` wordt voor de twee protocol-toegestane velden naar JSON-null omgezet. | OBS gebruikt expliciete null om een override te verwijderen; leeg betekent “ongewijzigd”. |
| GetMonitorList | De hardgecodeerde `events.*`-lookup is vervangen door `requests.*`; volledige rows worden weergegeven; monitorcount en links-naar-rechts-volgorde toegevoegd. | De requestmapping bestond wel, maar kon door de verkeerde namespace nooit worden gevonden. |
| Alle Array&lt;Object&gt;-responses | Expliciete mappings uitgebreid; iedere row bevat daarnaast `rawJson`, zodat resterende en toekomstige velden behouden blijven. | Onbekende arrays werden gelogd maar volledig weggegooid; bekende mappings verloren nieuwe kolommen. `rawJson` werkt ook in Chataignes oudere JavaScript-engine, die geen `for…in` ondersteunt. |
| GetGroupSceneItemList | Dezelfde volledige scene-itemmapping als gewone scènes. | De oude code sloeg groups bewust over, hoewel OBS hiervoor een officiële request biedt. |
| GetInputPropertiesListPropertyItems | `itemName`, `itemEnabled` en `itemValue` toegevoegd. | De mapping stond als “niet mogelijk” uitgeschakeld, maar de OBS-broncode definieert de rowstructuur eenduidig. |
| Object-responsevelden | Als compacte JSON-string opgeslagen. | Twintig response/eventvelden met protocoltype `Object` werden door `addParameter` niet ondersteund en verdwenen. |
| Any-responsevelden | JSON-waarden blijven typeveilig als JSON zichtbaar. | Een object werd eerder als niet-string aan een stringparameter aangeboden. |
| Callbacksignatuur | `wsMessageReceived(message)` gebruikt exact de WebSocket-clientsignatuur van Chataigne. | De twee-argumentvorm `wsMessageReceived(connectionId, message)` hoort bij een WebSocket-server. Voor de client kon die vorm ertoe leiden dat OBS' Hello-frame niet werd verwerkt en dus geen Identify werd verzonden. |
| Chataigne 1.10.4-scriptengine | ES-constructies die deze engine niet implementeert (`try/catch`, constructorconversies, `for…in` en `Array.join`) zijn vervangen; de returnwaarden van `addContainer` en `add…Parameter` worden rechtstreeks gebruikt. | De eerste live runs toonden parser-/runtimefouten en veel misleidende `Child not found`-meldingen. De definitieve run laadt, verbindt en verwerkt `queryAll` zonder nieuwe scriptfout of waarschuwing. |
| Generator | Correcte backslashverwerking, optionaliteitsmetadata, volledige beschrijvingen/defaults en compatibiliteitsindex. | De oude generator dubbel-escapete de protocol-JSON en verloor bij optionele velden de eigenlijke beschrijving. |
| Chataigne-metadata | Nieuwe naam, versie, correcte spelling Authentication, actuele documentatie/downloadlinks en Canvasparameter. | Voldoet aan `module.json`-eisen en onderscheidt deze herschreven editie van de alpha-upstream. |

## Verificatie

### Geautomatiseerd

- JavaScript syntax en JSON-validatie.
- Serializerregressies voor leeg/`null`/`0`/`-1`, JSON-objecten, mutexvelden en identifiergroepen.
- Dekkingscontrole die elk van de 147 protocolrequests vergelijkt met het gegenereerde Chataigne-command en de veldoptionaliteit.
- Opcode- en response-integratietests voor Identify, Reidentify, request/query, foutresponses, monitorarrays, objectvelden en batches.
- Generator-idempotentie: opnieuw genereren laat de repository ongewijzigd.

### Live tegen OBS

Op 5 november 2026 getest tegen de reeds draaiende OBS 33.0.0 / obs-websocket 5.7.6:

| Test | Resultaat |
|---|---|
| Geauthenticeerde Hello/Identify | Verbonden |
| GetVersion | Status 100 |
| GetMonitorList | Status 100; één monitor volledig ontvangen |
| GetCanvasList | Status 100; één canvas ontvangen |
| OpenSourceProjector via module-serializer | Status 100 |

De verzonden projector-`requestData` bevatte exact `sourceName` en `monitorIndex: -1`. Het tijdelijke projectorvenster werd daarna gesloten.

### Live in Chataigne

De module is als gewone lokale map geladen in Chataigne 1.10.4 en verbonden met dezelfde OBS-instance. Een verse sessie doorliep Hello/Identify, opende de WebSocketverbinding en verwerkte de automatische parameterloze Get-requests, inclusief de `GetMonitorList`-response, zonder nieuwe parserfout, runtimefout of `Child not found`-waarschuwing. Na de test is het oorspronkelijke gebruikersbestand `test_autosave_0.noisette` weer geopend. Voor de oorspronkelijke opgeslagen en autosaveversie zijn daarnaast herstelkopieën buiten deze repository bewaard.

## Bekende operationele aandachtspunten

- Maak na `Reload Custom Modules` een nieuwe module-instance; Chataigne bewaart commandoparameters van bestaande actions.
- Installeer de module als lokale kopie. Een symlink vanuit `Documents/Chataigne/modules` naar een Nextcloud File Provider-map kan Chataignes synchrone modulelader in een `open()`-aanroep laten blokkeren.
- Nieuwe protocolrequests kunnen door een oudere OBS-versie worden afgewezen. De foutstatus verschijnt dan onder `Responses` in plaats van een scriptfout te veroorzaken.
