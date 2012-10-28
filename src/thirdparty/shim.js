
// Wrap 3rd party libraries

var requireShim = {

    'audia': {
        deps : [],
        exports : "window.Audia"
    },

    'krusovice/thirdparty/remix/src/js/audio': {
        deps : ["krusovice/thirdparty/remix/src/js/utils"]
    },

    'krusovice/thirdparty/remix/src/js/filter': {
        deps : ["krusovice/thirdparty/remix/src/js/utils"]
    },

    'krusovice/thirdparty/remix/src/js/manager': {
        deps : ["krusovice/thirdparty/remix/src/js/filter"]
    }


};