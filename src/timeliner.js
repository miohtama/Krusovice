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
    barMatchFactor : 1.1, // Actual duration can be 100% + 100% from the suggested duration

    /**
     * How many seconds we can spend try to find a matching bar/beat
     */
    seekWindow : 3,

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
            var prev = i > 0 ? this.showElements[i-1] : null;

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

            var instant = (prev && prev.steppingTime === 0);

            // Place element on the timeine based on our current clock
            this.timeAnimations(out, elem, clock, elem.duration, instant);

            this.prepareAnimations(out, elem);

            console.log("Got out");
            console.log(out);

            // Advance clock to the start of the next show item based on how
            // long it took to show this item
            if(i == this.showElements.length-1) {
                out.spacingTime = this.coolingTime;
            } else {
                if(elem.steppingTime !== undefined) {
                    out.spacingTime = elem.steppingTime;
                } else {
                    out.spacingTime = this.steppingTime;
                }
            }

            var duration = krusovice.Timeliner.getElementDuration(out, true);

            console.log("Total duration:" + duration);

            //clock += duration;

            // Match clock to the wake up time + duration adjustment
            clock = out.wakeUpTime + duration;

            if(!clock) {
                console.error("Bad clock value after adding an input element: clock:" + clock + " duration:" + duration);
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
    timeAnimations : function(out, source, clock, onScreenDuration, instant) {

        var settings = this.settings;
        var transitionIn = this.settings.transitionIn;
        var transitionOut = this.settings.transitionOut;

        var sourceTransitions = source.transitions || { transitionIn : {}, transitionOut : {}, onScreen : {} };

        var tid = sourceTransitions.transitionIn.duration || settings.transitionIn.duration;
        var tod = sourceTransitions.transitionOut.duration || settings.transitionOut.duration;
        var onScreen = sourceTransitions.onScreen.duration || settings.onScreen.duration;

        var testDelta = 0.1; // seconds
        var musicStartTime = this.musicStartTime;

        // We operate in song clock time to make rhytm matching calcs easier
        var songClock = clock + musicStartTime;

        // on screen effect starts time in song time

        var hitsIn = 0;
        var hitsScreenSeek = songClock + transitionIn.duration;
        var hitsScreen;
        var matchMode = "none";
        var percents = 0;
        var inBarDuration;
        var transitionInDuration;
        var match;

        out.animations = [
             // transition in
             new krusovice.TimelineAnimation({
                    type : "transitionin",
                    duration : tid
             }),

             // on screen
             new krusovice.TimelineAnimation({
                    type : "onscreen",
                    duration : onScreenDuration
             }),

             // transition out
             new krusovice.TimelineAnimation({
                     type : "transitionout",
                    duration : tod
             }),


             // gone
             new krusovice.TimelineAnimation({
                    type : "gone",
                    duration : 0
             })


        ];

        var hitsInSeek = songClock, hitsOutSeek, hitsOut;
        var hardStart = -1;
        var i;
        var suggestedDuration, actualDuration;
        var a;
        var bar;
        var duration;

        // Don't leave any spacing from the previous slide
        if(instant) {
            console.log("Got instant clock for:" + songClock);
            hardStart = songClock;
        }

        // First match animation start with bar start, beat start or none
        // Then match animation end with bar start, beat start or none

        for(i=0; i<out.animations.length; i++) {

            a = out.animations[i];

            // Terminator or otherwise invalid animation
            if(a.duration === 0) {
                continue;
            }

            // This animation start is set by the previous cycle
            if(hardStart >= 0) {
                hitsIn = hardStart;
                matchMode = "hard-set";
            } else {

                // First try match bar, then beat
                bar = this.seekBar(hitsInSeek);

                if(bar) {
                    hitsIn = bar.start / 1000;
                    matchMode  = "bar";
                    console.log(bar);
                } else {
                    // This will fall back to current clock if not beat avail
                    hitsIn = this.findNextBeat(hitsInSeek);
                    if(hitsIn == hitsInSeek) {
                        matchMode  = "none";
                    } else {
                        matchMode  = "beat";
                    }
                }

            }

            console.log("Matching anim start: " + a.type + " hits in seek:" + hitsInSeek + " hits in:" + hitsIn + " match mode:" + matchMode);

            a.start = hitsIn;

            // Then match end

            // Use default transition in duration
            suggestedDuration = a.duration;
            actualDuration = suggestedDuration;

            // Check if we can fit the transition in to a bar
            match = false;
            matchMode = "none";
            percents = 0;
            duration = 0;

            if(!suggestedDuration || isNaN(suggestedDuration)) {
                console.error(a);
                throw "The animation has not proper duration set";
            }

            hitsOutSeek = hitsIn + suggestedDuration;
            bar = this.seekBar(hitsOutSeek);

            if(bar) {

                hitsOut = bar.start / 1000;

                duration = (hitsOut - hitsIn);
                percents = Math.abs(duration - suggestedDuration) / suggestedDuration;

                if(percents < this.barMatchFactor) {
                    actualDuration = duration;
                    match = true;
                    matchMode = "next-bar";
                } else {
                    console.log("Next bar fail, percents:" + percents + " factor:" + this.barMatchFactor);
                }

                // Then try match to previous bar if not matched
                if(!match && bar.previousBar) {

                    bar = bar.previousBar;

                    hitsOut = bar.start / 1000;

                    duration = (hitsOut - hitsIn);

                    if(duration > 0) {

                        percents = Math.abs(duration - suggestedDuration) / suggestedDuration;

                        if(percents < this.barMatchFactor) {
                            actualDuration = duration;
                            match = true;
                            matchMode = "previous-bar";
                        } else {
                            console.log("Previous bar fail, percents:" + percents);
                        }

                    }
                }

            }

            if(!match) {
                // Try beat

                // This will fall back to current clock if not beat avail
                hitsOut = this.findNextBeat(hitsOutSeek);

                if(hitsOut < 0 || isNaN(hitsOut)) {
                    throw "Bad beat timing:" + hitsOut;
                }

                if(hitsIn == hitsInSeek) {
                    matchMode  = "none";
                } else {
                    matchMode  = "beat";
                }

                actualDuration = hitsOut - hitsIn;

            }

            console.log("Matching anim end: " + a.type + " suggested duration:" + suggestedDuration + " actual duration:" + actualDuration + " hits out seek:" + hitsOutSeek + " hits out:" + hitsOut + " match mode:" + matchMode + " bar match duration:" + duration + " percents:" + percents);

            a.duration = actualDuration;

            if(actualDuration === 0 || isNaN(actualDuration)) {
                throw "Failed to calculate a proper duration for an element";
            }

            // Where the next anim shall begin
            hardStart = a.start + a.duration;

        }

        // Set the first animation appearing time in show clock
        out.wakeUpTime = out.animations[0].start;

        return out;

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

        if(!beat) {
            return clock;
        }

        var start = beat.start / 1000;

        if(start - clock > window) {
            return clock;
        }

        return start;
    },


    /**
     * Find a matching bar next bar index, starting from the clock
     */
    seekBar : function(clock, window) {

        // No rhytm data available
        if(!this.analysis) {
            return null;
        }

        window = window || this.seekWindow;

        var bari = this.analysis.findNextBar(clock);

        if(bari < 0) {
            return null;
        }

        var bar = this.rhythmData.bars[bari];
        if(bari >= 1) {
            bar.previousBar = this.rhythmData.bars[bari-1];
        }

        return bar;

    },

    /**
     * Find matching clock for a bar start position
     */
    findNextBar : function(clock, window) {

        var bar = this.seekBar(clock, window);

        if(!bar) {
            return clock;
        }

        var start = bar.start / 1000;

        console.log("Bar match start:" + start +  " clock:" + clock + " bar start:" + bar.start);

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
    },


    /**
     * Copy krusovice.Design timeliner created variables to this instance.
     */
    updateFromDesign : function(design) {
        // Adjust timing parameters
        this.leadTime = design.leadTime;
        this.coolingTime = design.coolingTime;
        this.steppingTime = design.steppingTime;
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
        //console.log("Duration:" + elem.animations[i].duration);
        duration += elem.animations[i].duration;
    }

    if(spacing) {
        duration += elem.spacingTime;
        //console.log("Spacing:" + elem.spacingTime);
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
