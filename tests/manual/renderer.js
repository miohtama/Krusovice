/**
 * Create dummy test data and send it to the server.
 *
 */

/*global require, window, simpleElements, console, jQuery, $ */

"use strict";

var renderer = {

        init : function(krusovice) {

                var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
                var plan = timeliner.createPlan();

                var design = {
                        plan : simpleElements,
                        background : {
                                backgroundId : "white"
                        },
                        songId : "theark1"
                };

                // JSON payload send to the server
                var project = {
                                design : design,
                                width : 512,
                                height : 288,
                                email : "mikko@industrialwebandmagic.com"
                };


                $("button[name=render]").click( function() {
                        // Create sample show

                        var url = $("input[name=rendering-service-url]").val();

                        var params = { project :JSON.stringify(project) };

                        $.getJSON(url, params, function(data, textStatus, jqXHR) {
                                var message = data.message;
                                window.alert("Got response:" + message);
                        });

                });


                $("button[name=json]").click( function() {
                        // Create sample show

                        var p = $("<p>");
                        p.text(JSON.stringify(project));
                        $("body").append(p);
                });

        }

};


require(["krusovice/api", "../../src/thirdparty/domready!"], function(krusovice) {
    renderer.init(krusovice);
});

