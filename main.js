var modules_dir = 'modules';
var path = require('path');
var util = require('util');
var scraper = require(path.join(__dirname, modules_dir, 'scraper'));
var history = require(path.join(__dirname, modules_dir, 'history'));

process.on('uncaughtException', function (err) {
    if (err) {
        util.trace(err);
        process.exit(1);
    }
});

process.on('exit', function () {
    util.log('Server shutting down.');
});

_data = [];

cacheJson = function () {
    util.log("Starte scraping...");
    return scraper.fetch(function (err, result) {
        var _ref;
        if (err != null) {
            throw err;
        }
        _data = result;
        return util.log("Daten geholt (" + (_data != null ? (_ref = _data.parkings) != null ? _ref.length : void 0 : void 0) + " Eintraege)");
    });
};

handleHistory = function () {
    var parkings;
    parkings = _data != null ? _data.parkings : void 0;
    if (parkings != null) {
        return history.storeHistory(parkings, function () {
            return util.log("Daten historisiert (" + (parkings != null ? parkings.length : void 0) + " Eintraege)");
        });
    }
};

scrapeDelay = 2 * 60 * 1000;
scrapeIntervalId = setInterval(cacheJson, scrapeDelay);
historyDelay = 30 * 60 * 1000;
historyIntervalId = setInterval(handleHistory, historyDelay);

express = require('express');
host = '0.0.0.0';
port = 8080;

app = express.createServer();

app.configure(function () {
    return app.use(express.static(__dirname + '/public'));
});

app.get('/json/current', function (req, res) {
    console.time('Ausgeliefert: /json/current');
    if (_data != null) {
        res.json(_data);
    } else {
        res.send('Derzeit keine Daten verf&uuml;gbar.', 404);
    }
    console.timeEnd('Ausgeliefert: /json/current');
    return util.log("Request von " + (req.header('host')) + " beantwortet.");
});

app.get('/json/history/:name', function (req, res) {
    var name, _ref;
    name = (_ref = req.params) != null ? _ref.name : void 0;
    console.time('Ausgeliefert: /json/history/' + name);
    return history.findTimelineByName(name, function (timeline, spaces) {
        var feedback;
        feedback = {
            "name":name,
            "spaces":spaces,
            "timeline":timeline
        };
        if ((timeline != null) && (timeline != null ? timeline.length : void 0) > 0) {
            res.json(feedback);
        } else {
            res.send('Derzeit keine Daten f&uuml;r Parkplatz "' + name + '" verf&uuml;gbar.', 404);
        }
        return console.timeEnd('Ausgeliefert: /json/history/' + name);
    });
});

app.listen(port, host);

util.log("Server laeuft auf http://" + host + ":" + port + "/");

