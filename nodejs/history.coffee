redis = require 'redis'
log   = require './custom_modules/logger'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
db = redis.createClient()
db.on 'error', 
    (err) -> 
        log.error err
        process.exit(1)

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
# Diese Methode benötigt ein Array mit den gelesenen Parkplatzdaten als Eingabe.
#
storeHistory = (rows) ->
    log.info 'Speichere Historie.'
    storeHistoryItem = (row) ->
        if row.name and row.free and row.spaces
            # Stammdaten
            if row.name.indexOf("<strong>") != -1
                return
            parkingId = "parking:" + row.name
            db.setnx "#{parkingId}:spaces", row.spaces, (err) ->
                throw err if err               
                # Bewegungsdaten
                db.incr parkingId, (err, id) ->        
                    throw err if err      
                    db.set "#{parkingId}:#{id}:timestamp", new Date().getTime()
                    db.set "#{parkingId}:#{id}:free", row.free
                    
    storeHistoryItem(row) for row in rows

# Exportiere die Funktion zum Speichern der Historie    
module.exports = storeHistory      
          