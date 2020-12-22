var supportMap = require("./supportMap.json");
var noClueFollowUps = [
  "I'm sure someone will be along soon.",
  "Try asking again.",
  "Have you tried turning it off and on again?",
  "Please rephrase.",
  "My neural net is still ingesting the internet.",
  "Try using different words.",
  "I'm sure one of the humans will help you.",
  "Hopefully a human will be along soon to help.",
  "I'm not the droid you're looking for.",
  "Insufficient data for a meaningful answer",
  ":computer: :fire:",
  "This incident will be reported.",
  "Could you repeat in binary?",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues.",
  "Perhaps check https://rebble.io/howto#Common-Issues."
]

function handle(supportQuery) {
  supportQuery = supportQuery.replace(/ /g, "").replace(/-/g,"");
  var response = null

  //Special case
  if (supportQuery == "list") {
    var response = "Currently I can help with the following issues: \n"
    supportMap.forEach(sup => {
      response = response + "`.support " + sup.supportcodes[0] + "`\n"
    });
    response += "The ability to automatically contribute to this list is coming soon. In the meantime email `mail@willow.systems` if you think something's missing."
    response = { msg: response }
    return response
  }

  for (var i = 0; i < supportMap.length; i++) {
    sup = supportMap[i]
    if (sup.supportcodes.includes(supportQuery)) {
      response = {}
      response.msg = " "

      var fixtext = (sup.fixurl != null && sup.fixurl != "") ? "See " + sup.fixurl : sup.fix
      var iconurl = (sup.customicon != null && sup.customicon != "") ? sup.customicon : "https://willow.systems/pebble/bot/sent.png"

      var fields = [
        {name: "Description:", value: sup.description},
        {name: "Fix:", value: fixtext}
      ]

      if (sup.customfields != null && sup.customfields != []) {
        fields = fields.concat(sup.customfields)
      }

      response.embed = {
        color: parseInt("ff4700", 16),
        thumbnail: {
          url: iconurl,
          height: 80,
          width: 80
        },
        title: sup.title,
        fields: fields,
      }

      if (sup.url != null && sup.url != "") { response.embed.url = sup.url }

      break
    }
  }

  if (response == null) {
    return {msg: "Sorry, I don't recognise that topic. Use `.support list` to see every support topic I can currently assist with."}
  } else {
    return response
  }
}

function suggestTopics(message) {
  var matchesWholeSet = true
  message = message.toLowerCase()
  message = message.replace(/[.?'"!_]/g,"");
  var topics = []


  //Before we go for the pebble ones, lets catch some fun ones
  //The real question is, will anyone ever trigger these?
  if (message.includes("meaning of life")) { return { msg: "42" } }
  if (message.includes("ultimate") && message.includes("question")) { return { msg: "42" } }
  if (message.includes("life") && message.includes("universe") && message.includes("everything")) { return { msg: "42" } }
  if (message.includes("area 51")) { return { msg: "I'm not allowed to talk about that. (They're listening)" } }
  if (message.includes("/") && message.includes("0")) { return { msg: "> rebbleDiscordBot.exe has stopped responding" } }
  if (message.includes("divide") && message.includes("0")) { return { msg: "> rebbleDiscordBot.exe has stopped responding" } }
  if (message.includes("what") && message.includes("your") && message.includes("purpose")) { return { msg: "I pass butter" } }

  //Okay lets actually find something useful now
  supportMap.forEach(article => {
    for (var i = 0; i < article.keywords.length; i++){
      var keywordSet = article.keywords[i]

      matchesWholeSet = true
      keywordSet.forEach(word => {
        if (! message.includes(word)) {
          matchesWholeSet = false
        }
      })

      if (matchesWholeSet) {
        topics.push({
          summary: article.summary,
          title: article.title,
          code: article.supportcodes[0]
        })
        break
      }

    }
  })

  //Generate the embed from the topics array
  var output, embed
  if (topics.length < 1) {
    output = "I don't understand what you're asking. " + noClueFollowUps[utils.getRndInteger(0, noClueFollowUps.length-1)]
  } else if (topics.length == 1) {
    //output = "If you would like help with " + topics[0].summary + ", reply with: `.support " + topics[0].code + "`"
    output = " "
    return handle(topics[0].code);
  } else {
    output = "It looks like you're asking for help, but I'm not certain about what. Here are some topics that might be useful. Reply with `.support [topic]` to see a solution."
    embed = {
      title: "Suggested Help Topics:",
      fields: []
    }
    for (var i = 0; i < topics.length; i++) {
      embed.fields.push({"name": topics[i].title, "value": "Use `.support " + topics[i].code + "`", "inline": true});
    }
  }

  return {msg: output, embed: embed}
}

module.exports.showTopic = handle
module.exports.handleNLQuery = suggestTopics
