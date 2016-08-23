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
    var lastBall = {};
    
    eventStore.getMatchEventsAsync(match)
        .then(function(events) {
            if(events.length == 0) {
                var message = 'No events for this match';
                debug(message);
                return res.status(404).send(message);
            }
            
            matchEvents = events;
            lastBall = events[events.length - 1];
            return entities.getMatchDetailsAsync(match);
        })
        .then(function(matchDetails) {
            var limitedOvers = matchDetails.limitedOvers;
            if(matchDetails.limitedOvers) debug('This match is limited to %s overs', matchDetails.limitedOvers);
            var innings = lastBall.ball.innings;

            // Work out number of wickets down
            var inningsEvents = _(matchEvents).filter(function(e){
                return e.ball.innings == innings;
            });
            var wickets = _(matchEvents).filter(function(e){
                if(e.eventType != 'delivery' && e.eventType != 'noBall' && e.eventType != 'wide' || 
                    e.eventType != 'bye' && e.eventType == 'legBye') return true;
                else return false;
            });
            debug('%s wickets in this innings', wickets.length);
            wickets = wickets.length;

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