(function() {
  var async, db, filterName, parkingBaseName, parkingSet, redis, storeHistoryItem, timelineBaseName, util;
  redis = require('redis');
  util = require('util');
  async = require('async');
  db = redis.createClient();
  db.on('error', function(err) {
    if (err != null) {
      return util.log(err);
    }
  });
  filterName = function(name) {
    if (name != null) {
      return name.replace(/[^a-zA-Z0-9 ]/g, "").replace(" ", "_");
    }
  };
  parkingBaseName = function(name) {
    return "parking:" + filterName(name);
  };
  timelineBaseName = function(name) {
    return "timeline:" + filterName(name);
  };
  parkingSet = "parkings";
  exports.storeHistory = function(rows, callback) {
    var now, row, timestamp, _i, _len;
    if (rows != null) {
      now = new Date();
      timestamp = now.getTime();
    }
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      storeHistoryItem(row, timestamp);
    }
    return callback();
  };
  storeHistoryItem = function(row, timestamp) {
    var parkingName, timelineName;
    if ((row != null) && (row.name != null) && (row.spaces != null)) {
      parkingName = parkingBaseName(row.name);
      db.sadd(parkingSet, parkingName, function(err, result) {
        if (err != null) {
          throw err;
        }
        if (result === 1) {
          util.log("HMSET " + parkingName + " name: '" + row.name + " spaces: " + row.spaces);
          return db.hmset(parkingName, "name", row.name, "spaces", row.spaces, function(err) {
            if (err != null) {
              throw err;
            }
          });
        }
      });
    } else {
      util.log("Unsufficient data for historization: " + (JSON.stringify(row)));
    }
    if ((row != null) && (row.status != null) && row.status === 'closed') {
      util.log(row.name + ' currently closed.');
    }
    if ((row != null) && (row.name != null) && (row.free != null) && (timestamp != null)) {
      util.log("HSET " + parkingName + " timeline " + (timelineBaseName(row.name)));
      db.hset(parkingName, "timeline", timelineBaseName(row.name));
      timelineName = timelineBaseName(row.name) + ':' + timestamp;
      util.log("LPUSH " + (timelineBaseName(row.name)) + " " + timelineName);
      return db.lpush(timelineBaseName(row.name), timelineName, function(err) {
        if (err != null) {
          throw err;
        }
        util.log("HMSET " + timelineName + " timestamp: " + timestamp + " free: " + row.free);
        return db.hmset(timelineName, "timestamp", timestamp, "free", row.free, function(err) {
          if (err != null) {
            throw err;
          }
        });
      });
    } else {
      return util.log("Could not store timeline for: " + (JSON.stringify(row)));
    }
  };
  exports.findTimelineByName = function(name, returnResult) {
    var result;
    result = [];
    util.log("HGETALL " + (parkingBaseName(name)));
    return db.hgetall(parkingBaseName(name), function(err, parking) {
      var twoWeeks;
      if (err != null) {
        throw err;
      }
      if ((parking != null) && (parking.timeline != null) && (parking.spaces != null)) {
        twoWeeks = 672;
        util.log("LRANGE " + parking.timeline + " " + (twoWeeks * -1) + " -1");
        return db.lrange(parking.timeline, twoWeeks * -1, -1, function(err, entries) {
          if (err != null) {
            throw err;
          }
          return async.forEach(entries, (function(key, done) {
            util.log("HGETALL " + key);
            return db.hgetall(key, function(err, value) {
              if (err != null) {
                throw err;
              }
              result.push(value);
              return done();
            });
          }), (function(err) {
            if (err != null) {
              throw err;
            }
            return returnResult(result, parking.spaces);
          }));
        });
      } else {
        return returnResult([], 0);
      }
    });
  };
}).call(this);
