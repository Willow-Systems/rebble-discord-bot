const request = require("request");

function searchForApp(query, filter, cb, ecb) {
  var headers = {
    'Content-Type': 'application/json',
  }

  var data = {
    requests: [
      {
        indexName: "rebble-appstore-production",
        params: "query=" + encodeURI(query) + "&tagFilters=(" + filter + ")&hitsPerPage=24&page=0&highlightPreTag=__ais-highlight__&highlightPostTag=__/ais-highlight__&facets=[]"
      }
    ]
  }

// Configure the request
var options = {
  url: "https://7683ow76eq-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.33.0)%3B%20Browser%20(lite)%3B%20instantsearch.js%20(3.6.0)%3B%20Vue%20(2.6.10)%3B%20Vue%20InstantSearch%20(2.3.0)%3B%20JS%20Helper%20(2.28.0)&x-algolia-application-id=7683OW76EQ&x-algolia-api-key=252f4938082b8693a8a9fc0157d1d24f",
  method: "POST",
  headers: headers,
  json: data
}
// Start the request

request(options, function (error, response, body) {
  console.log(body)
  if (body == null) {
    console.log("Can't talk to RWS store");
    errorCallbackFunction();
    return;
  } else {
    if (body.results.length < 1 || body.results[0].hits.length < 1) {
      cb({
        s: false
      });
    } else {
      try {
        var result = body.results[0].hits[0];
        result.img = result.list_image.replace("144x144/","");
        result.s = true
        if (result.description.length > 300) {
          result.description = result.description.substr(0, 300) + "..."
        }
        cb(result);
      } catch (e) {
        console.log("Search error: " + e);
        cb("Something went wrong")
      }
    }
  }
});

}

function getApp(appID, cb, ecb) {
  var headers = {
    'Content-Type': 'application/json',
  }

// Configure the request
var options = {
  url: "https://appstore-api.rebble.io/api/v1/apps/id/" + appID + "?platform=all",
  method: "GET",
  headers: headers
}
// Start the request

request(options, function (error, response, body) {
  console.log(body)
  if (body == null) {
    console.log("Can't talk to RWS store");
    errorCallbackFunction();
    return;
  } else {
    body = JSON.parse(body)
    if (body.data.length < 1) {
      cb({
        s: false
      });
    } else {
      try {
        var result = body.data[0];
        result.img = result.list_image["144x144"].replace("144x144/","");
        result.s = true
	try {
	        result.description = decodeURI(result.description)
	} catch (e) {
		result.description = "Description Unavailable. Please see store"
	}
        if (result.description.length > 300) {
          result.description = result.description.substr(0, 300) + "..."
        }
        cb(result);
      } catch (e) {
        console.log("Search error: " + e);
        cb("Something went wrong")
      }
    }
  }
});

}

function autoEmbed(message,cb) {
  if (message.split(" ").length == 1 && (message.includes("store-beta.rebble.io") || message.includes("apps.rebble.io"))) {
    //Only search if it's 1 work - Just the URL
    if (message.substr(message.length-1,1) == "/") {
      message = message.substr(0,message.length-1)
    }
    //Get URL
    message = message.split("/")
    var appID = message[message.length - 1];
    console.log("search for " + appID)
    getApp(appID, cb, function(e) {
      console.log("Failed to auto embed: " + e)
    })
  }
}


module.exports.search = searchForApp;
module.exports.detectAutoEmbed = autoEmbed;
