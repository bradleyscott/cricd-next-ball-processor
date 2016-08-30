var debug = require('debug')('next-ball-processor-helpers');
var _ = require('underscore');
var exports = module.exports = {};

exports.isEndOfOver = function(lastBall, allEvents) {
    var isExtra = false;
    if(lastBall.type == 'noBall' || lastBall.type == 'wide') isExtra = true;

    if(getLegalBallNumber(lastBall, allEvents) == 6 && isExtra == false) return true;
    else return false;
};

exports.isEndOfInnings = function(lastBall, limitedOvers, wickets) {
    var isExtra = false;
    if(lastBall.type == 'noBall' || lastBall.type == 'wide') isExtra = true;
    if(limitedOvers && !isExtra && lastBall.ball.ball == 6 && lastBall.ball.over == limitedOvers - 1) return true; // Check if innings is over because of limited overs

    // Check if innings is over because all batsman are dismissed
    var isWicket = true;
    if(lastBall.type == 'delivery' || lastBall.type == 'bye' || lastBall.type == 'legbye' || isExtra) isWicket = false;
    if(isWicket && wickets == 9) return true;

    return false;
};

exports.getPreviousBowler = function(lastBall, allEvents) {
    var previousOver = lastBall.ball.over - 1;
    var innings = lastBall.ball.innings;

    var previousOverBall = _(allEvents).find(function(e){
        return lastBall.ball.over == previousOver && lastBall.ball.innings == innings;
    });
    var bowler = previousOverBall.bowler;
    return bowler;  
};

exports.getLegalBallNumber = function(lastBall, allEvents) {
    var lastBall = allEvents[allEvents.length - 1];
    var innings = lastBall.ball.innings;
    var over = lastBall.ball.over;

    var legalBalls = _(allEvents).filter(function(e){
        var overMatch = lastBall.ball.over == over && lastBall.ball.innings == innings;
        var isExtra = lastBall.type == 'noBall' || lastBall.type == 'wide';
        return overMatch && !isExtra;
    });

    return legalBalls.length;
};
var getLegalBallNumber = exports.getLegalBallNumber;

exports.getWickets = function(lastBall, allEvents) {
    var inningsEvents = _(allEvents).filter(function(e){
        return lastBall.ball.innings == e.ball.innings;
    });

    var wickets = _(allEvents).filter(function(e){
        if(e.eventType != 'delivery' && e.eventType != 'noBall' && e.eventType != 'wide' || 
            e.eventType != 'bye' && e.eventType == 'legBye') return true;
        else return false;
    });

    return wickets.length;
};

exports.getDefaultResponse = function(lastBall, allEvents) {
    var response = {
        ball: {
            battingTeam: {
                id: lastBall.ball.battingTeam.id,
                name: lastBall.ball.battingTeam.name
            },
            fieldingTeam: {
                id: lastBall.ball.fieldingTeam.id,
                name: lastBall.ball.fieldingTeam.name
            },  
            innings: lastBall.ball.innings,
            over: lastBall.ball.over,
            ball: getLegalBallNumber(lastBall, allEvents) 
        },
        batsmen: {
            striker: {
                id: lastBall.batsmen.striker.id,
                name: lastBall.batsmen.striker.name
            },
            nonStriker: {
                id: lastBall.batsmen.nonStriker.id,
                name: lastBall.batsmen.nonStriker.name
            }
        },
        bowler: {
            id: lastBall.bowler.id,
            name: lastBall.bowler.name
        }      
    };

    return response;
}