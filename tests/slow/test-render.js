'use strict';

var RenderTest = AsyncTestCase("Render");

/**
 * Create timeline where we have image URLs relative to JsTestDriver root
 */
RenderTest.prototype.createPlan = function() {
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
    var plan = timeliner.createPlan();                  

    // fix URls
    plan[0].imageURL = "http://localhost:8000/testdata/kakku.png";
    
    return plan;
}

/**
 * Render few first frames of simple timeline.
 */
RenderTest.prototype.testRenderFewFrames = function(queue) {

    var plan = this.createPlan();
         
    var cfg = {
            timeline : plan,
            backgroundType : "plain",
            plainColor : "#ffffff",
            controls : false,
            elem : null,
            realtime : false // Enforce external test clock signal
    };
    
    
    assertEquals(2, plan.length);
    
    var show = new krusovice.Show(cfg);
    
    var done = false;
       
    queue.call('Step 1: load show media resources', function(callbacks) {
        
        console.log("Step 1");
                        
        assertFalse(show.loaded);
        
        var interrupt = callbacks.addErrback("Failed to load media resources");
        
        var onloaded = callbacks.add(function() {        
                          
        });
                
        $(show).bind("loadend", function() {
            onloaded()
        });
        
        $(show).bind("loaderror", function(event, msg) {
            // Single load failure is enough to stop us
            if(!done) {
                done = true;
                interrupt(msg);               
            }
        });
        
        show.prepare(); 
        
    });
        
    queue.call('Step 2: render the show', function(callbacks) {

        console.log("Step 2");

        assertTrue(show.loaded, "Show loaded");      

        assertEquals(2, show.animatedObjects.length);      

        for(var i=0; i<3; i+=0.1) {
            show.onClock(i);    
            show.render();
        }
    
        assertEquals(30, show.currentFrame);
               
    });
    
    
}


/**
 * Try loading a show which has bad resources and loading should fail
 */
RenderTest.prototype.ctestRenderBadResource = function(queue) {

    var plan = this.createPlan();
    
    // Test only with a single element
    plan = plan.slice(0, 1);
    
    plan[0].imageURL = "http://notexist";              
         
    var cfg = {
            timeline : plan,
    };
    
    var show = new krusovice.Show(cfg);
    
    var $show = $(show);

    queue.call('Step 1: try load non-existant resources', function(callbacks) {
        
        console.log("Step 1");
                        
        assertFalse(show.loaded);
        
        var interrupt = callbacks.addErrback("Failed to load media resources");
                       
        var onerror = callbacks.add(function() {   
            /// ok
            console.log("baabaa");
        });
        
        $show.bind("loadend", function(event) {
            interrupt();
        });
        
        $show.bind("loaderror", function(event, msg) {
            console.log("loaderror");
            onerror();
        });
        
        show.prepare(); 
        
    });
        
        
}

