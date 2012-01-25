var redis = require("redis");
var util = require("util");
var async = require("async");
var db = redis.createClient();

db.on("error", function (err) {
    if (typeof err !== "undefined" && err !== null) util.log(err);
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
    if (typeof rows === "undefined" || rows === null) {
        callback();
    }
    var now = new Date();
    var timestamp = now.getTime();
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

    if (typeof row !== "undefined"
        && row !== null
        && row.hasOwnProperty("name")
        && row.hasOwnProperty("spaces")) {

        var parkingName = parkingBaseName(row.name);

        db.sadd(PARKING_SET, parkingName, function (err, result) {
            if (typeof err !== "undefined" && err !== null) throw err;
            if (result === 1) {
                db.hmset(parkingName, "name", row.name, "spaces", row.spaces, function (err) {
                    if (typeof err !== "undefined" && err !== null) throw err;
                });
            }
        });
    }

    if (typeof row !== "undefined"
        && row !== null
        && row.hasOwnProperty("free")
        && typeof timestamp !== "undefined"
        && timestamp !== null) {

        parkingName = parkingBaseName(row.name);

        db.hset(parkingName, "timeline", timelineBaseName(row.name));

        var timelineName = timelineBaseName(row.name) + ":" + timestamp;

        db.lpush(timelineBaseName(row.name), timelineName, function (err) {
            if (typeof err !== "undefined" && err !== null) throw err;

            db.hmset(timelineName, "timestamp", timestamp, "free", row.free, function (err) {
                if (typeof err !== "undefined" && err !== null) throw err;
                callback();
            });
        });
    }
}

exports.findTimelineByName = function (name, callback) {
    var result = [];

    util.log("HGETALL " + (parkingBaseName(name)));

    db.hgetall(parkingBaseName(name), function (err, parking) {
        if (typeof err !== "undefined" && err !== null) throw err;

        if (typeof parking !== "undefined"
            && parking !== null
            && parking.hasOwnProperty("timeline")
            && parking.hasOwnProperty("spaces")) {

            var twoWeeks = 672;

            db.lrange(parking.timeline, twoWeeks * -1, -1, function (err, entries) {
                if (typeof err !== "undefined" && err !== null) throw err;

                async.forEach(
                    entries,
                    function (key, done) {
                        util.log("HGETALL " + key);
                        db.hgetall(key, function (err, value) {
                            if (typeof err !== "undefined" && err !== null) throw err;
                            result.push(value);
                            done();
                        });
                    },
                    function (err) {
                        if (typeof err !== "undefined" && err !== null) throw err;
                        callback(result, parking.spaces);
                    }
                );
            });
        } else {
            callback([], 0);
        }
    });
};

