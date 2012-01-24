$(document).ready(function () {

    var host = "localhost";
    var port = 8080;

    function calculateOccupation(parking) {
        return Math.floor(100 - ((parking.free * 100) / parking.spaces));
    }

    function onData(data) {
        console.log(JSON.stringify(data));
        if (typeof data === "undefined" || data === null) return;
        var parkings = data.current.parkings;
        for (var i = 0; i < parkings.length; ++i) {
            $('#parkings').append('<li><a href="#">'
                + '<div class="free" style="float:right;margin-right:15px;"><div class="occupied" style="width: '
                + calculateOccupation(parkings[i])
                + '%;"></div></div>'
                + parkings[i].name
                + '</a></li>');
        }
        $('#parkings').listview('refresh');
    }

    function onNoData() {
    }

    console.log("ajax call to: " + "http://" + host + ":" + port + "/json/current/");
    $.ajax({
        url:"http://" + host + ":" + port + "/json/current/",
        method:"GET",
        dataType:"json",
        success:onData,
        statusCode:{
            404:onNoData
        }
    });

    $('div.spinner')
        // hide it initially
        .hide()
        .ajaxStart(function () {
            //jquery mobile way $.mobile.pageLoading();
            $(this).show();
        })
        .ajaxStop(function () {
            //jquery mobile way $.mobile.pageLoading(true);
            $(this).hide();
        });

});