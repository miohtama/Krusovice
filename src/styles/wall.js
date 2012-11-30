/**
 * Old wooden wall style design.
 */

/**
 * Helper geometry for photos.
 */

define(["krusovice/thirdparty/three-bundle", "krusovice/styles/registry"], function(THREE, registry) {

    "use strict";

    var transitions = {
        transitionIn : {
            type : "fade",
            duration : 1.5
        },
        transitionOut : {
            type : "fade",
            duration : 1.5
        },
        onScreen : {
            type : "hold"
        }
    };

    function WallStyle() {
    }

    WallStyle.prototype = {

        /**
         * Setup transition effects for this style.
         * @param  {Array} plan krusovice.InputElements array
         */
        setupPlan : function(plan) {
            plan.forEach(function(e) {
                e.transitions = transitions;
            });
        },

        /**
         * Build a design which will do walls style rendering
         *
         * @param  {krusoviceDesig} design
         */
        setupDesign : function(design) {

            design.background = {
                type: "texture",
                src: "crate.gif",
                color : 0xaaaaff,
                mode : "wall"
            };

            design.postprocssing = "normal";

        },

        setupRenderer : function(renderer) {
            renderer.postprocessor = "magic";
        }

    };

    registry.wall = new WallStyle();

    return registry.wall;

});


