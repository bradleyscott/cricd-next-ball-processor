var debug = require('debug')('next-ball-processor-eventProcessors');
var _ = require('underscore');
var exports = module.exports = {};

var isEndOfOver = function(e) {
    var isExtra = false;
    if(e.type == 'noBall' || e.type == 'wide') isExtra = true;

    if(e.ball == 6 && isExtra == false) return true;
    else return false;
};

var isEndOfInnings = function(e, limitedOvers, wickets) {
    var isExtra = false;
    if(e.type == 'noBall' || e.type == 'wide') isExtra = true;

    // Check if innings is over because of limited overs
    if(!isExtra && e.ball.ball == 6 && e.ball.over == limitedOvers) return true;

    // Check if innings is over because all batsman are dismissed
    var isWicket = true;
    if(e.type == 'delivery' || e.type == 'bye' || e.type == 'legbye' || isExtra) isWicket = false;
    if(isWicket && wickets == 9) return true;

    return false;
};

exports.delivery = function(e, limitedOvers, wickets) {
    debug('Processing delivery: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
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
    else if(isEndOfOver(e) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = {};
    }
    else if(oddRuns) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball++;
    return changes;
};

exports.noBall = function(e, limitedOvers, wickets) {
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

exports.wide = function(e, limitedOvers, wickets) {
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

exports.bye = function(e, limitedOvers, wickets) {
    debug('Processing bye: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
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
    else if(isEndOfOver(e) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = {};
    }
    else if(oddRuns) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball++;
    return changes;
};

exports.legBye = function(e, limitedOvers, wickets) {
    debug('Processing legBye: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var oddRuns = e.runs % 2 != 0;
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
    else if(isEndOfOver(e) && !oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && oddRuns) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.bowler = {};
    }
    else if(oddRuns) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: e.batsmen.striker
        };
    }
    else changes.ball.ball++;
    return changes;
};

exports.bowled = function(e, limitedOvers, wickets) {
    debug('Processing bowled: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.timedOut = function(e, limitedOvers, wickets) {
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

exports.caught = function(e, limitedOvers, wickets) {
    debug('Processing caught: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

    var didCross = e.runs % 2 != 0; // TODO: Figure out did cross
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
    else if(isEndOfOver(e) && !didCross) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && didCross) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = {};
    }
    else if(didCross) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.handledBall = function(e, limitedOvers, wickets) {
    debug('Processing handledBall: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.doubleHit = function(e, limitedOvers, wickets) {
    debug('Processing doubleHit: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};


exports.hitWicket = function(e, limitedOvers, wickets) {
    debug('Processing hitWicket: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    } 
    return changes;
};

exports.lbw = function(e, limitedOvers, wickets) {
    debug('Processing lbw: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    } 
    return changes;
};

exports.obstruction = function(e, limitedOvers, wickets) {
    debug('Processing obstruction: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e) && !didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = {};
    }
    else if(didSwap) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.runOut = function(e, limitedOvers, wickets) {
    debug('Processing runOut: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e) && !didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.striker
        };
        changes.bowler = {};
    }
    else if(isEndOfOver(e) && didSwap) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
        changes.bowler = {};
    }
    else if(didSwap) {
        changes.ball.ball++;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};

exports.stumped = function(e, limitedOvers, wickets) {
    debug('Processing stumped: %s', JSON.stringify(e));
    var changes = {
        ball: e.ball
    };

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
    else if(isEndOfOver(e)) {
        changes.ball.over++;
        changes.ball.ball = 1;
        changes.batsmen = {
            striker: e.batsmen.nonStriker,
            nonStriker: {}
        };
        changes.bowler = {};
    }
    else {
        changes.ball.ball++;
        changes.batsmen = {
            striker: {},
            nonStriker: e.batsmen.nonStriker
        };
    }
    return changes;
};
