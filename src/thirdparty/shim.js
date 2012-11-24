
// Wrap 3rd party libraries

var requireShim = {

    'audia': {
        deps : [],
        exports : "window.Audia"
    },

    'spin': {
        deps : [],
        exports : "window.Spinner"
    },

    'three': {
        deps : [],
        exports : "window.THREE"
    },

    'bootstrap': {
        deps : ["krusovice/thirdparty/jquery"],
        exports : "$"
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