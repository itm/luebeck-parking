scrape      = require './scraper'
history     = require './history'
JSON        = require './custom_modules/json2'
log         = require './custom_modules/logger'
url         = require 'url'

# Behälter für Zwischenspeichern
jsonScraped = ""

log.info "Server gestartet..."

cacheJson = ->
  log.info "Scrape und cache Daten..."
  jsonScraped = scrape() 
  
storeHistory = ->
    scraped  = JSON.parse(jsonScraped)
    parkings = scraped.parkings if scraped
    history(parkings) if parkings        

# Alle delay ms die Daten erneut von der KWL holen
delay      = 1 * 60 * 1000 # 3 Minuten
intervalId = setInterval cacheJson, delay

# Alle historyDelay ms die Daten in die Historie speichern
historyDelay      = 1 * 60 * 1000 # 10 Minuten
historyIntervalId = setInterval storeHistory, historyDelay

#clearInterval intervalId

# Initialer Aufruf zum Scrapen der Daten
cacheJson()

#
# Server-Teil um das Json rauszugeben
#
express = require 'express'
host    = '0.0.0.0'
port    = 8080

app = express.createServer()

app.configure () ->
    app.use(express.static(__dirname + '/public'))
    app.use(express.errorHandler(dumpExceptions: true, showStack: true ))

app.get('/current',  (req, res) ->
    res.writeHead 200, {'content-type': 'text/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers' : 'x-requested-with' }
    # Parameter extrahieren
    params = url.parse(req.url, true).query
    # Welche Methode der Json Antwort
    if params.callback?
        res.write "#{params.callback}(#{jsonScraped})"
    else if params.field?
        res.write "var #{params.field}= #{jsonScraped};"
    else
        res.write jsonScraped
    res.end '\n'
  
    log.info "Request von #{req.header('host')} beantwortet."  
)

#
# Rest-like Interface für historische Daten
#
redis = require 'redis'
db = redis.createClient()
db.on 'error', 
    (err) -> 
        log.error err

getParkingStatus = (p, id, fn) -> 
    _result = new Object()
    if not p.name 
        return
    tempId = "parking:" + p.name + ":" + id + ":free" 
    db.get tempId, (err, free) ->        
        throw err if err         
        _result.name = p.name
        _result.free = if free then free else -1
        fn(_result) 
        
getAll = (res, id, parkings, fn) ->
    _result = new Array()
    for p in parkings
        getParkingStatus(p, id, 
            (x) -> 
                log.info JSON.stringify(x)
                _result.push(x)               
                fn(_result) if _result.length == parkings.length # Wir sind hier fertig
        )                    

app.get('/history/:id', (req, res) ->
    id       = req.params.id
    scraped  = JSON.parse(jsonScraped)
    parkings = scraped.parkings if scraped    

    getAll(res, id, parkings, 
        (result) ->                                  
            if result.length < 1
                res.send('Derzeit keine Daten f&uuml;r ID "' + id + '" verf&uuml;gbar.')
            else            
                res.send(JSON.stringify(result))
    )
)                        

app.listen port, host

log.info "Server läuft auf http://#{host}:#{port}/"
