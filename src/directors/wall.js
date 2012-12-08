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
                position: [0, 0, 700],
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

        /**
         * Calculate gravite based fall.
         *
         * Warp mess slightly from the edges, so that outer edges
         * "drag" when the photo falls. When the photo hits
         * ground, then let this warping slowly settle in.
         *
         * We use time range 0... 0.8 for fall and 0.8... 1.0
         * to settle down the mesh warp.
         *
         * @param  {[type]} target            [description]
         * @param  {[type]} source            [description]
         * @param  {[type]} interpolatedValue [description]
         * @param  {[type]} value             [description]
         * @return {[type]}                   [description]
         */
        animate : function(target, source, interpolatedValue, value) {

            var movement, warp, opacity;

            var g = 0.2;

            if(value < 0.8) {
                movement = value/0.8;
                warp = 1;
            } else {
                movement = 1;
                warp = (value-0.8) / 0.2;
            }

            // Object position in free fall acceleration is t^2
            movement = (movement*movement);

            if(value < 0.7) {
                opacity = value / 0.7;
                opacity = utils.ease("easeInQuad", opacity, 0, 1);
            } else {
                opacity = 1;
            }

            var output = {
                position: utils.calculateAnimation(target.position, source.position, movement),
                rotation: utils.calculateAnimationSlerp(target.rotation, source.rotation, movement),
                scale: utils.calculateAnimation(target.scale, source.scale, movement),
                opacity: source.opacity + (target.opacity-source.opacity)*opacity
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

            var world = design.world;
            world.wall.position = [0, 0, 0];
            world.camera.position = [29.02482966472225, -234.62693273310097, 671.6854940572234];
            world.camera.rotation = [0,0,0];

            design.postprocssing = "normal";

        },

        setupRenderer : function(renderer) {
            renderer.postprocessor = "magic";
        }

    };

    registry.wall = new WallDirector();

    return registry.wall;

});


