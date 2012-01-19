(function() {
  var async, geo, jqueryUrl, jsdom, processPage, processRow, request, scrapeURL, util;
  request = require('request');
  jsdom = require('jsdom');
  async = require('async');
  util = require('util');
  geo = require('./geo');
  scrapeURL = 'http://kwlpls.adiwidjaja.com/index.php';
  jqueryUrl = 'http://code.jquery.com/jquery.min.js';
  processRow = function($, row, callback) {
    var city, currentCity, elements, free, header, item, nameStr, spaces;
    elements = $(row).children('td');
    item = {};
    city = null;
    nameStr = elements != null ? elements.eq(0).html() : void 0;
        if (nameStr != null) {
      nameStr;
    } else {
      nameStr = "";
    };
    item.kind = nameStr.substring(0, 2);
    item.name = nameStr.substring(3);
    item.geo = geo.data[nameStr];
    if (elements.size() > 2) {
      free = elements != null ? elements.eq(2).html() : void 0;
      spaces = elements != null ? elements.eq(1).html() : void 0;
      item.free = free;
      item.spaces = spaces;
      item.status = "open";
    } else if (elements.size() > 0) {
      item.status = "closed";
    } else {
      header = $(row).children().first().html();
      currentCity = header.split(' ')[1];
      city = {
        name: "",
        geo: {}
      };
      city.name = currentCity;
      city.geo = geo.cities[currentCity];
    }
    item.city = currentCity;
    if (item.name === "" || !(item.kind === "PP" || item.kind === "PH")) {
      item = null;
    }
    return callback(item, city);
  };
  processPage = function(window, returnResult) {
    var $, result, rows;
    result = {
      cities: [],
      parkings: []
    };
    $ = window.$;
    rows = $("table").children();
    return async.forEach(rows, (function(row, done) {
      return processRow($, row, function(item, city) {
        if (item != null) {
          result.parkings.push(item);
        }
        if (city != null) {
          result.cities.push(city);
        }
        return done();
      });
    }), (function(err) {
      return returnResult(err, result);
    }));
  };
  exports.fetch = function(callback) {
    return request({
      uri: scrapeURL
    }, function(error, response, page) {
      if (error && response && response.statusCode !== 200) {
        return util.log('Error when contacting #{scrapeURL}');
      } else {
        return jsdom.env(page, [jqueryUrl], function(err, window) {
          if (err != null) {
            throw err;
          }
          return processPage(window, callback);
        });
      }
    });
  };
}).call(this);
