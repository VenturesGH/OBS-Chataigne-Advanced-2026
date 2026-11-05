# Implementatie-audit

De patch begint bij upstream `d30e873`. De generator gebruikt [protocol.json op e28f849](https://github.com/obsproject/obs-websocket/blob/e28f84975984340e84fc4879cfc05741cc0afde1/docs/generated/protocol.json) met 147 requests en 60 events.

| Integratiepunt | Wijziging | Motivatie |
|---|---|---|
| [Hello en Identify](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#hello-opcode-0) | Bouw Identify op als object. Voeg de challenge-respons alleen toe als OBS authenticatie vraagt en die in de module is ingeschakeld. | Upstream stuurde bij een server zonder authenticatie een verzonnen authenticatiewaarde en negeerde de lokale schakelaar bij een challenge. |
| [Identified](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#identified-opcode-2) | Start de initiële Get-requests na Identified en gebruik die sessiestatus voor zichtbaarheid. | Een open socket is nog geen geïdentificeerde OBS-sessie. |
| [EventSubscription](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#eventsubscription) | Voeg de Canvases-bit toe. | De protocolsnapshot bevat canvas-events die upstream niet kon abonneren. |
| [Request](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#request-opcode-6) | Verstuur een string-ID. Genereer metadata voor optionele velden, laat lege optionele waarden weg en behoud expliciete getallen en booleans. Parse gestructureerde waarden als JSON. | Upstream stuurde een numeriek ID, vulde lege optionele velden in en genereerde sommige arrayvelden niet. |
| [OpenSourceProjector](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#opensourceprojector) en [OpenVideoMixProjector](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#openvideomixprojector) | Sta één projectorlocatie toe. Vereis voor een bronprojector een naam of UUID. Gebruik actuele velden, inclusief `canvasUuid`. | OBS weigert lege identifiers en tegelijk meegestuurde monitorindex en geometrie. |
| [SetInputVolume](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#setinputvolume) | Controleer dat slechts één volume-eenheid is opgegeven. | De twee alternatieve volumevelden mogen niet samen worden verstuurd. |
| [SetProfileParameter](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#setprofileparameter) en [SetSceneSceneTransitionOverride](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#setscenescenetransitionoverride) | Zet het woord `null` om naar JSON-null in de velden die dit ondersteunen. | Hiermee kan een opgeslagen waarde of override expliciet worden verwijderd. |
| [RequestResponse](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#requestresponse-opcode-7) | Toon request-ID, status en fouttekst. Render arrays met de juiste namespace en behoud ruwe objecten als JSON. | Foutresponses kunnen zonder `responseData` komen. Onbekende objecten gingen eerder verloren. |
| [GetMonitorList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getmonitorlist) | Koppel de response aan de bestaande monitor-mapping onder `requests`. | De renderer zocht de mapping upstream altijd onder `events`. |
| [GetSceneList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getscenelist) en [GetCurrentProgramScene](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getcurrentprogramscene) | Vul de scènekeuzes bij het aanmaken van de actie, ververs de cache bij scène-events en vraag de gekozen scope op bij uitvoering. | OBS heeft geen enkel request dat dezelfde scope-opties biedt als Companion. |
| [GetSceneItemList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getsceneitemlist) en [SetSceneItemEnabled](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#setsceneitemenabled) | Zoek de directe scène-items, filter optioneel op naam en wijzig hun zichtbaarheid. Toggle keert de opgehaalde toestand per item om. | OBS slaat zichtbaarheid per scène-item op. Dezelfde bron kan meerdere onafhankelijke items hebben. |

## Validatie op 5 november 2026

- **Chataigne 1.10.4 en OBS 33.0.0 / obs-websocket 5.7.6**. De nieuwe scriptversie is geladen in de open app. Na een nieuwe verbinding naar `127.0.0.1:4455` kwamen de initiële OBS-responses binnen. De projectoractie vanuit Chataigne opende zichtbaar het projectorvenster in OBS. Het venster is na afloop gesloten.
- **Modulescript tegen dezelfde draaiende OBS**. Hello → Identify → Identified zonder authenticatie. `GetMonitorList` gaf status 100 en leverde twee gerenderde monitorrijen. `OpenSourceProjector` gaf status 100 met alleen `sourceName` en `monitorIndex: -1`.
- **Zichtbaarheid tegen dezelfde draaiende OBS**. Hide, Show en Toggle in de programmascène gaven status 100. `GetSceneItemEnabled` bevestigde respectievelijk `false`, `true` en `false`. De beginsituatie is hersteld. De Chataigne-keuzelijst en de bulkactie over alle scènes zijn niet live doorlopen.
- **Afbakening**. Authenticatie met wachtwoord en alle overige afzonderlijke OBS-commando’s zijn in deze run niet live beproefd. De gewone moduleacties gebruiken JSON Hello, Identify, Identified, Event, Request en RequestResponse. Voor losse frames is er een Raw WS Message-actie.


## Keuzelijsten in 2026.11.6

| Integratiepunt | Wijziging | Motivatie |
|---|---|---|
| [GetSceneList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getscenelist), [GetInputList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getinputlist) en [GetGroupList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getgrouplist) | Vraag bij Identified de ongefilterde lijsten op. Vul bij het aanmaken van SetSourceVisibility de dropdowns Scene en Source. | GetSceneList en GetInputList hebben optionele filters. De oude opstartlus sloeg ze daarom over. Voor bronnen was er alleen een tekstveld. |

Tegen de draaiende OBS getest dat alle drie lijstrequests na Identified slagen, dat de callbacks scène- en bronopties opbouwen en dat de waarden van die opties Hide, Show en Toggle correct uitvoeren. De zichtbaarheid is na de test hersteld. De keuzelijsten zijn via het modulescript getest.


## Bronnen per scène in 2026.11.7

De Source-dropdown blijft zichtbaar. Bij het wijzigen van Scene vult de module die met de directe items uit [GetSceneItemList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getsceneitemlist). De actuele programmascène volgt [CurrentProgramSceneChanged](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#currentprogramscenechanged). De optie All scenes gebruikt de eerder opgehaalde collectiebrede bronnen.

De keuzelogica is via het modulescript tegen draaiende OBS getest. Voor elk van de zeven scènes kwamen de dropdownopties overeen met de directe scène-items die OBS retourneerde. Ook Current program scene en All scenes zijn gecontroleerd. Deze test heeft de zichtbaarheid in OBS niet gewijzigd.


## Chataigne-interfacetest in 2026.11.8

Chataigne 1.10.4 gaf voor een opgeslagen scèneselectie een lege tekst terug bij `substring(start)`. De module gebruikt nu expliciete eindposities en controleert lege tekst expliciet. De broncache gebruikt arrayrecords en de opties worden toegevoegd via Chataignes enumfuncties.

In de open Chataigne-inspector getest met de bestaande actie. `PREVIEW_SIGLE` bood `Groep 2`, `Groep` en `logo` aan. Bij het wisselen naar `PREVIEW_2` veranderde de lijst in `T01_R`, `NRWCST` en `T02_R`. De eerdere scèneselectie is hersteld. De tijdelijke koppeling waarmee de bestaande actie tijdens het testen opnieuw aan het script werd verbonden, maakt geen deel uit van de patch.


## Projectorbron kiezen in 2026.11.9

[OpenSourceProjector](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#opensourceprojector) heeft een dropdown met de via OBS opgehaalde inputs, scènes en groepen. De keuze wordt vertaald naar de bestaande `sourceName` en dezelfde serializer laat lege optionele velden weg. Het bestaande handmatige `sourceName`-veld blijft beschikbaar voor opgeslagen acties en voor invoer per naam of UUID.

Een via de keuzelogica samengestelde projectorrequest tegen draaiende OBS gaf status 100. Handmatige naam en een request met alleen UUID zijn apart op de verzonden velden gecontroleerd.


## Projectorkeuzes verversen in 2026.11.10

De bronlijst van bestaande projectoracties volgt de opgehaalde OBS-lijsten. **Query All Values** vraagt de lijsten opnieuw op. Als de gekozen bron nog beschikbaar is, blijft die geselecteerd.

Getest met een actie die vóór de OBS-responses was aangemaakt. Dezelfde actie ontving 21 bronopties en behield de selectie bij een tweede query. Ook in de Chataigne-inspector zijn de bronopties op een bestaande actie gecontroleerd, met een tijdelijke koppeling voor de al open sessie.
