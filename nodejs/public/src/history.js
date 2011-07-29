$(function () {

    var parking = "Falkenstrasse";

    $("#parkings").change(function() {
        parking = $(this).val();
        fetchData(parking);
    });

    var options = {
        lines: { show: true },
        points: { show: true },
        xaxis:{
            mode: "time",
            tickLength: 5
        },
        grid: { markings: weekendAreas }
    };

    var container = $("#container");

    var overview = $("#overview");

    var data = [];

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

    function onDataReceived(parkingData) {

        jQuery.each(parkingData.occupancy, function(i, parking) {
            var millis = parseInt(parking.timestamp);
            var entry = [millis, parseInt(parking.free)];
            data.push(entry);
        });

        // first correct the timestamps - they are recorded as the daily
        // midnights in UTC+0100, but Flot always displays dates in UTC
        // so we have to add one hour to hit the midnights in the plot
        for (var i = 0; i < data.length; ++i)
            data[i][0] += 60 * 60 * 1000;

        // and plot all we got
        var plot = $.plot(container, [data], options);

        var smallPlot = $.plot($("#overview"), [data], {
            series: {
                lines: { show: true, lineWidth: 1 },
                shadowSize: 0
            },
            xaxis: { ticks: [], mode: "time" },
            yaxis: { ticks: [], min: 0, autoscaleMargin: 0.1 },
            selection: { mode: "x" }
        });

        container.bind("plotselected", function (event, ranges) {
            // do the zooming
            plot = $.plot($("#container"), [data],
                    $.extend(true, {}, options, {
                        xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                    }));

            // don't fire event on the overview to prevent eternal loop
            smallPlot.setSelection(ranges, true);
        });

        overview.bind("plotselected", function (event, ranges) {
            plot.setSelection(ranges);
        });
    }

    var fetchData = function(parking) {
        $.ajax({
            url: 'http://enterprise-it.corona.itm.uni-luebeck.de:8080/json/history/Falkenstrasse',
            //url: 'http://localhost:8080/history/Falkenstrasse',
            method: 'GET',
            dataType: 'json',
            success: onDataReceived
        });
    };

    fetchData(parking);
});