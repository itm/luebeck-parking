var path = require("path");
var util = require("util");
//var url = require("url");
//var _ = require("underscore");
var modules_dir = "modules";
var scraper = require(path.join(__dirname, modules_dir, "scraper"));
var history = require(path.join(__dirname, modules_dir, "history"));

// ----------------------------------------------------------------------------

var _data = {"current":{"cities":[], "parkings":[]}};

function onScrape() {
    util.log("Scrape...");
    return scraper.scrape(function (err, result) {
        if (typeof err !== "undefined" && err !== null) throw err;
        if (typeof result !== "undefined" && result !== null) {
            _data = result;
            util.log("#" + _data.current.parkings.length + " parkings returned.");
        }
    });
}

function onHistory() {
    var parkings = _data.current.parkings;
    if (typeof parkings !== "undefined" && parkings != null) {
        history.storeHistory(parkings, function () {
            util.log("#" + _data.current.parkings.length + " parkings historized.");
        });
    }
}

var scrapeDelay = 2 * 60 * 1000;
setInterval(onScrape, scrapeDelay);

var historyDelay = 30 * 60 * 1000;
setInterval(onHistory, historyDelay);

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
    if (typeof _data === "undefined" || _data === null) {
        res.send("Derzeit keine Daten verf&uuml;gbar.", 404);
    }
    else {
//        res.writeHead(200, {
//            'content-type': 'text/json',
//            'Access-Control-Allow-Origin': '*',
//            'Access-Control-Allow-Headers' : 'x-requested-with'
//        });
//        var params = url.parse(req.url, true).query;
//        if (typeof params.callback !== "undefined" && params.callback !== null) {
//            res.write(params.callback + JSON.stringify(_data));
//        }
//        else if (typeof params.field !== "undefined" && params.field !== null) {
//            res.write("var " + params.field + "= " + JSON.stringify(_data));
//        }
//        else {
//            res.write(JSON.stringify(_data));
//        }
//        res.end("\n");
        res.json(_data);
    }
    console.timeEnd("Delivered: /json/current");
    util.log("Answered request from: " + (req.header("host")));
});

app.get("/json/history/:name", function (req, res) {
    var name = req.params["name"];
    console.time("Delivered: /json/history/" + name);
    history.findTimelineByName(name, function (timeline, spaces) {
        var feedback = {
            "name":name,
            "spaces":spaces,
            "timeline":timeline
        };

        if (typeof timeline !== "undefined" && timeline !== null && timeline.length > 0) {
            res.json(feedback);
        } else {
            res.send("Derzeit keine Daten f&uuml;r Parkplatz \"" + name + "\" verf&uuml;gbar.", 404);
        }
        console.timeEnd("Delivered: /json/history/" + name);
    });
});

app.listen(port, host);

util.log("Server running: http://" + host + ":" + port + "/");


