scraper = require './lib/scraper'
history = require './lib/history'
url     = require 'url'
util    = require 'util'

# Fehlerbehandlung für unerwartete Exceptions
process.on('uncaughtException', (err) ->
    if err?
        util.trace err
        # Im Falle eines unerwarteten Fehlers => Server beenden
        process.exit(1)
)
process.on('exit', () ->
    util.log 'Server wird beendet.'
)

#
# Behälter für Zwischenspeichern der ge-scrapten Daten im JSON-Format
#
data = []

cacheJson = () ->
    scraper.fetch(
        (err, result) ->
            util.log err if err?
            data = result ? []
            util.log 'Daten geholt (' + data?.parkings?.length + ' Eintraege)'
    )
  
handleHistory = () ->
    parkings = data?.parkings
    if parkings?
        history.storeHistory(parkings,
            () ->
                util.log 'Daten historisiert (' + parkings.length + ' Eintraege)'
        )

# Alle delay ms die Daten erneut von der KWL holen
scrapeDelay      = 2 * 60 * 1000 # 2 Minuten
scrapeIntervalId = setInterval cacheJson, scrapeDelay

# Alle historyDelay ms die Daten in die Historie speichern
historyDelay      = 30 * 60 * 1000 # 30 Minuten
historyIntervalId = setInterval handleHistory, historyDelay

#
# Server-Teil um die JSON-Daten auszuliefern
#
express = require 'express'
host    = '0.0.0.0'
port    = 8080

app = express.createServer()

app.configure(
    () ->
        app.use(express.static(__dirname + '/public'))
        app.use(express.errorHandler(dumpExceptions: true, showStack: true ))
)

# Durch '/data' o.Ä. ersetzen?
app.get('/json/current',  (req, res) ->
    console.time 'Ausgeliefert: /json/current'

    res.writeHead 200, {
        'content-type': 'text/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers' : 'x-requested-with'
    }

    # Parameter extrahieren
    params = url.parse(req.url, true).query
    # Welche Methode der Json Antwort
    if params.callback?
        res.write "#{params.callback}(#{JSON.stringify(data)})"
    else if params.field?
        res.write "var #{params.field}= #{JSON.stringify(data)};"
    else
        res.write JSON.stringify(data)
    res.end '\n'

    console.timeEnd 'Ausgeliefert: /json/current'

    util.log "Request von #{req.header('host')} beantwortet."  
)

#
# Rest-like Interface für historische Daten
#
app.get('/json/history/:name', (req, res) ->
    name     = req.params?.name

    console.time 'Ausgeliefert: /json/history/' + name

    history.findTimelineByName(name, (timeline, spaces) ->
        obj           = {}
        obj.name      = name ? 'no data'
        obj.spaces    = spaces ? -1
        obj.timeline  = timeline ? []
        json          = JSON.stringify(obj)

        if not timeline? or timeline?.length < 1
            res.send('Derzeit keine Daten f&uuml;r Parkplatz "' + name + '" verf&uuml;gbar.', 404) # Status 404 senden
        else
            res.send(json) # Status 200, alles OK

        console.timeEnd 'Ausgeliefert: /json/history/' + name
    )
)                        

app.listen port, host

util.log "Server laeuft auf http://#{host}:#{port}/"
