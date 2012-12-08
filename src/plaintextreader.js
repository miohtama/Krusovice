/**
 * Read plain-text Krusovice show description;
 */

define(["jquery"], function($) {

    "use strict";

    /**
     * @param  {String} txt Incoming show description.
     *
     * @return {Array} array of krusovice.InputElemets
     */
    function readPlainTextShow(txt) {

        var baseplan = [];

        var baseelem = {
            type : "image",
            label : null,
            duration : 3.5,
            imageURL : null
        };

        var lines = txt.split("\n");

        var idCounter = 0;

        // Add image elements to show
        lines.forEach(function(l) {
            l = l.trim();
            var copy;

            if(l !== "") {

                if(l.indexOf(".jpg") >= 0) {
                    copy = $.extend({}, baseelem);
                    copy.imageURL = l;
                    baseplan.push(copy);
                } else {
                    copy = $.extend({}, baseelem);
                    copy.type = "text";
                    copy.texts = { text : l };
                    copy.shape = "clear";
                    baseplan.push(copy);

                }
            }

            copy.id = idCounter++;
        });

        return baseplan;

    }

    return readPlainTextShow;

});


