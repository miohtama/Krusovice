/*global define, console, jQuery, document, setTimeout */

define(["krusovice/thirdparty/jquery-bundle",
     "krusovice/core",
     'krusovice/effects',
     'krusovice/thirdparty/three-bundle'
     ], function($, krusovice, effects, THREE) {

    "use strict";


    /**
     * Interpolate effect base.
     *
     * Interpolate position, rotation, etc. from source to target parameters.
     *
     * Weighting of the interpolation is based on ease value.
     */
    var Interpolate = $.extend(true, {}, effects.Base, {

        parameters : {

            source : {
                position : [0, 0, effects.ON_SCREEN_Z],
                rotation : [0,0,0, 1],
                opacity : 1,
                scale : [1,1,1]
            },

            sourceVariation : {
            },

            target : {
                position : [0, 0, effects.ON_SCREEN_Z],
                rotation : [0, 0, 0, 1],
                opacity : 1,
                scale : [1,1,1]
            },

            targetVariation : {
            }

        },

        /**
         * Calculate state variables for an animation frame
         *
         * @param {Object} Show object being animated
         *
         * @param {Object} target Target animation state
         *
         * @param {Object} source Source animation state
         *
         * @param {Number} value current intermediate state 0...1, default easing applied
         */

        animate : function(target, source, value) {

            if(!krusovice.utils.isNumber(value)) {
                console.error(value);
                throw "animate(): Bad interpolation value:" + value;
            }

            var output = {
                position: krusovice.utils.calculateAnimation(target.position, source.position, value),
                rotation: krusovice.utils.calculateAnimationSlerp(target.rotation, source.rotation, value),
                scale: krusovice.utils.calculateAnimation(target.scale, source.scale, value),
                opacity: source.opacity + (target.opacity-source.opacity)*value
            };

            return output;
        }


    });

    return Interpolate;

});
