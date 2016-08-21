var express = require('express');
var app = express();
var debug = require('debug')('next-ball-processor');
var Promise = require('bluebird');
var eventStore = Promise.promisifyAll(require('./eventstore.js'));
var entities = Promise.promisifyAll(require('./entities.js'));
var scoreProcessor = Promise.promisifyAll(require('./scoreProcessor.js'));
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

    var lastBall, limitedOvers, wickets;
    eventStore.getMatchEventsAsync(match)
        .then(function(events) {
            if(events.length == 0) {
                debug('No events for this match');
                return res.status(404).send();
            }

            lastBall = events[events.length - 1];
            return entities.getMatchDetailsAsync(match);
        })
        .then(function(matchDetails) {
            limitedOvers = matchDetails.limitedOvers;
            if(matchDetails.limitedOvers) debug('This match is limited to %s overs', matchDetails.limitedOvers);

            return scoreProcessor.getScoreAsync(match);
        })
        .then(function(score){
            var innings = lastBall.ball.innings;
            wickets = score.innings[innings].wickets;

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
            var changes = eventProcessors[lastBall.eventType](lastBall, limitedOvers, wickets);
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
    if(changes.ball.innings) response.ball.innings = changes.ball.innings;
    if(changes.ball.over) response.ball.over = changes.ball.over;
    if(changes.ball.ball) response.ball.ball = changes.ball.ball;

    return response;
};