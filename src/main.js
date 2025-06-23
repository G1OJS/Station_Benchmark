var refresh_mSeconds = 5000;
var watchedMode = "FT8";

import * as UI from './ui.js';
import * as ENG from './eng.js';
import * as MQTT from './mqtt.js';
import * as STORAGE from './storage.js';

STORAGE.loadConfig();
setInterval(UI.updateClock, 1000);
setInterval(UI.writeStatsForAllBands, refresh_mSeconds);
setInterval(UI.writeModeButtons, refresh_mSeconds);
setInterval(ENG.purgeConnections, 30000);
MQTT.connectToFeed();

