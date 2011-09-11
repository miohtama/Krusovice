var krusovice = krusovice || {};

/**
 * Design object captures all input needed to prepare a show.
 *
 * Design is stateful - it is serialized and can be used to save and restore editing state.  
 * Thus, all resource references must be go through id mechanism.
 *
 */
krusovice.Design = function(cfg) {
    $.extend(this, cfg);
}

/**
 * 
 */
krusovice.Design.prototype = {

    /**
     * @type {Array}
     *
     * Show input elements. Will be converted to timeline in {@link krusovice"Timeliner}.
     */
    plan : null,
    
    /**
     * @type {Object}
     *
     * Background info 
     */
    background : {
        
        /**
         * @type String
         *
         * One of "video", "plain", "gradient", "skybox"
         */
        type : null,
        
        color : null,
        
        imageId : null,
        
        videoId : null
    },
    
    /**
     * @type Number
     *
     * Show width in pixels
     */
    width : 512,
    
    /**
     * @type Number
     *
     * Show height in pixels
     */
    height : 368,
    
    /**
     * @type String
     *
     * Background song id. Song id is associated with the serve side music file and generated rhytm analysis data.
     */
    songId : null
        

};
