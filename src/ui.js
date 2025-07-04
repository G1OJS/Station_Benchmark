var tStart = Date.now(); // software start time
var HTML = "";
var activeModes = new Set();
var watchedMode="FT8";

import * as ENG from './eng.js';
import * as STORAGE from './storage.js';
console.log('STORAGE.updateSquaresList:', STORAGE.updateSquaresList);


export function updateClock() {
    const t = new Date;
    const utc = ("0" + t.getUTCHours()).slice(-2) + ":" + ("0" + t.getUTCMinutes()).slice(-2) + ":" + ("0" + t.getUTCSeconds()).slice(-2);
    const runningmins = Math.trunc(((t - tStart) / 1000) / 60);
    document.getElementById("clock").innerHTML = utc + " UTC";
    document.getElementById("runningMins").innerHTML = runningmins;
	document.getElementById("connectionsIn").innerHTML = ENG.countAllTimestamps();
}

export function writeModeButtons() {
    const el = document.getElementById("modeSelectBox");
    el.innerHTML = "<legend>Mode</legend>";
    activeModes.forEach((md) => {
        const modeBtn = document.createElement("button");
        modeBtn.type = "button";
        modeBtn.className = "modeSelectBtn";
        modeBtn.id = md;
        modeBtn.textContent = md;
        modeBtn.addEventListener('click', () => setMode(md));
        el.appendChild(modeBtn);

        if (md === watchedMode) {
            modeBtn.classList.add('active');
        }
    });
}

function setMode(mode) {
    watchedMode = mode;
    writeStatsForAllBands();
	writeModeButtons();
}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

function safePercentage(numerator, denominator) {
    if (denominator == 0)
        return "0%";
    return Math.round((numerator / denominator) * 100) + "%";
}

export function writeStatsForAllBands() {

    const activeBands = Object.keys(ENG.connectivity_Band_Mode_HomeCall).sort((a, b) => wavelength(b) - wavelength(a));
 
    HTML = "<h3>Transmitting " + watchedMode + "</h3><div class='outputContainer transmit'>";
    writeStatsRowLabels();
    activeBands.forEach(band => writeStatsForThisBand(band, "Tx"));
    HTML += "</div>";
	
    HTML += "<h3>Receiving " + watchedMode + "</h3><div class='outputContainer receive'>";
    writeStatsRowLabels();
    activeBands.forEach(band => writeStatsForThisBand(band, "Rx"));
    HTML += "</div>";
	
    document.getElementById("mainContent").innerHTML = HTML;
	document.querySelectorAll("div").forEach(div => {
      if (div.innerText.trim() === "0") {
        div.classList.add("zero");
      }
    });
}

function writeStatsRowLabels() {
    HTML += "<div class = 'outputColumn'>"
     + "<div class = 'firstColumn topRow' title = 'Band'>Band</div>"
     + "<div class = 'firstColumn' title = 'Number of callsigns active in home squares'>Home calls</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by all callsigns in home, as a group'>Total spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by best performing callsign in home (hover over numbers for callsign)'>Leader spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by my callsign'>" + STORAGE.myCall + " spots</div>"
     + "</div>";
}

function writeStatsForThisBand(band, RxTx) {
//	console.log("Writing stats for " + band + RxTx);
    const bandData = ENG.connectivity_Band_Mode_HomeCall[band];
    if (!bandData) return;

    // Update activeModes early for all modes found on this band
    for (const md in bandData) {
        activeModes.add(md);
    }

    // Access the relevant direction of the watched mode
    const bandModeData = bandData[watchedMode]?.[RxTx];

    // Skip only if both directions are missing or empty
    if (!bandModeData || Object.keys(bandModeData).length === 0) {
        const otherDir = (RxTx === "Tx") ? "Rx" : "Tx";
        const otherData = bandData[watchedMode]?.[otherDir];
        if (!otherData || Object.keys(otherData).length === 0) return;
    }

    let nMe = 0,
    nMax = 0,
    winner = "";
    let nActive = 0;
    const otherEndCallsAggregate = new Set();

    for (const homeCall in bandModeData) {
        const peerMap = bandModeData[homeCall];
        const otherSet = new Set();

        for (const otherCall in peerMap) {
            otherSet.add(otherCall);
            otherEndCallsAggregate.add(otherCall);
        }

        const count = otherSet.size;
        if (count > 0)
            nActive++;

        if (count > nMax) {
            nMax = count;
            winner = homeCall;
        }

        if (homeCall === STORAGE.myCall) {
            nMe = count;
        }
    }

    HTML += "<div><div class='outputColumn'>"
     + "<div class='topRow'>" + band + "</div>"
     + "<div>" + nActive + "</div>"
     + "<div>" + otherEndCallsAggregate.size + "</div>"
     + "<div title='" + winner + "'>" + nMax + "</div>"
     + "<div title='" + STORAGE.myCall + "'>" + nMe + "</div>"
     + "</div></div>";
}


document.addEventListener('DOMContentLoaded', () => {
	
  const myCallInput = document.getElementById('myCallInput');
  if (myCallInput) {
    myCallInput.addEventListener('change', STORAGE.updateMyCall);
    console.log('Listener attached to myCallInput');
  } else {
    console.warn('myCallInput element not found');
  }

  const homeSquaresInput = document.getElementById('homeSquaresInput');
  if (homeSquaresInput) {
	const input = document.getElementById('homeSquaresInput');
    console.log('Input element:', input);
    input.addEventListener('change', STORAGE.updateSquaresList);
    console.log('Listener attached to homeSquaresInput');
  } else {
    console.warn('homeSquaresInput element not found');
  }

  const purgeMinutesInput = document.getElementById('purgeMinutesInput');
  if (purgeMinutesInput) {
    purgeMinutesInput.addEventListener('change', STORAGE.updatePurgeMins);
    console.log('Listener attached to purgeMinutesInput');
  } else {
    console.warn('purgeMinutesInput element not found');
  }
});

