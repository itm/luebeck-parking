var scraper = 
{
  parkings    : "",
  scrapeDivId : "cc-m-externalsource-container-m8a3ae44c30fa9708",
  
  rows : new Array(),
  
  processPage: function() {
    //$('#log').html(page);
    
    var rows = this.$('table tbody').children();
    var num  = this.$(rows).size(); 
    
    rows.each(function(i, row) {
      if ( i>1 || i == num-1 ) { // cut off header and footer
        Scraper.processRow(row);
      }
    });
    
    console.log(JSON.stringify(this.rows));
  },
  
  processRow: function(row) {
    var elements = this.$(row).children('td');
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

};

exports.scraper = scraper;
