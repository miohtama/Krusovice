/*jslint  newcap: true, sloppy: true*/
/*global requirejs, window, AsyncTestCase, require, console, jQuery, $ */

"use strict";

window.amdTestCase = function (config, moduleArr, tests) {
    var testName,
        proto = {},
        testCase = config.testCase,
        stubs = config.stubs,
        counter = 0;
    delete config.testCase;
    delete config.stubs;

    function load(req, callbacks) {
        // We can't avoid adding callback here, even though it
        // is an empty function. This is needed to avoid race
        // condition. Adding callback ensures that the next queue
        // call is made *only after* callback execution. It
        // guarantees in turn that by the time the next queue
        // call is made all modules have already been loaded.
        req(moduleArr, callbacks.add(function () {}));
    }

    function reload(context, callbacks) {
        var req, prop, reqConfig = {};

        /*jshint validthis:true */

        // copy config to new object
        for (prop in config) {
            if (config.hasOwnProperty(prop)) {
                reqConfig[prop] = config[prop];
            }
        }

        do {
            // on each `reload` call we set new context. This is
            // important. It allows as to stub modules and have a
            // sandbox for each test.
            counter += 1;
            reqConfig.context = context + counter;
        } while (typeof requirejs.s.contexts[reqConfig.context] !== 'undefined');

        // set new require
        req = this['req_' + context] = require.config(reqConfig);
        load(req, callbacks);
    }

    function curryReload(queue) {
        // curries `reload` function, so that it can be passed
        // a `context` string to reload modules with as the only
        // parameter. `reload` can also be called without a need
        // of wrapping it in `queue.call`.
        return function (context, callbacks) {
            if (typeof callbacks === 'undefined') {
                queue.call(function (callbacks) {
                    reload.call(this, context, callbacks);
                });
            } else {
                reload.call(this, context, callbacks);
            }
        };
    }

    function shouldTest(testName) {
        return function (queue) {
            queue.call(function (callbacks) {
                // `reload` method shouldn't be available in a
                // test if it starts with 'should' word, because
                // all operations in such a test are performed
                // in a single queue call, i.e. we can't access
                // results of an asynchronous operation immediately.
                delete this.reload;
                tests[testName].call(this, callbacks);
            });
        };
    }

    function makeTest(testName) {
        return function (queue) {
            // set `reload` and execute the test
            this.reload = curryReload(queue);
            tests[testName].call(this, queue);
        };
    }

    proto.setUp = function (queue) {

        // set `require`
        this.req = require.config(config);

        queue.call(function (callbacks) {
            // load modules
            load(this.req, callbacks);
        });

        queue.call(function (callbacks) {
            // reload modules if there are some stubs
            var prop;
            for (prop in stubs) {
                if (stubs.hasOwnProperty(prop)) {
                    stubs[prop]();
                    reload.call(this, prop, callbacks);
                }
            }
        });

        queue.call(function () {
            // call setUp method if defined in user tests.
            if (tests.setUp) {
                tests.setUp.call(this, queue);
            }
        });

        // call loadResources async handler if defined in user tests.
        queue.call(function () {
            if (tests.loadResources) {
                tests.loadResources(queue);
            }
        });
    };

    proto.tearDown = function (queue) {
        queue.call(function () {
            // call tearDown method if defined in user tests.
            if (tests.tearDown) {
                tests.tearDown.call(this, queue);
            }
        });
    };

    // compose `proto` object that is passed to `AsyncTestCase`.
    for (testName in tests) {
        if (tests.hasOwnProperty(testName)) {
            if (testName.indexOf('should') === 0) {
                proto['test_' + testName] = shouldTest(testName);
                console.log("Added test:" + testName);
            } else if (testName !== 'setUp' && testName !== 'tearDown') {

                if(testName.indexOf('test') === 0) {
                    proto[testName] = makeTest(testName);
                } else {
                    proto[testName] = tests[testName];
                }
            }
        }
    }

    /*jshint newcap:false*/
    return AsyncTestCase(testCase, proto);
};