var request  = require('request'),
    jsdom    = require('jsdom'),
    Scraper  = require('Scraper'),
    JSON     = require('JSON');

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
        var $ = window.jQuery;
    
        Scraper.processPage();
        // jQuery is now loaded on the jsdom window created from 'agent.body'
        // console.log($('table').html());
      });
  });
};

const delay = 20000; // 2 minutes  
var intervalId = setInterval(fetch, delay);

//clearInterval(intervalId);
  
