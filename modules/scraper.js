var request = require("request");
var jsdom = require("jsdom");
var async = require("async");
var path = require("path");
var util = require("util");
var geo = require(path.join(__dirname, "geo"));
var _ = require("underscore");

var scrapeURL = "http://kwlpls.adiwidjaja.com/index.php";
var jqueryUrl = "http://code.jquery.com/jquery.min.js";

function tr($, $tr, callback) {
    var $ths = $($tr).children($("th"));
    var $tds = $($tr).children($("td"));
    var nameStr = $tds.eq(0).html();

    var parking = {};
    var city = null;

    parking.kind = nameStr.substring(0, 2);
    parking.name = nameStr.substring(3);
    parking.geo = geo.data[nameStr];

    if ($tds.size() > 2) {
        parking.free = $tds.eq(2).html();
        parking.spaces = $tds.eq(1).html();
        parking.status = "open";
    }
    else if ($tds.size() > 0) {
        parking.status = "closed";
    }
    // TODO
    else if (typeof $ths !== "undefined" && $ths !== null) {
        var header = $($ths).first().html();
        var currentCity = header.split(" ")[1];
        city = {
            name:currentCity,
            geo:geo.cities[currentCity]
        };
    }

    parking.city = currentCity;
    if (parking.kind != "PP" && parking.kind != "PH") {
        parking = null;
    }

    callback(parking, city);
}

function table(window, callback) {
    var result = {
        cities:[],
        parkings:[]
    };

    var $ = window.$;
    var $trs = $("table").children();

    async.forEach(
        $trs,
        function ($tr, done) {
            tr($, $tr, function (item, city) {
                if (typeof item !== "undefined" && item !== null) {
                    result.parkings.push(item);
                }
                if (typeof city !== "undefined" && city !== null) {
                    result.cities.push(city);
                }
                done();
            });
        },
        function (err) {
            callback(err, result);
        }
    );
}

exports.scrape = function (callback) {
    request(
        {
            uri:scrapeURL
        },
        function (error, response, page) {
            if (typeof error !== "undefined" && error !== null) {
                throw error;
            }
            if (response.statusCode !== 200) {
                util.log("Error contacting " + scrapeURL);
            }
            else {
                jsdom.env(page, [jqueryUrl], function (err, window) {
                    if (typeof err !== "undefined" && err !== null) {
                        throw err;
                    }
                    table(window, callback);
                });
            }
        }
    );
};

