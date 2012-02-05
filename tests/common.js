/**
 * Unit test boilarplate.
 *
 *
 * Create Async test case wrapper
 *
 * Run krusoviceSetUp()
 *
 * Run krusoviceLoadResources()
 *
 * Run test method in the question.
 *
 * Finalize test case: rename all testXXX -> shouldXXX
 */

/*global amdTestCase*/


/**
 * Actual testcase.setUp();
 */
function krusoviceSetUp(queue) {
    console.log("krusoviceSetUp(): load krusovice API to member var");
    this.krusovice = this.req('krusovice/api');
}

/**
 * Set up other common async tasks before running sync test code.
 */
function krusoviceLoadResources(queue) {

    queue.call("Krusovice: Async loadResources()", function(callbacks) {

        var krusovice = this.krusovice;

        var startup = new krusovice.Startup({
            // No media paths defined
            mediaURL : "http://localhost:8000/",
            backgroundMediaURL : null,
            songMediaURL : null,
            songDataURL : null
        });

        // This will cause async abort
        var interrupt = callbacks.addErrback("Failed to load media resources");
        // This will go to next step
        var initialized = callbacks.add(function() {
            console.log("Krusovice initialized");
        });

        var dfd = startup.init();

        dfd.done(function() {
            initialized();
        });

        dfd.fail(function(msg) {
            interrupt("Failed to initialize Krusovice:" + msg);
        });

    });

}

/**
 * Shortcut for amdTestCase() with default settings.
 */
function KrusoviceTestCase(name, functions) {

    functions.setUp = krusoviceSetUp;

    functions.loadResources = krusoviceLoadResources;

    var testcase = amdTestCase(
        {
            testCase : name,
            baseUrl : "/test/src",
            paths : {
                "krusovice" : "/test/src"
            },
            waitSeconds : 1
        },
        ["krusovice/api"],
        functions
    );

    return testcase;
}

/**
 * Make require.js test case out of existing object.
 */
function finalizeTestCase(name, obj) {

    // Rename all testXXX functions to "shouldXXX"
    // so automatic async magic kicks in
    var tests = obj.prototype;
    var testName;

    for(testName in tests) {
        if (tests.hasOwnProperty(testName)) {
            if (testName.indexOf('test') === 0) {
                var func = tests[testName];
                console.log("Mangling test to require.js compatible:" + testName);
                delete tests[testName];
                tests[testName.replace("test", "should")] = func;
            }
        }
    }

    return KrusoviceTestCase(name, tests);

}

function finalizeAsyncTestCase(name, obj) {
    return KrusoviceTestCase(name, obj.prototype);
}
