# OBS Chataigne Advanced 2026

Een protocol-gegenereerde Chataigne-module voor OBS WebSocket 5.x. Deze editie is in 2026 met AI-assistentie herschreven, handmatig nagelopen en live gevalideerd tegen Chataigne 1.10.4 en OBS 33.0.0 / obs-websocket 5.7.6.

Versie 2026.11.1 voorkomt bovendien een opstartrace waarbij Chataigne de socket al kon openen voordat het modulescript geladen was. De groene verbindingsindicator was dan zichtbaar, maar OBS' eenmalige Hello-frame werd gemist en er volgde geen Identify. De module heropent de socket nu gecontroleerd vanuit `init()` nadat de callback beschikbaar is.

De module is afgeleid van [KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced](https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced), dat zelf voortbouwt op [Edrig/OBS-Websocket-Chataigne-Module](https://github.com/Edrig/OBS-Websocket-Chataigne-Module). Dank aan beide auteurs en aan Benjamin Kuperberg voor [Chataigne](https://benjamin.kuperberg.fr/chataigne/en).

> AI-vermelding: de herimplementatie, protocol-audit, tests en documentatie van deze 2026-editie zijn door OpenAI Codex uitgevoerd onder regie van de gebruiker. De originele auteurs blijven hierboven expliciet vermeld; deze editie claimt hun eerdere werk niet als nieuw werk.

## Belangrijkste correcties

- Optionele velden worden werkelijk weggelaten. Een leeg `sourceUuid` of `projectorGeometry` komt dus niet meer in een `OpenSourceProjector`-request terecht.
- Optionele numerieke velden zijn in Chataigne tekstvelden: leeg betekent “niet meesturen”, `0` en `-1` blijven geldige expliciete waarden.
- Conditioneel vereiste naam/UUID-paren worden vóór verzending gecontroleerd.
- Onderling exclusieve velden, waaronder `monitorIndex`/`projectorGeometry` en `inputVolumeMul`/`inputVolumeDb`, worden correct behandeld.
- `requestId` wordt altijd als string verstuurd, conform het protocol.
- `GetMonitorList` en alle andere `Array<Object>`-responses gebruiken nu de juiste `requests.*`-mapping; iedere row bewaart bovendien de volledige `rawJson`, zodat onbekende toekomstige velden zichtbaar blijven.
- `Object`-responsevelden worden als JSON bewaard in plaats van genegeerd.
- Mislukte requests zonder `responseData` worden zichtbaar gemaakt zonder scriptfout.
- Alle huidige 147 requests en 60 events uit de officiële protocoldefinitie zijn ingebed. OBS WebSocket 5.7 canvas- en deinterlace-integraties zijn toegevoegd.
- Alle JSON-opcodes 0, 1, 2, 3, 5, 6, 7, 8 en 9 worden ondersteund, inclusief Reidentify en request batches.

Zie [docs/IMPLEMENTATION_AUDIT.md](docs/IMPLEMENTATION_AUDIT.md) voor de volledige wijzigingentabel en motivatie. De vooraf uitgevoerde forkaudit staat in [docs/FORK_AUDIT.md](docs/FORK_AUDIT.md). De oorspronkelijke gebruikersprompt staat ongewijzigd in [docs/USER_PROMPT.md](docs/USER_PROMPT.md).

## Installatie

1. Kopieer deze map als gewone lokale map naar `<Documents>/Chataigne/modules/OBS-Chataigne-Advanced-2026`.
2. Kies in Chataigne `File > Reload Custom Modules`.
3. Verwijder een oude module-instance en voeg `Software > OBS Chataigne Advanced 2026` opnieuw toe. Chataigne past wijzigingen in `module.json` niet retroactief toe op bestaande instances.
4. Stel `Server Path` in, standaard `127.0.0.1:4455`, en vul zo nodig het OBS WebSocket-wachtwoord in.

Gebruik voor een Nextcloud-werkmap geen symlink in Chataignes modulemap; kopieer de map lokaal. De Chataigne-modulelader kan bij het volgen van zo'n cloudsymlink blokkeren.

## Gebruik

Responses staan onder `Values > Responses`, events onder `Values > Events` en samengevoegde veelgebruikte waarden onder `Values > Merged`.

`GetMonitorList` publiceert naast de volledige monitorobjecten:

- `monitorCount`;
- een links-naar-rechts gesorteerde reeks OBS-monitorindexen onder `Merged > Monitoren`;
- bij exact drie monitoren de extra aliassen `Links`, `Midden` en `Rechts`.

Voor optionele numerieke commandovelden geldt: laat het veld leeg om het niet te verzenden. Vul bijvoorbeeld `-1` in bij `monitorIndex` om een projector in een venster te openen. Objectvelden verwachten JSON, bijvoorbeeld `{}`.

## Testen en regenereren

```sh
npm test
python3 tools/regenerate.py
```

De generator haalt `docs/generated/protocol.json` van de officiële [obs-websocket-repository](https://github.com/obsproject/obs-websocket) op, werkt de ingebedde API en de commandodefinities bij en bewaart optionaliteitsmetadata voor bestaande Chataigne-actions.

De live validatie op 5 november 2026 gaf OBS-statuscode `100` voor `GetMonitorList`, `GetCanvasList` en een door deze module geserialiseerde `OpenSourceProjector` met uitsluitend `sourceName` en `monitorIndex`.

Bij diagnose kunnen `Log Incoming` en `Log Outgoing` bovenin de module-inspector tijdelijk worden ingeschakeld. Een gezonde start toont achtereenvolgens Hello, Identify, Identified en de automatisch verzonden Get-requests.

## Compatibiliteit

- Chataigne: getest met 1.10.4.
- OBS: getest met 33.0.0 en obs-websocket 5.7.6.
- Oudere OBS 28+ versies ondersteunen de basis van WebSocket 5.x, maar commands die later zijn toegevoegd kunnen daar terecht met `UnknownRequestType` worden afgewezen.

## Licentie en herkomst

Deze repository behoudt de herkomstgeschiedenis van de Advanced-module. Controleer bij distributie ook de licentievoorwaarden van Chataigne en obs-websocket; de protocoldefinitie wordt als gegenereerde interoperabiliteitsmetadata gebruikt.
