# Gebruikersprompt

Voor het aansturen van OBS Websocket dmv de app Chataigne gebruik ik een plugin. Deze OBS Websocket Advanced werkt maar gedeeltelijk omdat ze (bijv) voor de SetSourceProjector opdracht lege waarden sturen die OBS niet accepteert. Ook werkt GetMonitorList niet naar behoren. [https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced/](https://github.com/KopiasCsaba/Chataigne-Module-OBS-Websocket-Advanced/)

Controleer de bestaande module en spiegel modules die niet voldoen aan de eisen van OBS en test de werking in zowel het opzetten van de websocket en het uitvoern van commando's en de reactie erop: [https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)

Honoreer de programma en structuur opzet van de Chataigne Modules: [https://benkuper.notion.site/Making-your-own-Module-f892f4150bc74dc1b851ba1a3c99510d](https://benkuper.notion.site/Making-your-own-Module-f892f4150bc74dc1b851ba1a3c99510d)

Biedt mij een gepatchte Module: OBS Chataigne Advanced 2026. Zorg dat in ieder geval werkt:

[https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#opensourceprojector](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#opensourceprojector)

[https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getmonitorlist](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getmonitorlist)

Ook wil ik de bijgevoegde functionaliteit (screenshot) uit Bitfocus Companion : SetSourceVisibility beschikbaar hebben maar ik zie die optie zelf zo niet terug in de officiele OBS Websocket documentatie? In de screenshot heeft Bitfocus daarvoor een dropdown menu met de gevonden scenes en een optie "all" en de optie " hide, show of toggle", ik zou graag zo'n gelijke functionaliteit zien als de modules dat toestaan.

Test de werking van de wijzigingen met de openstaande Chataigne en OBS instance. Die mag je bedienen. Test de OBS socket opbouw - ik heb de websocket authenticatie ff uitgezet hiervoor.

Als je klaar bent documenteer je alles in de eerdere github  GitHub commit (mijn GitHub staat open in de ingebouwde browser) [https://github.com/VenturesGH/OBS-Chataigne-Advanced-2026](https://github.com/VenturesGH/OBS-Chataigne-Advanced-2026) - overschrijf wat daar al staat

Daarbij maak je ook netjes:

- vermelding dat AI de module herschreven heeft
- bron van de originele module + link (of fork maken, ook prima)
- een tabel met de verwijzing per websocket intergratie punt die je gewijzigd hebt, welke wijziging je hebt aangebracht en motivatie waarom / wat er volgens jou niet klopte
- deze prompt

## Vervolgopdracht

> ik heb nooit de opdracht voort te borduren gegeven, begin opnieuw
