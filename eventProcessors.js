var debug = require('debug')('next-ball-processor-eventProcessors');
var _ = require('underscore');
var exports = module.exports = {};

var isEndOfOver = function(e, matchEvents) {
    var isExtra = false;
    if(e.type == 'noBall' || e.type == 'wide') isExtra = true;

    if(getLegalBallNumber(e, matchEvents) == 6 && isExtra == false) return true;
    else return false;
};

var isEndOfInnings = function(e, limitedOvers, wickets) {
    var isExtra = false;
    if(e.type == 'noBall' || e.type == 'wide') isExtra = true;
    if(!isExtra && e.ball.ball == 6 && e.ball.over == limitedOvers - 1) return true; // Check if innings is over because of limited overs

    // Check if innings is over because all batsman are dismissed
    var isWicket = true;
    if(e.type == 'delivery' || e.type == 'bye' || e.type == 'legbye' || isExtra) isWicket = false;
    if(isWicket && wickets == 9) return true;

    return false;
};

var getPreviousBowler = function(e, matchEvents) {
    var previousOver = e.ball.over - 1;
    var innings = e.ball.innings;

    var previousOverBall = _(matchEvents).find(function(e){
        return e.ball.over == previousOver && e.ball.innings == innings;
    });
    var bowler = previousOverBall.bowler;
    return bowler;  
};

var getLegalBallNumber = function(e, matchEvents) {
    var lastBall = matchEvents[matchEvents.length - 1];
    var innings = lastBall.ball.innings;
    var over = e.ball.over;

    var legalBalls = _(matchEvents).filter(function(e){
        var overMatch = e.ball.over == over && e.ball.innings == innings;
        var isExtra = e.type == 'noBall' || e.type == 'wide';
        return overMatch && !isExtra;
    });

    return legalBalls.length;
};

var getWickets = function(e, matchEvents) {
    var inningsEvents = _(matchEvents).filter(function(evt){
        return e.ball.innings == evt.ball.innings;
    });

    var wickets = _(matchEvents).filter(function(e){
        if(e.eventType != 'delivery' && e.eventType != 'noBall' && e.eventType != 'wide' || 
            e.eventType != 'bye' && e.eventType == 'legBye') return true;
        else return false;
    });

    return wickets.length;
};

exports.delivery = function(e, matchEvents, limitedOvers) {
    debug('Processing delivery: %s', JSON.stringify(e));
    
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);
    var nextBall = getLegalBallNumber(e, matchEvents) + 1;

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(oddRuns) {
        changes.ball.ball = nextBall;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball = nextBall;
    return changes;
};

exports.noBall = function(e, matchEvents, limitedOvers) {
    debug('Processing noBall: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
    if(oddRuns) {
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    return changes;
};

exports.wide = function(e, matchEvents, limitedOvers) {
    debug('Processing wide: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
    if(oddRuns) {
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    return changes;
};

exports.bye = function(e, matchEvents, limitedOvers) {
    debug('Processing bye: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(oddRuns) {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball = getLegalBallNumber(e, matchEvents);
    return changes;
};

exports.legBye = function(e, matchEvents, limitedOvers) {
    debug('Processing legBye: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(oddRuns) {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball = getLegalBallNumber(e, matchEvents);
    return changes;
};

exports.bowled = function(e, matchEvents, limitedOvers) {
    debug('Processing bowled: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.timedOut = function(e, matchEvents, limitedOvers) {
    debug('Processing timedOut: %s', JSON.stringify(e));

    var changes = {
        ball: e.ball,
        batsmen: {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        }
    };

    return changes;
};

exports.caught = function(e, matchEvents, limitedOvers) {
    debug('Processing caught: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !e.didCross) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && e.didCross) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(e.didCross) {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.handledBall = function(e, matchEvents, limitedOvers) {
    debug('Processing handledBall: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.doubleHit = function(e, matchEvents, limitedOvers) {
    debug('Processing doubleHit: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.hitWicket = function(e, matchEvents, limitedOvers) {
    debug('Processing hitWicket: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    } 
    return changes;
};

exports.lbw = function(e, matchEvents, limitedOvers) {
    debug('Processing lbw: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    } 
    return changes;
};

exports.obstruction = function(e, matchEvents, limitedOvers) {
    debug('Processing obstruction: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var didSwap = e.runs % 2 == 0; // Players swap on unsuccessful run
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(didSwap) {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.runOut = function(e, matchEvents, limitedOvers) {
    debug('Processing runOut: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var didSwap = e.runs % 2 == 0; // Players swap on unsuccessful run
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents) && !didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(isEndOfOver(e, matchEvents) && didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else if(didSwap) {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.stumped = function(e, matchEvents, limitedOvers) {
    debug('Processing stumped: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var wickets = getWickets(e, matchEvents);
    var endOfInnings = isEndOfInnings(e, limitedOvers, wickets);

    if(endOfInnings) {
        changes.ball.battingTeam = e.ball.fieldingTeam;
        changes.ball.fieldingTeam = e.ball.battingTeam;
        changes.ball.innings++;
        changes.ball.over = 0;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e, matchEvents)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = getPreviousBowler(e, matchEvents);
    }
    else {
        changes.ball.ball = getLegalBallNumber(e, matchEvents);
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};
