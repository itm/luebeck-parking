request  = require('request')
jsdom    = require('jsdom')
scraper  = require('./scraper')
JSON     = require('./json2')
      
scrapeURL   = 'http://kwlpls.adiwidjaja.com/index.php'
scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708"
result      = new Array()

fetch = -> 
  request({ uri: scrapeURL }, (error, response, body) ->
    if error and response.statusCode isnt 200
      console.log 'Error when contacting #{scrapeURL}'
  
    jsdom.env({
      html: body
      scripts: ['http://code.jquery.com/jquery-1.6.1.min.js']
    }, (err, window) ->
      processPage(window)
    )
  )
  
  #console.log(JSON.stringify(result));
  JSON.stringify(result)

processPage = (window) ->  
  $ = window.jQuery
  rows = $('table').children()
  num  = $(rows).size()
  
  rows.each (i, row) ->
    if i>1 or i is num-1 # cut off header and footer
      processRow($, row)

processRow = ($,row) ->
  elements  = $(row).children('td')
  item      = new Object()
  item.name = elements.eq(0).html()
  
  if elements.size() > 2
    item.free      = elements.eq(1).html()
    item.parkings  = elements.eq(2).html()
    item.status = "openn"
  else if elements.size() > 0
    # temporarily closed
    item.status = "closed"
  else
    # this is no item (i.e. "Travemünde" header)
    return

  result.push(item)

module.exports = fetch
