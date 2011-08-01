redis   = require 'redis'
util    = require 'util'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
db = redis.createClient()
db.on 'error', 
    (err) -> 
        util.log err if err?

#
# Generiert einheitlich den Schlüssel-Präfix für einen DB-Eintrag.
#
parkingBaseName = (name) -> "parking:" + name if name?

#
# ABSPEICHERN DER HISTORIE
#
# Stammdaten sind Daten, die sich selten ändern wie z.B. die Anzahl
# der verfügbaren Stellplätze auf einem Parkplatz. Sie werden hier mit
# Redis als Keys gespeichert, die wie folgt aufgebaut sind: 
#
#    "parking:<Parkplatzname>:spaces"
#
# Als Redis-Befehl also:
#
#    SET "parking:Parkhaus Falkenstraße:spaces" 100
#
# um die Kapazität des Parkhauses Falkenstraße als 100 zu speichern. 
# Damit der Wert nicht immer wieder überschrieben werden muss, wird der 
# Befehl "SETNX" verwendet, der einen Key nur überschreibt, falls er noch nicht
# existiert. (Mehr Redis-Befehle gibt es hier: http://redis.io/commands)
#
#    SETNX "parking:Parkhaus Falkenstraße:spaces" 100
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
# Aufbau z.B: "parking:Parkhaus Falkenstraße:<ID>:free".
#
#    SET "parking:Parkhaus Falkenstraße:2:free" 50
#    SET "parking:Parkhaus Falkenstraße:2:timestamp" <aktueller Zeitstempel>
#
# Speichert die Anzahl freier Plätze 50 für das Parkhaus Falkenstraße zum
# aktuellen Zeitpunkt mit der ID 2.
#
# Alle Redis-Befehle sind als Callbacks verkettet um Nodes asnychronem
# Charakter Rechnung zu tragen. Zudem werden auf diese Weise keine weiteren
# Redis-Befehle ausgeführt, falls einer der vorhergehenden Befehle scheitert.
#
# Diese Methode benötigt ein Array mit den gelesenen Parkplatzdaten als Eingabe.
#
exports.storeHistory = (rows) ->
    if not rows? then return

    storeHistoryItem = (row) ->
        if not row? or not row.name? or not row.free? or not row.spaces? then return

        #
        # Stammdaten
        #
        if row.name.indexOf("<strong>") != -1 then return

        parkingId = parkingBaseName(row.name)

        # Speichere absolute Anzahl vorhandener Stellplätze für diesen Parkplatz
        db.setnx parkingId + ":spaces", row.spaces, (err) ->
            throw err if err?

            #
            # Bewegungsdaten
            #
            db.incr parkingId, (err, id) ->
                throw err if err?
                if not id? then return

                # Speichere Zeitstempel und zu diesem Zeitpunkt Anzahl freier Stellplätze für diesen Parkplatz
                db.mset parkingId + ":" + id + ":timestamp", new Date().getTime(), parkingId + ":" + id + ":free", row.free
                    
    storeHistoryItem(row) for row in rows

    util.log 'Daten historisiert (' + rows.length + ' Einträge)'

#
# Sucht einen Parkplatz-Eintrag zu dem gegebenen Namen und der gegebenen ID.
#
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

#
# Sucht alle Parkplatz-Einträge aus der Redis-DB zu dem gegebenen Namen.
#
exports.findAll = (name, callback) ->
    parkingSpaces = -1
    allParkings   = new Array()

    if not name? then callback(allParkings, parkingSpaces)

    spacesId  = parkingBaseName(name) + ":" + "spaces"
    parkingId = parkingBaseName(name)

    db.get spacesId, (err, spaces) ->
        throw err if err?
        parkingSpaces = spaces ? -1

        db.get parkingId,
            (err, dbId) ->
                throw err if err?

                if not dbId?
                    callback(allParkings, parkingSpaces)
                    return

                asyncResultCounter = dbId

                for parkingId in [1..dbId]
                    findParking(name, parkingId,
                        (parking) ->
                            allParkings.push(parking) if parking.free? and parking.timestamp?
                            asyncResultCounter--
                            callback(allParkings, parkingSpaces) if asyncResultCounter is 0
                    )

          