const config = require("./config.json")

function moderateMessage(message, messageID, userID, channelID) {

  //Disallow invite links
  if (message.includes("discord.gg")) {
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
module.exports.scan = moderateMessage
