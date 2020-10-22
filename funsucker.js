const config = require("./config.json")

function moderateMessage(message, messageID, userID, channelID) {

  //Disallow invite links
  if (message.includes("discord.gg") && ! message.includes("aRUAYFN")) {
    deleteMessage(channelID, messageID, userID, message, "Sent message containg a server invite link")
    utils.sendMessage("<@" + userID + "> - Your previous message has been removed because it contained a server invite link. Please don't post those here.", channelID, userID)
  }

}

function deleteMessage(channelID, messageID, userID, originalContents, reason) {
  console.log("Deleting message " + messageID + " in channel " + channelID + " for reason: " + reason)
  utils.deleteMessage(channelID, messageID, function() {

      console.log("Deleted a message from userID " + userID + ". Reason: " + reason)
      if (getModChannel() != null) {
          utils.sendMessage(" ", getModChannel(), null, {
            color: parseInt("ffc83c", 16),
            thumbnail: {
              url: "https://willow.systems/pebble/bot/bot.png",
              height: 80,
              width: 80
            },
            title: "Moderation Action Report",
            fields: [
              {name: "User", value: "<@" + userID + ">"},
              {name: "Reason for moderation", value: reason},
              {name: "Action taken", value: "Message deleted, user warned"},
              {name: "Original Message Contents", value: "`" + originalContents + "`"}
            ]
          })
      }

  })
}
function getModChannel() {
  if (! config.hasOwnProperty("moderationReportChannel")) {
    console.log("Setting missing: moderationReportChannel")
    return
  }
  var serverID = utils.getServerTrustedID()
  if (serverID == null) {
    console.log("Cannot report a moderation event on an untrusted server. I have no config.")
    return
  }
  if (! config.moderationReportChannel.hasOwnProperty(serverID)) {
    console.log("Configuration entry missing for this server in config.moderationReportChannel." + serverID)
    return
  }

  return config.moderationReportChannel[serverID]
}

function warnPotentialImpersonate(userID) {
  if (getModChannel() != null) {
      utils.sendMessage(" ", getModChannel(), null, {
        color: parseInt("ffc83c", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Moderation Alert",
        fields: [
          {name: "User", value: "<@" + userID + ">"},
          {name: "Reason for alert", value: "New user joined - Username potentially impersonating another user"},
          {name: "Action taken", value: "None"}
        ]
      })
  }
}
function notifyOfBan(bannedUsername) {
  if (getModChannel() != null) {
      utils.sendMessage(" ", getModChannel(), null, {
        color: parseInt("ffc83c", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Moderation Alert",
        fields: [
          {name: "Username", value: bannedUsername},
          {name: "Reason for alert", value: "User has been banned"}
        ]
      })
  }
}
function notifyOfForceDM(userID, adminID, state) {
  if (getModChannel() != null) {
    if (state == true) {
      utils.sendMessage(" ", getModChannel(), null, {
        color: parseInt("ffc83c", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Moderation Alert",
        fields: [
          {name: "Username", value: "<@" + userID + ">"},
          {name: "Reason for alert", value: "DMOnly has been enabled for this user. Any replies from the bot will go to the user's DMs instead of the channel they asked the question in."},
          {name: "Enabled by", value: "<@" + adminID + ">"}
        ]
      })
    } else {
      utils.sendMessage(" ", getModChannel(), null, {
        color: parseInt("ffc83c", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Moderation Alert",
        fields: [
          {name: "Username", value: "<@" + userID + ">"},
          {name: "Reason for alert", value: "DMOnly has been disabled for this user."},
          {name: "Disabled by", value: "<@" + adminID + ">"}
        ]
      })
    }
  }
}
module.exports.scan = moderateMessage
module.exports.warnPotentialImpersonate = warnPotentialImpersonate
module.exports.notifyOfBan = notifyOfBan
module.exports.notifyOfForceDM = notifyOfForceDM
