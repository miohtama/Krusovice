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
		        duration : 3.0                                             
		    },
		    
		    transitionOut : {
		        type :  $("#transitionout option:selected").val() || "slightmove",
		        duration : 3.0          
		    },   
		    
		    onScreen : {
		        type : $("#onscreen option:selected").val() || "zoomout",
		    }          				
								
		};
		
		for(var i=0; i<baseplan.length; i++) {
			baseplan[i].id = i;
		}
			
		this.createShow(baseplan, settings);						
	},
	
	/**
	 * Reconstruct Show
	 */
	createShow : function(input, settings) {

        var songURL = "../testdata/sample-song.mp3";
		
        // Create timeline
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(input, sampleSongData, settings);
        var plan = timeliner.createPlan();                              
        
        // Create visualization
        var visualizer = new krusovice.TimelineVisualizer({plan:plan, rhytmData:sampleSongData});                                
        var div = document.getElementById("visualizer");                               
        visualizer.secondsPerPixel = 0.02;
        visualizer.lineLength = 2000;				        
        visualizer.render(div);          
        
        // Set song on <audio>
        var audio = document.getElementById("audio");
        audio.setAttribute("src", songURL);
        
        var player = new krusovice.TimelinePlayer(visualizer, audio);
                
        var cfg = {
                rhytmData : sampleSongData,
                songURL : songURL,
                timeline : plan,
                backgroundType : "plain",
                backgroundColor : "#ffffff",
                elem : $("#show")                                                                                
        };
        
        // Create show
        var show = new krusovice.Show(cfg);
        
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
	 * Fill in effect selectors
	 */
	populate : function() {
				
		var defaults = this.splitURLParameters();
		console.log("Got defaults");
		console.log(defaults);
				
		defaults.transitionin = defaults.transitionin||"zoomin";
		defaults.onscreen = defaults.onscreen||"slightmove";	
		defaults.transitionout = defaults.transitionout||"zoomin";
		
		function fill(id, data) {
			var sel = $(id);
			
			var elems = [{id:"random", name:"Random"}] 
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
		}
		
		var vocab;
		
		vocab = krusovice.effects.Manager.getVocabulary("transitionin");
		fill("#transitionin", vocab);
		
		vocab = krusovice.effects.Manager.getVocabulary("onscreen");
		fill("#onscreen", vocab);
		
		vocab = krusovice.effects.Manager.getVocabulary("transitionout");
		fill("#transitionout", vocab);
				
	},
	
	init : function() {				
	    this.populate();

	    $("select").change($.proxy(effectbrowser.reanimate, effectbrowser));       
	    $("#reanimate").click($.proxy(effectbrowser.reanimate, effectbrowser));       
	    
	    this.reanimate();	    	    
	}

}

// jQuery will be bootstrap'd dynamically

document.addEventListener("DOMContentLoaded", function() {    
	// Dynamically load debug mode Krusovice
	krusovice.load(function() {
		effectbrowser.init();
	}, true);
});
                