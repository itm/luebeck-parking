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
delay      = 3 * 60 * 1000 # 3 Minuten
intervalId = setInterval cacheJson, delay

# Alle historyDelay ms die Daten in die Historie speichern
historyDelay      = 30 * 60 * 1000 # 30 Minuten
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

# Durch '/data' o.Ä. ersetzen?
app.get('/json/current',  (req, res) ->
    res.writeHead 200, {
        'content-type': 'text/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers' : 'x-requested-with'
    }

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

parkingBaseName = (name) -> "parking:" + name

findParking = (name, id, callback) -> 
    parking     = new Object()    
    freeId      = parkingBaseName(name) + ":" + id + ":free"
    timestampId = parkingBaseName(name) + ":" + id + ":timestamp"
    
    db.get freeId, (err, free) ->        
        throw err if err?         
        parking.free = free ? -1
    
        db.get timestampId, (err, timestamp) ->
            throw err if err
            parking.timestamp = timestamp ? -1 
            callback(parking)
        
findAll = (name, callback) ->
    allParkings = new Array()

    if not name? then callback(allParkings)

    parkingId   = parkingBaseName(name)
    
    db.get parkingId, 
        (err, dbId) ->
            throw err if err?
            
            if not dbId? 
                callback(allParkings)
                return
                
            asyncResultCounter = dbId
            
            for parkingId in [1..dbId]
                findParking(name, parkingId,  
                    (parking) -> 
                        allParkings.push(parking) if parking.free? and parking.timestamp?
                        asyncResultCounter--                                                                                       
                        callback(allParkings) if asyncResultCounter is 0
                )                    
                

app.get('/json/history/:name', (req, res) ->
    name     = req.params?.name
    scraped  = JSON.parse(jsonScraped)
    parkings = scraped?.parkings

    findAll(name,
        (result) ->
            obj           = new Object()
            obj.name      = name ? 'no data'
            obj.occupancy = result ? []            
            json          = JSON.stringify(obj)

#            log.info (json)
                               
            if not result? or result?.length < 1
                res.send('Derzeit keine Daten f&uuml;r Parkplatz "' + name + '" verf&uuml;gbar.')
            else            
                res.send(json)
    )
)                        

app.listen port, host

log.info "Server läuft auf http://#{host}:#{port}/"
