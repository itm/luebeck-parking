request  = require('request')
jsdom    = require('jsdom')
JSON     = require('./custom_modules/json2')
geo      = require('./geo')
      
scrapeURL   = 'http://kwlpls.adiwidjaja.com/index.php'
jqueryUrl   = 'http://code.jquery.com/jquery-1.6.1.min.js'
scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708"

result = new Object()
result.cities = new Array()
result.parkings = new Array()

currentCity = ""

fetch = -> 
  # Den Inhalt der KWL Seite holen
  request { uri: scrapeURL }, (error, response, body) ->
    if error and response.statusCode isnt 200
      console.log 'Error when contacting #{scrapeURL}'
    # Fake Brwoser Umgebung mit dem eben geholten Inhalt und Jquery
    jsdom.env
      html: body,
      scripts: [jqueryUrl],
      (err, window) ->
        # Seite verarbeiten
        processPage(window)
        
  JSON.stringify(result)
  
processPage = (window) ->  
  # alte Daten löschen
  result           = new Object() 
  result.cities    = new Array() 
  result.parkings  = new Array()
  currentCity      = ""
  
  $    = window.jQuery
  rows = $('table').children()
  num  = $(rows).size()

  rows.each (i, row) ->
    if i>0 and i isnt num-1 # Kopf und Fußzeile abschneiden
      processRow($, row)

processRow = ($,row) ->
  elements  = $(row).children('td')
  item      = new Object()
  nameStr   = elements.eq(0).html()
  nameStr  ?= "" #falls es keine elements gibt
  item.kind = nameStr.substring 0,2
  item.name = nameStr.substring 3
  item.geo  = geo.data[nameStr]
  item.city = currentCity
  
  if elements.size() > 2
    item.free      = elements.eq(2).html()
    item.spaces    = elements.eq(1).html()
    item.status    = "open"
  else if elements.size() > 0
    # Vorrübergehend geschlossen
    item.status    = "closed"
  else
    # Orte (z.B. "Parkplätze Travemünde" Überschrift)
    header = $(row).children().first().html()
    currentCity = header.split(' ')[1]
    city = new Object()
    city.name = currentCity
    city.geo = geo.cities[currentCity]
    result.cities.push(city)
    return

  result.parkings.push(item)

module.exports = fetch
