"use strict";

var krusovice = krusovice || {};

krusovice.version = "trunk" // $VERSION_LINE

/**
 * Dynamicaly load Krusovice Javascript code for debug mode. 
 * 
 * @param {Function} doneCallback Called after the loading is complete.
 */
krusovice.load = function(doneCallback) {
	
	var files = [
	     "utils.js",
	     "design.js",
	     "inputelement.js",
	     "loader.js",
	     "rhytmanalysis.js",
	     "showobjects.js",
	     "timeliner.js",
	     "timelinevisualizer.js",
	     "show.js",
	     "renderers/three.js",
	     "effects/base.js",
	     "effects/linear.js"
	]
	            
	// Get krusovise/bootstrap.js URL
	function getMyURL() {
	      var scripts = document.getElementsByTagName("script");
	     
	      for(var i=0; i<scripts.length; i++) {
	          var script = scripts[i];
	          
	          // Found our script tag
	          var src = script.getAttribute("src");
	          if(!src) {
	              // Inline script tag
	              continue;
	          }
	          
	          src = src.toLowerCase();
	          
	          if(src.indexOf("krootstrap.js") >= 0) {
	              // Current 'script' ok
	              return src;;
	          }
	      }		

	      throw "Could not know where to Krusovice";
	}
	
	// Get URL folder part
	function getBaseURL(aUrl) {
	        
        var end;
        var url;
        
        end = aUrl.indexOf('?');
        
        if(end <= 0) {
            end = aUrl.length-1;
        }
        
        url = aUrl.slice(0, end);
        // Ignore slash at the end of url
        if(url[url.length-1] == "/" ) {
            url = url.slice(0,url.length-2);
        }
        
        // But add the slash to result for convenient concat
        end = url.lastIndexOf("/") + 1;
        url = url.slice(0,end);
        
        return url;
	}	   
	
	var myURL = getMyURL();
	var base = getBaseURL(myURL);
	var head = document.getElementsByTagName("head")[0];
	var loadCount = 0;
	
	// Load single script
	function loadJS(file) {

		var url = base + file;
		 // Using script tag injection to have JS debugger show the source
        console.log("Injecting <script> tag to load:" + url);
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.setAttribute("src", url);
        script.src = url;
        
        function bump() {
            console.log("Script onload handler for " + url);
            
            loadCount += 1;
            console.log("Loaded:" + loadCount + "/" + files.length);
            if(loadCount >= files.length) {
            	console.log("Krusovice loaded");
            	doneCallback();
            }                
        }

        function heady(script) {
        	
            script.onerror = function(e, a, b, c) {
            	console.error("Script contained errors:" + url);
            	console.exception(e);
            }        	
	        
	        script.onload = function() { 
	            if ( ! script.onloadDone ) {
	                script.onloadDone = true; 
	                bump(); 
	            }
	        };
	        script.onreadystatechange = function() { 
	            if ( ( "loaded" === script.readyState || "complete" === script.readyState ) && ! script.onloadDone ) {
	            	script.onloadDone = true; 
	                bump();
	            }
	        }
	        
	        head.appendChild(script);
        }
        
        heady(script);
	}
	
	files.forEach(function(file) {
		loadJS(file)
	});
		
}
