const request  = require('request'),
      jsdom    = require('jsdom'),
      scraper  = require('./scraper'),
      JSON     = require('./json2');

console.log("Server started...");

var fetch = function() {    
    request({ uri:'http://kwlpls.adiwidjaja.com/index.php' }, function (error, response, body) {
      if (error && response.statusCode !== 200) {
        console.log('Error when contacting google.com')
      }
    
      jsdom.env({
        html: body,
        scripts: [
          'http://code.jquery.com/jquery-1.6.1.min.js'
        ]
      }, function (err, window) {
        scraper.scraper.$ = window.jQuery;
    
        scraper.scraper.processPage();
        // jQuery is now loaded on the jsdom window created from 'agent.body'
        // console.log($('table').html());
      });
  });
};

const delay = 10000; // 2 minutes  
var intervalId = setInterval(fetch, delay);

//clearInterval(intervalId);
  
