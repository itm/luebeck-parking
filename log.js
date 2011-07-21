/*
 * Author: Soenke Nommensen
 */
const DATE = require('./date')

var LOG;
if (!LOG) {
    LOG = {};
}

(function () {
    var defaultDateFormat = 'dd-Mm-yyyy-H:m:s';

    var log = function (message, level) {
        var now = DATE.formattedString(new Date(), defaultDateFormat);
        console.log(now + " [" + level + "]: " + message);
    };

    if (typeof LOG.info !== 'function') {
        LOG.info = function (message) {
            log(message, "INFO");
        };
    }

    if (typeof LOG.error !== 'function') {
        LOG.error = function (message) {
            log(message, "ERROR");
        };
    }
}());

module.exports = LOG;