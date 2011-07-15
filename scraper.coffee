request  = require('request')
jsdom    = require('jsdom')
JSON     = require('./json2')
geo      = require('./geo')
      
scrapeURL   = 'http://kwlpls.adiwidjaja.com/index.php'
jqueryUrl   = 'http://code.jquery.com/jquery-1.6.1.min.js'
scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708"
result      = new Array()

fetch = -> 
  request { uri: scrapeURL }, (error, response, body) ->
    if error and response.statusCode isnt 200
      console.log 'Error when contacting #{scrapeURL}'
  
    jsdom.env
      html: body,
      scripts: [jqueryUrl],
      (err, window) ->
        processPage(window)
  
  #console.log(JSON.stringify(result));
  JSON.stringify(result)

processPage = (window) ->  
  $    = window.jQuery
  rows = $('table').children()
  num  = $(rows).size()
  
  rows.each (i, row) ->
    if i>1 or i is num-1 # Kopf und Fußzeile abschneiden
      processRow($, row)

processRow = ($,row) ->
  elements  = $(row).children('td')
  item      = new Object()
  nameStr   = elements.eq(0).html()
  item.kind = nameStr.substring 0,2
  item.name = nameStr.substring 3
  item.geo  = geo.cities[nameStr]
  
  if elements.size() > 2
    item.free      = elements.eq(1).html()
    item.parkings  = elements.eq(2).html()
    item.status    = "open"
  else if elements.size() > 0
    # Vorrübergehend geschlossen
    item.status    = "closed"
  else
    # Keine Parkmöglichkeit (z.B. "Travemünde" Überschrift)
    return

  result.push(item)

module.exports = fetch
