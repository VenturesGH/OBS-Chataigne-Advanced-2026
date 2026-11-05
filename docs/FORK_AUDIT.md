# Forkaudit vóór herimplementatie

Uitgevoerd op 5 november 2026, vóór het herschrijven van de Advanced-module. Vergelijkingen zijn gemaakt met de standaardbranch van de betreffende upstream.

## Edrig/OBS-Websocket-Chataigne-Module

Forkoverzicht: <https://github.com/Edrig/OBS-Websocket-Chataigne-Module/forks>

| Fork | Unieke status | Bevinding |
|---|---:|---|
| [ElectronFlowVJ](https://github.com/ElectronFlowVJ/OBS-Websocket-Chataigne-Module) | 1 commit voor | Voegt media-input polling en tijdwaarden toe; geen fix voor optionele requestvelden, projector of GetMonitorList. |
| [H3mul](https://github.com/H3mul/OBS-Websocket-Chataigne-Module) | 1 commit voor | Schakelt automatische valuefeedback uit om een crash te vermijden; geen protocolfix. |
| [KopiasCsaba](https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced) | 11 commits voor / 2 achter | Is de oorspronkelijke Advanced-variant en de gekozen basis; bevat de gemelde problemen nog. |
| [Guesn](https://github.com/Guesn/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |
| [neolectron](https://github.com/neolectron/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |
| [huangming741](https://github.com/huangming741/OBS-Websocket-Chataigne-Module) | Geen vergelijkbare actuele branch | Geen aantoonbare unieke fix in de zichtbare fork. |
| [tainalo2](https://github.com/tainalo2/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |
| [awrebels](https://github.com/awrebels/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |
| [Giing](https://github.com/Giing/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |
| [DrMicka](https://github.com/DrMicka/OBS-Websocket-Chataigne-Module) | Alleen achter | Geen unieke fix. |

## KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced

Forkoverzicht: <https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced/forks>

| Fork | Unieke status | Bevinding |
|---|---:|---|
| [dsokoloski](https://github.com/dsokoloski/Chataigne-Module-OBS-Websocket-Advanced) | 1 commit voor | Voegt `@@root.customVariables...@@`-substitutie in JSON-payloads toe; geen fix voor optionaliteit, projector of monitorrespons. |
| [gniluje](https://github.com/gniluje/Chataigne-Module-OBS-Websocket-Advanced) | Identiek | Geen unieke wijziging. |

## Conclusie

Geen bestaande fork bood de gevraagde complete oplossing. Daarom is de Advanced-variant protocolbreed herzien in plaats van één losse projectorpatch over te nemen.
