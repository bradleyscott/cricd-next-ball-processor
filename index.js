var express = require('express');
var app = express();
var debug = require('debug')('next-ball-processor');
var Promise = require('bluebird');
var eventStore = Promise.promisifyAll(require('./eventstore.js'));
var entities = Promise.promisifyAll(require('./entities.js'));
var eventProcessors = require('./eventProcessors.js');
var _ = require('underscore');

app.get('/', function(req, res) {
    debug('Request received with query params %s', JSON.stringify(req.query));

    var match = req.query.match;
    if(!match) {
        var error = 'matchId must be included in request query params';
        debug(error);
        return res.status(400).send(error);
    }

    var matchEvents = [];
    
    eventStore.getMatchEventsAsync(match)
        .then(function(events) {
            if(events.length == 0) {
                var message = 'No events for this match';
                debug(message);
                return res.status(404).send(message);
            }
            
            matchEvents = events;
            return entities.getMatchDetailsAsync(match);
        })
        .then(function(matchDetails) {
            var limitedOvers = matchDetails.limitedOvers;
            if(matchDetails.limitedOvers) debug('This match is limited to %s overs', matchDetails.limitedOvers);
            var lastBall = matchEvents[matchEvents.length - 1];
            var innings = lastBall.ball.innings;

            // Default next ball information
            var response = {
                match: match, 
                ball: {
                    battingTeam: lastBall.ball.battingTeam, 
                    fieldingTeam: lastBall.ball.fieldingTeam,
                    innings: innings,
                    over: lastBall.ball.over,
                    ball: lastBall.ball.ball // Assumes an extra
                },
                batsmen: lastBall.batsmen,
                bowler: lastBall.bowler
            };

            debug('Invoking processor for: %s', lastBall.eventType);
            var changes = eventProcessors[lastBall.eventType](lastBall, matchEvents, limitedOvers);
            response = applyNextBall(response, changes);

            return res.send(response);
        })
        .catch(function(error) {
            debug(error);
            return res.status(500).send(error);
        });
});

app.listen(3004);
console.log('next-ball-processor listening on port 3004...');

applyNextBall = function(response, changes) {
    debug('Applying changes to next ball using: %s', JSON.stringify(changes));

    if(changes.bowler) response.bowler = changes.bowler;
    if(changes.batsmen) response.batsmen = changes.batsmen;
    if(changes.ball.battingTeam) response.ball.battingTeam = changes.ball.battingTeam;
    if(changes.ball.fieldingTeam) response.ball.fieldingTeam = changes.ball.fieldingTeam;
    if(changes.ball.innings != null) response.ball.innings = changes.ball.innings;
    if(changes.ball.over != null) response.ball.over = changes.ball.over;
    if(changes.ball.ball != null) response.ball.ball = changes.ball.ball;

    return response;
};