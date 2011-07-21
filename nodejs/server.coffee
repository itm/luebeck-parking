scrape      = require './scraper'
url         = require 'url'

# Behälter für Zwischenspeichern
jsonScraped = ""

console.log "Server gestartet..."

cacheJson = ->
  console.log "Scrape und cache Daten..."
  jsonScraped = scrape()

# Alle delay ms die Daten erneut von der KWL holen
delay = 3 * 60 * 1000 # 3 Minuten
intervalId = setInterval cacheJson, delay

#clearInterval intervalId

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
  
    console.log "Request beantwortet..."
  
).listen port, host

console.log "Server läuft auf http://#{host}:#{port}/"
