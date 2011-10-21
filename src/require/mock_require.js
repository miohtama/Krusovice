/**
 * XXX: Don't use - did not fly
 *
 * Alternative loading root for unit tests as JSUnit + JsTestDriver do not play along with require.js.
 */

/*global window*/

var krusovice = {};

/**
 * Mock require.js define() loader functoin
 *
 * JsTestDriver loads all Javascript code *SYNCHRONOUSLY* and do not rely require.js async look-up mechanism,
 * as files are loaded by jsTestDriver.conf, not require.js.
 *
 * We override the define() function to always run module code as is and initialize it into
 * the global krusovice namespace.
 *
 *
 */
function define(dependencies, module) {

    // Resolved dependencies;
    var deps = window.dependencies || {};

    var args = [], moduleName;

    if(typeof(dependencies) == "string") {
        module = dependencies;
        dependencies = [];
    } else {
        moduleName =
    }

    dependencies.forEach(function(d) {
        var resolved = deps[d];

        if(!resolved) {
            throw "Unknown mocked up dependency:" + d + " when loading module " + module;
        }

        args.push(resolved);
    });


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/call

    deps[modu] module.apply(this, args);


}
