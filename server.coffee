request = require 'request'
jsdom   = require 'jsdom'
json2   = require './json2'

# Behaelter für gescrapte Daten als JSON kodiert
data = null

console.log 'Scraping-Server gestartet...'

# Daten-Historie anlegen
redis = require('redis')
db    = redis.createClient()
db.on 'error', (err) -> console.log 'Redis error: ' + err

scrape = ->
    request uri:'http://kwlpls.adiwidjaja.com/index.php', (error, response, body) ->
        console.log 'Fehler beim Kontaktieren der KWL Webseite!' if (error && response.statusCode != 200)
        
        jsdom.env
            html: body,
            scripts: [
                'http://code.jquery.com/jquery-1.6.1.min.js'
            ]
        , (err, window) ->
            $ = window.jQuery
            scrapeDivId = 'cc-m-externalsource-container-m8a3ae44c30fa9708'
            tableRows = new Array()

            processPage = ->
                rows = $('table').children()
                num  = $(rows).size()

                console.log 'Belegungsdaten für ' + num + ' Parkplätze gefunden.'

                # Zeilenweise verarbeiten
                rows.each( (i, row) ->
                    processRow(row) if (i > 1 || i == num - 1) # Header und Footer abschneiden
                )
                
                # Resultat zwischenspeichern zur Auslieferung
                data = json2.stringify(tableRows)
                
#                # Speichere Historie
#                tableRows.each( (i, r) ->
#                    id = db.incr 'parking'                 
#                    db.set 'parking:#{id}:date', new Date().getTime()
#                    db.set 'parking:#{id}:name', r.name if r.name
#                    db.set 'parking:#{id}:occupied', r.free if r.free

            processRow = (row) ->
                elements     = $(row).children('td')
                item         = new Object()
                item.name    = elements.eq(0).html()

                if elements.size() > 2
                    item.total     = elements.eq(1).html()
                    item.occupied  = elements.eq(2).html()
                    item.status    = 'open'
                else if elements.size() > 0
                    item.status = 'closed' # Voruebergehend geschlossen
                else
                    return # Dies ist kein Item (z.B. 'Travemuende' header)

                tableRows.push(item)

            # Seitenverarbeitung anstossen
            processPage()

# Intervall, das festlegt, wie haeufig die Daten angefordert werden
delay = 2 * 60 * 1000 # 2 minutes

# Die Funktion scrape() alle delay-Sekunden aufrufen
intervalId = setInterval(scrape, delay)

# Daten im JSON-Format ausliefern auf Port 8080
http = require('http')
host = '0.0.0.0'
port = 8080

http.createServer((req, response) ->
  response.writeHead(200, 'content-type': 'text/json')
  response.write(_scraped)
  response.end('\n')
).listen(port, host)

console.log('http://' + host + ':' + port)




