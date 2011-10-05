function getTextDefinitions() {
    
    return [
        {
            id : "box",
            
            name : "Box",
            
            boxes : [{
                id : "text",
                label : "Text",
                x : 0.2,
                y : 0.2,
                w : 0.6,
                h : 0.4 
            }],
                        
            width : 16,            
            height : 9
        },
        
        {
            id : "note",
            
            name : "Note",
            
            boxes : [{
                x : 0,
                y : 0,
                w : 1,
                h : 1  
            }],
            
            width : 4,
            
            height : 4        
        },
        
        
        {
            id : "postcard",
            
            name : "Postcard",
            
            boxes : [],
            
            width : 0,
            
            height : 0
            
        }
        
        
    ];

}