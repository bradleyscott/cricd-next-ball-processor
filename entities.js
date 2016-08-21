var debug = require('debug')('next-ball-processor-entities');
var exports = module.exports = {};
var Client = require('node-rest-client').Client;
var client = new Client();

// Configuration variables
var host = process.env.ENTITIES_HOST ? process.env.ENTITIES_HOST : 'entities';
var port = process.env.ENTITIES_PORT ? process.env.ENTITIES_PORT : 1337;

exports.getMatchDetails = function(matchId, callback) {
    debug('Attempting to retrieve match details');

    if(!matchId) {
        var error = 'matchId is required';
        debug(error);
        return callback(error);
    }
 
    var baseUrl = 'http://' + host + ':' + port; 
    client.get(baseUrl + '/matches/' + matchId, function (match, response) {
        debug('Received match details: %s', JSON.stringify(match));
        callback(null, match);
    }).on('error', function (err) {
        var message = 'Problem retrieving match details: ' + err;
        debug(message);
        return callback(message);
    });
};
