var redis = require("redis");
var util = require("util");
var async = require("async");
var db = redis.createClient();

db.on("error", function (err) {
    if (typeof err !== "undefined" && err !== null) {
        return util.log(err);
    }
});

function filterName(name) {
    var result = name;
    if (typeof name !== "undefined" && name !== null) {
        result = name.replace(/[^a-zA-Z0-9 ]/g, "").replace(" ", "_");
    }
    return result;
}

function parkingBaseName(name) {
    return "parking:" + filterName(name);
}

function timelineBaseName(name) {
    return "timeline:" + filterName(name);
}

var PARKING_SET = "parkings";

exports.storeHistory = function (rows, callback) {
    var timestamp;
    if (typeof rows !== "undefined" && rows !== null) {
        now = new Date();
        timestamp = now.getTime();
    }
    async.forEach(
        rows,
        function (r, done) {
            storeHistoryItem(r, timestamp, function () {
                done();
            });
        },
        function (err) {
            if (typeof err !== "undefined" && err !== null) {
                throw err;
            }
            callback();
        }
    );
};

function storeHistoryItem(row, timestamp, callback) {
    var parkingName;
    var timelineName;

    if ((row !== null) && (row.name != null) && (row.spaces != null)) {
        parkingName = parkingBaseName(row.name);
        db.sadd(PARKING_SET, parkingName, function (err, result) {
            if (typeof err !== "undefined" && err !== null) {
                throw err;
            }
            if (result === 1) {
                util.log("HMSET " + parkingName + " name: " + row.name + " spaces: " + row.spaces);
                db.hmset(parkingName, "name", row.name, "spaces", row.spaces, function (err) {
                    if (typeof err !== "undefined" && err !== null) {
                        throw err;
                    }
                });
            }
        });
    }

    if ((row != null) && (row.name != null) && (row.free != null) && (timestamp != null)) {
        util.log("HSET " + parkingName + " timeline " + (timelineBaseName(row.name)));
        db.hset(parkingName, "timeline", timelineBaseName(row.name));
        timelineName = timelineBaseName(row.name) + ":" + timestamp;
        util.log("LPUSH " + (timelineBaseName(row.name)) + " " + timelineName);
        db.lpush(timelineBaseName(row.name), timelineName, function (err) {
            if (typeof err !== "undefined" && err !== null) {
                throw err;
            }
            util.log("HMSET " + timelineName + " timestamp: " + timestamp + " free: " + row.free);
            db.hmset(timelineName, "timestamp", timestamp, "free", row.free, function (err) {
                if (typeof err !== "undefined" && err !== null) {
                    throw err;
                }
                callback();
            });
        });
    }
}

exports.findTimelineByName = function (name, callback) {
    var result = [];
    util.log("HGETALL " + (parkingBaseName(name)));
    db.hgetall(parkingBaseName(name), function (err, parking) {
        if (typeof err !== "undefined" && err !== null) {
            throw err;
        }
        if ((parking != null) && (parking.timeline != null) && (parking.spaces != null)) {
            var twoWeeks = 672;
            util.log("LRANGE " + parking.timeline + " " + (twoWeeks * -1) + " -1");
            db.lrange(parking.timeline, twoWeeks * -1, -1, function (err, entries) {
                if (err != null) {
                    throw err;
                }
                async.forEach(
                    entries,
                    function (key, done) {
                        util.log("HGETALL " + key);
                        db.hgetall(key, function (err, value) {
                            if (err != null) {
                                throw err;
                            }
                            result.push(value);
                            done();
                        });
                    },
                    function (err) {
                        if (err != null) {
                            throw err;
                        }
                        callback(result, parking.spaces);
                    });
            });
        } else {
            callback([], 0);
        }
    });
};

