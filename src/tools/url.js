/**
 * Audio fade in support
 */

// jslint hints
/*global window, define, console, jQuery, document, setTimeout */
define("krusovice/tools/url", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
    "use strict";

    // Declare namespace
    krusovice.tools = krusovice.tools || {};
    krusovice.tools.url  = krusovice.tools.url || {};

    /**
     * Read HTTP GET query parameters to a object.
     *
     * See: http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
     *
     *
     * @param {String} aURL URL to split or null for window.location
     *
     * @return {Object} key -> value pairs
     */
    krusovice.tools.url.splitParameters = function (aURL) {

        if(!aURL) {
            aURL = window.location.href;
        }

        var vars = {}, hash;

        if(aURL.indexOf("#") >= 0 ){
            aURL = aURL.slice(0,aURL.indexOf("#"));
        }
        var hashes = aURL.slice(aURL.indexOf('?') + 1).split('&');

        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            //vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }

        return vars;
    };


    /**
     * Add path to a base URL
     */
    krusovice.tools.url.joinRelativePath = function(url, path) {

        // Make sure we don't generate double slash

        if(url[url.length-1] != '/') {
            url += "/";
        }

        if(path[0] == '/') {
            path = path.substring(1);
        }

        return url + path;
    };

    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License

    // http://blog.stevenlevithan.com/archives/parseuri

    krusovice.tools.url.parseUri = function(str) {
        var o   = krusovice.tools.url.parseUri.options,
            m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

        while (i--) { uri[o.key[i]] = m[i] || ""; }

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) { uri[o.q.name][$1] = $2; }
        });

        return uri;
    };

    krusovice.tools.url.parseUri.options = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    return  krusovice.tools.url;
});
