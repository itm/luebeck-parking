/*
 * Author: annakata
 * Taken from: http://stackoverflow.com/questions/986657/how-do-i-format-a-javascript-date
 *
 * Modified to serve as a module.
 */

var DATE;
if (!DATE) {
    DATE = {};
}

(function () {
    if (typeof DATE.formattedString !== 'function') {
        DATE.formattedString = function (d, f) {
            var nm = this.monthName(d);
            var nd = this.dayName(d);
            f = f.replace(/yyyy/g, d.getFullYear());
            f = f.replace(/yy/g, String(d.getFullYear()).substr(2, 2));
            f = f.replace(/MM/g, nm.substr(0, 3).toUpperCase());
            f = f.replace(/Mm/g, nm.substr(0, 3));
            f = f.replace(/mm/g, String(padLeft(d.getMonth() + 1), '0', 2));
            f = f.replace(/DDD/g, nd.substr(0, 3).toUpperCase());
            f = f.replace(/Ddd/g, nd.substr(0, 3));
            f = f.replace(/DD\*/g, nd.toUpperCase());
            f = f.replace(/Dd\*/g, nd);
            f = f.replace(/dd/g, String(padLeft(d.getDate(), '0', 2)));
            f = f.replace(/d\*/g, d.getDate());
            f = f.replace(/H/g, d.getHours());
            f = f.replace(/m/g, d.getMinutes());
            f = f.replace(/s/g, d.getSeconds());
            return f;
        };
    }

    //n.b. this is sooo not i18n safe :)
    if (typeof DATE.monthName !== 'function') {
        DATE.monthName = function (d) {
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
    }

    //n.b. this is sooo not i18n safe :)
    if (typeof DATE.dayName !== 'function') {
        DATE.dayName = function (d) {
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
    }

    var padLeft = function (date, value, size) {
        var x = date;
        while (x.length < size) {
            x = value + x;
        }
        return x;
    };
}());

module.exports = DATE;