(function() {
  var fetch, _jsdom, _json2, _request;
  _request = require('request');
  _jsdom = require('jsdom');
  _json2 = require('./json2');
  console.log('Scraping server started...');
  fetch = function() {
    return _request({
      uri: 'http://kwlpls.adiwidjaja.com/index.php'
    }, function(error, response, body) {
      if (error && response.statusCode !== 200) {
        console.log('Fehler beim Kontaktieren der KWL Webseite!');
      }
      return _jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.1.min.js']
      }, function(err, window) {
        var $, processPage, processRow, rows, scrapeDivId;
        $ = window.jQuery;
        scrapeDivId = 'cc-m-externalsource-container-m8a3ae44c30fa9708';
        rows = new Array();
        processPage = function() {
          var num;
          rows = $('table tbody').children();
          num = $(rows).size();
          console.log('#rows=' + num);
          rows.each(function(i, row) {
            if (i > 1 || i === num - 1) {
              return processRow(row);
            }
          });
          return console.log(_json2.JSON.stringify(rows));
        };
        processRow = function(row) {
          var elements, item;
          console.log('processRow( ' + row + ' )');
          elements = $(row).children('td');
          item = new Object();
          item.name = elements.eq(0).html();
          if (elements.size() > 2) {
            item.free = elements.eq(1).html();
            item.parkings = elements.eq(2).html();
            item.status = 'open';
          } else if (elements.size() > 0) {
            item.status = 'closed';
          } else {
            return;
          }
          return rows.push(item);
        };
        return processPage();
      });
    });
  };
}).call(this);
