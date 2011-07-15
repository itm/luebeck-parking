const scraper  = require('./scraper');

console.log("Server started...");

const delay = 30000; // 30 seconds 
var intervalId = setInterval(scraper, delay);

//clearInterval(intervalId);
  
