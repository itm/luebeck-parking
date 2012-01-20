request = require 'request'
jsdom = require 'jsdom'
async = require 'async'
util = require 'util'
geo = require './geo'

scrapeURL = 'http://kwlpls.adiwidjaja.com/index.php'
jqueryUrl = 'http://code.jquery.com/jquery.min.js'

processRow = ($, row, callback) ->
  #util.log "processRow"
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
    city = {name:"", geo:{}}
    city.name = currentCity
    city.geo = geo.cities[currentCity]

  item.city = currentCity
  if item.name is "" or not (item.kind == "PP" or item.kind == "PH")
    item = null
  #util.log "item=#{JSON.stringify(item)}"

  callback(item, city)

processPage = (window, returnResult) ->
  #util.log "processPage"
  result = {cities:[], parkings:[]}
  $ = window.$
  rows = $("table").children()

  async.forEach(rows,
    ((row, done) ->
      processRow($, row, (item, city) ->
          result.parkings.push(item) if item?
          result.cities.push(city) if city?
          done()
        )),
    ((err) ->
      returnResult err, result
      )
    )

exports.fetch = (callback) ->
  # Den Inhalt der KWL-Seite holen
  request { uri:scrapeURL }, (error, response, page) ->
    if error and response and response.statusCode isnt 200
      util.log 'Error when contacting #{scrapeURL}'
    else
      # Fake Browser Umgebung mit dem eben geholten Inhalt und jQuery
      jsdom.env page, [jqueryUrl], (err, window) ->
        throw err if err?
        processPage window, callback


