"use strict";

var krusovice = krusovice || {};

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
    
}

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
    timeline : [],

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
     * @cfg {String} backgroundEffectId Used background (beat reacting) effect id
     */
    backgroundEffectId : null,

    /**
     * @cfg {String} backgroundType What kind of background we have (video, pic, gradient)
     */
    backgroundType : "plain",
         
    videoURL : null,
    pictureURL : null,
    plainColor : null,
    gradientStart : null,
    gradientEnd : null,              

    /**
     * @cfg {String} songURL URL to the background music 
     */    
    songURL : null,   

    /**
     * @cfg {Object} rhytmData Echo Nest API data for rhytm used to animate background effects 
     */        
    rhytmData : null,
    
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
    animatedObjects : [],
        
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
         * Fired when all resources could not be loaded
         *
         */
        "loaderror",
        
    ],
    
    /**
     * krusovice.Loader used to book keeping of async media loading progress 
     */
    loader : null,
    
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
     * Start async media loading and preparation.
     *
     * Will set loaded flag and fire loaded event when ready.
     * 
     */    
    prepare : function() {      
        this.prepareCanvas();
		this.prepareRenderer();      
		this.prepareTimeline();
        this.loadResources();
    },

    /**
     * ASync waiting loop until are resources are loaded
     */
    loadResources : function() {
                       
        var $this = $(this);
                           
        function loadcb(progress) {
            $this.trigger("loadprogress", progress);  
            
            if(progress >= 1) {
                this.loaded = true;
                console.log("Show resources loaded");
                $this.trigger("loadend");
            }
        }   
        
        
        function loaderror(msg) {
            console.log("Triggering loaderror");
            $this.trigger("loaderror", [msg]);
        }
        
        this.loader.callback = loadcb;
        this.loader.errorCallback = loaderror;

        console.log("Starting loading, total objects " + this.loader.totalElementsToLoad);
                 
        $this.trigger("loadstart");        

        function cb(success, errorMessage) {
            if(success) {
                self.loader.mark("animatedobject", 1);
            } else {
                console.log("Got error:" + errorMessage);
                self.loader.setError(errorMessage);
            }
        }
        
                
        var self = this;
                
        this.animatedObjects.forEach(function(e) {
            e.prepareCallback = cb;
            e.prepare(); 
        });     
        
    },
    
    /**
     * Create animated objects based on timeline input data
     */    
    prepareTimeline : function() {        
        
        var self = this;
        
        this.timeline.forEach(function(e) {            
            var obj = self.createAnimatedObject(e);
            console.log("Created animated object " + obj);
            self.animatedObjects.push(obj);                 
            self.loader.add("animatedobject", 1);
        });
    },
    
    /**
     * Create a <canvas> and place it in the parent container
     */
    prepareCanvas : function() {
                
        var $canvas = $("<canvas width=" + this.width + " height=" + this.height + ">");
        
        if(this.elem !== null) {
            this.elem.append($canvas);
        }        
        this.canvas = $canvas.get(0);
        this.ctx = this.canvas.getContext("2d");
        
    },    
    
    /**
     * Create 3d renderer backend
     */
    prepareRenderer : function() {

    	// XXX: hardcoded for THREE.js now
    	this.renderer = new krusovice.renderers.Three({
    		width : this.width,
    		height : this.height,
    		elem : this.elem
    	});
    	
    	this.renderer.setup();
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
            return new krusovice.showobjects.TextFrame(cfg);            
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
    
    stop : function() {      
        this.playing = false;  
    },
    
    /**
     * Main rendering loop.
     *
     * Redraws <canvas> using the frame rate given by the browser
     * until this.playing flag is unset by stop().
     * 
     */
    loopAnimation : function() {
        if(this.playing) {
            this.render();                   
            krusovice.utils.requestAnimationFrame($.proxy(this.loopAnimation, this), this.canvas);
        }         
    },
    
    render : function() {                       
        this.currentFrame += 1;
        
        var renderClock = this.getEstimatedClock();
        
        this.animateObjects(renderClock);
        
        //console.log("Slicing frame " + this.currentFrame + " clock:" + renderClock);
        this.renderBackground(renderClock);       
        this.renderScene(renderClock);
        this.renderFrameLabel(renderClock); 
    },
    
    /**
     * Render the video background buffer
     */
    renderBackground : function(renderClock) {
        var ctx = this.ctx;       

        if(this.backgroundType == "plain") {
            // Single colour bg
            // https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas
            ctx.save();
            ctx.fillStyle = this.plainColor; //"rgba(200,200,200,0.3)";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else if(this.backgroundType == "clear") {
            // Transparent bg
            // http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
            ctx.clearRect (0, 0, this.width, this.height);
        } else {
            throw "Unknown background type:" + this.backgroundType;
        }
    },
    
    renderScene : function() {
    	this.renderer.render(this.ctx);
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
        ctx.save()
        ctx.font = "bold 12px sans-serif"
        ctx.fillText("Rendering frame " + this.currentFrame + " at " + Math.round(renderClock*1000)/1000, 20, 20);
        ctx.restore();
    },
    
    /**
     * Render the show animated objects.
     *
     * @param {Number} renderClock The rendering clock time that should be used for this frame
     */
    renderAnimateObjects : function(renderClock) {
        this.animatedObjects.forEach(function(e) {
        	var state = e.animate(renderClock);
        	// console.log("Clock " + renderClock + " animated object " + e.data.id + " state " + state);
        });
    },
    
    /**
     * Receive clock signal from external source
     *
     * @param {Number} 
     */
    onClock : function(clock) {        
        this.clock = clock;
        if(this.realtime) {
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
        
        if(this.realtime) {
            return this.clock + (now - this.clockUpdated);
        } else {
            return this.clock;
        }
    },


    
    
    /**
     * Bind this show to HTML5 <audio> player.
     *
     * The show will listen to events from the audio object and 
     * will use its clock to adjust own playback.
     * 
     * @param {HTML5Audio} audio HTML5 audio element / player
     */
    bindToAudio : function(audio) {
        
        function onTimeUpdate() {
            var ctime = audio.currentTime;
            ctime /= 1000;
            ctime -= this.musicStartTime;
            this.onClock(ctime);
        } 
        
        // 
        $(audio).bind("timeupdate", $.proxy(onTimeUpdate, this));
        $(audio).bind("play", $.proxy(this.play, this));
        $(audio).bind("pause", $.proxy(this.stop, this));
        
        /*
         * HAVE_NOTHING (0) No data available

            HAVE_METADATA (1) Duration and dimensions are available
            
            HAVE_CURRENT_DATA (2) Data for the current position is available
            
            HAVE_FUTURE_DATA (3) Data for the current and future position is available, so playback could start
            
            HAVE_ENOUGH_DATA (4) Enough data to play the whole video is available
         */
        
        var self = this;
        // http://www.chipwreck.de/blog/2010/03/01/html-5-video-dom-attributes-and-events/
        if(audio.readyState < 4) {
            // 
            $(audio).bind("canplaythrough", function() {
                self.loader.mark("audio", 1);
            });
            
            this.loader.add("audio", 1);            
        }
    }
           
}
