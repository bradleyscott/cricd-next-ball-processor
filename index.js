var express = require('express');
var app = express();
var debug = require('debug')('next-ball-processor');
var eventStore = require('./eventstore.js');
var entities = require('./entities.js');
var eventProcessors = require('./eventProcessors.js');
var _ = require('underscore');

app.get('/', function(req, res) {
    debug('Request received with query params %s', JSON.stringify(req.query));

    var match = req.query.match;
    if (!match) {
        var error = 'matchId must be included in request query params';
        debug(error);
        return res.status(400).send(error);
    }

    var events = eventStore.getMatchEvents(match, function(error, events) {
        if (error) {
            debug(error);
            return res.status(500).send(error);
        }

        if(events.length == 0) {
          debug('No events for this match');
          return res.send();
        }

        var lastBall = events[events.length - 1];

        entities.getMatchEvents(match, function(details){
            var limitedOvers = details.limitedOvers;
            // var nextBall = eventProcessors[e.eventType](lastBall, limitedOvers);
        });

        return res.send();
    });
});

app.listen(3004);
console.log('next-ball-processor listening on port 3004...');