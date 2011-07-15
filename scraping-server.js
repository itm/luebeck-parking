const request = require('request'),
        jsdom = require('jsdom'),
        scraper = require('./scraper'),
        JSON = require('./json2');

console.log("Server started...");

var fetch = function() {
    request({ uri:'http://kwlpls.adiwidjaja.com/index.php' }, function (error, response, body) {
        if (error && response.statusCode !== 200) {
            console.log('Fehler beim Kontaktieren der KWL Webseite!')
        }

        jsdom.env({
            html: body,
            scripts: [
                'http://code.jquery.com/jquery-1.6.1.min.js'
            ]
        }, function (err, window) {
            var $ = window.jQuery;
            const parkings = "";
            const scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708";

            var rows = new Array();

            var processPage = function() {
                var rows = $('table tbody').children();
                var num = $(rows).size();

                console.log("#rows=" + num);

                rows.each(function(i, row) {
                    if (i > 1 || i == num - 1) { // cut off header and footer
                        this.processRow(window, row);
                    }
                });

                console.log(JSON.stringify(this.rows));
            };

            var processRow = function(row) {
                console.log("processRow( " + row + " )");
                var elements = $(row).children('td');
                var item = new Object();
                item.name = elements.eq(0).html();

                if (elements.size() > 2) {
                    item.free = elements.eq(1).html();
                    item.parkings = elements.eq(2).html();
                    item.status = "open";
                } else if (elements.size() > 0) {
                    // temporarily closed
                    item.status = "closed";
                } else {
                    // this is no item (i.e. "Travemünde" header
                    return;
                }
                ;

                this.rows.push(item);
                //console.log(this.rows[this.rows.length-1]);

            };

            processPage();

        });
    });
};

const delay = 10000; // 10 seconds

/* Die Funktion fetch() alle delay-Sekunden aufrufen */
var intervalId = setInterval(fetch, delay);

//clearInterval(intervalId);
