new Ext.Application({
    launch: function() {
    
        var jsonServer = 'http://192.168.2.32:8080';

        var lübeck = new google.maps.LatLng(53.867814, 10.687208); // default
        var infoWindow = new google.maps.InfoWindow({maxWidth: 350}); // 350 is a hack to get autosizing working
        var map = new Ext.Map({
            title: 'Map',
            getLocation: true,
            mapOptions: {
                center: lübeck,
                zoom: 13
            }
        });
        
        // --- Home Bildschirm ---
                      
        var infoHandler = function() {
            if (!this.popup) {
                this.popup = new Ext.Panel({
                    floating: true,
                    modal: true,
                    centered: true,
                    width: 300,
                    height: 200,
                    styleHtmlContent: true,
                    scroll: 'vertical',
                    html: '<p>Entwickelt im Rahmen des Projekts SmartLübeck.<br/>Verwendet das Parkleitsystem der KWL.</p>',
                    dockedItems: [{
                        dock: 'top',
                        xtype: 'toolbar',
                        title: 'Info'
                    }]
                });
            }
            this.popup.show('pop');
        };
        
        var pnlHome = new Ext.Panel({
            dockedItems : [{xtype: 'toolbar', dock : 'top', title: 'SmartLübeck Parking'}],
            layout: {
                type: 'vbox',
                pack: 'center'
            },
            defaults: {
                xtype:  'button',
                width:  300,
                style:  'margin: 0.5em;'
            },
            items:  [
                { 
                    text: 'Karte',
                    handler: function() {
                        main.setActiveItem(1);
                        loadData();
                    }      
                },
                { 
                    text: 'Liste',
                    handler: function() {
                        main.setActiveItem(2);
                        store.load();
                    }      
                },
                {
                    text: 'Info',
                    handler: infoHandler
                }
            ],
        });
        
        // --- Kartenansicht ---

        var btnHome = {
            ui: 'back',
            text: 'Zurück',
            handler: function() {
                main.setActiveItem(0);
            }
        };
        
        var bar = new Ext.Toolbar({
            dock        : 'top',
            items       : [btnHome]
        });
               
        var pnlMap = new Ext.Panel({
            dockedItems: [bar],
            items      : [map]
        });
        
        // --- Model, Store und Liste ---
        
        Ext.regModel('Parking', {
          fields: ['kind', 'name', 'status', 'free', 'spaces']
        });
        
        var store = new Ext.data.JsonStore({
          model : 'Parking',
          //autoLoad: true,
          sorters: 'name',
          proxy: {
            type: 'scripttag',
            url : jsonServer,
            reader: {
                type: 'json',
                root: 'parkings'
            },
            callbackParam: 'callback'
          }
        });
        
        var tpl = new Ext.XTemplate(
            '<div>{kind} <b>{name}</b></div><div>{[this.getInfo(values)]}</div>',
            {
                compiled: true,
                getInfo: function(value){
                    if ( value.status == "closed") {
                      return "geschlossen";
                    } else {
                      return value.free + " von " + value.spaces + " frei."
                             + "<div class=\"free\"><div class=\"occupied\" style=\"width: "
                             + getOccupation(value)
                             + "%;\"></div></div>";
                    }
                },
            }
        );
        
        var list = new Ext.List({
          fullscreen: true,
          itemTpl : tpl,
          grouped : false,
          indexBar: false,
          store: store
        });
        
        var pnlList = new Ext.Panel( {
          items       : [list],
          dockedItems : [{xtype: 'toolbar', dock: 'top', items: [btnHome]}]
        });
        
        // --- Haupt Panel ---
        
        var main = new Ext.Panel({
            fullscreen: true,
            layout:     'card',
            items:      [pnlHome, pnlMap, pnlList],
            cardSwitchAnimation: 'slide'
        });
        main.setActiveItem(0);

        var tabButtonHandler = function(button, event) {
            Ext.each(theData.cities, function(city) {
                if (city.name == button.id) {
                    map.map.panTo(new google.maps.LatLng(city.geo.lat, city.geo.lng));
                    return false;
                }
            });
        };
        
        // for debugging while there's no api
        var getOccupation = function(parking) {
            return Math.floor(100 * (parking.free / parking.spaces));
        };

        var createParkingInfoWindow = function(parking) {
            var occupation = getOccupation(parking);
            var info;
            if (parking.status == "open") {
              info =  "<b>Auslastung</b> "
                      + "<br/>"
                      + parking.free + " / " + parking.spaces
                      + "<br/>"
                      + "<div class=\"free\"><div class=\"occupied\" style=\"width: "
                      + occupation
                      + "%;\"></div></div>";
            } else {
              info = "vorrübergehend geschlossen";
            }
            
            return "<div class=\"parkingInfoWindow\">"
                    + "<b>" + parking.name + "</b> (" + parking.kind + ")</b>"
                    + "<br/>"
                    + info
                    + "</div>"
        };   

        var loadData = function() {
            bar.removeAll();
            bar.add(btnHome);
            // Add points to the map
            Ext.each( theData.cities, function(city) {
                bar.add({
                    text: city.name,
                    id  : city.name,
                    handler: tabButtonHandler
                });
            });
            bar.doLayout();
            //console.log(city);
            Ext.each( theData.parkings, function(parking) {
                if (typeof parking.geo !== 'undefined') { 
                  var position = new google.maps.LatLng(parking.geo.lat, parking.geo.lng);
                  addMarker(parking, position, infoWindow);
                }
            });
            city = null;  
        };

        // These are all Google Maps APIs
        var addMarker = function(parking, position, infowindow) {
            var image;
            switch (parking.kind) {
                case "PP":
                    image = "images/parking.png"
                    break;
                case "PH":
                    image = "images/parking.png"
                    break;
            };
            
            var marker = new google.maps.Marker({
                map: map.map,
                position: position,
                icon: image
            });
            marker.title = parking.name;

            // Sencha Touch has problems with the maps handlers...
            // click wont work on mobile devices
            // see http://www.sencha.com/forum/showthread.php?117876-OPEN-642-map-on-1.0.1-not-responding-to-click-events-on-iPhone-Android/
            var evListener = function() {
                infowindow.setContent(createParkingInfoWindow(parking));
                infoWindow.open(map.map, marker);
            };
            google.maps.event.addListener(marker, 'mousedown', evListener);
            google.maps.event.addListener(marker, 'click', evListener);
        };
    }
});

