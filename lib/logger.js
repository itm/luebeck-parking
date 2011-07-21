/*
 * Author: Soenke Nommensen
 */
const DATE = require('./date_formatter')

var logger;
if (!logger) {
    logger = {};
}

(function () {
    var defaultDateFormat = 'dd-Mm-yyyy-H:k:s';

    var log = function (message, level) {
        var now = new Date().formattedString(defaultDateFormat);
        console.log(now + " [" + level + "]: " + message);
    };

    if (typeof logger.info !== 'function') {
        logger.info = function (message) {
            log(message, "INFO");
        };
    }

    if (typeof logger.error !== 'function') {
        logger.error = function (message) {
            log(message, "ERROR");
        };
    }
}());

module.exports = logger;