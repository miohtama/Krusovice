.. contents :: :local:

Introduction
-------------

Krusovice is a high quality HTML5 rhythmic photo show creator
which you can integrate to your website.

Background
----------

This is a rewrite and clean-up of previous slideshow9000 attempt.

Music rhythm data is extracted using Echo Nest Remix API.
Rhythm data must be pregenerated prior real-time photo show run.

Componets
------------

Timeliner
=======================

Timeliner takes in a set of show elements (images, text slides) and puts
them on a timeline based on music rhythm data.

Timeline visualization
=======================

Timeline visualization is an utility which shows your built
timeline, so you can see where slides come in and out.

Player
=======================

Player plays the ready show plan in a <canvas>.

Running demos
----------------

If you run demos from file:// you need to disable AJAX security checks.

Start Google Chrome with no security from command lin, OSX::

	/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security

Start Google Chrome from command line, Ubuntu/Linux::

	chromium-browser --disable-web-security

Alternative run with SimpleHTTPServer in port 8000::

    python -m SimpleHTTPServer

Unit tests
------------

Fast tests::

    java -jar JsTestDriver-1.3.3d.jar --port 9876  &
    java -jar JsTestDriver-1.3.3d.jar --config jsTestDriver.conf --tests all --reset

Slow tests::

    python -m "SimpleHTTPServer" &
    java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --port 9876 --config jsTestDriver-render.conf &
    java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --config jsTestDriver-render.conf --tests all --reset

If you get::

    Render.testRenderFewFramesWebGL failed (185.00 ms): SECURITY_ERR: SECURITY_ERR: DOM Exception 18

... you did not start Chrome Security disabled (see above).

JsTestDriver brief
--------------------

JsTestDriver is a Javascript unit testing tool and framework from Google.
It will automatically load a set fo static JS files and execute unit test
cases for them.

JsTestDriver provides its own unit testing suite, but it can be integrated with
other test frameworks (QUnit).

JsTestDriver limitations
==========================

Currently JsTestDriver has some limitations which I hope to have as features in the future

* You still need to Alt-Tab to the browser to check console logs

JS-test-driver command line
=============================

* http://code.google.com/p/js-test-driver/wiki/GettingStarted

::

        wget http://js-test-driver.googlecode.com/files/JsTestDriver-1.3.4-a.jar
        java -jar JsTestDriver-1.3.4-a.jar --port 9876

Then visit

        http://localhost:9876

Leave the browser running. Put the job JsTestDriver on background.

Now trigger a test run::

        java -jar JsTestDriver-1.3.4-a.jar --tests all

Asserts with JsTestDriver
===========================

A good guide to different asserts you can make is in the source code itself

* http://code.google.com/p/js-test-driver/source/browse/trunk/JsTestDriver/src/com/google/jstestdriver/javascript/Asserts.js

Eclipse plug-in
=============================

Install JsTestDrive plug-in

* `Instructions <http://code.google.com/p/js-test-driver/wiki/UsingTheEclipsePlugin>`_

* `Eclipse Update site URL <http://js-test-driver.googlecode.com/svn/update/>`_

.. warning

        Only version 1.1.1.e or later works. Don't pick
        version 1.1.1.c.

* http://code.google.com/p/js-test-driver/issues/detail?id=214

*Run Configurations...* -> for JSTest. Select a .conf file from the project root.
Don't run it yet, just save.

Open JsTestDriver view: *Window* -> * Show view* -> *Other* -> *Javascript* -> *JsTestDriver*.

Click *Play* to start test runner server.
Now JsTsetDriver view shows "capture" URL - go there with your browser(s). Each browser running
a page in this URL is a slave to JsTestDriver and will run the tests. I usually keep
one browser for running tests / code and other open for normal surfing e.g. Firefox as browser browser
and Chrome for testing and debugging. The test browser can has its console all the time open,
so you can check the console messages from there.

The test machinery has been set-up now.
Now you can

 * Run tests manually from Eclipse launcher

 * Toggle checkbox *Run on Save* in the run configuration to see unit tests results after each file save

After run you see the test output in *JsTestDriver* view per browser.

.. note ::

        For some reason I could not get output/stacktrace from failed tests on Chrome
        on one of two test Macs. Safari was ok.

Command-line
========================================

This setup gives you local, instant, continuous integration of Javascript
unit tests using `JsTestDriver <http://code.google.com/p/js-test-driver/wiki/GettingStarted>`_.
JSTestDriver is remote browser controlling and continuous integration framework
for JSUnit unit tests.

We use Python `Watchdog <https://github.com/gorakhargosh/watchdog>`_
to monitor Javascript file save events.

Because Javascript lacks static compile time checks, rigirous unit testing
is the only way to tame this bastard of Scheme. Especially considering
that you have to Microsoft legacy devouring your code and mind.

What we will accomplish

* Save Javascript file in your favorite editor

* Tests run automatically, triggered by file system monitoring

* Alt-tab to browser to see results in the console output

These instructions are for OSX and Linux. Windows users can adapt
with necessary skillz0r.

.. note ::

        JsTestDriver supports other Javascript unit test frameworks besides JsUnit.
        For example, QUnit bindings are available.

Install JsTestDriver::

        wget http://js-test-driver.googlecode.com/files/JsTestDriver-1.3.4-a.jar

Install Watchdog (in `virtualenv isolated Python <http://pypi.python.org/pypi/virtualenv>`_)::

        git clone git://github.com/gorakhargosh/watchdog.git
        cd watchdog
        python setup.py install

Create `JsTestDriver.conf file <http://code.google.com/p/js-test-driver/wiki/ConfigurationFile>`_
telling where to load tests and where to load data.

