redis = require 'redis'
util = require 'util'
async = require 'async'

# Initialisiere Datenbankverbindung um Daten-Historie anzulegen
db = redis.createClient()
db.on 'error', (err) ->
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
    now = new Date()
    timestamp = now.getTime()
  storeHistoryItem(row, timestamp) for row in rows

  callback()

storeHistoryItem = (row, timestamp) ->
  #
  # 1) Stammdaten
  #
  if row? and row.name? and row.spaces?
    parkingName = parkingBaseName(row.name)
    # Speichere Parkplatz in Menge von Parkplaetzen falls noch nicht vorhanden
    db.sadd parkingSet, parkingName, (err) ->
      throw err if err?
      # Speichere Stammdaten (verfuegbare Parkplaetze und Stadt)
      util.log "HMSET #{parkingName} name: '#{row.name} spaces: #{row.spaces}"
      db.hmset parkingName, "name", row.name, "spaces", row.spaces, (err) ->
        throw err if err?
  else
    util.log "Unsufficient data for historization: #{JSON.stringify(row)}"

  #
  # 2) Bewegungsdaten
  #
  if row? and row.status? and row.status == 'closed'
    util.log(row.name + ' currently closed.')

  if row? and row.name? and row.free? and timestamp?
    util.log "HSET #{parkingName} timeline #{timelineBaseName(row.name)}"
    db.hset parkingName, "timeline", timelineBaseName(row.name)
    # Lege Liste mit Belegungen fuer aktuellen Parkplatz an
    timelineName = timelineBaseName(row.name) + ':' + timestamp
    util.log "LPUSH #{timelineBaseName(row.name)} #{timelineName}"
    db.lpush timelineBaseName(row.name), timelineName, (err) ->
      throw err if err?
      # Speichere Bewegungsdaten (Zeitstempel, Anzahl freier Parkplaetze)
      util.log "HMSET #{timelineName} timestamp: #{timestamp} free: #{row.free}"
      db.hmset timelineName, "timestamp", timestamp, "free", row.free, (err) ->
        throw err if err?
  else
    util.log "Could not store timeline for: #{JSON.stringify(row)}"

#
# Sucht die Timeline zu dem gegebenen Parkplatznamen. Es werden die Werte der letzten zwei Wochen zurueckgegeben.
#
exports.findTimelineByName = (name, returnResult) ->
  result = []
  util.log "HGETALL #{parkingBaseName(name)}"
  db.hgetall parkingBaseName(name), (err, parking) ->
    throw err if err?
    if parking? and parking.timeline? and parking.spaces?
      twoWeeks = 672
      # 24 * 2 * 14, Werte von zwei Wochen bei einem Speicherintervall von 30 Minuten
      util.log "LRANGE #{parking.timeline} #{twoWeeks * -1} -1"
      db.lrange parking.timeline, (twoWeeks * -1), -1, (err, entries) ->
        throw err if err?
        async.forEach(entries,
          ((key, done) ->
            util.log "HGETALL #{key}"
            db.hgetall(key, (err, value) ->
                throw err if err?
                result.push(value)
                done()
              )
            ),
          ((err) ->
            throw err if err?
            returnResult result, parking.spaces
            )
          )
    else
      # parking konnte nicht gefunden werden
      returnResult [], 0



          