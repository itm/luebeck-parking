var Scraper = 
{
  parkings    : "",
  //scrapeUrl   : "http://kwlpls.adiwidjaja.com/index.php",
  scrapeUrl   : "parkings.htm",
  scrapeDivId : "cc-m-externalsource-container-m8a3ae44c30fa9708",
  
  rows : new Array(),
  
  scrape : function() {
    $.ajax({ 
        url: this.scrapeUrl,
        type: "GET",
        dataType: "text",
        success: function(data) {
          Scraper.processPage(data);
        }
    });
  },

  processPage: function(page) {
    $('#log').html(page);
    
    var rows = $('table tbody').children();
    var num  = $(rows).size(); 
    
    rows.each(function(i, row) {
      if ( i>1 || i == num-1 ) { // cut off header and footer
        Scraper.processRow(row);
      }
    });
    
    console.log(JSON.stringify(this.rows));
  },
  
  processRow: function(row) {
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
  
    this.rows.push(item);
    //console.log(this.rows[this.rows.length-1]);
    
  }

}
