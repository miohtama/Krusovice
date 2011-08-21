"use string";

var krusovice = krusovice || {};

/**
 * Simple element loader helper
 */
krusovice.Loader = function() {
    
}

krusovice.Loader.prototype = {

    /**
     * Dictionary of elements which are still being loaded.
     *
     * Must be populated in before prepare() or during prepare() using addForLoading
     *
     */
    loadElements : {
        video : 0,
        audio : 0,
        images : 0,
        backgroundImages : 0
    },
    
    totalElementsToLoad : 0,
    
    nowLoaded : 0,
    
    /**
     * @type Function
     *
     * Function which is called for the progress as callback(progress)
     *
     */
    callback : null,
    
    /**
     * Add elements to load queue counter 
     *
     * @param {String} name E.g. audio, video, image
     *
     * @param {Nunmber} count How many elements needs to be loaded (still)
     */
    add : function(name, count) {
      
        // Let's imagine this is an atomic operation  
        value = this.loadElements[name] || 0;
        value += count;               
        this.totalElementsToLoad += count;
        this.loadElements[name] = value;
    },

    getLeftCount : function() {        
        return totalElementsToLoad;
    },
    
    mark : function(name, count) {

        value = this.loadElements[name] || 0;
        value -= count;               
        
        if(value < 0) {
            throw "Loading book keeping failure for:" + name;
        }

                                
        this.loadElements[name] = value;
        
        this.nowLoaded += count;

        console.log("Loaded name:" + name + " left:" + value + " total loaded:" + this.nowLoaded + " total count:" + this.totalElementsToLoad);
       
        if(this.callback) {
            this.callback(this.getProgress());
        }
    },
    
    /**
     * @return Number 0...1 how much loading is done
     */
    getProgress : function() {
        return this.nowLoaded / this.totalElementsToLoad;
    } 
    
}