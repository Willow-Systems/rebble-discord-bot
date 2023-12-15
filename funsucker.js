const config = require("./config.json");
var rateLimitStore = {}
Date.prototype.addMinutes = function (minutes) {
  var date = new Date(this.valueOf());
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

//Rate limit config
//Auto-mute users for rl_timeout minutes if they are younger than $rl_max_age days old and they send $rl_quantity (or more) messages in a period of $rl_period milliseconds
if (!config.hasOwnProperty("rateLimit")) {
  console.log("Rate limit config missing from config.json. Sadness incoming")
}
var rl_quantity = config.rateLimit.Xmessages
var rl_period = config.rateLimit.Ymilliseconds
var rl_max_age = config.rateLimit.youngerThanDays
var rl_timeout = config.rateLimit.muteMinutes

function moderateMessage(message, messageID, userID, channelID) {

  //Delete message if user is muted
  if (utils.isUserMuted(userID)) {
    deleteMessage(channelID, messageID, userID, message, "User is muted", true);
    utils.logMutedUserMessageDeleted(userID)
    //Stop processing moderation
    return
  }


  //Disallow invite links
  if (message.includes("discord.gg") && !message.includes("aRUAYFN")) {
    deleteMessage(channelID, messageID, userID, message, "Sent message containg a server invite link")
    utils.sendMessage("<@" + userID + "> - Your previous message has been removed because it contained a server invite link. Please don't post those here.", channelID, userID)
  }

  //Rate limit
  incrementRateLimitCounter(userID);
  utils.debugLog("Rate limit period quanity: " + getRateLimitPeriodQuantity(userID))
  if (getRateLimitPeriodQuantity(userID) >= rl_quantity) {

    //User has exceeded rate limit
    if (utils.getUserAge(userID) <= rl_max_age) {

      var shhUntil = new Date().addMinutes(rl_timeout)
      //Delete that last message
      deleteMessage(channelID, messageID, userID, message, "Exceeded rate limit", true)
      //Mute user
      utils.setUserMute(userID, shhUntil)
      //Notify user
      utils.sendMessage(`<@${userID}> - You have been muted for ${rl_timeout} minutes because you exceeded the message rate limit. Please refrain from spamming messages.`, channelID, userID)
      //Notify Mods
      notifyOfMute(userID, utils.userTagToID(settings.mytag), true, true)

    } else {
      utils.debugLog(`Not enforcing rate limit on ${userID} because they are older than ${rl_max_age} days.`)
    }

  }

}

function incrementRateLimitCounter(userID) {
  if (!rateLimitStore.hasOwnProperty(userID)) {
    rateLimitStore[userID] = {}
  }
  if (!rateLimitStore[userID].hasOwnProperty("rl_periodStart")) {
    rateLimitStore[userID].rl_periodStart = new Date().getTime()
    rateLimitStore[userID].rl_count = 0
    return
  }

  var rl_period_start = rateLimitStore[userID].rl_periodStart;
  if ((new Date().getTime() - rl_period_start) > rl_period) {
    //Their previous message was longer than rl_period ago
    rateLimitStore[userID].rl_count = 1
    rateLimitStore[userID].rl_periodStart = new Date().getTime()
  } else {
    rateLimitStore[userID].rl_count++
  }

}

function getRateLimitPeriodQuantity(userID) {

  if (!rateLimitStore.hasOwnProperty(userID)) {
    rateLimitStore[userID] = {}
  }

  if (!rateLimitStore[userID].hasOwnProperty("rl_periodStart")) {
    rateLimitStore[userID].rl_periodStart = new Date().getTime();
  }

  var rl_period_start = rateLimitStore[userID].rl_periodStart;
  if ((new Date().getTime() - rl_period_start) > rl_period) {
    //Their previous message was longer than rl_period ago
    rateLimitStore[userID].rl_count = 0
  }


  return rateLimitStore[userID].rl_count

}

function deleteMessage(channelID, messageID, userID, originalContents, reason, silent = false) {
  console.log("Deleting message " + messageID + " in channel " + channelID + " for reason: " + reason)
  utils.deleteMessage(channelID, messageID, function () {

    console.log("Deleted a message from userID " + userID + ". Reason: " + reason)
    if (getModChannel() != null && !silent) {
      utils.sendMessage(" ", getModChannel(), null, {
        color: parseInt("ffc83c", 16),
        thumbnail: {
          url: "https://willow.systems/pebble/bot/bot.png",
          height: 80,
          width: 80
        },
        title: "Moderation Action Report",
        fields: [
          { name: "User", value: "<@" + userID + ">" },
          { name: "Reason for moderation", value: reason },
          { name: "Action taken", value: "Message deleted, user warned" },
          { name: "Original Message Contents", value: "`" + originalContents + "`" }
        ]
      })
    }

  })
}
function getModChannel() {
  if (!config.hasOwnProperty("moderationReportChannel")) {
    console.log("Setting missing: moderationReportChannel")
    return
  }
  var serverID = utils.getServerTrustedID()
  if (serverID == null) {
    console.log("Cannot report a moderation event on an untrusted server. I have no config.")
    return
  }
  if (!config.moderationReportChannel.hasOwnProperty(serverID)) {
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
        { name: "User", value: "<@" + userID + ">" },
        { name: "Reason for alert", value: "New user joined - Username potentially impersonating another user" },
        { name: "Action taken", value: "None" }
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
        { name: "Username", value: bannedUsername },
        { name: "Reason for alert", value: "User has been banned" }
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
          { name: "Username", value: "<@" + userID + ">" },
          { name: "Reason for alert", value: "DMOnly has been enabled for this user. Any replies from the bot will go to the user's DMs instead of the channel they asked the question in." },
          { name: "Enabled by", value: "<@" + adminID + ">" }
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
          { name: "Username", value: "<@" + userID + ">" },
          { name: "Reason for alert", value: "DMOnly has been disabled for this user." },
          { name: "Disabled by", value: "<@" + adminID + ">" }
        ]
      })
    }
  }
}
function notifyOfMute(userID, adminID, state, isAutomatic = false) {

  var reason_on = (isAutomatic) ? `User exceeded the rate limit of ${rl_quantity} or more messages in a ${rl_period}ms period. Muted for ${rl_timeout} minutes. To revoke now use $toggleMute.` : 'User has been manually muted. Any messages will be silently deleted.'
  var reason_off = 'User has been unmuted.'

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
          { name: "Username", value: "<@" + userID + ">" },
          { name: "Reason for alert", value: reason_on },
          { name: "Enabled by", value: "<@" + adminID + ">" }
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
          { name: "Username", value: "<@" + userID + ">" },
          { name: "Reason for alert", value: reason_off },
          { name: "Disabled by", value: "<@" + adminID + ">" }
        ]
      })
    }
  }
}

function spamtrapTriggered(userID, message) {
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
        { name: "User", value: "<@" + userID + ">" },
        { name: "Reason for alert", value: "User triggered the spamtrap" },
        { name: "Action taken", value: "User banned. Messages deleted." }
      ]
    })
  }
}

module.exports.scan = moderateMessage
module.exports.warnPotentialImpersonate = warnPotentialImpersonate
module.exports.notifyOfBan = notifyOfBan
module.exports.notifyOfForceDM = notifyOfForceDM
module.exports.notifyOfMute = notifyOfMute
module.exports.spamtrapTriggered = spamtrapTriggered
