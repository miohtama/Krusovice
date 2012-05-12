/**
 * gettext() stub
 *
 * Use real gettext() function if one has been defined synchronously
 * before including this file.
 */

/*global require, define, window, console, jQuery, document, setTimeout */

define("krusovice/tools/gettext", function() {

    "use strict";

    function noop(msg) {
        return msg;
    }

    var gettext = window.gettext || noop;

    //
    // public API
    //

    return {
        gettext : gettext
    };

});

