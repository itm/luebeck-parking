var request = require("request");
var jsdom = require("jsdom");
var async = require("async");
var path = require("path");
var util = require("util");
var geo = require(path.join(__dirname, "geo"));
//var _ = require("underscore");

var scrapeURL = "http://kwlpls.adiwidjaja.com/index.php";
var jqueryUrl = "http://code.jquery.com/jquery.min.js";


function parseParkings(window, callback) {
    var $ = window.$;
    var $trs = $("table tr");
    var cities = [];
    var parkings = [];

    async.forEach(
        $trs,
        function ($tr, done) {
            var tmpCityName = null;
            var $tmpTds = $($tr).children();
            var $tmpThs = $($tr).children("th.head1");

            if ($($tmpThs).size() > 0) {
                tmpCityName = $($tmpThs).text().split(" ")[1];
                cities.push(tmpCityName);
                done();
            }

            var tmpParking = {};
            var tmpText = $($tmpTds).eq(0).html();
            var tmpPrefix = tmpText.substring(0, 2);

            if (tmpPrefix === "PP" || tmpPrefix === "PH") {
                tmpParking.kind = tmpPrefix;
                tmpParking.name = tmpText.substring(3);

                if ($($tmpTds).size() > 2) {
                    tmpParking.spaces = $($tmpTds).eq(1).html();
                    tmpParking.free = $($tmpTds).eq(2).html();
                    tmpParking.status = "open";
                }
                else if ($($tmpTds).size() > 0) {
                    tmpParking.status = "closed";
                }
                tmpParking.geo = geo.data[tmpParking.name];
                parkings.push(tmpParking);
            }
            done();
        },
        function (err) {
            if (typeof err !== "undefined" && err !== null) {
                callback(err, null);
            }
            callback(null, {"current":{"cities":cities, "parkings":parkings}});
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
                    parseParkings(window, callback);
                });
            }
        }
    );
};

