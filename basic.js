function help() {
  var msg = ""
  for (var i = 0; i < simpleCommands.length; i++) {
    if (simpleCommands[i].desc != "") {
      msg = msg + "**" + simpleCommands[i].command + "** - " + simpleCommands[i].desc + "\n"
    }
  }
  return msg
}

module.exports.help = help;
