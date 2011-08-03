$(function () {

    var options = {
        series: {
            stack: true,
            lines: { show: true, fill: true },
            points: { show: false },
            shadowSize: 0
        },
        xaxis:{
            mode: "time",
            tickLength: 5
        },
        yaxis: {
            min: 0
        },
        selection: { mode: "x" },
        grid: { hoverable: true, clickable: true, markings: weekendAreas }
    };

    var smallOptions = {
        series: {
            lines: { show: true, lineWidth: 1, fill: true },
            shadowSize: 0,
            stack: true
        },
        xaxis: { ticks: [], mode: "time" },
        yaxis: { ticks: [], min: 0, autoscaleMargin: 0.1 },
        selection: { mode: "x" }
    };

    // Returns the weekends in a period
    function weekendAreas(axes) {
        var markings = [];
        var d = new Date(axes.xaxis.min);
        // go to the first Saturday
        d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7));
        d.setUTCSeconds(0);
        d.setUTCMinutes(0);
        d.setUTCHours(0);
        var i = d.getTime();
        do {
            // when we don't set yaxis, the rectangle automatically
            // extends to infinity upwards and downwards
            markings.push({ xaxis: { from: i, to: i + 2 * 24 * 60 * 60 * 1000 } });
            i += 7 * 24 * 60 * 60 * 1000;
        } while (i < axes.xaxis.max);

        return markings;
    }

    var occupancy = [];
    var total = [];
    var spaces = 0;

    var plot = null;
    var smallPlot = null;

    function onDataReceived(parkingData) {
        if ($("#tooltip")) $("#tooltip").remove();

        //if (console && console.log) console.log(JSON.stringify(parkingData));

        if (parkingData && parkingData.spaces) {
            spaces = parseInt(parkingData.spaces);
        }

        jQuery.each(parkingData.occupancy, function(i, parking) {
            var millis = parseInt(parking.timestamp);
            var occupied = spaces - parseInt(parking.free);
            occupancy.push([millis, occupied]);
            total.push([millis, spaces - occupied]); // avoid stacking
        });

        // set maximum für y-axis
        options.yaxis.max = spaces;
        smallOptions.yaxis.max = spaces;

        // first correct the timestamps - they are recorded as the daily
        // midnights in UTC+0100, but Flot always displays dates in UTC
        // so we have to add one hour to hit the midnights in the plot
        for (var i = 0; i < occupancy.length; ++i)
            occupancy[i][0] += 60 * 60 * 1000;

        for (var j = 0; j < total.length; ++j)
            total[j][0] += 60 * 60 * 1000;

        // and plot all we got
        plot = $.plot($("#placeholder"), [
            { data: occupancy, label: "Belegt", color: "rgb(200, 20, 30)" },
            { data: total, label: "Verf&uuml;gbar", color: "rgb(30, 180, 20)" }
        ], options);

        smallPlot = $.plot($("#overview"), [
            { data: occupancy, color: "rgb(200, 20, 30)" },
            { data: total, color: "rgb(30, 180, 20)" }
        ], smallOptions);

        $("#placeholder").bind("plotselected", function (event, ranges) {
            // do the zooming
            plot = $.plot($("#placeholder"), [
                { data: occupancy, label: "Belegt", color: "rgb(200, 20, 30)" },
                { data: total, label: "Verf&uuml;gbar", color: "rgb(30, 180, 20)" }
            ],
                    $.extend(true, {}, options, {
                        xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                    }));

            // don't fire event on the overview to prevent eternal loop
            smallPlot.setSelection(ranges, true);
        });

        $("#placeholder").bind("plothover", function (event, pos, item) {
            $("#x").text(pos.x.toFixed(2));
            $("#y").text(pos.y.toFixed(2));

            if (item) {
                if (previousPoint != item.dataIndex) {
                    previousPoint = item.dataIndex;

                    $("#tooltip").remove();
                    var x = item.datapoint[0].toFixed(2);
                    var y = item.datapoint[1].toFixed(2);

                    var timestamp = new Date();
                    timestamp.setTime(x - 60 * 60 * 1000);

                    showTooltip(item.pageX, item.pageY,
                            "<b>"
                                    + item.series.label
                                    + ":</b> "
                                    + parseInt(y)
                                    + " / "
                                    + spaces
                                    + "; <b>Zeitpunkt:</b> "
                                    + timestamp
                    );
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint = null;
            }
        });

        $("#overview").bind("plotselected", function (event, ranges) {
            plot.setSelection(ranges);
        });
    }

    function showTooltip(x, y, contents) {
        $('<div id="tooltip">' + contents + '</div>').css({
            position: 'absolute',
            display: 'none',
            top: y + 5,
            left: x + 5,
            border: '1px solid #fdd',
            padding: '2px',
            'background-color': '#fee',
            opacity: 0.80
        }).appendTo("body").fadeIn(200);
    }

    function onNoDataRecieved() {
        plot = $.plot($("#placeholder"), [
            { data: [], label: "Belegung"}
        ], options);

        smallPlot = $.plot($("#overview"), [], {
            series: {
                lines: { show: true, lineWidth: 1, fill: 0.25 },
                shadowSize: 0
            },
            xaxis: { ticks: [], mode: "time" },
            yaxis: { ticks: [], min: 0, autoscaleMargin: 0.1 },
            selection: { mode: "x" }
        });

        $('<div id="tooltip">' + 'Keine Daten verf&uuml;gbar!' + '</div>').css({
            position: 'absolute',
            display: 'none',
            top: 400,
            left: 350,
            border: '3px solid red',
            color: 'red',
            'font-weight': 'bold',
            padding: '5px',
            'background-color': 'white'
        }).appendTo("body").fadeIn(200);
    }

    var parking = "Falkenstrasse";

    $("#parkings").change(function() {
        parking = $(this).val();
        fetchData(parking);
    });

    $("#reset").click(function() {
        fetchData(parking);
    });

    function fetchData(parking) {
        // reset data
        occupancy = [];
        total = [];

        $.ajax({
            url: 'http://enterprise-it.corona.itm.uni-luebeck.de:8080/json/history/' + parking,
            //url: 'http://localhost:8080/json/history/' + parking,
            method: 'GET',
            dataType: 'json',
            success: onDataReceived,
            statusCode: {
                404: onNoDataRecieved
            }
        });
    }

    fetchData(parking);

});