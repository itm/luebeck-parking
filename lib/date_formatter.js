/*
 * Author(s): annakata, Sönke Nommensen
 * Taken from: http://stackoverflow.com/questions/986657/how-do-i-format-a-javascript-date
 *
 * Modified to serve as a module. Enriches the Date object with a formattedString operation.
 */

var date_formatter;
if (!date_formatter) {
    date_formatter = {};
}

(function () {
    if (typeof Date.prototype.formattedString !== 'function') {
        Date.prototype.formattedString = function (f) {
            var nm = monthName(this);
            var nd = dayName(this);
            f = f.replace(/yyyy/g, this.getFullYear());
            f = f.replace(/yy/g, String(this.getFullYear()).substr(2, 2));
            f = f.replace(/MM/g, nm.substr(0, 3).toUpperCase());
            f = f.replace(/Mm/g, nm.substr(0, 3));
            f = f.replace(/mm/g, String(padLeft(this.getMonth() + 1), '0', 2));
            f = f.replace(/DDD/g, nd.substr(0, 3).toUpperCase());
            f = f.replace(/Ddd/g, nd.substr(0, 3));
            f = f.replace(/DD\*/g, nd.toUpperCase());
            f = f.replace(/Dd\*/g, nd);
            f = f.replace(/dd/g, String(padLeft(this.getDate(), '0', 2)));
            f = f.replace(/d\*/g, this.getDate());
            f = f.replace(/H/g, hours(this));
            f = f.replace(/k/g, minutes(this));
            f = f.replace(/s/g, seconds(this));
            return f;
        };
    }

    var monthName = function (d) {
        switch (d.getMonth()) {
            case 0:
                return 'January';
            case 1:
                return 'February';
            case 2:
                return 'March';
            case 3:
                return 'April';
            case 4:
                return 'May';
            case 5:
                return 'June';
            case 6:
                return 'July';
            case 7:
                return 'August';
            case 8:
                return 'September';
            case 9:
                return 'October';
            case 10:
                return 'November';
            case 11:
                return 'December';
        }
    };

    var dayName = function (d) {
        switch (d.getDay()) {
            case 0:
                return 'Sunday';
            case 1:
                return 'Monday';
            case 2:
                return 'Tuesday';
            case 3:
                return 'Wednesday';
            case 4:
                return 'Thursday';
            case 5:
                return 'Friday';
            case 6:
                return 'Saturday';
        }
    };

    var hours = function (d) {
        var hours = d.getHours();
        if (hours < 10) {
            return "0" + hours;
        }
        else {
            return "" + hours;
        }
    };

    var minutes = function (d) {
        var min = d.getMinutes();
        if (min < 10) {
            return "0" + min;
        }
        else {
            return "" + min;
        }
    };

    var seconds = function (d) {
        var secs = d.getSeconds();
        if (secs < 10) {
            return "0" + secs;
        }
        else {
            return "" + secs;
        }
    };

    var padLeft = function (date, value, size) {
        var x = date;
        while (x.length < size) {
            x = value + x;
        }
        return x;
    };
}());

module.exports = date_formatter;