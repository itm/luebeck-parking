path = require 'path'
url = require 'url'
util = require 'util'
scraper = require path.join __dirname, 'lib', 'scraper'
history = require path.join __dirname, 'lib', 'history'

# Fehlerbehandlung für unerwartete Exceptions
process.on 'uncaughtException', (err) ->
  if err?
    util.trace err
    # Im Falle eines unerwarteten Fehlers => Server beenden
    process.exit(1)

process.on 'exit', () ->
  util.log 'Server wird beendet.'

#
# Behälter für Zwischenspeichern der ge-scrapten Daten im JSON-Format
#
_data = []

cacheJson = () ->
  util.log "Starte scraping..."
  scraper.fetch (err, result) ->
    throw err if err?
    _data = result
    util.log "Daten geholt (#{_data?.parkings?.length} Eintraege)"

handleHistory = () ->
  parkings = _data?.parkings
  if parkings?
    history.storeHistory parkings, () ->
      util.log "Daten historisiert (#{parkings?.length} Eintraege)"

# Alle delay ms die Daten erneut von der KWL holen
# 3 Minuten
scrapeDelay = 2 * 60 * 1000
scrapeIntervalId = setInterval cacheJson, scrapeDelay

# Alle historyDelay ms die Daten in die Historie speichern
# 30 Minuten
historyDelay = 30 * 60 * 1000
historyIntervalId = setInterval handleHistory, historyDelay

#
# Server-Teil um die JSON-Daten auszuliefern
#
express = require 'express'
host = '0.0.0.0'
port = 8080

app = express.createServer()

app.enable "jsonp callback"

app.configure () ->
  app.use(express.static(__dirname + '/public'))

app.get '/json/current', (req, res) ->
  console.time 'Ausgeliefert: /json/current'

  if _data?
    res.json(_data)
  else
    res.send('Derzeit keine Daten verf&uuml;gbar.', 404)

  console.timeEnd 'Ausgeliefert: /json/current'

  util.log "Request von #{req.header('host')} beantwortet."

#
# Rest-like Interface für historische Daten
#
app.get '/json/history/:name', (req, res) ->
  name = req.params?.name

  console.time 'Ausgeliefert: /json/history/' + name

  history.findTimelineByName name,(timeline, spaces) ->
    feedback = {"name":name, "spaces":spaces, "timeline":timeline}

    if timeline? and timeline?.length > 0
      # Status 200, alles OK
      res.json(feedback)
    else
      # Status 404 senden
      res.send('Derzeit keine Daten f&uuml;r Parkplatz "' + name + '" verf&uuml;gbar.', 404)

    console.timeEnd 'Ausgeliefert: /json/history/' + name

app.listen port, host

util.log "Server laeuft auf http://#{host}:#{port}/"
