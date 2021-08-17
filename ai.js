var authToken = null
var request = require('request');

function makeWolframRequest(question, callback) {
    question = question.toLowerCase().replace(/ /g, "+").trim();

    if (authToken == null) {
        console.log("Aborting wolfram request because authToken has not been set");
        return
    }

    // Configure the request
    var options = {
            url: 'https://api.wolframalpha.com/v1/result?i=' + question + "&appid=" + authToken,
            method: "GET",
        }
        // Start the request
    console.log("Call wolfram with " + options.url)
    request(options, function(error, response, body) {
        body = body.replace("Wolfram|Alpha", "I")
        callback(body)
    })
}

function setAuthToken(token) {
    authToken = token
}

module.exports.answer = makeWolframRequest
module.exports.init = setAuthToken
