const config = require("./config.json");
var timeoutDuration = (config.hasOwnProperty("timeouts") && config.timeouts.hasOwnProperty("errorCodes")) ? parseInt(config.timeouts.errorCodes) : 3600
//convert milliseconds to seconds
timeoutDuration = timeoutDuration * 1000
var lastTalked = {}

function canTalkAbout(code) {
  var now = new Date()
  now = now.getTime()
  var prevTime = (lastTalked.hasOwnProperty(code)) ? lastTalked[code] : (now - timeoutDuration - 1);
  lastTalked[code] = now
  return ((now - prevTime) > timeoutDuration)
}

var errorCodeLookup = {
  "504510": "fix1",
  "504511": "fix1",
  "504512": "fix1",
  "1003": "fix2",
  "504502": "fix3",
  "504503": "fix3",
  "504504": "fix3",
  "504501": "fix4"
}

var fixes = {
  "fix1": {
    "description": "If you experience one of these error codes, please please try letting the battery drain completely and try again.",
    "instructions": [
      "Completely discharge the Pebble so that it shuts down.",
      "Try to turn on the Pebble with the select button, if you see the Pebble logo and the watch turns off by itself keep holding the select button until the watch no longer turns on with the Pebble logo.",
      "After verifying that the watch is completely discharged, please charge your watch and turn it on."
    ]
  },
  "fix2": {
    "description": "This error code indicates a problem with the Bluetooth Low Energy module in your phone.  This can typically be resolved by resetting the connection.",
    "instructions": [
      "Turn your phone off",
      "Press and hold the back (left) and select (middle-right) buttons on your watch until the ‘pebble’ logo appears",
      "Restart your phone",
      "Open your Pebble App and follow the prompts to reconnect your watch"
    ]
  },
  "fix3": {
    "description": "These error code indicate issues which can often be resolved by restarting the watch from recovery mode.",
    "instructions": [
      "Your watch may already be in Recovery Mode (pictured on right); if not, please press and hold the back, up, and select buttons at the same time.",
      "Continue holding until your watch screen shows a screen similar to the one pictured here.",
      "Open the Settings menu on your phone",
      "Open Bluetooth under Settings and find any Pebble devices",
      "Tap the icon to the right of the Pebble device(s) and forget them",
      "Reopen your Pebble App and follow the prompts to reconnect your watch to your phone"
    ],
    "image": "https://pebble-help-legacy.rebble.io/i.imgur.com/hZmtme7.png"
  },
  "fix4": {
    "description": "This error code indicates there may be an issue with one of the buttons on your watch. It is most often caused by a stuck button",
    "instructions": [
      "Press the back button quickly three times, holding the last push for 7 seconds",
      "Repeat with the other three buttons (order is not important)",
      "Hold the back (left side) and select (right middle) buttons at the same time for 5-10 seconds, until the Pebble logo appears"
    ]
  }
}



function matchCode(message) {
  message = message.toLowerCase();
  message = message.replace(/fe/g,"");
  message = message.replace(/[!?.'")>\]]/g,"");
  message = message.split(" ");
  for (var i=0; i < message.length; i++) {
    var word = message[i]
    if (errorCodeLookup.hasOwnProperty(word)) {
      var fix = fixes[errorCodeLookup[word]]

      var img = (fix.image == null) ? "https://willow.systems/pebble/bot/car.png" : fix.image
      var desc = ""
      fix.instructions.forEach(step => {
        desc += "- " + step + "\n"
      })

      if (canTalkAbout(word)) {
        return {
        color: parseInt("ff4700", 16),
        thumbnail: {
          url: img,
          height: 80,
          width: 80
        },
        title: "Error FE" + word,
        fields: [
          {name: "Error Description:", value: fix.description},
          {name: "Suggested Fix:", value: desc}
        ]
      }
      }
    }
  }
}

module.exports.matchCode = matchCode
