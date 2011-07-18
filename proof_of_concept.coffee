request = require 'request'
jsdom   = require 'jsdom'

# Behaelter für gescrapte Daten als JSON kodiert
jsonData = null

# Rohdaten als Array
rawData  = new Array()

console.log 'Server gestartet...'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
redis = require('redis')
db    = redis.createClient()
db.on 'error', 
    (err) -> 
        console.log err
        process.exit(1)

scrape = ->
    request uri:'http://kwlpls.adiwidjaja.com/index.php', (error, response, body) ->
        if error and response.statusCode != 200
            console.log 'Fehler beim Kontaktieren der KWL-Webseite!' 

        jsdom.env
            html: body,
            scripts: [
                'http://code.jquery.com/jquery-1.6.1.min.js'
            ]
        ,(err, window) ->
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
                rawData  = tableRows
                jsonData = JSON.stringify(tableRows)

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
            
storeHistory = ->
    storeHistoryItem = (row) ->
        if row.name and row.occupied and row.total
            # Stammdaten
            parkingId = "parking:" + row.name
            db.setnx parkingId + ':total', row.total, (err) ->                
                # Bewegungsdaten
                db.incr parkingId, (err, id) ->              
                    db.set parkingId + ':' + id + ':date', new Date().getTime()
                    db.set parkingId + ':' + id + ':occupied', row.occupied 
                    
    storeHistoryItem(row) for row in rawData                                               

# Intervall, das festlegt, wie haeufig die Daten angefordert werden
scrapeDelay = 2 * 60 * 1000 # 2 Minuten

# Die Funktion scrape() scrapeDelay-oft aufrufen
scrapeIntervalId = setInterval(scrape, scrapeDelay)

# Intervall, das festlegt, wie haeufig die Daten historisiert werden
historyDelay = 15 * 60 * 1000 # 15 Minuten

# Die Funktion storeHistory() historyDelay-oft aufrufen
historyIntervalId = setInterval(storeHistory, historyDelay)

# Daten im JSON-Format ausliefern auf Port 8080
http = require('http')
host = '0.0.0.0'
port = 8080

http.createServer( (req, response) ->
  response.writeHead(200, 'content-type': 'text/json')
  response.write(data)
  response.end('\n')
).listen(port, host)

console.log('http://' + host + ':' + port)
