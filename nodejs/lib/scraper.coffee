request = require 'request'
jsdom   = require 'jsdom'
util    = require 'util'
geo     = require './geo'
      
scrapeURL   = 'http://kwlpls.adiwidjaja.com/index.php'
jqueryUrl   = 'http://code.jquery.com/jquery-1.6.1.min.js'
scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708"

currentCity = ""

exports.fetch = (callback) ->
    # Den Inhalt der KWL Seite holen
    request { uri: scrapeURL }, (error, response, body) ->
        if error and response and response.statusCode isnt 200
            util.log 'Error when contacting #{scrapeURL}'

        # Fake Browser Umgebung mit dem eben geholten Inhalt und Jquery
        jsdom.env
            html: body,
            scripts: [jqueryUrl],
            (err, window) ->
                # Seite verarbeiten
                processPage(window, (result) ->
                    callback(err, result)
                )
  
processPage = (window, callback) ->
    # alte Daten löschen
    result           = new Object()
    result.cities    = new Array()
    result.parkings  = new Array()
    currentCity      = ""
  
    $    = window.jQuery
    rows = $('table').children()
    num  = $(rows).size()

    rows.each (i, row) ->
        if i > 1 and i isnt num - 1 # Kopf und Fußzeile abschneiden
            processRow($, row, (item, city) ->
                result.parkings.push(item) if item?
                result.cities.push(city) if city?
                callback(result) if i is num - 2 # Fertig
            )

processRow = ($, row, callback) ->
    elements  = $(row).children('td')
    item      = new Object()
    city      = new Object()
    nameStr   = elements?.eq(0).html()
    nameStr  ?= "" #falls es keine elements gibt
    item.kind = nameStr.substring 0, 2
    item.name = nameStr.substring 3
    item.geo  = geo.data[nameStr]
  
    if elements.size() > 2
        free   = elements?.eq(2).html()
        spaces = elements?.eq(1).html()
        item.free      = free
        item.spaces    = spaces
        item.status    = "open"
    else if elements.size() > 0
        # Vorrübergehend geschlossen
        item.status    = "closed"
    else
        # Orte (z.B. "Parkplätze Travemünde" Überschrift)
        header = $(row).children().first().html()
        currentCity = header.split(' ')[1]
        city.name = currentCity
        city.geo = geo.cities[currentCity]
        item.city = currentCity

    callback(item, city)



