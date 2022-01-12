var Discord = require('discord.io');
var fs = require('fs');
var wait = require('wait-sync');
const auth = require("./auth.json");
const support = require("./support.js");
const codes = require("./errorcodes.js");
const moderator = require("./funsucker.js");
var pbimg = require("./pblimg.js");
var userauth = require("./roles.js");
const appstore = require("./appsearch.js");
const config = require("./config.json");
const ai = require("./ai.js");

//Automatically start bot on launch (true normally, false for debug)
var autoStartBot = true;

var debugCommandsEnabled = true;
var verboseLogging = true;

var disabled = false

version = 0.1;

//Dynamic configuration. Loaded/saved to disk. Don't edit here
settings = {
  mytag: "",
  serverID: "",
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
  getRndInteger: getRndInteger,
  isUserMuted: isUserMuted,
  logMutedUserMessageDeleted: logMutedUserMessageDeleted,
  toggleMute: toggleMute,
  setUserMute: setUserMute,
  userTagToID: userTagToID,
  getUserAge: getUserAge
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
      {"name": "Appstore Embed", value: "If you paste a Pebble store link (and nothing else), I'll pull some of the info"},
      {"name": "Other Commands", value: "I also have a few commands that are useful. These start with a leading period:"},
      {"name": ".support [topic]", "value": "Show a support topic. If you don't know what you're looking for, try asking me a question first."},
      // {"name": ".support list", "value": "List all support topics."},
      {"name": ".store [search term]", "value": "I'll search the store with your term and return the top result."},
      {"name": ".app [search term], .face [search term]", "value": "The same as .store, but filtered to apps or faces only."},
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
    if (data.mutedUsers == null) { data.mutedUsers = []}
    settings = data
  } catch (e) {
    console.log("Failed to start: " + e)
    process.exit();
  }
}
function save() {
  fs.writeFile(__dirname + "/brain.json", JSON.stringify(settings), "UTF-8", function() {
    //debugLog("Settings persisted to disk.");
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
function amIOnlyDMingUser(userID) {
  userID = userTagToID(userID)
  if (settings.usersICareAbout.hasOwnProperty(userID)) {
    if (settings.usersICareAbout[userID].hasOwnProperty("forcedm")) {
      return settings.usersICareAbout[userID].forcedm
    } else {
      return false
    }
  } else {
    return false
  }
}
function isUserMuted(userID) {
  if (settings.usersICareAbout.hasOwnProperty(userID) && settings.usersICareAbout[userID].hasOwnProperty("muteUntil")) {
    var then = new Date(settings.usersICareAbout[userID].muteUntil).getTime();
    var now = new Date().getTime()
    return (then > now)
  } else {
    return false
  }
}
function toggleIgnore(userID, channelID) {
  userID = userTagToID(userID)
  if (amIIgnoringUser(userID)) {

    settings.usersICareAbout[userID].ignore = false

    botReply(" ", channelID, userID, {
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

    botReply(" ", channelID, userID, {
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
function toggleForceDM(userID, adminID) {
  userID = userTagToID(userID)
  if (amIOnlyDMingUser(userID)) {

    settings.usersICareAbout[userID].forcedm = false
    moderator.notifyOfForceDM(userID, adminID, false)


  } else {

    if (! settings.usersICareAbout.hasOwnProperty(userID)) {
      settings.usersICareAbout[userID] = {};
    }
    settings.usersICareAbout[userID].forcedm = true
    moderator.notifyOfForceDM(userID, adminID, true)

  }
  save()
}
function toggleMute(userID, adminID) {
  userID = userTagToID(userID)

  if (isUserMuted(userID)) {

    setUserMute(userID, new Date(0))
    moderator.notifyOfMute(userID, adminID, false)

  } else {

    setUserMute(userID, new Date("2121-01-01"))
    moderator.notifyOfMute(userID, adminID, true)

  }
  save()
}
function setUserMute(userID, endDate) {
  if (endDate.getTime() < new Date().getTime()) {
    //We're disabling mute
    //Remove role
    removeUserFromRole(userID, config.rateLimit.timeoutRoleID[userauth.getTrustedServerName()])

    for (var i=0;i<settings.mutedUsers.length;i++) {
      if (settings.mutedUsers[i].id == userID) {
        settings.mutedUsers.splice(i,1);
      }
    }

  } else {

    //Enable mute, add role
    addUserToRole(userID, config.rateLimit.timeoutRoleID[userauth.getTrustedServerName()])
    settings.mutedUsers.push({
      id: userID,
      end: endDate
    });

  }

  if (! settings.usersICareAbout.hasOwnProperty(userID)) {
    settings.usersICareAbout[userID] = {};
  }
  settings.usersICareAbout[userID].muteUntil = endDate.getTime()
}
function unmuteExpiredMutes() {
  for (var i=0;i<settings.mutedUsers.length;i++) {
    var then = new Date(settings.mutedUsers[i].end).getTime()
    var now = new Date().getTime()
    if (then < now) {
      setUserMute(settings.mutedUsers[i].id, new Date(0))
    }
  }
}
function logMutedUserMessageDeleted(userID) {
  if (! settings.usersICareAbout.hasOwnProperty(userID)) {
    settings.usersICareAbout[userID] = {}
  }
  if (! settings.usersICareAbout.hasOwnProperty("mutedMsgCount")) {
    settings.usersICareAbout.mutedMsgCount = 0
  }
  settings.usersICareAbout.mutedMsgCount++
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
  if (! settings.seenusers.includes(userID)) {
	  settings.seenusers.push(userID)
  }
}
function haveISeenUserBefore(userID) {
  userID = userTagToID(userID)
  return settings.seenusers.includes(userID)
}
function getUserAge(userID) {
  if (settings.usersICareAbout.hasOwnProperty(userID) && settings.usersICareAbout[userID].hasOwnProperty("joined")) {
    var birthDate = new Date(settings.usersICareAbout[userID].joined).getTime()
    var now = new Date().getTime()
    var ago = (now - birthDate) / 1000 / 3600 / 24
    console.log(userID + " is " + ago + " days old")
    return ago
  } else {
    return 0
  }
}
function addUserToRole(userID, roleID) {
  bot.addToRole({
    serverID: settings.serverID,
    userID: userID,
    roleID: roleID
}, (error, response) => {
    if (error != null) {
        console.log("Add role error: " + JSON.stringify(error))
    }
})
}
function removeUserFromRole(userID, roleID) {
  bot.removeFromRole({
    serverID: settings.serverID,
    userID: userID,
    roleID: roleID
}, (error, response) => {
    if (error != null) {
        console.log("Add role error: " + JSON.stringify(error))
    }
})
}

//Load data from FILE
loadSaveData()

//Initialise the icon replier
pbimg.init(__dirname + "/icons")

//Validate configuration
validateConfig();

//Bot functions. Magic happens in bot.on('message')
bot = new Discord.Client({
   token: auth.token,
   autorun: autoStartBot
});
function botReply(msg, channelID, userID, msgEmbed) {
  if (msg == null || msg == "") { return }

  if (amIOnlyDMingUser(userID)) {
    //DM user
    channelID = userID
  }
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
      settings.serverID = serverID
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

    //Check for users to unmute once a minute
    setInterval(unmuteExpiredMutes, 60000)

    //Setup wolfram
    ai.init(auth.wolfram)

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

  //Get roles
  var roles = []
  if (evt.d.hasOwnProperty("member")) {

    if (evt.d.member.hasOwnProperty("roles")) {
      //DMs don't have roles
      roles = evt.d.member.roles
    }

    //Store info for $joined
    if (! settings.usersICareAbout.hasOwnProperty(userID)) { settings.usersICareAbout[userID] = {} }
    settings.usersICareAbout[userID].joined  = (evt.d.member.hasOwnProperty("joined_at")) ? evt.d.member.joined_at : "Unknown"

    //Store some basic metadata for fun
    //Inc messagecount
    settings.usersICareAbout[userID].msgcount = (settings.usersICareAbout[userID].hasOwnProperty("msgcount")) ? settings.usersICareAbout[userID].msgcount + 1 : 1;

    if (! settings.usersICareAbout[userID].hasOwnProperty("wordcount")) {
      settings.usersICareAbout[userID].wordcount = {
        pebble: 0,
        yes: 0,
        no: 0
      }
    }
    settings.usersICareAbout[userID].wordcount.pebble += (message.match(/pebble/g) || []).length
    settings.usersICareAbout[userID].wordcount.yes += (message.match(/\byes\b/g) || []).length
    settings.usersICareAbout[userID].wordcount.no += (message.match(/\bno\b/g) || []).length
  }

  //Moderate message (delete if user muted)
  moderator.scan(message, messageID, userID, channelID)

  //Ignore user?
  if (amIIgnoringUser(userID) && message.indexOf(".ignore") == -1) {
    debugLog("Ignoring user " + userID)
    return
  }

  //Remove punctuation we don't care about
  message = message.replace(/[\(\)\[\]\{\}\!]/g,"");

  appstore.detectAutoEmbed(message, function(res) {
    if (res.s) {
      botReply(" ", channelID, userID, {
        color: parseInt(res.category_color, 16),
        thumbnail: {
          url: res.img,
          height: 144,
          width: 168
        },
        title: res.title,
        fields: [
          {name: "Category", value: res.category},
          {name: "Description", value: res.description},
          {name: "Author", value: res.author},
          {name: "Hearts", value: res.hearts}
        ],
        footer: {
          "text": "(Click the title to go to the store page)"
        },
        url: "https://apps.rebble.io/en_US/application/" + res.id
      });
    }
  });

  //Wolfram
  var mytag = "<@" + bot.id + ">"
  var msg = message.replace("<@!", "<@");
  if (msg.substring(0, mytag.length) == mytag) {
    if (userauth.hasPermission(roles, "useAdminCommands")) {

      msg = msg.replace(mytag, "");
      ai.answer(msg, function(response) {
          botReply(response, channelID, userID)
      })

    }
  }


  // Commands
  if (message.substr(0,1) == ".") {
    var args = message.substr(1).split(' ');
    var cmd = args[0]
    args = args.splice(1);


    // This is the core logic, where we manage commands


    if (cmd == "help") {
      botReply(" ", channelID, userID, generateHelpEmbed());
    } else if (cmd == "stats") {

      var countStart = new Date("2021-03-06T12:27:02.898Z");
      var ago = new Date() - countStart
      ago = Math.floor(ago / 1000 / 3600 / 24)
      botReply("Since I started counting " + ago + " days ago, you've sent " + settings.usersICareAbout[userID].msgcount + " messages. You've said 'pebble' " + settings.usersICareAbout[userID].wordcount.pebble + " times, 'yes' " + settings.usersICareAbout[userID].wordcount.yes + " times and 'no' " + settings.usersICareAbout[userID].wordcount.no + " times.", channelID, userID);
      return

    } else if (cmd == "permissions") {
      var response = "Permission bits for <@" + userID + ">:\nuseAdminCommands: " + userauth.hasPermission(roles, "useAdminCommands");
      response += "\nuseIntrospection: " + userauth.hasPermission(roles, "useIntrospection");
      botReply(response, channelID, userID);

    } else if (cmd == "support") {
      var s = support.showTopic(args.join(" "));
      if (s.file) {
        console.log("Support topic has a file!: " + s.file)
        botReply("file~files/" + s.file, channelID, userID);
        s.file = null
      }
      botReply(s.msg, channelID, userID, s.embed);

    } else if (cmd == "ignore") {
      toggleIgnore(userID, channelID);
    } else if (cmd == "app" || cmd == "face" || cmd == "store") {
      var filter = {
        app: "watchapp",
        face: "watchface",
        store: "watchface,watchapp"
      }[cmd]
      appstore.search(args.join(" "), filter, function(res) {

        if (res.s) {
          botReply(" ", channelID, userID, {
            color: parseInt(res.category_color, 16),
            thumbnail: {
              url: res.img,
              height: 144,
              width: 168
            },
            title: res.title,
            fields: [
              {name: "Category", value: res.category},
              {name: "Description", value: res.description},
              {name: "Author", value: res.author},
              {name: "Hearts", value: res.hearts},
            ],
            footer: {
              "text": "(Click the title to go to the store page)"
            },
            url: "https://apps.rebble.io/en_US/application/" + res.id
          });
        } else {
          botReply("No results", channelID, userID);
        }
      }, function() {
        botReply("Something went wrong", channelID, userID);
      });
    }


  }

  // Admin commands
  if (message.substr(0,1) == "$" && /on|off|help|save|joined|forcedm|say|toggleMute|muteState.*/.test(message)) {
    if (! userauth.hasPermission(roles, "useAdminCommands")) {
      botReply("You do not have permission to do that", channelID, userID)
      return
    }

    var args = message.substr(1).split(' ');
    var cmd = args[0]
    args = args.splice(1);

    if (cmd == "off") {
      if (userauth.hasPermission(roles, "switchOff")) {
        disabled = true
        botReply("Entering sleep mode. I'll now only respond to the Wake command: `$on`.", channelID, userID);
      } else {
        botReply("You do not have permission to do that", channelID, userID)
        return
      }
  } else if (cmd == "on") {
      if (userauth.hasPermission(roles, "switchOff")) {
        disabled = false
        botReply("I'm awake!", channelID, userID);
      } else {
        botReply("You do not have permission to do that", channelID, userID)
        return
      }
    } else if (cmd == "joined") {
      var usr = userTagToID(args[0])
      if (usr == null || usr == "") {
        botReply("Missing argument. Usage: $joined @user", channelID, userID);
      } else {
        if (settings.usersICareAbout.hasOwnProperty(usr) && settings.usersICareAbout[usr].hasOwnProperty("joined")) {
          botReply("User join date: **" + settings.usersICareAbout[usr].joined.toString().split(".")[0].replace("T", " ") + "**", channelID, userID);
        } else {
          botReply("Unknown user or data not yet gathered.", channelID, userID);
        }
      }
    } else if (cmd == "forcedm") {
      var usr = userTagToID(args[0])
      if (usr == null || usr == "") {
        botReply("Missing argument. Usage: $forcedm @user", channelID, userID);
      } else {
        toggleForceDM(usr, userID);
      }
    } else if (cmd == "toggleMute") {

      var usr = userTagToID(args[0])
      if (usr == null || usr == "") {
        botReply("Missing argument. Usage: $toggleMute @user (@ or ID)", channelID, userID);
      } else {
        toggleMute(usr, userID);
      }

    } else if (cmd == "muteState") {
      var usr = userTagToID(args[0])
      if (usr == null || usr == "") {
        botReply("Missing argument. Usage: $muteState @user (@ or ID)", channelID, userID);
      } else {

        var out = (isUserMuted(usr)) ? "User is muted. " : "User is not muted. "
        if (settings.usersICareAbout.hasOwnProperty(usr) && settings.usersICareAbout[usr].hasOwnProperty("muteUntil") && isUserMuted(usr)) {
          out += " Mute expires " + new Date(settings.usersICareAbout[usr].muteUntil).toISOString() + ". "
        }
        if (settings.usersICareAbout.hasOwnProperty(usr) && settings.usersICareAbout[usr].hasOwnProperty("mutedMsgCount")) {
          out += ` While muted they have tried to send ${settings.usersICareAbout[usr].mutedMsgCount} messages.`
        }
        botReply(out, channelID, userID);

      }
    } else if (cmd == "save") {
      save();
      botReply("It is now safe to turn off your computer", channelID, userID);
    } else if (cmd == "say") {
      var channel = args[0]
      args.splice(0,1);
      botReply(args.join(" "), channel, bot.id)
    } else if (cmd == "help") {
      botReply('Adminstrator Commands:\n\
      $off - Suspend Anne\n\
      $on - Reanimate Anne\n\
      $joined @user - Show the server join date for user\n\
      $forcedm @user - Toggle forceDM mode for @user. If enabled bot will only DM @user in response to messages\n\
      $say <channelID> <msg> - Puppeteer Anne\n\
      $toggleMute <userID> - Toggle muting a userID\n\
      $muteState <userID> - Get the muted state for a userID\n\
      $save - Save brain to disk\n\
      $help - Show this dialogue', channelID, userID);
    }
  }

  //Remove . as it's not a command
  message = message.replace(/\./g,"");

  // Pebble image sending
  var img = pbimg.match(message)
  if (img != false) {
    botReply(img,channelID, userID);
    return
  }

  //help keyword detection
  if (message.substr(0,1) == "?" && message.replace(/[\?\ ]/g,"").length > 1) {

    var supportResponse = support.handleNLQuery(message)
    if (supportResponse.file) {
      console.log("Support topic has a file!: " + supportResponse.file)
      botReply("file~files/" + supportResponse.file, channelID, userID);
      supportResponse.file = null
    }
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
bot.on('any', function(event) {
  //Catch special events

  //Eventually populate this from roles, but for now I cba
  var protectedUsernames = ["katharineberry","bradtgmurray","kat","liammcloughlin","meiguro","orviwan","crc32","ishotjr","josuha","will","will0","tation","astosia","stefanogerli","tertty","annedroid","sphinxy","itsthered","itsthered1","udsx"];


  if (event.t == "GUILD_MEMBER_ADD") {
    //New user has joined the server
    var newuser = event.d.user.username;
    newuser = newuser.toLowerCase().replace(/[!?.'")>\]]/g,"")
    for (var i = 0; i < protectedUsernames.length; i++) {
      if (newuser == protectedUsernames[i]) {
        moderator.warnPotentialImpersonate(event.d.user.id)
        break
      }
    }

  } else if (event.t == "GUILD_BAN_ADD") {
    //User yeeted
    moderator.notifyOfBan(event.d.user.username)
  } else {
    //console.log(event)
  }
});
