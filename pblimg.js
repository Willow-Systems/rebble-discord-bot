var fs = require("fs")
var baseDIR = ""
var imagenames = [];

function init(basedir) {
  baseDIR = basedir
  fs.readdirSync(basedir).forEach(file => {
    var match = file.replace(".png","")
    imagenames.push(match)
    //utils.debugLog("Ready to match system://images/" + match)
  });
}

function detectImageSummon(msg) {
  msg = msg.toLowerCase()
  if (msg.includes("system://")) {

    var matchname = msg.substr(msg.indexOf("//images/") + 9, msg.length)

    for (var i = 0; i < imagenames.length; i++) {
      //utils.debugLog("does " + msg + " == " + imagenames[i])
      if (matchname == imagenames[i]) {
        return "file~" + baseDIR + "/" + imagenames[i] + ".png"
      }
    }

  }
  return false
}

module.exports.init = init
module.exports.match = detectImageSummon
