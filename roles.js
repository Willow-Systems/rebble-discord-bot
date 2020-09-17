// Lookup speed is the name of the game, not RAM usage
var roleNameToID = [];
var roleIDToName = [];
var authCodeToGroup = {};
var config = null;
var currentID = null;

function init(serverInfo) {

  if (! serverInfo.hasOwnProperty("roles")) {
    console.log("Failed to ingest roles. serverinfo.roles doesn't exist.")
    return
  }

  // console.log(serverInfo.roles)
  //Ingest the server roles
  utils.debugLog("Ingest roles")
  Object.keys(serverInfo.roles).forEach(key => {
    var role = serverInfo.roles[key]
    utils.debugLog("Role '" + role.name + "' has ID '" + role.id + "'")
    roleNameToID[role.name.replace(/ /g,"")] = role.id
    roleIDToName[role.id] = role.name
  })

}

function loadPermissions(serverID, configuration) {
  currentID = serverID
  config = configuration
  authCodeToGroup = configuration.authorisationRoles

}

function getTrustedServerName() {
  if (currentID == null) {
    return null
  } else {
    return serverIDToSafename(currentID)
  }
}
function serverSafeNameToID(safename) {
  for (var i = 0; i < config.trustedServers.length; i++) {
    if (config.trustedServers[i].safename == safename) {
      return config.trustedServers[i].id
    }
  }
}
function serverIDToSafename(id) {
  for (var i = 0; i < config.trustedServers.length; i++) {
    if (config.trustedServers[i].id == id) {
      return config.trustedServers[i].safename
    }
  }
}
function userHasPermission(roles, authCode) {
  for (var i = 0; i < roles.length; i++) {
    if (groupHasPermission(roles[i], authCode)) {
      return true
    }
  }
  return false
}
function groupHasPermission(group, authCode) {
  if (currentID == null) {
    console.log("groupHasPermission called before loadPermissions. Call with roles.readConfig() first.")
    return false
  }

  if (! authCodeToGroup.hasOwnProperty(authCode)) {
    console.log("groupHasPermission called with unknown auth code '" + authCode + "'");
    return false
  }

  var serversafename = serverIDToSafename(currentID);

  if (! authCodeToGroup[authCode].hasOwnProperty(serversafename)) {
    console.log("groupHasPermission called with an auth code (" + authCode + ") that has no entries for this server (" + currentID + ")(" + serversafename + ")")
    return false
  }

  return (authCodeToGroup[authCode][serversafename] != null && authCodeToGroup[authCode][serversafename].includes(group))
}

function getProactiveChannels(configuration) {
  if (currentID != null && configuration.hasOwnProperty("proactiveHelperChannels")) {
    if (configuration.proactiveHelperChannels.hasOwnProperty(serverIDToSafename(currentID))) {
      return configuration.proactiveHelperChannels[serverIDToSafename(currentID)];
    } else {
      return []
    }
  }
  return []
}

module.exports.setupRoles = init
module.exports.readConfig = loadPermissions
module.exports.groupHasPermission = groupHasPermission
module.exports.hasPermission = userHasPermission
module.exports.getProactiveChannels = getProactiveChannels
module.exports.getTrustedServerName = getTrustedServerName
