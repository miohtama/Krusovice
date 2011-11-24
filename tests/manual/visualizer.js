/*global require,simpleElements,sampleSongData*/

require(["krusovice/api", "../../src/thirdparty/domready!"], function(krusovice) {

    function setupVisualizer(visualizer) {
        visualizer.secondsPerPixel = 0.02;
        visualizer.lineLength = 2000;
    }

   // Visualization without music
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
    var plan = timeliner.createPlan();
    var visualizer = new krusovice.TimelineVisualizer({plan:plan});
    var div = document.getElementById("visualizer-no-rhythm");
    setupVisualizer(visualizer);
    visualizer.render(div);

    // Visualization with music
    if(!sampleSongData) {
            throw "No music";
    }
    timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, sampleSongData);
    plan = timeliner.createPlan();

    visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:sampleSongData});
    div = document.getElementById("visualizer-rhythm");
    setupVisualizer(visualizer);
    visualizer.render(div);

    var songURL = "../../testdata/sample-song.mp3";
    var player = new krusovice.TimelinePlayer(visualizer, songURL);
    $("#player").append(player.audio);


    var cfg = {
            rhythmData : sampleSongData,
            songURL : "../../testdata/sample-song.mp3",
            timeline : plan,
            backgroundType : "plain",
            plainColor : "#ffffff",
            controls : false,
            elem : $("#show")
    };

    var show = new krusovice.Show(cfg);
    show.bindToAudio(player.audio);

    krusovice.attachSimpleLoadingNote(show);
    show.prepare();


});