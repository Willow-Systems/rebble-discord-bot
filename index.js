var Discord = require('discord.io');
var fs = require('fs');
var wait = require('wait-sync');
const auth = require("./auth.json");
const support = require("./support.js")
const codes = require("./errorcodes.js")
const moderator = require("./funsucker.js")
var pbimg = require("./pblimg.js")
var userauth = require("./roles.js")
const config = require("./config.json");

//Automatically start bot on launch (true normally, false for debug)
var autoStartBot = true;

var debugCommandsEnabled = true;
var verboseLogging = true;

var disabled = false

version = 0.1;

//Dynamic configuration. Loaded/saved to disk. Don't edit here
settings = {
  mytag: "",
  usersICareAbout: {}
}

// Utility functions
utils = {
  dayOfWeek: function() {
    return new Date().getDay();
  },
  day: function() {
    var d = new Date().getDay();
    return env.days[d];
  },
  debugLog: debugLog,
  sendMessage: botReply,
  deleteMessage: deleteMessage,
  getServerTrustedID: userauth.getTrustedServerName,
  getRndInteger: getRndInteger
}
function resolveServerIDToTrustedServer(id) {
  var sname = null
  var p = config.trustedServers.forEach(elm => {
    if (id == elm.id) {
      sname = elm.name
    }
  });
  return sname
}
function validateConfig() {

}
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}
function userTagToID(tag) {
  //E.g. <@!316611120519577602>
  try {
    return tag.match(/\d+/)[0];
  } catch (e) {
    return "";
  }
}
function debugLog(text) {
  if (verboseLogging) {
    console.log(text)
  }
}
function generateHelpEmbed() {
  var e = {
    color: parseInt("ff4700", 16),
    thumbnail: {
      url: "https://willow.systems/pebble/bot/bot.png",
      height: 80,
      width: 80
    },
    title: "Hi, I'm Anne",
    description: "I do a few things round here to help out. Perhaps the most useful is answer your questions. Start the question with a question mark (mad, I know) and I'll do my best to answer it.",
    fields: [
      {"name": "Asking me a question", value: "Start a question with a question mark, and I'll try to find support for your issue. For example: `? Where can I find the android app?`"},
      {"name": "Pebble Images", value: "If you write a message with a Pebble resource in it (i.e. `system://images/emoji_11`), I'll post that image. For a list of all available, see https://willow.systems/pebble/bot/images/"},
      {"name": "Error codes", value: "If you write a message with a Pebble error code in it (i.e. `FE504504`), I'll explain how to fix it."},
      {"name": "Other Commands", value: "I also have a few commands that are useful. These start with a leading period:"},
      {"name": ".support [topic]", "value": "Show a support topic. If you don't know what you're looking for, try asking me a question first."},
      {"name": ".support list", "value": "List all support topics"},
      {"name": ".help", "value":"Show this message"},
      {"name": ".ignore", "value":"Toggle whether I should ignore you or not"}
    ]
  }
  return e

}
function loadSaveData() {
  try {
    var data = fs.readFileSync(__dirname + "/brain.json");
    data = JSON.parse(data);
    if (data.usersICareAbout == null) { data.usersICareAbout = {} }
    if (data.seenusers == null) { data.seenusers = []}
    settings = data
  } catch (e) {
    console.log("Failed to start: " + e)
    process.exit();
  }
}
function save() {
  fs.writeFile(__dirname + "/brain.json", JSON.stringify(settings), "UTF-8", function() {
    debugLog("Settings persisted to disk.");
  });
}

