const scrape  = require('./scraper');
var jsonScraped = "";

console.log("Server started...");

var cacheJson = function() {
  console.log("Scraping and Caching...");
  jsonScraped = scrape();
}

const delay = 30000; // 30 seconds 
var intervalId = setInterval(cacheJson, delay);

//clearInterval(intervalId);


var http = require('http');

http.createServer(function (req, response) {
  response.writeHead(200, {'content-type': 'text/json' });
  response.write( jsonScraped );
  response.end('\n');
}).listen(1337, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1337/');
  

