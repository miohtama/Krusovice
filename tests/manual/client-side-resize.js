/**
 * See what we can do for images on the client side.
 *
 */

/*global XMLHttpRequest, FormData, require, window, simpleElements, console, jQuery, $ */


require(["krusovice/thirdparty/jquery",
    "krusovice/tools/resizer",
    "../../src/thirdparty/domready!"], function($, resizer) {

    "use strict";

    function uploadFiles(url, files) {
      var r = new XMLHttpRequest();
      r.open("POST", url);
      var fd = new FormData(); // XHR2
      for(var i=0; i < files.length; i++)
        fd.append(files[i].name, files[i]);
      r.send(fd);  // multipart/form-data
    }

    function upload(url, blob, callback) {
      var r = new XMLHttpRequest();
      r.open("POST", url);
      r.send(blob);  // XHR2
      r.upload.onprogress = callback;
    }

    function onFileUpload(event) {

        var i;
        var files = event.target.files;

        function progress() {

        }

        function success(resized) {

            // Andd processed file to the upload chain

            if(resized.resized) {
                resizer.updatePayload($("#files"), resized);
            }

            // Debug: add <canvas> on doc so we see the results
            $("body").append(resized.canvas);

            console.log(resizer.stats);
            console.log("The save factor is " + resizer.stats.bytesIn / resizer.stats.bytesOut);

            upload("http://localhost:8000", resized.blob, function(e) {
                  console.log(e.loaded + " / " + e.total);
            });

        }

        function failure(resizer, msg) {
            window.alert(msg);
        }

        console.log("res");
        console.log(resizer);

        for(i=0; i<files.length; i++) {

            var resized = new resizer.Resizer({

                maximumWidth : 1920,

                maximumHeight : 1080,

                success : success,

                failure : failure
            });

            resized.process(files.item(i));

        }
    }


    function createAspectRatios() {

    }

    function init() {
        $("#files").change(onFileUpload);
    }

    init();

});