function amIIgnoringUser(userID) {
  userID = userTagToID(userID)
  if (settings.usersICareAbout.hasOwnProperty(userID)) {
    if (settings.usersICareAbout[userID].hasOwnProperty("ignore")) {
      return settings.usersICareAbout[userID].ignore
    } else {
      return false
    }
  } else {
    return false
  }
}
function toggleIgnore(userID) {
  userID = userTagToID(userID)
  if (amIIgnoringUser(userID)) {

    settings.usersICareAbout[userID].ignore = false

    botReply(" ", userID, userID, {
      color: parseInt("ff4700", 16),
      thumbnail: {
        url: "https://willow.systems/pebble/bot/unmute.png",
        height: 80,
        width: 80
      },
      title: "I'm no longer ignoring you",
      description: "We have so much to catch up on!"
    });

  } else {

    if (! settings.usersICareAbout.hasOwnProperty(userID)) {
      settings.usersICareAbout[userID] = {};
    }
    settings.usersICareAbout[userID].ignore = true

    botReply("Hey <@" + userID + ">", userID, userID, {
      color: parseInt("ff4700", 16),
      thumbnail: {
        url: "https://willow.systems/pebble/bot/mute.png",
        height: 80,
        width: 80
      },
      title: "I'm now ignoring you",
      description: "Just write `.ignore` again if you ever change your mind"
    });
  }
  save()
}
function deleteMessage(cid, mid, callback) {
  console.log("Channel: " + cid.toString())
  console.log("Message: " + mid.toString())
  bot.deleteMessage({channelID: cid.toString(), messageID: mid.toString()}, function(error) {
    if (error != null) {
      console.log("Error deleting a message")
      console.log(error)
    } else {
      console.log("Message deleted")
      callback()
    }
  });
}

function recordSeenUser(userID) {
  userID = userTagToID(userID)
  settings.seenusers.push(userID)
}
function haveISeenUserBefore(userID) {
  userID = userTagToID(userID)
  return settings.seenusers.includes(userID)
}
//Load data from FILE
loadSaveData()

//Initialise the icon replier
pbimg.init(__dirname + "/icons")

//Validate configuration
validateConfig()

