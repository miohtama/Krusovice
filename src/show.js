var krusovice = krusovice || {};

/**
 * HTML5 <canvas> photo show kicking llama's ass 
 *
 * @param {krusovice.Show} cfg Show to play 
 */
krusovice.Show = function(cfg) {
    $.extend(this, cfg);
    
    if(!this.loader) {
        this.loader = new krusovice.Loader();        
    }
}

krusovice.Show.prototype = {

    /**
     * @cfg {Object} jQuery wrapped DOM element which will contain the show 
     */
    elem : null,

    /**
     * @cfg {Array} timeline Timeline of show elements
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
    play : false,
    
    /**
     * List of animated objects in this show
     */
    animatedObjects : [],
        
    /**
     * <canvas> used as the main output element
     */
    canvas : null,
    
    ctx : null,
    
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
    ],
    
    /**
     * krusovice.Loader used to book keeping of async media loading progress 
     */
    loader : null,
            
    /**
     * Start async media loading and preparation.
     *
     * Will set loaded flag and fire loaded event when ready.
     * 
     */    
    prepare : function() {       
         this.prepareCanvas();
    },

    prepareLoop : function() {
                       
        $this = $(this);
        
        this.prepareTimeline();
        
        function loadcb(progress) {
            $this.trigger("loadprogress", progress);  
            
            if(progress >= 1) {
                $this.trigger("loadend");
            }
        }   
        
        this.loader.callback = loadcb;
                 
        $this.trigger("loadstart");        
        
        var self = this;
        this.timeline.forEach(function(e) {
            function cb() {
                self.loader.mark("animatedobject", 1);
            }
            e.preparedCallback = cb;
            e.prepare(); 
        });     
        
    },
    
    /**
     * Create animated objects based on timeline input data
     */    
    prepareTimeline : function() {        
        
        this.timeline.forEach(function(e) {            
            this.animatedObjects.push(this.createAnimatedObject(e));                 
            this.loaded.add("animatedobject", 1);
        });
    },
    
    createAnimatedObject : function(timelineInput) {
        
    },
        
    /**
     * Enter the main rendering loop
     */
    loop : function(muted) {
       console.log("-----------------------")       
       console.log("loop start")    
       console.log("-----------------------")       
    
       if(this.play) {
            // Already playing
            return;
       }
       
       // Reset clock
       this.clock = 0;
       
       // Canvas full reset
       // http://diveintohtml5.org/canvas.html#divingin
       this.canvas.width = this.canvas.width;
       this.ctx = this.canvas.getContext("2d");
               
       this.renderer.start();
        
       this.play = true;
       
       console.log("Entering animation loop");
       this.prepareTick();  
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
        
    },
    
    stop : function() {        
    },
    
    /**
     * Receive clock signal from external source
     *
     * @param {Number} 
     */
    onClock : function(clock) {        
    },

    /**
     * Create a <canvas> and place it in the parent container
     */
    prepareCanvas : function() {
                
        var $canvas = $("<canvas width=" + this.width + " height=" + this.height + ">");
        
        this.elem.append($canvas);
        
        this.canvas = $canvas.get(0);
        this.ctx = this.canvas.getContext("2d");
        
    },
    
    
    /**
     * Bind this show to HTML5 <audio> player.
     *
     * The show will listen to events from the audio object and 
     * will use its clock to adjust own playback.
     * 
     * @param audio HTML5 audio element
     */
    bindToAudio : function(audio) {
        
        function onTimeUpdate() {
            var ctime = this.audio.currentTime;
            ctime *= 1000;
            ctime -= this.musicStartTime;
            this.onClock(ctime);
        }
        
        $(audio).bind("timeupdate", $.proxy(this.onTimeUpdate, this));
        $(audio).bind("play", $.proxy(this.play, this));
        $(audio).bind("stop", $.proxy(this.stop, this));
        
        var self = this;
        if(!audio.loaded) {
            
            $(audio).bind(load, function() {
                self.loader.mark("audio", 1);
            });
            
            this.loader.add("audio", 1);            
        }
    }
           
}
