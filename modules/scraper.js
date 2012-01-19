var request = require('request');
var jsdom = require('jsdom');
var async = require('async');
var path = require('path');
var util = require('util');
var geo = require(path.join(__dirname, 'geo'));

var scrapeURL = 'http://kwlpls.adiwidjaja.com/index.php';
var jqueryUrl = 'http://code.jquery.com/jquery.min.js';

function processRow($, row, callback) {
    var elements = $(row).children('td');
    var item = {};
    var city = null;
    var nameStr = elements != null ? elements.eq(0).html() : "";
    item.kind = nameStr.substring(0, 2);
    item.name = nameStr.substring(3);
    item.geo = geo.data[nameStr];
    if (elements.size() > 2) {
        var free = elements != null ? elements.eq(2).html() : void 0;
        var spaces = elements != null ? elements.eq(1).html() : void 0;
        item.free = free;
        item.spaces = spaces;
        item.status = "open";
    } else if (elements.size() > 0) {
        item.status = "closed";
    } else {
        var header = $(row).children().first().html();
        var currentCity = header.split(' ')[1];
        city = {
            name:"",
            geo:{}
        };
        city.name = currentCity;
        city.geo = geo.cities[currentCity];
    }
    item.city = currentCity;
    if (item.name == "" || !(item.kind == "PP" || item.kind == "PH")) {
        item = null;
    }
    callback(item, city);
}

function processPage(window, returnResult) {
    var result = {
        cities:[],
        parkings:[]
    };
    var $ = window.$;
    var rows = $("table").children();
    return async.forEach(rows, (function (row, done) {
        return processRow($, row, function (item, city) {
            if (item != null) {
                result.parkings.push(item);
            }
            if (city != null) {
                result.cities.push(city);
            }
            return done();
        });
    }), (function (err) {
        returnResult(err, result);
    }));
}

exports.fetch = function (callback) {
    return request({
        uri:scrapeURL
    }, function (error, response, page) {
        if (error && response && response.statusCode !== 200) {
            util.log('Error when contacting #{scrapeURL}');
        } else {
            jsdom.env(page, [jqueryUrl], function (err, window) {
                if (err != null) {
                    throw err;
                }
                processPage(window, callback);
            });
        }
    });
};

