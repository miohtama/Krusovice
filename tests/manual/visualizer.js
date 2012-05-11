/*global document, console, require, simpleElements, sampleSongData, jQuery, $ */

"use strict";

require(["krusovice/api", "../../src/thirdparty/domready!"], function(krusovice) {

    function setupVisualizer(visualizer) {
        visualizer.secondsPerPixel = 0.02;
        visualizer.lineLength = 2000;
    }

   // Visualization without music
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);

    timeliner.leadTime = 3;
    timeliner.steppingTime = 1.5;

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
    timeliner.leadTime = 3;
    timeliner.steppingTime = 1.5;

    // Start playing in 5 seconds
    timeliner.musicStartTime = 0;

    plan = timeliner.createPlan();

    visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:sampleSongData});
    div = document.getElementById("visualizer-rhythm");
    setupVisualizer(visualizer);
    visualizer.render(div);

    var songURL;

    // XXX: Firefox support hax
    var audio = document.createElement("audio");
    var canMP3 = audio.canPlayType('audio/mpeg') !== "";

    if(canMP3) {
        songURL = "../../testdata/sample-song.mp3";
    } else {
        songURL = "../../testdata/sample-song.ogg";
    }

    songURL = "../../../olvi/music/russian.mp3";

    console.log("Loading song:" + songURL);

    var player = new krusovice.TimelinePlayer(visualizer, songURL, timeliner.musicStartTime);
    $("#player").append(player.audio);


    var cfg = {
            rhythmData : sampleSongData,
            songURL : songURL,
            timeline : plan,
            backgroundType : "plain",
            plainColor : "#ffffff",
            controls : false,
            elem : $("#show"),
            musicStartTime : timeliner.musicStartTime
    };

    var show = new krusovice.Show(cfg);
    show.bindToAudio(player.audio);

    krusovice.attachSimpleLoadingNote(show);
    show.prepare();


});