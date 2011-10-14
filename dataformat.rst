.. contents :: :local:

Data formats
--------------

This describes Javascript data objects going in and out of Krusovice.

Animation types
==================

Animation: one of 

* *in*: appearing show element

* *out*: fading out show element

* *screen*: currently primary element being shown

Timeline input element
=============================

Describe photo or text we want to have placed
on a timeline.

Input::

        {
                
                showElements,
                rhythmData,
                settings,
                transitionEffectIds,
                onScreenEffectIds,                        
        }

Show elements:

        {
                id,
                
                type : "image" | "text"
                                               
                label,
                
                text,
                
                duration,
                
                imageId,        
        }     
                
Rhythm data::

        { // Echo nest API output }
        
        
Match data (how to match transitions to rhythm)::
        
        {
                type : "beat",
                window : 5.0 // Search window in seconds (to future)
        
        }

Settings::

        {
                //  Where we start to sync with rhythm data
                musicStartTime : 0, 
                
                transitionIn : {
                        type : "",
                        duration : 2.0,                                                
                },
                
                transitionOut : {
                        type : "",
                        duration : 2.0,          
                        clockSkip : 0.0 // How many seconds we adjust the next object coming to the screen
                }   
                
                onScreen : {
                        type : "",
                        duration : 2.0,
                }                                
        }       
                

Effects:

        {
                type : "",
                easing : "",
                duration : 5,                
                position : [ [0,0,0], [0,0,0] ]
                rotations : [ [0,0,0,0], [0,0,0,0] }
                opacity : [ 0, 0 ],
                                                
        }

Generated timeline objects::

        {
                id,
                
                wakeUpTime : 0.0,
                
                transitionIn : { ... }                
                onScreen : { ... }
                transitionOut : { }        
                      
        }

        
Plan Data (internal to Plan object):
        [ show object 1, show object 2, .... ]