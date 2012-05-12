/*global define, window, console, jQuery, document, setTimeout */

define("krusovice/editdata", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
'use strict';

/**
 * Edit data holds UI editor data for settings of show, photo and text slides.
 *
 * This is an abstract baseclass.
 *
 * This data is stored in InputElement.editData attribute when dealing
 * with input elements thru UI editor.
 *
 * Edit data consists of section which are directly mapped to settings panes.
 * Each setting pane has option "useDefault" which tells whether to pull
 * the setting from the show settings or use the object local setting.
 *
 */
krusovice.EditData = function() {
};

/**
 *
 */
krusovice.EditData.prototype = {


};


/**
 * Photo editor data.
 */
krusovice.PhotoEditData = function() {

    // Apply default settings
    $.extend(this, {
        border : {
            useDefault : true,
            color : "#e0e0e0"
        },

        font : {
            useDefault : true,
            color : "#eeEEee",
            size : 1.0 // Size multiplie
        },

        // Photo label
        label : {
            useDefault : true,
            position : "bottom-center",
            text : null
        },

        // Mixnap effect id (is NOT transition id, but more user friendly)
        transitions : {
            useDefault : true,
            effectId : "slide"
        },

        // Transition timings
        stepping : {
            useDefault : true,
            transitionIn : 1.5,
            onScreen : 8,
            transitionOut : 1.5,
            steppingTime : 1.0
        },

        texts : {
            useDefault : false,
            text : ""
        }

    });
};

$.extend(krusovice.PhotoEditData, krusovice.EditData.prototype, {});


/**
 * Text editor data.
 */
krusovice.TextEditData = function() {

    // Apply default settings
    $.extend(this, {

        font : {
            useDefault : true,
            color : "#ffffaa",
            size : 1.0 // Size multiplie
        },

        // Mixnap effect id (is NOT transition id, but more user friendly)
        transitions : {
            useDefault : true,
            effectId : "slide"
        },

        // Transition timings
        stepping : {
            useDefault : true,
            transitionIn : 1.5,
            onScreen : 5,
            transitionOut : 1.5,
            steppingTime : 1.0
        },

        shape : {
            useDefault : true,
            shapeId : "clear"
        },

        labels : {
            useDefault : false,
            primary : "",
            secondary : ""
        }
    });
};

$.extend(krusovice.TextEditData, krusovice.EditData.prototype, {});

/**
 * UI data for setting the show timing.
 *
 * Match one in krusovice.Design() by variable name.
 */
krusovice.TimingEditData = function() {
    $.extend(this, {
        musicStart : 0.0,
        leadTime : 3.0,
        coolingTime : 5.0,
        steppingTime : 1.0
    });
};

$.extend(krusovice.TimingEditData, krusovice.EditData.prototype, {});

return {
    TimingEditData : krusovice.TimingEditData,
    PhotoEditData : krusovice.PhotoEditData,
    TextEditData : krusovice.TextEditData
};

});
