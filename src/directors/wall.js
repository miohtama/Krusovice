/**
 * Old wooden wall style design.
 */

define(["krusovice/thirdparty/jquery-bundle",
        "krusovice/thirdparty/three-bundle",
        "krusovice/directors/registry",
        "krusovice/effects",
        "krusovice/utils"],
function($, THREE, registry, effects, utils) {

    "use strict";

    var config = {
        start : [0, 0, -100],
        end : [0, 0, 0]
    };

    var transitions = {
        transitionIn : {
            type : "wall-fall",
            duration : 1.5,
            config : config
        },
        transitionOut : {
            type : "fade",
            duration : 1.5
        },
        onScreen : {
            type : "hold"
        }
    };

    /**
     * Animate photo falls from the camera on the background wall.
     *
     */
    var WallFallEffect = $.extend(true, {}, effects.Base, {

        id: "wall-fall",

        name: "fallin",

        parameters: {

            // Where the falling begins
            source : {
                position : [0, 0, -100],
                rotation : [0,0,0, 1],
                opacity : 1,
                scale : [1,1,1]
            },

            // Variation in the photo source position
            sourceVariation : {

            },

            // Where the falling ends
            target : {
                position : [0, 0, 0],
                rotation : [0, 0, 0, 1],
                opacity : 1,
                scale : [1,1,1]
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
         * @param {Number} value current intermediate state 0...1, easing applied
         */

        animate : function(target, source, value) {

            return {
                position: source.position,
                rotation: source.rotation,
                scale: source.scale,
                opacity: 1
            };
        }

    });

effects.Manager.register(WallFallEffect);

    /**
     * The style class directing the show
     */
    function WallDirector() {
    }

    WallDirector.prototype = {

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

            design.world.wall.position = [0, 0, 0];

            design.postprocssing = "normal";

        },

        setupRenderer : function(renderer) {
            renderer.postprocessor = "magic";
        }

    };

    registry.wall = new WallDirector();

    return registry.wall;

});


