scrape      = require './scraper'

# Behälter für Zwischenspeichern
jsonScraped = ""

console.log "Server gestartet..."

cacheJson = ->
  console.log "Scrape und cache Daten..."
  jsonScraped = scrape()

# Alle delay ms die Daten erneut von der KWL holen
delay = 5 * 60 * 1000
intervalId = setInterval cacheJson, delay

#clearInterval intervalId

cacheJson()

###
Server-Teil um das Json rauszugeben
###
http = require 'http'
host = '0.0.0.0'
port = 8080

http.createServer( (req, response) ->
  response.writeHead 200, {'content-type': 'text/json' }
  response.write     jsonScraped
  response.end       '\n'
).listen port, host

console.log "Server läuft auf http://#{host}:#{port}/"
