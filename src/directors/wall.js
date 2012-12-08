/**
 * Old wooden wall style design director.
 */

define(["krusovice/thirdparty/jquery-bundle",
        "krusovice/thirdparty/three-bundle",
        "krusovice/directors/registry",
        "krusovice/effects",
        "krusovice/effects/interpolate",
        "krusovice/utils"],
function($, THREE, registry, effects, Interpolate, utils) {

    "use strict";

    // Draw items little bit higher than zero Z
    // so that we don't get polygon overlapping artifacts
    // and flickering
    var VERY_LOW_HEIGHT = 15.0;

    var transitions = {
        transitionIn : {
            type : "wall-fall",
            duration : 1.5
        },
        transitionOut : {
            type : "wall-fade",
            duration : 1.5
        },
        onScreen : {
            type : "wall-hold"
        }
    };

    /**
     * Animate photo falls from the camera on the background wall.
     *
     */
    var WallFallEffect = $.extend(true, {}, Interpolate, {

        id: "wall-fall",

        name: "Fall",

        parameters: {

            // Where the falling begins
            source : {
                position: [0, 0, 1000],
                rotation: [0,0,0, 1],
                opacity: 0,
                scale: [1,1,1]
            },


            target : {
                position: [0, 0, VERY_LOW_HEIGHT]
            },

            // Variation in the each photo source position
            sourceVariation : {
            }

        },

        prepareParameters : function(parametersSlot, obj, config, source) {
            this.initParameters(parametersSlot, obj, config, source);
        },

        animate : function(target, source, value) {

            var output = {
                position: utils.calculateAnimation(target.position, source.position, value),
                rotation: utils.calculateAnimationSlerp(target.rotation, source.rotation, value),
                scale: utils.calculateAnimation(target.scale, source.scale, value),
                opacity: source.opacity + (target.opacity-source.opacity)*value
            };

            return output;
        }
    });

    effects.Manager.register(WallFallEffect);

    /**
     * Animate photo falls from the camera on the background wall.
     *
     */
    var WallHoldEffect = $.extend(true, {}, Interpolate, {

        id: "wall-hold",

        name: "Hold",

        parameters: {

            // Where the falling begins
            source : {
                position: [0, 0, VERY_LOW_HEIGHT],
                rotation: [0,0,0,1],
                opacity: 1,
                scale: [1,1,1]
            },

            target : {
                position: [0, 0, VERY_LOW_HEIGHT]
            },

            // Variation in the each photo source position
            sourceVariation : {
            }
        }

    });

    effects.Manager.register(WallHoldEffect);

    var WallFadeEffect = $.extend(true, {}, Interpolate, {

        id: "wall-fade",

        name: "Fade",

        parameters: {

            // Where the falling begins
            source : {
                opacity: 0,
                position: [0, 0, VERY_LOW_HEIGHT]
            },

            // Variation in the each photo source position
            sourceVariation : {
            }
        }
    });

    effects.Manager.register(WallFadeEffect);

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


