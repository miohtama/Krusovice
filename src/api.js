// TODO: This will hold public Krusovice API

define("krusovice/api", [
    "require",

    "krusovice/thirdparty/jquery-bundle",
    "krusovice/thirdparty/three-bundle",

    "krusovice/krusovice",
    "krusovice/utils",
    "krusovice/design",
    "krusovice/inputelement",
    "krusovice/project",
    "krusovice/loader",
    "krusovice/rhythmanalysis",
    "krusovice/timeliner",
    "krusovice/timelinevisualizer",
    "krusovice/show",
    "krusovice/renderers/three",
    "krusovice/effects",
    "krusovice/effects/linear",
    "krusovice/backgrounds",
    "krusovice/showobjects",
    "krusovice/showobjects/framedimage",
    "krusovice/showobjects/textdefinitions",
    "krusovice/showobjects/text",
    "krusovice/music",
    "krusovice/tools/fade",
    "krusovice/tools/url"
], function(require, krusovice) {
    console.log("Krusovice API init");
    console.log(krusovice);
    return krusovice;
});
