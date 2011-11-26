request = require 'request'
jsdom = require 'jsdom'
util = require 'util'
geo = require './geo'

scrapeURL = 'http://kwlpls.adiwidjaja.com/index.php'
jqueryUrl = 'http://code.jquery.com/jquery.min.js'
scrapeDivId = "cc-m-externalsource-container-m8a3ae44c30fa9708"

exports.fetch = (callback) ->
  # Den Inhalt der KWL-Seite holen
  request { uri:scrapeURL }, (error, response, body) ->
    if error and response and response.statusCode isnt 200
      util.log 'Error when contacting #{scrapeURL}'

    # Fake Browser Umgebung mit dem eben geholten Inhalt und jQuery
    jsdom.env
        html:body,
        scripts:[jqueryUrl],
      (err, window) ->
        # Seite verarbeiten
        processPage(window, (result) ->
            #util.log JSON.stringify(result)
            callback(err, result)
          )

processPage = (window, callback) ->
  # Alte Daten loeschen
  result = {}
  result.cities = []
  result.parkings = []

  $ = window.$
  rows = $('table').children()
  num = $(rows).size()

  rows.each(i, row) ->
    if i > 0 and i isnt num - 1 # Kopf und Fusszeile abschneiden
      processRow($, row, (item, city) ->
          result.parkings.push(item) if item?
          result.cities.push(city) if city?
          item = null
          city = null
          callback(result) if i is num - 2 # Fertig
        )

processRow = ($, row, callback) ->
  elements = $(row).children('td')
  item = {}
  city = null
  nameStr = elements?.eq(0).html()
  nameStr ?= ""
  # Falls es keine elements gibt
  item.kind = nameStr.substring 0, 2
  item.name = nameStr.substring 3
  item.geo = geo.data[nameStr]

  if elements.size() > 2
    free = elements?.eq(2).html()
    spaces = elements?.eq(1).html()
    item.free = free
    item.spaces = spaces
    item.status = "open"
  else if elements.size() > 0
    # Vorruebergehend geschlossen
    item.status = "closed"
  else
    # Orte (z.B. "Parkplaetze Travemuende" Ueberschrift)
    header = $(row).children().first().html()
    currentCity = header.split(' ')[1]
    city = {}
    city.name = currentCity
    city.geo = geo.cities[currentCity]

  item.city = currentCity
  if item.name is "" or not item.name? then item = null

  # Aufraeumen
  elements = null
  $ = null

  callback(item, city)



