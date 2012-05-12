/**
 * Client-side image resizer module
 */

/*global require, define, window, console, atob, unescape, ArrayBuffer, Uint8Array, jQuery, document, setTimeout */


define("krusovice/tools/resizer", ["krusovice/thirdparty/jquery",
    "krusovice/thirdparty/jpegmeta"], function($, JpegMeta) {

    "use strict";

    //
    // private functions
    //

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
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

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


    function getAsJPEGBlob(canvas) {
        if(canvas.mozGetAsFile) {
            return canvas.mozGetAsFile("foo.jpg", "image/jpeg");
        } else {
            var data = canvas.toDataURL('image/jpeg', 0.7);
            var blob = dataURItoBlob(data);
            return blob;
        }
    }


    function saveCanvasAsFile(canvas) {
        var blob = getAsJPEGBlob(canvas);
        return blob;
    }

    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

        var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

        return { width:srcWidth*ratio, height:srcHeight*ratio };
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

        return jpeg;
    }

    /**
     * Calculate degrees and flip for the JPEG TIFF orientation to straighten it.
     *
     * http://www.impulseadventure.com/photo/exif-orientation.html
     *
     * @reurn {Number} Degrees to rotate the image to counter-clockwise to fix the roratino.
     */
    function calculateRotation(orientation) {

        // Got values 1,6,8,3 out of Galaxy S

        if(orientation == 8) {
            return 90;
        } else if(orientation == 3) {
            return 180;
        } else if(orientation == 6) {
            return 270;
        }
        return 0;
    }


    /**
     * Global stats of all processed images
     */
    var stats = {

        bytesIn : 0,

        bytesOut : 0,

        startedCount : 0,

        finishedCount : 0

    };


    /**
     * Change <input file> control to include a resized file instead of orignal one.
     *
     * http://davidflanagan.com/Talks/jsconf11/BytesAndBlobs.html
     */
    function updatePayload(files, resizer) {
        if(resizer.resized) {
            console.log(files);
        }
    }

    /**
     * Client-size image resizer done using HTML5.
     *
     * Batch resize multiple images into target parameters.
     * Asynchronously report and push the results to the caller.
     *
     *
     * Create Resizer object, give success and failure callbacks for it and call process(file).
     * The success() callback is called as success(resizer) and having access to all related data
     * in Resizer object.
     */
    function Resizer(cfg) {
        $.extend(this, cfg);
    }


    Resizer.prototype = {

        maximumWidth : 1024,

        maximumHeight : 768,

        /**
         * @param {Function} success Callback success(blob, metadata) for asyncrhonous processing
         *
         * @param {Function} failer Callback failure(msg) for asyncrhonous processing
         */
        success : null,

        failure : null,


        /**
         * Did we need to resize the file
         *
         * E.g. it was small enough in the begin with
         */
        resized : false,

        /**
         * Source local File object
         */
        file : null,

        /**
         * Extracted JPEG metadata
         */
        metadata : null,

        /**
         * Image object for the source image
         */
        image : null,

        /**
         * Contains resized image
         */
        canvas : null,

        /**
         * Resulting File object. Can be same as input file if no resize process took place.
         */
        blob : null,

        /**
         * Extract image file from canvas
         */
        processExtractImageFile : function() {
            this.blob = saveCanvasAsFile(this.canvas);

            stats.bytesOut += this.blob.size;

            stats.finishedCount += 1;

            this.resized = true;

            this.success(this);
        },

        /**
         * @param metadata: JPEG metadata
         */
        processCanvasResize : function() {
            var img = this.image;

            // No need to resize the image - it is small enough
            if(img.naturalWidth <= this.maximumWidth && img.naturalHeigth <= this.maximumHeight) {
                return this.processNoResize();
            }

            var rotatedSize = { width : img.naturalWidth, height : img.naturalHeight };

            // Rotate width / height to match orientation

            // degrees how much image must rotated to get it to the proper angle

            var rotation = 0;

            // XXX: Not supported, very rare use case
            // -1 to flip the image
            var mirror = 1;

            var orientation = this.getOrientation();
            if(orientation !== null) {
                rotation = calculateRotation(orientation);
            }

            if(rotation !== 0) {
                if(rotation == 90 || rotation == 270) {
                    rotatedSize = { width : img.naturalHeight, height : img.naturalWidth };
                }
            }

            console.log("Image rotation: " + rotation + " rotated size:" + rotatedSize.width + " x " + rotatedSize.height);

            var size = calculateAspectRatioFit(rotatedSize.width, rotatedSize.height, this.maximumWidth, this.maximumHeight);
            var canvas = document.createElement("canvas");
            canvas.width = size.width;
            canvas.height = size.height;
            var context = canvas.getContext("2d");

            //context.translate(canvas.width, 0);
            context.rotate(-Math.PI*2*rotation/360);

            var x=0, y=0, w=canvas.width, h=canvas.height;

            // Reset orientation parameters to match canvas rotation

            if(rotation == 90) {
                x = -canvas.height;
                y = 0;
                w = canvas.height;
                h = canvas.width;
            }

            if(rotation == 270) {
                x = 0;
                y = -canvas.width;
                w = canvas.height;
                h = canvas.width;
            }

            if(rotation == 180) {
                x = -canvas.width;
                y = -canvas.height;
            }

            console.log("drawImage():" + x + " " + y + " " + w + " " + h);

            // http://stackoverflow.com/questions/4649836/using-html5-canvas-rotate-image-about-arbitrary-point/4650102#4650102
            context.drawImage(img, x, y, w, h);

            this.canvas = canvas;
            this.processExtractImageFile();
        },

        /**
         * Create <img> from local file object and then process it forward for resize.
         */
        processSourceImage : function() {

            var img = document.createElement("img");
            var self = this;

            img.onload = function(e) {
                // Don't leak file data unneeded
                self.image = img;

                // Give UI thread some time to breathe
                setTimeout($.proxy(self.processCanvasResize, self), 10);
            };

            var reader = new window.FileReader();

            reader.onload = function(e) {
                img.src = e.target.result;
            };

            reader.onerror = function(e) {
                self.failure(self, e);
            };

            reader.readAsDataURL(this.file);
        },


        /**
         * Check if we have APIs needed to perform the resize
         */
        isResizeSupported : function() {

            var BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;

            if(window.WebKitBlobBuilder && window.location.href.indexOf("file://") === 0) {
                // throw "Chrome et. al. do not support File API on file:// origin HTML files"
                return false;
            }

            // FileReader is available only in Safari nightly builds currently
            // https://developer.mozilla.org/en/DOM/FileReader

            if(!window.FileReader) {
                return false;
            }

            return !!BlobBuilder;
        },

        /**
         * Fallback when we cannot resize on the client side
         */
        processNoResize : function() {
            this.finishedCount++;
            this.blob = this.file;
            this.resized = false;
            this.success(this);
        },

        read : function() {

            var reader = new window.FileReader();
            var self = this;

            reader.onload = function(event) {
                var data = event.target.result;

                stats.bytesIn += data.length;

                self.metadata = extractJPEGData(data, self.file.fileName);

                self.processSourceImage();
            };

            reader.onerror = function(event) {
                console.error("Could not read");
                console.error(event);
                console.error(self.file);
                self.failure(this, "File reading failed");
            };

            console.log("Starting reading");
            console.log(this.file);
            reader.readAsBinaryString(this.file);

        },


        /**
         * Resize file on the client side and notify about the results asynchronously
         */
        process : function(f) {

            this.file = f;

            stats.startedCount++;

            if(!this.isResizeSupported()) {
                // Pass through the image as is
                this.processNoResize();
            } else {
                // Start reading image off-the-disk
                this.read();
            }

        },

        /**
         * Get orientation from JPEG metadata or null if not available
         */
        getOrientation : function() {

            var jpeg = this.metadata;

            if(jpeg) {
                if(jpeg.tiff) {
                    if(jpeg.tiff.Orientation) {
                        return jpeg.tiff.Orientation.value;

                    }
                }
            }

            return null;
        }

    };

    //
    // Module API
    //

    return {
        Resizer : Resizer,
        stats : stats,
        updatePayload : updatePayload
    };

});

