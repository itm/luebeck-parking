scrape      = require './scraper'
jsonScraped = ""

console.log "Server gestartet..."

cacheJson = ->
  console.log "Scrape und cache Daten..."
  jsonScraped = scrape()

# Alle delay ms die Daten erneut von der KWL holen
delay = 30000 
intervalId = setInterval cacheJson, delay

#clearInterval intervalId

cacheJson()

###
Server-Teil um das Json rauszugeben
###
http = require 'http'

http.createServer( (req, response) ->
  response.writeHead 200, {'content-type': 'text/json' }
  response.write     jsonScraped
  response.end       '\n'
).listen 1337, "127.0.0.1"

console.log 'Server läuft auf http://127.0.0.1:1337/'
