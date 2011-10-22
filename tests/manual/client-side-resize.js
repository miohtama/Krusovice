/**
 * See what we can do for images on the client side.
 *
 */

/*global require,window,simpleElements,console*/


require(["krusovice/thirdparty/jquery",
    "krusovice/thirdparty/jpegmeta",
    "../../src/thirdparty/domready!"], function($, JpegMeta) {

    "use strict";

    /**
     * http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata/5100158
     *
     *
     */
    function dataURItoBlob(dataURI, callback) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs

        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURI.split(',')[1]);
        } else {
            byteString = unescape(dataURI.split(',')[1]);
        }

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;
        var bb = new BlobBuilder();
        bb.append(ab);
        return bb.getBlob(mimeString);
    }


    function getAsJPEGDataURI(canvas) {
        if(canvas.mozGetAsFile) {
            return canvas.mozGetAsFile("foo.png");
        } else {
            return canvas.toDataURL('image/jpeg', 0.5);
        }
    }


    function saveCanvasAsFile(canvas) {
        var data = getAsJPEGDataURI(canvas);
        var blob = dataURItoBlob(data);
        console.log(blob);
    }

    /**
     * http://benno.id.au/blog/2009/12/30/html5-fileapi-jpegmeta
     */
    function extractJPEGData(data, name) {
        var jpeg = new JpegMeta.JpegFile(data, name);
        console.log(jpeg);

        var orientation = -1;
        if(jpeg.tiff) {
            if(jpeg.tiff.Orientation) {
                orientation =  jpeg.tiff.Orientation.value;
            }
        }

        console.log("Orientation:" + orientation);
    }

    function drawOnCanvas(canvas, img) {
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        saveCanvasAsFile(canvas);
    }

    function dumpIntoCanvas(canvas, f) {
        var img = document.createElement("img");

        img.onload = function(e) {
            // Don't leak file data unneeded
            drawOnCanvas(canvas, img);
        };

        var reader = new window.FileReader();
        reader.onload = function(e) {img.src = e.target.result; };
        reader.readAsDataURL(f);
    }

    function process(f) {

        var reader = new window.FileReader();

        var canvas = document.getElementById("canvas");

        reader.onload = function(event) {
            var data = event.target.result;
            console.log("Got size:" + data.length);
            extractJPEGData(data, f.fileName);
            dumpIntoCanvas(canvas, f);
        };

        reader.onerror = function(event) {
            console.error("Could not read");
            console.error(event);
        };

        console.log("Starting reading");
        console.log(f);
        reader.readAsBinaryString(f);
    }


    function onFileUpload(event) {
        console.log(this.files);

        var i;
        for(i=0; i<this.files.length; i++) {
            process(this.files.item(i));
        }
    }

    function init() {
        $("#files").change(onFileUpload);
    }

    init();

});

