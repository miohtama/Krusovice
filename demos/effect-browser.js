"use strict";

/**
 * Effect browser UI.
 * 
 * For quick testing you can enter effect ids as URL parameters:
 * 
 *      file:///Users/moo/git/Krusovice/demos/effect-browser.html?transitionin=flip&transitionout=flip
 *      
 */
var effectbrowser = {
	
	
	hasMusic : false,
	
	hasBackgrounds : false,
	
	song : null,

   /**
	* Read URL parameters to dict.
	*
	* See: http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
	*/
    splitURLParameters : function (aURL) {
        
        if(!aURL) {
            aURL = window.location.href;
        }
                
        var vars = {}, hash;

        if(aURL.indexOf("#") >= 0 ){
            aURL = aURL.slice(0,aURL.indexOf("#"));
        }
        var hashes = aURL.slice(aURL.indexOf('?') + 1).split('&');
        
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            //vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        
        return vars;
    },
		    		
		
	/**
	 * Regenerate timeline based on the new choices made in the editor.
	 */
	reanimate : function() {
						
	    console.log("reanimate()");
	    
        if(this.show) {
            // One show per demo page allowed
            this.deleteShow();
        }
                	    
		var baseelem = {				
			type : "image",
			label : null,
			duration : 1.5,
			imageURL : "../testdata/kakku.png"			
		};
		
		var baseplan = [
		     baseelem,
		     baseelem,
		     baseelem
		];
		
		var settings = {

		    // Time in seconds where song starts playing
		    musicStartTime : 0,
		    
		    transitionIn : {
		        type : $("#transitionin option:selected").val() || "zoomin",
		        duration : 1.0                                             
		    },
		    
		    transitionOut : {
		        type :  $("#transitionout option:selected").val() || "slightmove",
		        duration : 3.0          
		    },   
		    
		    onScreen : {
		        type : $("#onscreen option:selected").val() || "zoomfar",
		    }          				
								
		};
		
		for(var i=0; i<baseplan.length; i++) {
			baseplan[i].id = i;
		}
		
		var backgroundId = $("#background option:selected").val() || "blue";

		var background = krusovice.backgrounds.Registry.get(backgroundId);
						
		console.log("Created background data:");
		console.log(background);						
		var design = new krusovice.Design({
			plan : baseplan,
			settings : settings,
			background : background			
		});
			
		this.createShow(design);						
	},
	
	/**
	 * Stop playing the current show and release the resources.
	 */
	deleteShow : function() {
	    
        var audio = document.getElementById("audio");
        audio.pause(); // Will trigger show.stop	    

        this.show.stop();
	    this.show.release();	
	    
	    $("#show").empty();
        $("#visualizer").empty();
        
        this.show  = null;
	},
	
	/**
	 * Reconstruct Show
	 *
	 * @param {krusovice.Design} design
	 */
	createShow : function(design) {

       	var audio = document.getElementById("audio");   
       	
        // Create timeline
        
        var rhytmData = null;
        if(this.song) {
        	rhytmData = this.song.rhytmData;
        } else {
        	rhytmData = null;
        }
                
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(design.plan, rhytmData, design.settings);
        var timeline = timeliner.createPlan();                              
        
        // Create visualization
        var visualizer = new krusovice.TimelineVisualizer({plan:timeline, rhytmData:rhytmData});                                
        var div = document.getElementById("visualizer");     
               
        visualizer.secondsPerPixel = 0.02;
        visualizer.lineLength = 2000;				        
        visualizer.render(div);          
        
        // Set dummy song on <audio>        
        if(!rhytmData) {
        	var songURL = "../testdata/sample-song.mp3";        	     	
        	audio.setAttribute("src", songURL);
        }
        
        var player = new krusovice.TimelinePlayer(visualizer, audio);
                
        var cfg = {
        	width : 512,
        	height : 288,
        	timeline : timeline,
            rhytmData : rhytmData,
            background : design.background,
            elem : $("#show"),                                                                                
        };
        
        // Create show
        var show = new krusovice.Show(cfg);
        
        this.show = show;
        
        // Make show to use clock and events from <audio>
        show.bindToAudio(player.audio);   
        
        krusovice.attachSimpleLoadingNote(show);                                                                                                                                
                
        // Automatically start playing when we can do it
        $(show).bind("loadend", function() {
        	audio.play();
        });
                
        // Start loading show resources
        show.prepare();
		
	},
	
	
	/**
	 * Get <select> default values
	 */
	getDefaults : function() {
		var defaults = this.splitURLParameters();		
		defaults.transitionin = defaults.transitionin||"zoomin";
		defaults.onscreen = defaults.onscreen||"slightmove";	
		defaults.transitionout = defaults.transitionout||"zoomin";
		defaults.background = defaults.background||"blue";
		defaults.music = "nomusic";
		return defaults;
	},
	
	/**
	 * Fill in the tester choices.
	 *
	 * Read default values from URL if it supplies any.
	 */
	fillVocab : function(id, data, defaultId, defaultName) {
		var sel = $(id);
		var defaults = this.getDefaults();	
			
		if(!defaultId) {
			defaultId = "random";
		}
		
		if(!defaultName) {
			defaultName = "Random";
		}
		
		var elems = [{id:defaultId, name:defaultName}] 
		$.merge(elems, data);   
		
		elems.forEach(function(e) {
			var selected="";
			if(e.id == defaults[id.substring(1)]) {
				selected="selected"
			}
			sel.append("<option " + selected + " value='" + e.id + "'>" + e.name + "</option>");
		});
		
		var def = defaults[id];
		if(def) {
			sel.val(def);
		}
	},
		
	
	/**
	 * Fill in effect selectors
	 */
	populate : function() {
				
		var vocab;
		
		vocab = krusovice.effects.Manager.getVocabulary("transitionin");
		this.fillVocab("#transitionin", vocab);
		
		vocab = krusovice.effects.Manager.getVocabulary("onscreen");
		this.fillVocab("#onscreen", vocab);
		
		vocab = krusovice.effects.Manager.getVocabulary("transitionout");
		this.fillVocab("#transitionout", vocab);
								
	},
	
	createBackgroundSelector : function() {
		var vocab = krusovice.backgrounds.Registry.getVocabulary();
		this.fillVocab("#background", vocab);
		this.hasBackgrounds = true;
		this.loadCheck();
	},
	
	
	createSongSelector : function() {
		console.log("Creating song selector");
		var vocab = krusovice.music.Registry.getVocabulary();
		this.fillVocab("#music", vocab, "nomusic", "No music");
		this.hasMusic = true;
		this.loadCheck();
	},	
	
	loadCheck : function() {
		if(this.hasBackgrounds && this.hasMusic) {
			// autoplay
			this.reanimate();
		}
	},
	
	setupRenderLayers : function() {
		if(this.show) {
			// 
			this.show.renderFlags.background = $("#render-background").is(":checked");
			this.show.renderFlags.scene = $("input#render-scene").is(":checked");
			console.log("New render flags");
			console.log(this.show.renderFlags);
		}
	},
	
	onSelect : function(e, elem) {

		var id = e.currentTarget.id;
		
		function switchSong(song) {
		
			if(!song) {
				throw "Who turned off the music?";
			}

			if(!song.id) {
				throw "Bad song data";
			}

			console.log("Switching to song:" + song.id);
			this.song = song;
			this.reanimate();
		}

		if(id == "music") {
			var audio = document.getElementById("audio");       
			var songId = $(e.currentTarget).find("option:selected").val();
			krusovice.music.Registry.loadSong(songId, audio, $.proxy(switchSong, this));
		} else {
			this.reanimate();
		}	
		
	},
	
	init : function() {				
	    this.populate();

		
	    $("select").live("change", $.proxy(effectbrowser.onSelect, effectbrowser));       

	    $("input[type=checkbox]").live("change", $.proxy(effectbrowser.setupRenderLayers, effectbrowser));       

	    
	    $("#reanimate").click($.proxy(effectbrowser.reanimate, effectbrowser));       
	    
	    // XXX: Cannot distribute media files on Github
	    krusovice.backgrounds.Registry.loadBackgroundData("../media/backgrounds.json", 
	     												  "../../../../../olvi/backgrounds/", 
	     												  $.proxy(this.createBackgroundSelector, this));


	    // XXX: Cannot distribute media files on Github
	    krusovice.music.Registry.loadData("../../../../../olvi/music/songs.json", 
										  "../../../../../olvi/music/", 
										  $.proxy(this.createSongSelector, this));
	    	    
	}

}

// jQuery will be bootstrap'd dynamically

document.addEventListener("DOMContentLoaded", function() {    
	// Dynamically load debug mode Krusovice
	krusovice.load(function() {
		effectbrowser.init();
	}, true);
});
                