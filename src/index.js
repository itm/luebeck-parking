// jep @ Sencha Touch forums
Ext.namespace("Ext.jep");


Ext.jep.List = Ext.extend(Ext.List, {
    // Use displayIndexToRecordIndex in the list's itemTap handlers to convert between
    // the index in the handler (the display index) and the record index in the store.
    // this isn't always the same when you have a custom grouping function that causes
    // the store's to not sort identically to the display order (see bug report)
    displayIndexToRecordIndex: function (targetIndex) {
        if (this.grouped) {
            var groups = this.getStore().getGroups();

            for (var g = 0; g < groups.length; g++) {
                var group = groups[g].children;

                if (targetIndex < group.length)
                    return this.getStore().indexOf(group[targetIndex]);

                targetIndex -= group.length;
            }
        }
        else
            return targetIndex;
    },

    // Use this to convert the store's record index to the display index
    // for using the list's nodes directly via list.all.elements[i] or
    // in calls to list.getNode.
    recordIndexToDisplayIndex: function (targetIndex) {
        if (this.grouped) {
            var rec = this.getStore().getAt(targetIndex);

            var groups = this.getStore().getGroups();
            var currentIndex = 0;

            for (var g = 0; g < groups.length; g++) {
                var group = groups[g].children;

                for (var i = 0; i < group.length; i++)
                    if (group[i] == rec)
                        return currentIndex;
                    else
                        currentIndex++;
            }
        }
        else
            return targetIndex;
    },

    // Fixes getNode so that if you pass it a store record, it will return the
    // proper node even when the grouping/sorting situations described above happen.
    getNode: function (nodeInfo) {
        if (Ext.isString(nodeInfo)) {
            return document.getElementById(nodeInfo);
        } else if (Ext.isNumber(nodeInfo)) {
            return this.all.elements[nodeInfo];
        } else if (nodeInfo instanceof Ext.data.Model) {
            var idx = this.recordIndexToDisplayIndex(this.store.indexOf(nodeInfo));
            return this.all.elements[idx];
        }
        return nodeInfo;
    },

    // Fixes getRecord so that it gets the proper store record even when the
    // grouping/sorting situations described above happen.
    getRecord: function(node) {
        return this.store.getAt(this.displayIndexToRecordIndex(node.viewIndex));
    },

    // Fix for groupTpl not being able to accept an XTemplate
    initComponent : function() {
        Ext.jep.List.superclass.initComponent.apply(this);

        if (this.grouped && this.groupTpl && this.groupTpl.html) {
            this.tpl = new Ext.XTemplate(this.groupTpl.html, this.groupTpl.initialConfig);
        }
    },

    // Allows for dynamically switching between grouped/non-grouped
    setGrouped: function(grouped) {
        // we have to save the itemTpl user functions first, which are in different place depending on grouping
        var memberFnsCombo =
                (!this.grouped && this.tpl && this.tpl.initialConfig)
                        ? this.tpl.initialConfig
                        : ((this.grouped && this.listItemTpl && this.listItemTpl.initialConfig) ? this.listItemTpl.initialConfig : {});

        this.grouped = !!grouped;

        // the following is code copied from List.initComponent, slightly modified
        if (Ext.isArray(this.itemTpl)) {
            this.itemTpl = this.itemTpl.join('');
        } else if (this.itemTpl && this.itemTpl.html) {
            Ext.apply(memberFnsCombo, this.itemTpl.initialConfig);
            this.itemTpl = this.itemTpl.html;
        }

        if (!Ext.isDefined(this.itemTpl)) {
            throw new Error("Ext.List: itemTpl is a required configuration.");
        }
        // this check is not enitrely fool proof, does not account for spaces or multiple classes
        // if the check is done without "s then things like x-list-item-entity would throw exceptions that shouldn't have.
        if (this.itemTpl && this.itemTpl.indexOf("\"x-list-item\"") !== -1) {
            throw new Error("Ext.List: Using a CSS class of x-list-item within your own tpl will break Ext.Lists. Remove the x-list-item from the tpl/itemTpl");
        }

        this.tpl = '<tpl for="."><div class="x-list-item ' + this.itemCls + '"><div class="x-list-item-body">' + this.itemTpl + '</div>';
        if (this.onItemDisclosure) {
            this.tpl += '<div class="x-list-disclosure"></div>';
        }
        this.tpl += '</div></tpl>';
        this.tpl = new Ext.XTemplate(this.tpl, memberFnsCombo);


        if (this.grouped) {

            this.listItemTpl = this.tpl;
            if (Ext.isString(this.listItemTpl) || Ext.isArray(this.listItemTpl)) {
                // memberFns will go away after removal of tpl configuration for itemTpl
                // this copies memberFns by storing the original configuration.
                this.listItemTpl = new Ext.XTemplate(this.listItemTpl, memberFnsCombo);
            }
            if (Ext.isString(this.groupTpl) || Ext.isArray(this.groupTpl)) {
                this.tpl = new Ext.XTemplate(this.groupTpl);
            }
            // jep: this line added to original source
            else if (this.grouped && this.groupTpl && this.groupTpl.html) {
                this.tpl = new Ext.XTemplate(this.groupTpl.html, this.groupTpl.initialConfig);
            }
        }

        // jep: slightly modified from here
        this.updatePinHeaders();

        if (this.rendered)
            this.refresh();
    },

    updatePinHeaders: function() {
        if (this.rendered)
            if (this.grouped && this.pinHeaders)
                this.onScrollStart();
            else
                this.setActiveGroup();
    },

    onScrollStart: function() {
        if (this.grouped && this.pinHeaders && this.getStore().data.length)
            Ext.jep.List.superclass.onScrollStart.apply(this);
    },

    onScroll: function(scroller, pos, options) {
        if (this.grouped && this.pinHeaders && this.getStore().data.length)
            Ext.jep.List.superclass.onScroll.apply(this, [scroller, pos, options]);
    },

    setPinHeaders: function(pinHeaders) {
        this.pinHeaders = pinHeaders;
        this.updatePinHeaders();
    }
});