//Bot functions. Magic happens in bot.on('message')
bot = new Discord.Client({
   token: auth.token,
   autorun: autoStartBot
});
function botReply(msg, channelID, userID, msgEmbed) {
  if (msg == null || msg == "") { return }

  if (msg.includes("~")) {
    msg = msg.split("~");
    if (msg[0] == "file") {
      console.log("SEND FILE")
      bot.uploadFile({
             to: channelID,
             file: msg[1]
         });
    }

  } else {

      if (msg.length > 1999) {
        //Msg is too long, cut to truncate
        msg = msg.substring(0, 1995);
        //Now we need to cut off the last word, so we don't send a malformed emoji
        var split = (msg.includes(" ")) ? "\ " : "\<";
        msg = msg.substring(0, msg.lastIndexOf(split)) + "..."
      }

      if (msgEmbed != null) {
        bot.sendMessage({ to: channelID, message: msg, embed: msgEmbed});
      } else {
        bot.sendMessage({ to: channelID, message: msg });
      }
    }
}
bot.on('ready', function (evt) {
    //Get the first server address. This bot is not designed to service multiple servers on the same runtime (though it probably could)
    try {
      var serverID = evt.d.guilds[0].id
    } catch (e) {
      console.log("Failed to get server ID: " + e);
      var serverID = "Unknown"
    }

    console.log('Connected to discord. Server ID: ' + serverID);
    console.log('Authenticated as: ' + bot.username + ' - (' + bot.id + ')');

    if (resolveServerIDToTrustedServer(serverID) != null) {
      console.log("Server recognised as " + resolveServerIDToTrustedServer(serverID))
    } else {
      console.log("Warning: Server is not recognised. Connected to unknown server. Authentication roles and commanded dependant on them are not available.")
    }


    settings.mytag = "<@" + bot.id + ">"
    //Load permission info for this server from config.json
    userauth.readConfig(serverID, config)
    //Map the current server roles to IDs
    userauth.setupRoles(bot.servers[serverID]);

    //Save once every 15 mins
    setInterval(save, 900000);

    console.log("Initalisation complete. Ready to serve " + resolveServerIDToTrustedServer(serverID) + "!")
});
bot.on('disconnect', function(errMsg, code) {
    console.log('Disconnected from discord [' + code + ']. Reason: ' + errMsg);
    console.log('Reconnecting');
    bot.connect();
});
bot.on('message', function (user, userID, channelID, message, evt) {

  //Ignore ourselves
  if (userTagToID(userID) == userTagToID(settings.mytag)) {
    // debugLog("Ignoring message as it's from myself")
    return;
  }

  //Check we've not been disabled
  if (disabled && ! message.includes("$on")) {
    return
  }

  var messageID = evt.d.id

  console.log(JSON.stringify(evt))

  //Get roles
  var roles = []
  if (evt.d.hasOwnProperty("member") && evt.d.member.hasOwnProperty("roles")) {
    //DMs don't have roles
    roles = evt.d.member.roles
  }

  //Ignore user?
  if (amIIgnoringUser(userID) && message.indexOf(".ignore") == -1) {
    debugLog("Ignoring user " + userID)
    return
  }

  //Moderate message
  moderator.scan(message, messageID, userID, channelID)

  // Commands
  if (message.substr(0,1) == ".") {
    var args = message.substr(1).split(' ');
    var cmd = args[0]
    args = args.splice(1);


    // This is the core logic, where we manage commands


    if (cmd == "help") {
      botReply(" ", channelID, userID, generateHelpEmbed());

    } else if (cmd == "permissions") {
      var response = "Permission bits for <@" + userID + ">:\nuseAdminCommands: " + userauth.hasPermission(roles, "useAdminCommands");
      response += "\nuseIntrospection: " + userauth.hasPermission(roles, "useIntrospection");
      botReply(response, channelID, userID);

    } else if (cmd == "support") {
      var s = support.showTopic(args.join(" "));
      botReply(s.msg, channelID, userID, s.embed);

    } else if (cmd == "ignore") {
      toggleIgnore(userID);
    }


  }

  // Admin commands
  if (message.substr(0,1) == "$") {
    if (! userauth.hasPermission(roles, "useAdminCommands")) {
      botReply("You do not have permission to do that", channelID, userID)
      return
    }

    var args = message.substr(1).split(' ');
    var cmd = args[0]
    args = args.splice(1);

    if (cmd == "off") {
      disabled = true
      botReply("Entering sleep mode. I'll now only respond to the Wake command: `$on`.", channelID, userID);

    } else if (cmd == "on") {
      disabled = false
      botReply("I'm awake!", channelID, userID);

    } else if (cmd == "help") {
      botReply("Adminstrator Commands:\n$off - Suspend Anne\n$on - Reanimate Anne\n$help - Show this dialogue", channelID, userID);

    }
  }

  // Pebble image sending
  var img = pbimg.match(message)
  if (img != false) {
    botReply(img,channelID, userID);
    return
  }

  //help keyword detection
  if (message.substr(0,1) == "?") {

    var supportResponse = support.handleNLQuery(message)
    botReply(supportResponse.msg, channelID, userID, supportResponse.embed);
    recordSeenUser(userID);
    return

  } else {

    //Proactive help
    //This is where if we see a new user ask a question in #rebble-help, we introduce outselves
    if (userauth.getProactiveChannels(config).includes(channelID.toString()) && ! haveISeenUserBefore(userID)) {
      botReply(" ", userID, userID, {
        color: parseInt("ff4700", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Hi, @" + user,
        description: "I've not seen you around here before, welcome to the Rebble Alliance discord server. Here are a few useful tips:",
        fields: [
          {name: "Need help?", value: "If you have a question and nobody has answered yet, try asking me! **Start your question with a leading '?'** and I'll try to answer it. E.g. `? How do I setup rebble?`" },
          {name: "Still confused?", value: "You can find a channel guide and role explanations in <#221397928592277504>, there are plenty of humans here who are super helpful." }
        ],
      });
      recordSeenUser(userID);
    }

  }

  //Error code detection
  var errorCodeFix = codes.matchCode(message);
  if (errorCodeFix != null) {
    botReply(" ", channelID, userID, errorCodeFix)
  }


  //Fun
  var binary = RegExp('^[01 ]+$')
  if (binary.test(message) && message.length > 5) {
    botReply('01001100 01101111 01101110 01100111 00100000 01001100 01101001 01110110 01100101 00100000 01010000 01100101 01100010 01100010 01101100 01100101 00100001', channelID, userID)
  }

  recordSeenUser(userID);

});