Start JsTestDriver as a background process::

::

        java -jar JsTestDriver-1.3.4-a.jar --port 9876 &

Capture browser(s) by visiting in the URL in a browser opened on the
computer running tests (usually your own computer...).
These browsers will keep executing unit test
until the page is closed::

        http://localhost:9876/capture

.. warning ::

        The success with new browser versions vary. JsTestDriver uses console exception stack trace
        text analysis to capture the errors. However, the browser vendors do not have standardized,
        or even stable, stack trace format. If you get just report "test failed" without further
        information how it failed try to switch the test browser. I had best luck with Google Chrome
        version 13 (the exact version number is very important!).
        Please report further browser problems to JsTestDriver discussion group.

.. note ::

        Google doesn't provide old Chrome downloads. Niiice.

.. note ::

        Disable Chrome automatic update: http://www.sitepoint.com/how-to-disable-google-chrome-updates/

Specifically the following browsers failed to produce useable stack traces
with JsTestDriver 1.3.2: Firefox 6, Chrome 14, Safari 5.1, Opera 11.50.
Pass/fail output still works.

This magic spell will make Watchdog to rerun tests on file-system changes::

        watchmedo shell-command --patterns="*.js" --recursive  --command='java -jar JsTestDriver-1.3.4-a.jar --captureConsole --tests all'

To run a single test case (e.g. Timeliner)::

        java -jar JsTestDriver-1.3.4-a.jar --captureConsole --tests Timeliner

To run a single test::

        java -jar JsTestDriver-1.3.4-a.jar --tests Timeliner.testBasicNoMusic


Save any *.js* file, watchmedo notices and runs the tests.

Use ``--captureConsole`` to control whether you want to see console output in the terminal
(only text) or browser (object explorer enabled).

.. note ::

        You can normally insert debug breakpoints in the web browser Javascript debugger.
        The test execution will pause.

Sometimes JsTestDriver daemon process gets stuck. Kill it and restart with the following terminal commands::

        # hit CTRL+C to stop Watchdog
        fg # Bring JsTestDriver process to foreground
        # hit CTRL+C

You might need to also increase the default Java heap site if you get out of memory errors::

        java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --port 9876 --config jsTestDriver-render.conf &
        java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --config jsTestDriver-render.conf --tests all


Static data
++++++++++++++

Image files etc. which are exposed to unit tests do not follow the same relative paths
as they would on the file system, because the test runner URL is clunky.

You use ``serve`` directive in *JsTestDriver.conf* to specify the location
of static media files::

        serve:
          - testdata/*

Async tests
++++++++++++++

These tests are runned separately because the JsTestDriver server cannot serve images and
running the tests are slow.

We use Python SimpleHTTPServer to serve data,.

How to run::

	python -m SimpleHTTPServer &
	java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --config jsTestDriver-render.conf --port 9876 &
	# Capture
	java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --config jsTestDriver-render.conf --tests all

More info

* http://groups.google.com/group/js-test-driver/browse_thread/thread/a14e2d24ec563d78

More info
++++++++++++

* http://groups.google.com/group/js-test-driver

* http://code.google.com/p/js-test-driver/wiki/Assertions

* http://startingonsoftware.blogspot.com/2011/02/javascript-headless-unit-testing_15.html

* http://code.google.com/p/js-test-driver/issues/detail?id=263&start=100

Breakpoints and Eclipse JsTestDriver
========================================

Instructions for Safari, but should apply to other browsers as well.

* Capture browser

* Run unit tests

* See some test is failing

* Go to captured browser, Javascript debugger

* Add breakpoint to the failing test, before the assert/line that fails

* Go to Eclipse (Alt+tab)

* Hit *Rerun last configuration* in *JsTestDriver* view

* Now your browser should stop in the breakpoint

Available test sets
=================================

Fast (no images, canvas stressing)::

        watchmedo shell-command --patterns="*.js" --recursive  --command='java -jar JsTestDriver-1.3.4-a.jar --captureConsole --tests all'

Render (loads images, renders several frames, async)::

        watchmedo shell-command --patterns="*.js" --recursive  --command='java -jar JsTestDriver-1.3.4-a.jar --config jsTestDriver-render.conf --tests all'

Documentation
---------------

Building API documentation
==============================

Installing prerequisitements (OSX)::

        sudo gem install rdiscount json parallel rspec

Installing JSDuck::

        # --pre installs 2.0 beta version
        sudo gem install --pre jsduck

Building docs with JSDuck::

        bin/build-docs.sh

More info

* https://github.com/nene/jsduck

Release
---------

To run the most fucked up release script ever::

        wget http://yui.zenfs.com/releases/yuicompressor/yuicompressor-2.4.6.zip
        unzip yuicompressor-2.4.6.zip
        bin/release.py -d build trunk

.. note ::

        All JS files must terminate with newline or the compressor will complain.

Music
-------

The out of the box project contains CC licensed music files for testing purposes

* http://www.jamendo.com/en/artist/Emerald_Park

* http://www.jamendo.com/en/artist/manguer

Echo Nest REMIX
-----------------

Echo Nest Remix API works by uploading data to Echo Nest servers for audio analysis.
First MP3 is decoded with ffmpeg and then raw data is uploaded(?).

Echo Nest remix API Python bindings can be installed:

::

    source pyramid/bin/activate
    svn checkout http://echo-nest-remix.googlecode.com/svn/trunk/ echo-nest-remix
    cd echo-nest-remix
    # Apparently this puts some crap to /usr/local and /usr/local/bin
    sudo python setup.py install
    sudo ln -s `which ffmpeg` /usr/local/bin/en-ffmpeg



TODO: How to build rhythm .json data files by hand.