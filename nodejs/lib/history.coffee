redis   = require 'redis'
util    = require 'util'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
db = redis.createClient()
db.on 'error', 
    (err) -> 
        util.log err if err?

#
# Alle Sonderzeichen werden aus dem Namen entfernt.
#
filterName = (name) ->
    name.replace(/[^a-zA-Z0-9 ]/g, "").replace(" ", "_") if name?

#
# Erzeugt einen als Schlüssel verwendbaren Namen aus einem Parkplatznamen
#
parkingBaseName = (name) ->
    "parking:" + filterName(name)

#
# Erzeugt einen als Schlüssel verwendbaren Namen aus einem Parkplatznamen
#
timelineBaseName = (name) ->
    "timeline:" + filterName(name)

#
# Name der Menge von Parkplätzen
#
parkingSet = "parkings"

#
# ABSPEICHERN DER HISTORIE
#
# Stammdaten sind Daten, die sich selten ändern wie z.B. die Anzahl
# der verfügbaren Stellplätze auf einem Parkplatz.
#
# Als Bewegungsdaten werden die anfallenden Parkplatzbelegungen bezeichnet,
# die sich häufig über die Zeit ändern.
#
# Alle Redis-Befehle sind als Callbacks verkettet um Nodes asnychronem
# Charakter Rechnung zu tragen. Zudem werden auf diese Weise keine weiteren
# Redis-Befehle ausgeführt, falls einer der vorhergehenden Befehle scheitert.
#
# Diese Methode benötigt ein Array mit den gelesenen Parkplatzdaten als Eingabe.
#
exports.storeHistory = (rows, callback) ->
    if rows?
        now       = new Date()
        timestamp = now.getTime()
        storeHistoryItem(row, timestamp) for row in rows

    callback()

storeHistoryItem = (row, timestamp) ->
    #
    # Stammdaten
    #
    if row? and row.name? and row.spaces? #and row.city?
        parkingName = parkingBaseName(row.name)
        # Speichere Parkplatz in Menge von Parkplätzen falls noch nicht vorhanden
        db.sismember parkingSet, parkingName, (err, isMember) ->
            throw err if err?
            if isMember is 0
                db.sadd parkingSet, parkingName, (err) ->
                    throw err if err?

        # Speichere Stammdaten (verfügbare Parkplätze und Stadt)
        util.log('HMSET ' + parkingName + ' name: ' + row.name + ', spaces: ' + row.spaces )#+ ', city: ' + row.city)
        db.hmset parkingName, "name", row.name, "spaces", row.spaces, (err) ->#, "city", row.city, (err) ->
            throw err if err?

    else
      util.log 'Unsufficient data for historization! ' + JSON.stringify(row)

    #
    # Bewegungsdaten
    #
    if row? and row.name? and row.free? and row.status? and timestamp?
        util.log('HSET timeline ' + timelineBaseName(row.name))
        db.hset parkingName, "timeline", timelineBaseName(row.name)
        # Lege Liste mit Belegungen an für aktuellen Parkplatz
        timelineName = timelineBaseName(row.name) + ':' + timestamp
        db.lpush timelineBaseName(row.name), timelineName, (err) ->
            throw err if err?
            # Speichere Bewegungsdaten (Zeitstempel, Anzahl freier Parkplätze)
            util.log('HMSET timestamp: ' + timstamp + ', free: ' + row.free, ', status: ' + row.status)
            db.hmset timelineName, "timestamp", timestamp, "free", row.free, "status", row.status, (err) ->
                throw err if err?

#
# Sucht die Timeline zu dem gegebenen Parkplatznamen. Es werden die Werte der letzten zwei Wochen zurückgegeben.
#
exports.findTimelineByName = (name, callback) ->
    theTimeline = []
    util.log('HGETALL ' + parkingBaseName(name))
    db.hgetall parkingBaseName(name), (err, parking) ->
        throw err if err?
        if parking? and parking.timeline? and parking.spaces?
            twoWeeks = 672 # 24 * 2 * 14, Werte von zwei Wochen bei einem Speicherintervall von 30 Minuten
            db.lrange parking.timeline, (twoWeeks * -1), -1, (err, entries) ->
                throw err if err?
                asyncCounter = entries.length
                for key in entries
                    db.hgetall key, (err, result) ->
                        throw err if err?
                        theTimeline.push(result)
                        asyncCounter--
                        if asyncCounter is 0 then callback(theTimeline, parking.spaces)
        else
            callback([], 0)


          