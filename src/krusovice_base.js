define("krusovice_base", function() {
    return window.krusovice;
});

(function() {
    "use strict";

    // Get krusovise/bootstrap.js URL
    var getMyURL = function () {
         var scripts = document.getElementsByTagName("script");
         for (var i=0; i<scripts.length; i++) {
             var script = scripts[i];

             // Found our script tag
             var src = script.getAttribute("src");
             if(!src) {
                 // Inline script tag
                 continue;
             }
             src = src.toLowerCase();
             if(src.indexOf("krusovice_base.js") >= 0) {
                 // Current 'script' ok
                 return src;
             }
         }

         throw "Could not know where to Krusovice";
    };
 
    // Get URL folder part
    var getBaseURL = function (aUrl) {
        var end;
        var url;

        end = aUrl.indexOf('?');

        if (end <= 0) {
            end = aUrl.length-1;
        }

        url = aUrl.slice(0, end);
        // Ignore slash at the end of url
        if (url[url.length-1] == "/" ) {
            url = url.slice(0,url.length-2);
        }

        // But add the slash to result for convenient concat
        end = url.lastIndexOf("/") + 1;
        url = url.slice(0,end);

        return url;
    };

    var myURL = getMyURL();
    var base = getBaseURL(myURL);

    require.config({
        baseUrl: getBaseURL(myURL)
    });

    window.krusovice = window.krusovice || {};
    var krusovice = window.krusovice;
    krusovice.version = "trunk";

    krusovice.load = function(doneCallback, includeDependencies) {
        if (! includeDependencies) {
            define('jquery_bundle',    function() { return window.$; });
            define('thirdparty/Three', function() { return window.THREE; });
        }
    
        require(['krusovice_loader'], doneCallback);
    };
} ());

// define our loader module
define("krusovice_loader", [
    "require",
    "utils",
    "design",
    "inputelement",
    "project",
    "loader",
    "rhythmanalysis",
    "timeliner",
    "timelinevisualizer",
    "show",
    "renderers/three",
    "renderers/canvas",
    "renderers/projector",
    "effects/base",
    "effects/linear",
    "backgrounds/background",
    "showobjects/showobjects",
    "showobjects/framedimage",
    "showobjects/textdefinitions",
    "showobjects/text",
    "music",
    "tools/fade",
    "tools/url"
], function(require) {
    return window.krusovice;
});
