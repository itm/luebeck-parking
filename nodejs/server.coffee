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
delay = 3 * 60 * 1000 # 3 Minuten
intervalId = setInterval cacheJson, delay

# Alle historyDelay ms die Daten in die Historie speichern
historyDelay = 10 * 60 * 1000 # 10 Minuten
historyIntervalId = setInterval storeHistory, historyDelay

#clearInterval intervalId

# Initialer Aufruf zum Scrapen der Daten
cacheJson()

#
# Server-Teil um das Json rauszugeben
#
http = require 'http'
host = '0.0.0.0'
port = 8080

http.createServer( (req, response) ->
    response.writeHead 200, {'content-type': 'text/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers' : 'x-requested-with' }
    # Parameter extrahieren
    params = url.parse(req.url, true).query
    # Welche Methode der Json Antwort
    if params.callback?
        response.write "#{params.callback}(#{jsonScraped})"
    else if params.field?
        response.write "var #{params.field}= #{jsonScraped};"
    else
        response.write jsonScraped
    response.end       '\n'
  
    log.info "Request beantwortet..."
  
).listen port, host

log.info "Server läuft auf http://#{host}:#{port}/"