Ext.reg('jeplist', Ext.jep.List);


new Ext.Application({
    launch: function() {

        var jsonServer = 'http://141.83.151.102:8080/json/current';

        var lübeck = new google.maps.LatLng(53.867814, 10.687208); // default
        var infoWindow = new google.maps.InfoWindow({maxWidth: 350}); // 350 is a hack to get autosizing working
        var lastActiveItem = 0;
        var myPosition;
        var directionsDisplay = new google.maps.DirectionsRenderer();
        var map = new Ext.Map({
            title: 'Map',
            getLocation: true,
            mapOptions: {
                center: lübeck,
                zoom: 15
            }
        });

        window.onbeforeunload = function() {
          return "Wirklich die Anwendung verlassen?";
    };

        var getMarkerAt = function(position) {
            for (var i = 0; i < map.markers.length; i++) {
                var marker = map.markers[i];
                if (marker.position.equals(position)) {
                    return marker;
                }
            }
        };

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
                    html: '<p>Entwickelt im Rahmen des Projekts SmartLübeck.'
                            + '<br/>Verwendet das Parkleitsystem der KWL.</p>',
                    dockedItems: [
                        {
                            dock: 'top',
                            xtype: 'toolbar',
                            title: 'Info'
                        }
                    ]
                });
            }
            this.popup.show('pop');
        };

        var pnlHome = new Ext.Panel({
            dockedItems : [
                {xtype: 'toolbar', dock : 'top', title: 'SmartLübeck Parking'}
            ],
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
                    iconMask: true,
                    iconCls: 'maps',
                    handler: function() {
                        lastActiveItem = 0;
                        main.setActiveItem(1);
                        loadData();
                    }
                },
                {
                    text: 'Liste',
                    iconMask: true,
                    iconCls: 'bookmarks',
                    handler: function() {
                        lastActiveItem = 2;
                        main.setActiveItem(2);
                        store.load();
                    }
                },
                {
                    text: 'Info',
                    iconMask: true,
                    iconCls: 'info',
                    handler: infoHandler
                }
            ]
        });

        // --- Kartenansicht ---

        var btnBack = {
            ui: 'back',
            text: 'Zurück',
            handler: function() {
                console.log(lastActiveItem);
                main.setActiveItem(lastActiveItem);
            }
        };

        var bar = new Ext.Toolbar({
            dock        : 'top',
            items       : [btnBack]
        });

        var pnlMap = new Ext.Panel({
            dockedItems: [bar],
            items      : [map]
        });

        // --- Model, Store und Liste ---

        Ext.regModel('Parking', {
            fields: ['kind', 'name', 'status', {name:'free', type:'int'}, {name:'spaces', type:'int'}, "city"]
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
            },
            sorters: [
                {
                    property : 'city',
                    direction: 'ASC'
                }
            ],
            getGroupString : function(record) {
                return record.get('city');
            }
        });

        var tpl = new Ext.XTemplate(
                '<div>{kind} <b>{name}</b></div><div>{[this.getInfo(values)]}</div>',
                {
                    compiled: true,
                    getInfo: function(value) {
                        if (value.status == "closed") {
                            return "geschlossen";
                        } else {
                            return value.free + " von " + value.spaces + " frei."
                                    + "<div class=\"free\"><div class=\"occupied\" style=\"width: "
                                    + getOccupation(value)
                                    + "%;\"></div></div>";
                        }
                    }
                }
        );

        var list = new Ext.jep.List({
            onItemDisclosure: function (record) {
                var city = record.raw;
                main.setActiveItem(1);
                loadData();
                var position = new google.maps.LatLng(city.geo.lat, city.geo.lng);
                map.map.panTo(position);
                var marker = getMarkerAt(position);
                infoWindow.setContent(createParkingInfoWindow(marker.parking));
                infoWindow.open(map.map, marker);
                map.map.setZoom(15);
                createRoute(position);
            },
            itemTpl : tpl,
            grouped : true,
            store: store
        });

        var sortHandler = function() {
            if (!this.actions) {
                this.actions = new Ext.ActionSheet({
                    items: [
                        {
                            text: 'Name',
                            handler : function() {
                                store.sort('name');
                            }
                        },
                        {
                            text : 'Freie Plätze',
                            handler : function() {
                                store.sort('free');
                                list.refresh();
                            }
                        },
                        {
                            text : 'Gesamt Plätze',
                            handler : function() {
                                store.sort('spaces');
                            }
                        },
                        {
                            text : 'Zurück',
                            ui: 'decline',
                            scope : this,
                            handler : function() {
                                this.actions.hide();
                            }
                        }
                    ]
                });
            }
            this.actions.show();
        };

        var btnSort = {
            text: 'Sortieren',
            handler: sortHandler
        };

        var btnHome = {
            ui: 'back',
            text: 'Zurück',
            handler: function() {
                main.setActiveItem(0);
            }
        };

        var pnlList = new Ext.Panel({
            layout: 'fit',
            items       : [list],
            dockedItems : [
                {xtype: 'toolbar', dock: 'top', items: [btnHome,{xtype:'spacer'},btnSort] }
            ]
        });

        // --- Haupt Panel ---

        var main = new Ext.Panel({
            fullscreen: true,
            layout:     'card',
            items:      [pnlHome, pnlMap, pnlList],
            cardSwitchAnimation: 'slide'
        });
        main.setActiveItem(0);

        var createRoute = function(destination) {
            var directionsService = new google.maps.DirectionsService();

            var request = {
                origin: myPosition,
                destination: destination,
                travelMode: google.maps.TravelMode["DRIVING"]
            };
            directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
            });

        };

        var tabButtonHandler = function(button, event) {
            Ext.each(theData.cities, function(city) {
                if (city.name == button.id) {
                    map.map.panTo(new google.maps.LatLng(city.geo.lat, city.geo.lng));
                    map.map.setZoom(13);
                    return false;
                }
            });
        };

        // for debugging while there's no api
        var getOccupation = function(parking) {
            return Math.floor(100 - ((parking.free * 100) / parking.spaces));
        };

        var createParkingInfoWindow = function(parking) {
            var occupation = getOccupation(parking);
            var info;
            if (parking.status == "open") {
                info = "<b>Belegung</b> "
                        + "<br/>"
                        + (parking.spaces-parking.free) + " von " + parking.spaces
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
            map.markers = new Array();
            bar.removeAll();
            bar.add(btnBack);
            // Add points to the map
            Ext.each(theData.cities, function(city) {
                bar.add({
                    text: city.name,
                    id  : city.name,
                    handler: tabButtonHandler
                });
            });
            //bar.add({xtype:'spacer'});

            bar.doLayout();
            //console.log(city);
            Ext.each(theData.parkings, function(parking) {
                if (typeof parking.geo !== 'undefined') {
                    var position = new google.maps.LatLng(parking.geo.lat, parking.geo.lng);
                    addMarker(parking, position, infoWindow);
                }
            });
            city = null;
            getMyPosition();
            map.map.setCenter(lübeck);
            map.map.setZoom(15);
            infoWindow.close();
            directionsDisplay.setMap(null);
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map.map);
        };

        // These are all Google Maps APIs
        var addMarker = function(parking, position, infowindow) {
            var image, util, utilFrac;
 
            if(parking.spaces == 0) {
                util = "100";
            } else {
                utilFrac = parking.free / parking.spaces;
                if(utilFrac == 0)
                    util = "100";
                else if(utilFrac < 0.2)
                    util = "80";
                else if(utilFrac < 0.5)
                    util = "60";
                else if(utilFrac < 0.6)
                    util = "40";
                else if(utilFrac < 0.8)
                    util = "20";
                else
                    util = "0";
            };


            
            switch (parking.kind) {
                case "PP":
                    image = "images/pp_u_" + util + ".png";
                    break;
                case "PH":
                    image = "images/ph_u_" + util + ".png";
                    break;
            }
            ;

            var marker = new google.maps.Marker({
                map: map.map,
                position: position,
                icon: image
            });
            marker.title = parking.name;
            marker.parking = parking;

            // Sencha Touch has problems with the maps handlers...
            // click wont work on mobile devices
            // see http://www.sencha.com/forum/showthread.php?117876-OPEN-642-map-on-1.0.1-not-responding-to-click-events-on-iPhone-Android/
            var evListener = function() {
                infowindow.setContent(createParkingInfoWindow(parking));
                infoWindow.open(map.map, marker);
            };
            map.markers.push(marker);
            google.maps.event.addListener(marker, 'mousedown', evListener);
            google.maps.event.addListener(marker, 'click', evListener);
        };

        var getMyPosition = function() {
            if (typeof(navigator.geolocation) != 'undefined') {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    myPosition = new google.maps.LatLng(lat, lng);
                    var marker = new google.maps.Marker({
                        map: map.map,
                        position: myPosition
                    });
                    marker.title = "Ihre Position";
                });
            }
        };

        getMyPosition();
    }
});

