/**
 * Unit test boilarplate.
 */

/*global amdTestCase*/

function krusoviceSetUp(queue) {
    console.log("Common setup");
    this.krusovice = this.req('krusovice_loader');
}

/**
 * Synchronoous test case using require.js.
 */
function KrusoviceTestCase(name, functions) {

    functions.setUp = krusoviceSetUp;

    var testcase = amdTestCase(
        {
            testCase : name,
            baseUrl : "/test/src"
        },
        ["krusovice_loader"],
        functions
    );

    return testcase;
}

/**
 * Make require.js test case out of existing object.
 */
function finalizeTestCase(name, obj) {

    // Rename all functions to "should"
    var tests = obj.prototype;

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
