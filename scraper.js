const request  = require('request'),
      jsdom    = require('jsdom'),
      scraper  = require('./scraper'),
      JSON     = require('./json2');
      
const scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708";
const result = new Array();

var fetch = function() {    
    request({ uri:'http://kwlpls.adiwidjaja.com/index.php' }, function (error, response, body) {
      if (error && response.statusCode !== 200) {
        console.log('Error when contacting http://kwlpls.adiwidjaja.com/index.php')
      }
    
      jsdom.env({
        html: body,
        scripts: [
          'http://code.jquery.com/jquery-1.6.1.min.js'
        ]
      }, function (err, window) {
        processPage(window);
      });
  });
};

function processPage(window) {  
  var $ = window.jQuery;
  var rows = $('table').children();
  var num  = $(rows).size(); 
  
  rows.each(function(i, row) {
    if ( i>1 || i == num-1 ) { // cut off header and footer
      processRow($, row);
    }
  });

  console.log(JSON.stringify(result));
}

function processRow($,row) {
  var elements = $(row).children('td');
  var item     = new Object();
  item.name    = elements.eq(0).html();
  
  if ( elements.size() > 2 ) {
    item.free      = elements.eq(1).html();
    item.parkings  = elements.eq(2).html();
    item.status = "open";
  } else if (elements.size() > 0) {
    // temporarily closed
    item.status = "closed";
  } else {
    // this is no item (i.e. "Travemünde" header
    return;
  };

  result.push(item);
  //console.log(this.rows[this.rows.length-1]);
  
}

module.exports = fetch;
