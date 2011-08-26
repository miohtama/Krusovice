
/**
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.krusovice.effects.Interpolate = $.extend(krusovice.effects.Base, {
    
    name : "Linear movement",
    
    available : false,
    
    source : {
        position : [0, 0, krusovice.effects.CAMERA_Z],
        rotation : [0,0,0],
        opacity : 1,
        scale : [1,1,1]    
    },
    
    variation : {
    },
    
    target : {        
    },
  
    prepareAnimationParameters : function(config, source, target, next) {        
        this.initParameter("position");
        this.initParameter("rotation");
        this.initParameter("scale");
        this.initParameter("opacity");
    },
          
});

/**
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.ZoomIn = $.extend(krusovice.effects.Interpolate, {
    
    id : "zoomin",
    
    name : "Zoom In",
    
    available : true,
    
    categories : ["transitionin"],
    
    source : $.extend(krusovice.effects.Interpolate.source, {
        position : [0, 0, krusovice.effects.FAR_Z],
    });
        
});

krusovice.effects.registerEffect(krusovice.effects.ZoomIn);


krusovice.effects.RotoZoomIn = $.extend(krusovice.effects.ZoomIn, {
    
    id : "rotozoomin",
    
    name : "Roto Zoom In",
    
    available : true,
    
    categories : ["transitionin"],    
    
    
});

krusovice.effects.registerEffect(krusovice.effects.RotoZoomIn);

krusovice.effects.ZoomOut = $.extend(krusovice.effects.ZoomOut, {
    
    id : "zoomout",
    
    name : "Zoom Out",
    
    available : true,
    
    categories : ["transitionout"],
    
});


/**
 * 
 */
krusovice.effects.SlightMove = $.extend(krusovice.effects.SlightMove, {
    
    id : "slightmove",
    
    name : "Slight move",
    
    available : true,
    
    categories : ["onscreen"],
    
    source : {
        
    }
    
});



