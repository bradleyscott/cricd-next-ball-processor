var express = require('express');
var app = express();
var debug = require('debug')('next-ball-processor');
var Promise = require('bluebird');
var eventStore = Promise.promisifyAll(require('./eventstore.js'));
var entities = Promise.promisifyAll(require('./entities.js'));
var eventProcessors = require('./eventProcessors.js');
var _ = require('underscore');

app.use(function(req, res, next) {
    var allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS : 'http://localhost:8080';
    res.header("Access-Control-Allow-Origin", allowedOrigins);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
    debug('Request received with query params %s', JSON.stringify(req.query));

    var match = req.query.match;
    if(!match) {
        var error = 'matchId must be included in request query params';
        debug(error);
        return res.status(400).send(error);
    }

    var allEvents = [];
    
    eventStore.getMatchEventsAsync(match)
        .then(function(events) {
            if(events.length == 0) {
                var message = 'No events for this match';
                debug(message);
                return res.status(404).send(message);
            }
            
            allEvents = events;
            return entities.getMatchDetailsAsync(match);
        })
        .then(function(matchDetails) {
            var limitedOvers = matchDetails.limitedOvers;
            if(matchDetails.limitedOvers) debug('This match is limited to %s overs', matchDetails.limitedOvers);
            var lastBall = allEvents[allEvents.length - 1];
            var innings = lastBall.ball.innings;

            debug('Invoking processor for: %s', lastBall.eventType);
            var response = eventProcessors[lastBall.eventType](lastBall, allEvents, limitedOvers);
            return res.send(response);
        })
        .catch(function(error) {
            debug(error);
            return res.status(500).send(error);
        });
});

app.listen(3004);
console.log('next-ball-processor listening on port 3004...');