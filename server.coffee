_request = require 'request'
_jsdom   = require 'jsdom'
_json2   = require './json2'

console.log 'Scraping server started...'

fetch = () ->
    _request uri:'http://kwlpls.adiwidjaja.com/index.php', (error, response, body) ->
        console.log 'Fehler beim Kontaktieren der KWL Webseite!' if (error && response.statusCode != 200)

        _jsdom.env
            html: body,
            scripts: [
                'http://code.jquery.com/jquery-1.6.1.min.js'
            ]
        , (err, window) ->
            console.log body

            $ = window.jQuery
            scrapeDivId = 'cc-m-externalsource-container-m8a3ae44c30fa9708'
            tableRows = new Array()

            processPage = ->
                rows = $('table').children()
                num  = $(rows).size()

                console.log '#rows=' + num

                # Zeilenweise verarbeiten
                rows.each( (i, row) ->
                    processRow(row) if (i > 1 || i == num - 1) # Header und Footer abschneiden
                )

                console.log _json2.JSON.stringify(tableRows)

            processRow = (row) ->
                console.log 'processRow( ' + row + ' )'
                elements     = $(row).children('td')
                item         = new Object()
                item.name    = elements.eq(0).html()

                if elements.size() > 2
                    item.free     = elements.eq(1).html()
                    item.parkings = elements.eq(2).html()
                    item.status   = 'open'
                else if elements.size() > 0
                    item.status = 'closed' # Voruebergehend geschlossen
                else
                    return # Dies ist kein Item (z.B. 'Travemünde' header)

                tableRows.push(item)

            # Seitenverarbeitung anstossen
            processPage()

delay = 10000 # 10 secs

# Die Funktion fetch() alle delay-Sekunden aufrufen
intervalId = setInterval(fetch, delay)

