scrape      = require './scraper'
jsonScraped = ""

console.log "Server started..."

cacheJson = ->
  console.log "Scraping and Caching..."
  jsonScraped = scrape()

delay = 30000 
intervalId = setInterval cacheJson, delay

#clearInterval intervalId

cacheJson()

###
Server part for the data
###
http = require 'http'

http.createServer( (req, response) ->
  response.writeHead 200, {'content-type': 'text/json' }
  response.write     jsonScraped
  response.end       '\n'
).listen 1337, "127.0.0.1"

console.log 'Server running at http://127.0.0.1:1337/'
  

