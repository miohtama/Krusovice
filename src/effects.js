/*global define, console, jQuery, document, setTimeout */

define("krusovice/effects", ['krusovice/thirdparty/jquery-bundle', "krusovice/core", "krusovice/utils"], function($, krusovice, utils) {
"use strict";

krusovice.effects = krusovice.effects || {};

$.extend(krusovice.effects, {

 /**
  * Z distance from the camera for normal image viewing.
  *
  * If plane has this distance and has width of 1 and height of 1
  * it will fill the screen exactly.
  *
  */
 ON_SCREEN_Z : 0,

 ON_SCREEN_MAX_X : 400,

 ON_SCREEN_MAX_Y : 400,

 /**
  * Used when zooming out of infinity.
  */
 FAR_Z : -10000,


 /**
  * The object is behind camera (but will zoom in)
  */
 BEHIND_CAMERA_Z : 1000,

 /**
  * If the object is at FAR_Z what is X value for the edge of screen
  */
 FAR_Z_MAX_X : 1000,

 /**
  * If the object is at FAR_Z what is Y value for the edge of screen
  */
 FAR_Z_MAX_Y : 1000

});

/**
 * Effect manager is responsible for registering animation effects.
 *
 * The managed data is used by the user interface and the internal
 * factory methods to map serialized effect ids to the actual animation code.
 *
 * @singleton
 */
krusovice.effects.Manager = $.extend(true, {}, utils.Registry, {

    initFunction : "init",

    /**
     * Get human readable effect list
     *
     * @param {String} transtion For which registered transition
     *
     * @return [ { id : name}, { id : name} ]
     */
    getVocabulary : function(transition) {

        var data = [];

        $.each(this.data, function(id, effect) {
            if(effect.available) {
                //console.log("Checking:" + transition + " " + effect.transitions);
                if($.inArray(transition, effect.transitions) != -1) {
                    data.push({id:effect.id, name:effect.name});
                }
            }
        });

        return data;
    },

    /**
     * @return All registered effects for certain transition type
     */
    getIds : function(transition) {
        var data = this.getVocabulary(transition);
        var d2 = [];
        data.forEach(function(e) {d2.push(e.id);});
        return d2;
    }

});

/**
 * Effects base class.
 *
 * All effects are singleton instances
 *
 * @singleton
 */
krusovice.effects.Base = {

    /**
     * @type String

     * Serialization id of the effect
     */
    id : null,

    /**
     * @type String
     *
     * The human readable name of the effect
     */
    name : null,

    /**
     * @type Boolean
     *
     * Whether or not the end user can pick this effect from the list. Set
     * false for the base classes.
     */
    available : false,


    /**
     * @type Array
     *
     * Animation types for which this effect is available.
     *
     * Example:
     *
     *      transition : ["transitionin", "transitionout"]
     */
    transitions : null,

    /**
     * @type String
     *
     * How we will interpolate values from this animation type to the next.
     *
     * One of options given by {@link krusovice.utils#ease}
     */
    easing : "linear",

    /**
     * @type Boolean
     *
     * Run animation backwards when transition out effects
     */
    reverseOut : true,

    /**
     * @type Object
     *
     * Declare effect interpolation.
     *
     * **source** and *target** contains endpoints of the interpoliated effect values.
     *
     * They are randomized with corresponding data in **sourceVariation** and **targetVariation**.
     *
     * Usually effects declare only source parameters, as the target is the source of the next animation.
     * However the exception is *onscreen* animation, as it will be usually matched to beat at the
     * beginning and the end of animation.
     *
     * XXX XX (needed anymore?) Parameter name starting with underscore (_) are only used during init() and prepareParameters().
     * They do not actually take part of the animation calculations itself, but are only source data
     * to derive actual animation parameters (e.g. _axis and _angle for rotation quarternion).
     *
     */
    parameters : {

        /**
         * @type Object
         *
         * Default values for various source values.
         *
         * May be computed in prepareAnimationParameters
         */
        source : {

        },


        /**
         * Random ranges for each parameter
         */
        sourceVariation : {

        },

        /**
         * @type Object
         *
         * Default values for various target values,
         *
         * May be computed in prepareAnimationParameters
         */
        target : {

        },

        targetVariation : {

        },

        /**
         * @type object
         *
         * Parameter name -> easing method mappings (if overriding global easing)
         */
        easing : {
        }

    },


    /**
     * Called when the animation is registered.
     *
     * Useful to tune parameters for the effect.
     *
     *
     */
    init : function() {
    },


    /**
     * Get list of parameter ids used for this effect.
     */
    getParameterNames : function(parametersSlot) {
        var names = [];

        $.each(this.parameters[parametersSlot], function(key, val) {

            names.push(key);
        });

        return names;
    },

    /**
     * Read effect parameters.
     *
     *
     * @param {String} slot one of source, sourceVariation, target, targetVariation
     *
     * First try animation level parameter, then
     * show level parameter and finally fall back
     * to the value defined in the effect class itself.
     *
     */
    getParameter : function(name, slot, showConfig, animationConfig, allowNull) {

        var value;

        if(!slot) {
            throw "Slot parameter missing";
        }

        if(animationConfig) {
            if(animationConfig[slot]) {
                value = animationConfig[name];
                if(value !== undefined) {
                    return value;
                }
            }
        }

        if(showConfig) {
            if(showConfig[slot]) {
                value = showConfig[slot][name];
                if(value !== undefined) {
                    return value;
                }
            }
        }

        if(this.parameters[slot] !== undefined) {
            value = this.parameters[slot][name];
            if(value !== undefined) {
                return value;
            }
        }

        // Don't bother to declare every variable in variation section
        if(allowNull) {
            return null;
        }

        console.error("Got effect");
        console.error(this);
        console.error(slot);
        console.error(showConfig);
        throw "Unknown effect parameter:" + name + " in parameter slot " + slot + " for effect " + this.id;
    },


    /**
     * Initialize a single parameter based on input ranges.s
     */
    initParameter : function(obj, slot, name, config, source) {
        obj[name] = this.randomizeParameter(name, source, config, source);
    },

    /**
     * Initialize animation source and target parameters and store then on an object.
     *
     * Generate animation parameters based on object config, show config and global config
     * (in this order). The animation parameter data is in format
     * as described in {@link krusovice.effects.Base#parameters}. The
     * actual parameter names and values vary effect by effect.
     *
     * @param {String} parametersSlot "source" or "target"
     *
     * @param {Object} obj Object receiving calculated values
     *
     * @param {Object} config Show per-effect overrides
     *
     * @param {Object} source Input element effects overrides
     *
     */
    initParameters : function(parametersSlot, obj, config, source) {

        if(obj === undefined ||obj === null) {
            throw "Target object missing";
        }

        var names = this.getParameterNames(parametersSlot);

        var self = this;

        names.forEach(function(name) {
            obj[name] = self.randomizeParameter(name, parametersSlot, config, source);
        });

    },

    /**
     * Set animation source and target parameters for this effects.
     *
     * The purpose is to set animation parameters for "current" animation
     * and optionally hint previous or next animations.
     *
     * @param {String} parametersSlot "source" or "target"
     *
     * @param {Object} obj Object receiving calculated values
     *
     * @param {Object} config Show per-effect overrides
     *
     * @param {Object} source Input element effects overrides
     */
    prepareParameters : function(parametersSlot, obj, config, source) {
        this.initParameters(parametersSlot, obj, config, source);
    },


    /**
     * Generate value for one parameter based on variation definitions in inputs.
     */
    randomizeParameter : function(name, slot, config, source) {


        var valSlot = slot;
        var variationSlot = slot + "Variation";

        var val = this.getParameter(name, valSlot, config, source);

        if(!(krusovice.utils.isNumber(val) || $.isArray(val))) {
            // String or object
            // Don't try to randomize
            return val;
        }

        var variation = this.getParameter(name, variationSlot, config, source, true);

        if(variation !== null)  {
            // We have randomization defined for this parameter
            return krusovice.utils.randomize(val, variation);
        } else {
            return val;
        }
    },

    /**
     * @return Easing method name for animating this effect
     */
    getEasing : function(config, source) {

        if(source && source.easing) {
            return source.easing;
        }

        if(config && config.easing) {
            return config.easing;
        }

        return this.easing;

    },

    time : function(startTime, endTime, rhythmAnalysis) {
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
    animate : function(object, target, source, value) {
    },

    render : function() {
    },

    /**
     * Hook to be called which sets commonn parameters for source and target animation.
     */
    postProcessParameters : function(source, target) {
    }
};

return krusovice.effects;
});
