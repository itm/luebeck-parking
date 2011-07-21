request = require 'request'
jsdom   = require 'jsdom'
log     = require './log'

# Behaelter für gescrapte Daten als JSON kodiert
jsonData = null

# Rohdaten als Array
rawData  = new Array()

log.info 'Server gestartet...'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
redis = require('redis')
db    = redis.createClient()
db.on 'error', 
    (err) -> 
        log.error err
        process.exit(1)

scrape = ->
    request uri:'http://kwlpls.adiwidjaja.com/index.php', (error, response, body) ->
        if error and response.statusCode != 200
            log.info 'Fehler beim Kontaktieren der KWL-Webseite!'

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

                log.info 'Belegungsdaten für ' + num + ' Parkplätze gefunden.'

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
                    item.free      = elements.eq(2).html()
                    item.status    = 'open'
                else if elements.size() > 0
                    item.status = 'closed' # Voruebergehend geschlossen
                else
                    return # Dies ist kein Item (z.B. 'Travemuende' header)

                tableRows.push(item)

            # Seitenverarbeitung anstossen
            processPage()

#
# ABSPEICHERN DER HISTORIE
#
# Stammdaten sind Daten, die sich selten ändern wie z.B. die Anzahl
# der verfügbaren Stellplätze auf einem Parkplatz. Sie werden hier mit
# Redis als Keys gespeichert, die wie folgt aufgebaut sind: 
#
#    "parking:<Parkplatzname>:total"
#
# Als Redis-Befehl also:
#
#    SET "parking:Parkhaus Falkenstraße:total" 100
#
# um die Kapazität des Parkhauses Falkenstraße als 100 zu speichern. 
# Damit der Wert nicht immer wieder überschrieben werden muss, wird der 
# Befehl "SETNX" verwendet, der einen Key nur überschreibt, falls er noch nicht
# existiert. (Mehr Redis-Befehle gibt es hier: http://redis.io/commands)
#
#    SETNX "parking:Parkhaus Falkenstraße:total" 100
#
# Bewegungsdaten sind Daten, die sich ständig ändern, z.B. die Parkplatzbelegung
# und der Zeitpunkt zu dem eine bestimmte Belegung vorlag. Daher haben die
# Bewegungsdaten eine fortlaufende ID im Key unter dem sie gespeichert werden.
#
#    INCR "parking:Parkhaus Falkenstraße"
#
# Dieser Redis-Befehl ist eine atomare Operation und erhöht die ID für den Key
# des Parkhauses Falkenstraße um 1. So können wir dann neue Bewegungsdaten
# mit einer neuen ID im Key speichern.
#
# Aufbau z.B: "parking:Parkhaus Falkenstraße:<ID>:occupied".
#
#    SET "parking:Parkhaus Falkenstraße:2:occupied" 50
#    SET "parking:Parkhaus Falkenstraße:2:date"     <aktueller Zeitstempel>
#
# Speichert die Belegung 50 für das Parkhaus Falkenstraße zum aktuellen 
# Zeitpunkt mit der ID 2.
#
# Alle Redis-Befehle sind als Callbacks verkettet um Nodes asnychronem
# Charakter Rechnung zu tragen. Zudem werden auf diese Weise keine weiteren
# Redis-Befehle ausgeführt, falls einer der vorhergehenden Befehle scheitert.
#
storeHistory = ->
    storeHistoryItem = (row) ->
        if row.name and row.occupied and row.total
            # Stammdaten
            if row.name.indexOf("<strong>") != -1
                return
            parkingId = "parking:" + row.name
            db.setnx "#{parkingId}:total", row.total, (err) ->
                throw err if err               
                # Bewegungsdaten
                db.incr parkingId, (err, id) ->        
                    throw err if err      
                    db.set "#{parkingId}:#{id}:timestamp", new Date().getTime()
                    db.set "#{parkingId}:#{id}:free", row.free
                    
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
  response.write(jsonData)
  response.end('\n')
).listen(port, host)

log.info "http://#{host}:#{port}/"

