/*global define,window*/

define("krusovice/timeliner", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
"use strict";

/**
 * Describe one of transition in, transition out or on screen or gone animation for TimelineElement.
 *
 * We actually need four animations where the gone animation is fake, as for each animation
 * the animation defines its source values which serve target values of the previous animation.
 * We also need target values for the gone animation and thus this fourth animation acts only
 * as a final target parameters for transitionOut.
 *
 *
 */

krusovice.TimelineAnimation = function(cfg) {
    $.extend(true, this, cfg);
};

krusovice.TimelineAnimation.prototype = {

    /**
     * @type String
     *
     * What state of the element this animation presents.
     *
     * One of transitionin, onscreen, transitionout, gone.
     */
    type : null,

    /**
     * @type String
     *
     * What effect is applied on this animation (besides interpolated movement)
     */
    effectType : null,

    /**
     * How many seconds this animation lasts
     */
    duration : 0,

    /**
     * How we will interpolate values from this animation type to the next.
     */
    easing : "linear",

    // XXX: Below are overridden from effects


    /**
     * Are we running the effect backwards (transition out).
     *
     * This flag is used in easing calculations to make sure the
     * acceleration for reverse animations is calculated correctly.
     */
    reverse : false,

    /**
     * Effect hint parameters for this animation.
     *
     * Use this for setting per-item animation parameters.
     */
    parameters : {


        /**
         * Where is this object at the beginning of the animation.
         *
         * The default position is at the front of the camera.
         *
         */
        //position : [0, 0, 1],

        /**
         * How this object is rorated the beginning of the animation.
         *
         * The default position facing the camera so that up is up.
         *
         */
        //rotation : [0, 0, 0],


        /**
         * How this object is scaled at the beginning of the animation.
         */
        //scale : [1, 1, 1],

        /**
         * By default, the object is 100% visible
         */
        //opacity : 1,

    },


    /**
     * The orignal user input which was used to create this animation
     */
    input : null
};


/**
 * TimelineElement describes element inserted on the timeline.
 *
 * It contains all copied attributesfrom krusovice.InputElement +
 * additional calculated timing info created by Timeliner.
 */
krusovice.TimelineElement = function() {
};

krusovice.TimelineElement.prototype = {
    id :  null,

    //type : null,
    // Contains copied
    //text : null,
    //label : null,
    //imageURL : null,

    /**
     * @type Number
     *
     * Time in seconds when this element is animated for the first time
     */
    wakeUpTime : 0,


    /**
     * @type Number
     *
     * Time of empty playback after this element. It's stepping time, but
     * for the last element it is coolingTime.s
     */
    spacingTime : 0,


    /**
     * Sequence of TimelineAnimations.
     *
     * By default this is
     *
     * 0 : transitionIn,
     * 1 : onScreen,
     * 2 : transitionOut,
     * 3 : gone
     *
     * ... but any number of state transformations is supported.
     *
     * Currently the end of each animation is the start of the next animation.
     *
     * The last animation is not animated, but it just contains the stopper values of the second last animation.
     */
    animations : []


};

/**
 * Create show timeline plan based on show input elements
 */
krusovice.Timeliner = function(config) {

    $.extend(this, config);

    if(!this.showElements) {
        throw new TypeError("you must give list of elements for the timeline designer");
    }

    if(!jQuery.isArray(this.showElements)) {
        throw new TypeError("Array plz");
    }

};

krusovice.Timeliner.prototype = {

    /**
     * @cfg {Array} showElements Input elements to construct the show as array of objects
     */
    showElements : null,

    /**
     * @cfg {Object} Transition settings used in this show.
     *
     * Copy default settings object and modify it for your needs.
     */
    settings : null,

    /**
     * @cfg {Object} rhythmData Music rhythm data used in timing the elements
     *
     */
    rhythmData : null,


    /**
     * @cfg {Number} musicStartTime The position of MP3 where the music starts playing
     *
     */
    musicStartTime : 0,


    /**
     * @cfg {Number} leadTime How many seconds we play music before the first element appears
     */
    leadTime : 0,

    /**
     * @cfg {Number} coolingTime  How many seconds empty we have after the last element before the credits
     */
    coolingTime : 0,

    /**
     * @cfg {Number} steppingTime How many seconds empty we have between show objects
     */
    steppingTime : 0,

    /**
     * How big tolerance % in transition duration / bar duration is allowed to that
     * transition is fitted perfectly into a bar.
     */
    barMatchFactor : 0.5, // 50%

    /**
     * How many seconds we can spend try to find a matching bar/beat
     */
    seekWindow : 1.5,

    /**
     * @cfg {Object} Effect parameter overrides for this show.
     */
    effectConfig : null,

    /**
     * @cfg {Array} transitionInEffects List of allowed transition in animation ids for random pick
     */
    transitionInEffects : ["random", "fadein"],

    /**
     * @cfg {Array} transitionOitEffects List of allowed transition out animation ids for random pick
     */
    transitionOutEffects : ["random", "fadeout"],

    /**
     * @cfg {Array} onScreenEffects List of allowed on screen animation effect ids for random pick
     */
    onScreenEffects : ["random", "fadeout"],



    /**
     * Create rhythm analysis interface for laoded rhythm data.
     *
     * Optionally we can use null data and no beats.
     */
    createMusicAnalysis : function() {
        if(this.rhythmData) {
            var analysis = new krusovice.RhythmAnalysis(this.rhythmData);
            analysis.initBeats();
            return analysis;
        } else {
            return null;
        }
    },

    /**
     * Be like a MasterMind.
     *
     * @return
     */
    createPlan : function() {

        this.analysis = this.createMusicAnalysis(this.rhythmData);

        var plan = [];

        var clock = this.leadTime;

        var transitionIn = this.settings.transitionIn;
        var transitionOut = this.settings.transitionOut;
        var onScreen = this.settings.onScreen;

        var musicStartTime = this.musicStartTime;

        for(var i=0; i<this.showElements.length; i++) {

            var elem = this.showElements[i];

            console.log("Element #" + i + " current clock:" + clock);

            // Construct show element
            var out = new krusovice.TimelineElement();

            out.input = elem;

            // Populate it with default values from input
            krusovice.utils.copyAttrs(out, elem, ["id", "type", "text", "label", "imageURL"]);

            if(!elem.duration) {
                // Use default duration in the case funny input data happens
                elem.duration = this.duration || 8.0;
            }


            // Place element on the timeine based on our current clock
            this.timeAnimations(out, elem, clock, elem.duration);

            this.prepareAnimations(out, elem);


            console.log("Got out");
            console.log(out);

            // Advance clock to the start of the next show item based on how
            // long it took to show this item
            if(i == this.showElements.length-1) {
                out.spacingTime = this.coolingTime;
            } else {
                out.spacingTime = this.steppingTime;
            }

            var duration = krusovice.Timeliner.getElementDuration(out, true);

            clock += duration;

            if(!clock) {
                console.error("Latest input element");
                console.error(elem);
                throw "Bad presentation input element";
            }

            plan.push(out);
        }

        return plan;
    },

    /**
     * Put element to the timeline and match its on screen time with beats.
     *
     * Create four states: transition, onscreen, transitionout, gone.
     *
     * Element on screen animation starts on a beat.
     * Element on screen animation stops on a beat.
     *
     * @param out Show element
     */
    timeAnimations : function(out, source, clock, onScreenDuration) {

        var transitionIn = this.settings.transitionIn;
        var tid = transitionIn.duration;
        var transitionOut = this.settings.transitionOut;
        var onScreen = this.settings.onScreen;
        var tod = transitionOut.duration;

        var testDelta = 0.1; // seconds
        var musicStartTime = this.musicStartTime;

        console.log("Input data: " + clock + " start time:" + musicStartTime +  " in duration:" + transitionIn.duration + " on screen:" + onScreen.duration);

        // We operate in song clock time to make rhytm matching calcs easier
        var songClock = clock + musicStartTime;

        // on screen effect starts time in song time
        var hitsScreen = this.findNextBar(songClock + transitionIn.duration);

        // on screen effect stops time
        var hitsOut = this.findNextBar(hitsScreen + onScreenDuration);

        if(!hitsScreen || hitsScreen <= 0) {
            console.error("Screen:" + hitsScreen + " clock:" + clock + " music start time:" + musicStartTime + "transition in:" + transitionIn.duration);
            throw "Failed to calculate hits to screen time";
        }

        if(!hitsOut ||hitsOut <  0) {
            throw "Failed to calculate leaves the screen time";
        }

        // Try time transition in animation to a bar
        var inBarStart = this.findCurrentBarStart(songClock + transitionIn.duration - testDelta);
        var inBarDuration = hitsScreen - inBarStart;
        var transitionInDuration;

        // We are confident transition in duration matches almost the bar duration
        if(Math.abs(inBarDuration - tid) / tid < this.barMatchFactor) {
            transitionInDuration = inBarDuration;
        } else {
            transitionInDuration = tid;
        }

        var outBarEnd = this.findNextBar(hitsOut + testDelta);
        var outBarDuration = outBarEnd - hitsOut;
        var transitionOutDuration;

        // We are confident transition out duration matches almost the bar duration
        if(Math.abs(outBarDuration - tod) / tod < this.barMatchFactor) {
            transitionOutDuration = outBarDuration;
        } else {
            transitionOutDuration = tod;
        }

        // Set the first animation appearing time in show clock
        out.wakeUpTime = hitsScreen - musicStartTime;

        out.animations = [
             // transition in
             new krusovice.TimelineAnimation({
                    type : "transitionin",
                    duration : transitionInDuration
             }),

             // on screen
             new krusovice.TimelineAnimation({
                    type : "onscreen",
                    duration : hitsOut - hitsScreen
             }),

             // transition out
             new krusovice.TimelineAnimation({
                     type : "transitionout",
                    duration : transitionOutDuration
             }),


             // gone
             new krusovice.TimelineAnimation({
                     type : "gone",
                    duration : 0
             })


        ];

    },

    /**
     * Choose animation effects and set initial parameters for a timeline element.
     *
     * @param {TimelineElement} out
     */
    prepareAnimations : function(out, source) {

        var current, next;
        for(var i=0; i<out.animations.length-1; i++) {
            // Setup animation effect data
            current = out.animations[i];
            next = out.animations[i+1];

            // Choose effect from the settings
            //console.log("Settings")
            //console.log(this.settings);
            var effect = this.getEffectForAnimation(this.settings, current, source);

            this.prepareAnimationParameters(effect, current.type, current, next);
        }
    },

    /**
     * Create one of animation blocks in the outgoing presentation data.
     *
     * @param {TimelineAnimation} currentAnimation
     *
     * @param {TimelineAnimation} nextAnimation
     *
     */
    prepareAnimationParameters : function(effectType, animationType, currentAnimation, nextAnimation) {

        if(!effectType) {
            throw "Effect type pick failed:" + animationType;
        }

        currentAnimation.effectType = effectType;

        // Set gone animation targets
        if(animationType == "transitionout") {
            nextAnimation.animationType = "gone";
        }

        this.prepareEffectParameters(animationType, currentAnimation, nextAnimation);

    },


    /**
     * Set effect start and stop coordinates.
     *
     *
     * Animation filling chain:
     *
     *       transitionin current[0]
     *       onscreen current[1] next[2]
     *       transitionout next[3]
     *
     */
    prepareEffectParameters : function(animationType, currentAnimation, nextAnimation) {

        // Get effect
        var effect = krusovice.effects.Manager.get(currentAnimation.effectType);

        if(!effect) {
            throw "Unknown effect type:" + currentAnimation.effectType;
        }

        var source = null;
        var target = null;

        currentAnimation.type = animationType;
        currentAnimation.effectType = effect.id;

        console.log("effectConfig");
        currentAnimation.easing = effect.getEasing(this.effectConfig, source);
        console.log("Got easing:"+ currentAnimation.easing);

        if(animationType == "transitionin") {
            // Set initial parameters
            effect.prepareParameters("source", currentAnimation, this.effectConfig, source);
        }

        // On screen animation may decide it's start and stop places on the screen
        if(animationType == "onscreen") {
            // Set initial parameters

            effect.prepareParameters("source", currentAnimation, this.effectConfig, source);
            effect.prepareParameters("target", nextAnimation, this.effectConfig, target);
            effect.postProcessParameters(currentAnimation, nextAnimation);

            console.log("Got target:");
            console.log(nextAnimation);
        }

        if(animationType == "transitionout") {
            if(effect.reverseOut) {
                // Run effect backwards on transition out
                currentAnimation.reverse = true;
                effect.prepareParameters("source", nextAnimation, this.effectConfig, source);
            } else {
                // XXX: Should not really happen?
                effect.prepareParameters("target", nextAnimation, this.effectConfig, target);
            }
        }


    },

    /**
     *
     * @param window Seek window in seconds
     *
     * @param clock Clock in song time
     *
     * @return Next beat in song time or clock if no data avail
     */
    findNextBeat : function(clock, window) {

        // No rhytm data available
        if(!this.analysis) {
            return clock;
        }

        window = window || this.seekWindow;

        var beat = this.analysis.findNextBeat(clock);

        var start = beat.start / 1000;

        if(start - clock > window) {
            return clock;
        }

        return start;
    },


    findNextBar : function(clock, window) {

        // No rhytm data available
        if(!this.analysis) {
            return clock;
        }

        window = window || this.seekWindow;

        var bari = this.analysis.findNextBar(clock);
        var bar = this.rhythmData.bars[bari];

        var start = bar.start / 1000;

        if(start - clock > window) {
            return clock;
        }

        return start;
    },


    findCurrentBarStart : function(clock, window) {

        // No rhytm data available
        if(!this.analysis) {
            return clock;
        }

        window = window || this.seekWindow;

        var bari = this.analysis.findBarAtClock(clock);

        if(bari < 0) {
            return clock;
        }

        var bar = this.rhythmData.bars[bari];

        var start = bar.start / 1000;

        if(Math.abs(start - clock) > window) {
            return clock;
        }

        return start;
    },



    /**
     * Assume we have the same animation effects for the whole show and just repeat the same animation effect for each element.
     *
     * Unless we are using random effect and then just pick from the list in the configuration.
     */
    getEffectForAnimation : function(settings, animation, input) {

        var effectType;

        var animationType = animation.type;

        // This element overrides transitions
        var inputTransitions = input.transitions || {};
        var transitionIn = inputTransitions.transitionIn || settings.transitionIn;
        var transitionOut = inputTransitions.transitionOut || settings.transitionOut;
        var onScreen = inputTransitions.onScreen || settings.onScreen;


        if(animationType == "transitionin") {
            effectType = transitionIn.type;
        } else if(animationType == "onscreen") {
            effectType = onScreen.type;
        } else if(animationType == "transitionout") {
            effectType = transitionOut.type;
        } else {
            throw "Unknown animation type:" + animationType;
        }

        if(effectType == "random") {
            if(animationType == "onscreen") {
                effectType = krusovice.utils.pickRandomElement(this.onScreenEffects);
            } else if(animationType == "transitionout") {
                effectType = krusovice.utils.pickRandomElement(this.transitionOutEffects);
            } else {
                effectType = krusovice.utils.pickRandomElement(this.transitionInEffects);
            }
        }

        return effectType;
    }

};

/**
 * Shortcut to create a presentation easily.
 *
 * @param {Object} transitions As described in {@link krusovice#Design} transitions
 *
 * @param elements Array of input blocks
 *
 * @param rhythmData Echo nest API data or null if no music
 *
 * @param {Number} musicStartTime adjust music start time +- X seconds
 *
 */
krusovice.Timeliner.createSimpleTimeliner = function(elements, rhythmData, transitions, musicStartTime) {

    // transitions.musicStartTime -> old way, should be given explicitly
    if(transitions) {
        musicStartTime = musicStartTime || transitions.musicStartTime;
    }

    // Default to zero
    musicStartTime = musicStartTime || 0;

    var input = {
        showElements : elements,
        rhythmData : rhythmData,
        settings : transitions||krusovice.Timeliner.defaultSettings,
        transitionInEffects : krusovice.effects.Manager.getIds("transitionin"),
        transitionOutEffects : krusovice.effects.Manager.getIds("transitionout"),
        onScreenEffects: krusovice.effects.Manager.getIds("onscreen"),
        musicStartTime : musicStartTime
    };

    return new krusovice.Timeliner(input);
};

/**
 * How long the object stays on the screen (without stepping time)
 *
 * @param {Object} elem krusovice.TimelineElement
 *
 * @param {Boolean} spacing True to include the spacing time
 */
krusovice.Timeliner.getElementDuration = function(elem, spacing) {

    var duration = 0;
    for(var i=0; i<elem.animations.length-1; i++) {
        duration += elem.animations[i].duration;
    }

    if(spacing) {
        duration += elem.spacingTime;
    }

    return duration;
};

/**
 * Get the total length of the show.
 */
krusovice.Timeliner.getTotalDuration = function(plan) {

    var stopPoint;

    if(plan && plan.length >= 1) {
        var lastElem = plan[plan.length - 1];
        var duration = krusovice.Timeliner.getElementDuration(lastElem, true);
        stopPoint = lastElem.wakeUpTime + duration;
    } else {
        stopPoint = 0;
    }

    return stopPoint;
};

/**
 * Default settings used in planning
 *
 * @class krusovice.Timeliner.defaultSettings
 * @singleton
 */
krusovice.Timeliner.defaultSettings = {

    // Time in seconds where song starts playing
    musicStartTime : 0,

    transitionIn : {
        type : "zoomin",
        duration : 2.0
    },

    transitionOut : {
        type : "zoomfar",
        duration : 2.0,
        clockSkip : 0.0 // How many seconds we adjust the next object coming to the screen
    },

    onScreen : {
        type : "slightmove",
        duration : 2.0
    }
};
});
