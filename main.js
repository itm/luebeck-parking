var path = require("path");
var util = require("util");
//var _ = require("underscore");
var modules_dir = "modules";
var scraper = require(path.join(__dirname, modules_dir, "scraper"));
var history = require(path.join(__dirname, modules_dir, "history"));

// ----------------------------------------------------------------------------

process.on("uncaughtException", function (err) {
    if (err) {
        util.trace(err);
        process.exit(1);
    }
});

process.on("exit", function () {
    util.log("Server shutting down.");
});

// ----------------------------------------------------------------------------

var _data = [];

function onScrape() {
    util.log("Scrape");
    return scraper.scrape(function (err, result) {
        if (err != null) {
            throw err;
        }
        _data = result;
        if (typeof result !== "undefined" && result !== null) {
            util.log("Got data (" + _data.length + " items)");
        }
    });
}

function onHistory() {
    var parkings = _data.parkings;
    if (typeof parkings !== "undefined" && parkings != null) {
        history.storeHistory(parkings, function () {
            util.log("Added data to history (" + parkings.length + " items)");
        });
    }
}

var scrapeDelay = 0.1 * 60 * 1000;
var scrapeIntervalId = setInterval(onScrape, scrapeDelay);
var historyDelay = 10 * 60 * 1000;
var historyIntervalId = setInterval(onHistory, historyDelay);

// ----------------------------------------------------------------------------

var express = require("express");
var host = "0.0.0.0";
var port = 8080;

app = express.createServer();

app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

//app.configure("production", function () {
//    var oneYear = 31557600000;
//    app.use(express.static(__dirname + "/public", { maxAge:oneYear }));
//    app.use(express.errorHandler());
//});

app.get("/json/current", function (req, res) {
    console.time("Delivered: /json/current");
    if (typeof _data !== "undefined" && _data !== null) {
        res.json(_data);
    } else {
        res.send("Derzeit keine Daten verf&uuml;gbar.", 404);
    }
    console.timeEnd("Delivered: /json/current");
    return util.log("Answered request from: " + (req.header("host")));
});

app.get("/json/history/:name", function (req, res) {
    var name = req.params["name"];
    console.time("Delivered: /json/history/" + name);
    return history.findTimelineByName(name, function (timeline, spaces) {
        var feedback;
        feedback = {
            "name":name,
            "spaces":spaces,
            "timeline":timeline
        };
        if (typeof timeline !== "undefined" && timeline !== null && timeline.length > 0) {
            res.json(feedback);
        } else {
            res.send("Derzeit keine Daten f&uuml;r Parkplatz \"" + name + "\" verf&uuml;gbar.", 404);
        }
        return console.timeEnd("Delivered: /json/history/" + name);
    });
});

app.listen(port, host);

util.log("Server running: http://" + host + ":" + port + "/");


