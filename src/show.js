/*global define*/
define("krusovice/show", ['jquery_bundle', 'krusovice_base'], function($, krusovice) {
"use strict";

/**
 * HTML5 canvas photo show which is too cool to kick llama's ass
 *
 * - Construct show based on timeline input and show settings (background, etc).
 *   These are given in the configuration.
 *
 * - Bind Show object to {@link krusovice.Show#bindToAudio HTML5 audio playback} or if you have no music
 *   use real-time object. You need to have something calling onClock() method or animation won't
 *   go anywhere.
 *
 * - Call {@link krusovice.Show#prepare prepare()} method to start async media loading
 *
 * - {@link krusovice.Show#play play()} will be called automatically by associated clock source
 *
 * @param {Object} cfg Configuration object
 */
krusovice.Show = function(cfg) {
    $.extend(this, cfg);

    if(!this.loader) {
        this.loader = new krusovice.Loader();
    }

};

krusovice.Show.prototype = {

    /**
     * @cfg {Object} elem jQuery wrapped DOM element which will contain the show.
     *
     * Can be null for testing (rendering is 100% hidden)
     */
    elem : null,

    /**
     * @cfg {Array} timeline Timeline of {krusovice.TimelineElement} elements
     */
    timeline : null,

    /**
     * @cfg {Number} width Show width in pixels
     */
    width : 512,

    /**
     * @cfg {Number} height Show height in pixels
     */
    height : 288,

    /**
     * @cfg {Boolean} controls Draw start/stop or not
     */
    controls : false,

    /**
     * @cfg {Number} musicStartTime Song position where the playback stars (seconds)
     */
    musicStartTime : 0,


    /**
     * Show design object
     */
    design : null,

    /**
     * @cfg {String} songURL URL to the background music
     */
    songURL : null,

    /**
     * @cfg {Object} Use WebGL renderer: true, false or "auto"
     */
    webGL : "auto",

    /**
     * @cfg {Boolean} preview
     *
     * Take some steps in order to optimize speed and network bandwidth and have less quality output.
     */
    preview : false,

    /**
     * @cfg {String|Object} previewWarningMessage
     *
     * Show this message when preview is in progress. It can be string or jQuery object whose text() value is used.
     */
    previewWarningMessage : null,

    /**
     * @cfg {Object} rhythmData Echo Nest API data for rhythm used to animate background effects
     */
    rhythmData : null,

    /**
     * Set to true when all necessary data is loaded to start the playback
     */
    loaded : false,

    /**
     * Is play currently in progress
     */
    playing : false,


    /**
     * @type Number
     *
     * How many frames we have rendered
     */
    currentFrame : 0,


    /**
     * List of animated objects in this show
     */
    animatedObjects : null,

    /**
     * @cfg {Object} Background renderer
     */
    background : null,

    /**
     * <canvas> used as the main output element
     */
    canvas : null,

    /**
     * 2D context of the <canvas>
     */
    ctx : null,

    /**
     * Pseudo 3d backend to render animated show objects
     */
    renderer : null,

    events :[
        /**
         * @event
         *
         * Fired when the show loading starts in prepare()
         */
        "loadstart",

        /**
         * @event
         *
         * Fired when the show loading is going on
         *
         * @param {Number} progress 0...1 how done we are
         */
        "loadprogress",

        /**
         * @event
         *
         * Fired when loading is done and we are ready to play
         *
         */
        "loadend",

        /**
         * @event
         *
         * Fired for every error when loading resources.
         *
         */
        "loaderror",

        /**
         * @event
         *
         *
         * Fired after both on load error or on load sucesss.
         */
        "loaddone"
    ],

    /**
     * krusovice.Loader used to book keeping of async media loading progress
     */
    loader : null,


    /**
     * @type String
     *
     * If non-null this is error from prepare() of async dealing with media
     */
    errorMessage : null,

    /**
     * @type Number
     *
     * Time in seconds since the starting of the animation.
     *
     * Set by onClock() callback as we usually sync the animation to external audio or video source.
     */
    clock : 0,

    /**
     * When the clock was last time updated - as <audio> time update events post too slowly,
     * we need to estimate the audio clock during the timeupdate calls.
     */
    clockUpdated : 0,

    /**
     * @type Boolean
     *
     * Is this real-time playback or not
     *
     * Whether or not the show player should try to estimate the clock between onClock() calls.
     */
    realtime : true,




    /**
     * Control individual render layers.
     *
     * Most useful for debugging.
     */
    renderFlags : {
          background : true,
          scene : true
    },

    /**
     * Start async media loading and preparation.
     *
     * Will set loaded flag and fire loaded event when ready.
     *
     */
    prepare : function() {

        if(this.webGL == "auto") {
            this.webGL = krusovice.utils.hasWebGL();
            console.log("Initializing show. WebGL support:" + this.webGL);
        }

        this.prepareCanvas();
        this.prepareRenderer();
        this.prepareTimeline();
        this.prepareBackground();
        this.preparePreviewWarning();
        this.loadResources();
    },

    /**
     * Free are resources associated with this show.
     *
     * After this call this Show object is no longer useable.
     */
    release : function() {
        //this.canvas = null;
        //this.animatedObjects = null;
    },

    /**
     * ASync waiting loop until are resources are loaded
     */
    loadResources : function() {

        var $this = $(this);
        var self = this;

        function loadcb(progress) {
            $this.trigger("loadprogress", progress);
        }


        function loaderror(msg, progress) {
            console.log("Triggering loaderror");
            self.errorMessage = msg;
            $this.trigger("loaderror", [msg]);
        }


        function loaddone() {
            self.loaded = true;
            console.log("All show resources loaded, error status:" + self.errorMessage);
            if(!self.errorMessage) {
                $this.trigger("loadend");
            }
            $this.trigger("loaddone");
        }

        this.loader.callback = loadcb;
        this.loader.errorCallback = loaderror;
        this.loader.allLoadedCallback = loaddone;


        console.log("Starting loading, total objects " + this.loader.totalElementsToLoad);

        $this.trigger("loadstart");

        function cb(success, errorMessage) {
            if(success) {
                self.loader.mark("animatedobject", 1);
            } else {
                console.log("Got error:" + errorMessage);
                self.loader.fireError(errorMessage);
                self.loader.mark("animatedobject", 1);
            }
        }


        for(var i=0; i<this.animatedObjects.length; i++) {
            console.log("Preparing anim object:" + i);
            var e = this.animatedObjects[i];
            e.prepareCallback = cb;
            e.prepare(self.loader, this.width, this.height);
        }

    },

    /**
     * Create animated objects based on timeline input data
     */
    prepareTimeline : function() {

        var self = this;
        var timeline;

        this.animatedObjects = [];

        // XXX: fix all tests to use show.timeline as input
        if(this.design) {
            // DEPRECATE ME
            timeline = this.design.timeline;
        } else {
            timeline = this.timeline;
        }

        if(!timeline) {
            // no animated objects
            return;
        }

        timeline.forEach(function(e) {
            var obj = self.createAnimatedObject(e);
            console.log("Created animated object " + obj);
            self.animatedObjects.push(obj);
            self.loader.add("animatedobject", 1);
        });

        if(timeline.length != this.animatedObjects.length) {
            console.error("arg");
            throw "Somehow failed";
        }
    },

    /**
     * Create a <canvas> and place it in the parent container
     */
    prepareCanvas : function() {

        var $canvas = $("<canvas width=" + this.width + " height=" + this.height + ">");

        if(this.elem !== null) {
            this.elem.find("canvas").remove();
            this.elem.append($canvas);
        }
        this.canvas = $canvas.get(0);
        this.ctx = this.canvas.getContext("2d");

    },

    /**
     * Build background data and add all medias to the loader
     */
    prepareBackground : function() {


        var duration = this.getDuration();

        var background;

        if(!this.background) {
            // Use default white background
            background = {
                type : "plain",
                color : "#ffffff"
            };
        } else {

            if(this.background.backgroundId) {
                // Use stock background
                // Apply default backgroudn settings by id
                // then custom settings
                background = $.extend({}, krusovice.backgrounds.Registry.get(this.background.backgroundId), this.background);
            } else {
                // Totally custom background
                background = this.background;
            }

        }

        var timeline = this.timeline;

        this.background = krusovice.backgrounds.createBackground(background.type,
                                                                 duration,
                                                                 timeline,
                                                                 this.rhythmData,
                                                                 background);
        this.background.prepare(this.loader, this.width, this.height);
    },

    /**
     * Create 3d renderer backend
     */
    prepareRenderer : function() {

        // XXX: hardcoded for THREE.js now
        this.renderer = new krusovice.renderers.Three({
            width : this.width,
            height : this.height,
            elem : this.elem,
            webGL : this.webGL
        });

        this.renderer.setup();
    },

    preparePreviewWarning : function() {
        if(this.previewWarningMessage) {
            if(typeof(this.previewWarningMessage) != 'string') {
                this.previewWarningMessage = $(this.previewWarningMessage).text();

                if(!this.previewWarningMessage) {
                    throw "Preview warning message cannot be found";
                }
            }
        }
    },

    /**
     * Factory of matching input data to actual animated objects.
     *
     * Renderer must be set up in this point
     */
    createAnimatedObject : function(timelineInput) {

        var cfg = {
            renderer : this.renderer,
            data : timelineInput
        };

        if(timelineInput.type == "image") {
            var obj = new krusovice.showobjects.FramedAndLabeledPhoto(cfg);
            return obj;
        } else if(timelineInput.type == "text") {
            return new krusovice.showobjects.Text(cfg);
        } else {
            throw "Unknown timeline input type:" + timelineInput.type;
        }
    },

    /**
     * Start animation frame requesting loop.
     *
     * Show must be prepared and loaded in this point.
     *
     * You must have something feeding clock to onClock() or the animation won't move anywhere.
     *
     */
    play : function() {

        console.log("Show playing start");

        if(this.playing) {
            return;
        }

        this.playing = true;

        this.loopAnimation();
    },

    /**
     * Stop playing the show
     */
    stop : function() {
        console.log("Show stopping");
        this.playing = false;

        if(this.realtime) {
            this.clockUpdated = 0;
            this.clock = 0;
        }
    },


    /**
     * @return {Number} How many seconds this show is long
     */
    getDuration : function() {

        var stopPoint;

        if(this.animatedObjects && this.animatedObjects.length >= 1) {
            var lastElem = this.animatedObjects[this.animatedObjects.length - 1];

            // TimelineElement of last animated object
            var tl = lastElem.data;

            var duration = 0;

            for(var i=0; i<tl.animations.length-1; i++) {
                duration += tl.animations[i].duration;
            }

            stopPoint = tl.wakeUpTime + duration;

        } else {
            stopPoint = 0;
        }


        return stopPoint;
    },

    /**
     * Check if we have played all objects.
     *
     * Compare current object against the timeline length.
     *
     * @return {Boolean} true if this show has nothing more to show
     */
    isFinished : function() {
        var stopPoint = this.getDuration();
        return this.clock > stopPoint;
    },

    /**
     * Main rendering loop.
     *
     * Redraws <canvas> using the frame rate given by the browser
     * until this.playing flag is unset by stop().
     *
     */
    loopAnimation : function() {


        var self = this;
        function loop() {
            self.loopAnimation();
        }


        if(this.playing) {
            this.render();
            krusovice.utils.requestAnimationFrame(loop);
        }
    },

    /**
     * Request rendering.
     *
     * Can be manually called after onClock(). Automatically called when playing.
     */
    requestAnimationFrame : function() {
        //krusovice.utils.requestAnimationFrame($.proxy(this.render, this), this.canvas);
        setTimeout($.proxy(this.render, this), 10);
    },

    render : function() {

        if(this.errorMessage) {
            this.renderError(this.errorMessage);
            return;
        }


        if(!this.loaded) {
            throw "Tried to call render() before loading was done";
        }

        this.currentFrame += 1;

        var renderClock = this.getEstimatedClock();


        this.renderAnimateObjects(renderClock);

        //console.log("Slicing frame " + this.currentFrame + " clock:" + renderClock);
        this.renderBackground(renderClock);
        this.renderScene(renderClock);
        //this.renderFrameLabel(renderClock);
        this.renderPreviewWarningMessage(renderClock);
    },

    /**
     * Render the video background buffer
     */
    renderBackground : function(renderClock) {

        if(!this.renderFlags.background) {
            return;
        }

        if(this.background) {
            this.background.render(this.ctx, renderClock);
        }

    },

    renderScene : function() {

        if(!this.renderFlags.scene) {
            return;
        }

        this.renderer.render(this.ctx);
    },

    /**
     * We cannot render the show due to loading phase error.
     *
     * Make sure we notice it.
     */
    renderError : function(msg) {
        var ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#FFffFF";
        ctx.fillText(msg, 20, 20);
        ctx.restore();
    },

    /**
     * Debugging helper printing data of this
     *
     *
     * @param {Number} renderClock The rendering clock time that should be used for this frame
     */
    renderFrameLabel : function(renderClock) {
        // http://diveintohtml5.org/canvas.html#text
        var ctx = this.ctx;
        // round to 3 decimals

        function round(x) {
            return Math.round(x*1000)/1000;
        }


        var clock = round(renderClock);
        var external = round(this.clock);
        var sync = round(this.clockUpdated);

        ctx.save();
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("Rendering frame " + this.currentFrame + " render clock:" + clock + " external clock:" + external + " last sync:" + sync, 20, 20);
        ctx.restore();
    },

    /**
     * Render the show animated objects.
     *
     * @param {Number} renderClock The rendering clock time that should be used for this frame
     */
    renderAnimateObjects : function(renderClock) {

        if(!this.animatedObjects) {
            return;
        }

        this.animatedObjects.forEach(function(obj) {
            var state = obj.animate(renderClock);
            obj.render();
            // console.log("Clock " + renderClock + " animated object " + e.data.id + " state " + state);
        });
    },


    renderPreviewWarningMessage : function(clock) {

        // Don't render empty box
        if(!this.previewWarningMessage) {
            return;
        }

        var ctx = this.ctx;

        ctx.save();
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";

        // Place text center bottom of the screen
        var dimensions = ctx.measureText(this.previewWarningMessage);

        var x = this.width/2 - dimensions.width/2;
        var y = this.height * 0.8;
        var border = 10;
        var w = dimensions.width;

        // XXX: use Mozilla API on FF and font baseline
        var h = dimensions.height || 10; // textMetrics object does not have height info!

        ctx.strokeStyle = "#ffFFff";
        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
        ctx.lineWidth = 2;
        krusovice.utils.fillRoundedRect(ctx, x-border, y-border, w+border*2, h+border*2, 3);

        ctx.fillStyle = "#ffFFff";
        ctx.fillText(this.previewWarningMessage, x, y + h);
        ctx.restore();

    },

    /**
     * Receive clock signal from external source
     *
     * @param {Number} clock Clock signal in seconds
     */
    onClock : function(clock) {
        this.clock = clock;
        if(this.realtime && this.playing) {
            this.clockUpdated = (new Date().getTime()) / 1000;
        }

    },

    /**
     * Calculate the rendering clock from the last clock timestamp.
     *
     * If we are in real-time mode estimate the current clock value between time update calls.
     */
    getEstimatedClock : function() {
        var now = (new Date().getTime()) / 1000;

        if(this.realtime && this.playing) {
            // We can calculate estimation only if we are in continuous playback mode
            // and not e.g. on seek
            return this.clock + (now - this.clockUpdated);
        } else {
            return this.clock;
        }
    },

    /**
     * We are forcing in new clock signal and all real-time clock calculations should be reseted.
     */
    resetClock : function() {
        this.clockUpdated = null;
    },



    /**
     * Bind this show to HTML5 <audio> player.
     *
     * The show will listen to events from the audio object and
     * will use its clock to adjust own playback.
     *
     * @param {HTML5Audio} audio HTML5 audio element / player
     *
     * @param loadAsResource Add MP3 file to the show resources loading chain
     *
     * @return {Object} controller object for the playback
     */
    bindToAudio : function(audio, loadAsResource) {

        var self = this;

        if(!audio) {
            throw "You should give that audio element";
        }

        function onTimeUpdate() {

            //console.log("timeupdate");

            var ctime = audio.currentTime;
            ctime -= self.musicStartTime;
            self.onClock(ctime);

            // Send in render event if we are not in playback mode
            // to visualize the current position on audio
            if(!self.playing) {
                console.log("forcing rendering");
                self.resetClock();
                self.requestAnimationFrame();
            }
        }

        //
        $(audio).bind("timeupdate", onTimeUpdate);
        $(audio).bind("play", $.proxy(this.play, this));
        $(audio).bind("pause", $.proxy(this.stop, this));


        // User has moved time slider in Audio
        /*
        function onSeekEnd() {
            var ctime = audio.currentTime;
            ctime -= this.musicStartTime;
            this.onClock(ctime);

            console.log("seekend");


        }
        $(audio).bind("seekend", $.proxy(onSeekEnd, this));
        */



        /*
         * HAVE_NOTHING (0) No data available

            HAVE_METADATA (1) Duration and dimensions are available

            HAVE_CURRENT_DATA (2) Data for the current position is available

            HAVE_FUTURE_DATA (3) Data for the current and future position is available, so playback could start

            HAVE_ENOUGH_DATA (4) Enough data to play the whole video is available
         */

        // http://www.chipwreck.de/blog/2010/03/01/html-5-video-dom-attributes-and-events/
        if(loadAsResource) {
            if(audio.readyState < 4) {
                //
                $(audio).bind("canplaythrough", function() {
                    self.loader.mark("audio", 1);
                });

                this.loader.add("audio", 1);
            }
        }

        return audio;
    },


    /**
     * Play the with no background music using system clock as the clock source.
     *
     * @return {Object} Controller object with play() and pause() methods
     */
    bindToClock : function() {

        var self = this;
        var startTime = null;
        var handle = null;

        var controller = {

            tick : function() {
                var now = (new Date().getTime());
                self.onClock((now - startTime) / 1000);
            },

            play : function() {
                startTime = (new Date().getTime());
                handle = setInterval(this.tick, 500);
                self.onClock(0);
                self.play();
            },

            pause : function() {
                self.stop();
                console.log("Clearing inteval()");
                clearInterval(handle);
                console.log("Done");
            }
        };

        return controller;

    },


    /**
     * 2D canvas context used to record the video.
     *
     * This communicates to the external script which can slice frames out of the show for video encoding.
     */
    getCaptureCanvasContext : function() {
        return this.ctx;
    }

};
});
