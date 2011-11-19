/**
 * gettext() stub
 *
 * Use real gettext() function if one has been defined synchronously
 * before including this file.
 */

/*global require,define,window,console*/

define("krusovice/tools/gettext", function() {

    function noop(msg) {
        return msg;
    }

    var gettext = window.gettext || noop;

    //
    // public API
    //

    return {
        gettext : gettext
    };

});

