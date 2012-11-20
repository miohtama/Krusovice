/**
 * Echo Nest integration - upload file to the Echo nest directly from the browser
 *
 */

/*global require, define, window, console, document, File */

define(["krusovice/thirdparty/remix", "krusovice/thirdparty/sparkmd5"], function(Nest, SparkMD5) {

    "use strict";

    // Cache expensive HTTP upload result operations in local storage
    function getCachedResult(hash) {
        var json = window.localStorage[hash];
        if(json) {
            return JSON.parse(json);
        }

        return null;
    }

    function storeCachedResult(hash, result) {
        window.localStorage[hash] = result;
    }

    function createNest(apiKey) {
        var nest = new Nest(apiKey);
        return nest;
    }

    /**
     * Convert Echo Nest data to Krusovice internal format in place.
     *
     * We optimize some timestamps for quicker look up.
     *
     * @param  {Object} analysis Raw echo nest data
     */
    function preprocessData(data) {
        var i;
        var bars = data.analysis.bars, beats = data.analysis.beats;

        for(i=0; i<bars.length; i++) {
            bars[i].start *= 1000; // ms
            bars[i].duration *= 1000;
        }

        for(i=0; i<beats.length; i++) {
            beats[i].start *= 1000; // ms
            beats[i].duration *= 1000;
        }

        return data;
    }

    /**
     * Calculate file hash using SparkMD5 lib
     *
     * @param  {Object}   file window.File instance
     * @param  {Function} done Callback done(hash) when hashing is finished
     */
    function calculateHash(file, done) {

        var fileReader = new FileReader(),
            blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunkSize = 2097152,                           // read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5();

        fileReader.onload = function(e) {
            console.log("read chunk nr", currentChunk + 1, "of", chunks);
            spark.appendBinary(e.target.result);           // append binary string
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            }
            else {
               console.log("finished hashing");
               var hash = spark.end();
               done(hash);
            }
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = start + chunkSize >= file.size ? file.size : start + chunkSize;

            fileReader.readAsBinaryString(blobSlice.call(file, start, end));
        }

        loadNext();
    }


    /**
     * Ask track analysis info from Echo Nest HTTP API.
     *
     * Store the file result in localStorage cache.
     *
     * @param  {[type]}   apiKey [description]
     * @param  {[type]}   file   [description]
     * @param  {Function} done   Called with succesful track analysis done(data) where data.analysis contains bars, beats
     * @param  {Function} failed   Called with unsuccesful track analysis
     * @return {[type]}          [description]
     */
    function analyzeFile (apiKey, file, done, failed) {

        var hash = null;

        console.log('analyzing file', file);

        var nest = createNest(apiKey);

        function ready(data) {
            return done(preprocessData(data));
        }

        // Call Echo Nest HTTP API with file payload
        function postToAPI() {
            console.log("Sending file to analyze");

            nest.analyzeFile(file, nest.guessType(file), {
                onload: function (result) {

                    var response = result.response;

                    var data = result;

                    console.log("Got response");
                    console.log(response);

                    if (response.track && response.track.audio_summary) {
                        console.log("Loading analysis URL:" + response.track.audio_summary.analysis_url);

                        if(!response.track.audio_summary.analysis_url) {
                            console.error("Echonest does not like us and didn't produce track analysis URL");
                            if(failed) {
                                failed();
                                return;
                            }
                        }

                        nest.loadAnalysis(response.track.audio_summary.analysis_url, {
                            onload: function (result) {
                                data.analysis = result;
                                storeCachedResult(hash, JSON.stringify(data));
                                ready(data);
                            }
                        });
                    }
                }
            });
        }

        // We now know if we are dealing with a new file or can use cached result
        function gotHash(xhash) {
            hash = xhash;
            var cached = getCachedResult(hash);
            if(cached) {
                ready(cached);
            } else {
                postToAPI();
            }
        }

        calculateHash(file, gotHash);

    }


    //
    // Module API
    //

    return {
        analyzeFile : analyzeFile
    };

});

