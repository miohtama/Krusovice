#!/bin/sh
#
# Run all the tests on hacked Chrome
# - this will kill your Chrome session on the computer so be careful
#


# OSX specific Chrome start-up line
# https://groups.google.com/d/msg/js-test-driver/UfV_xK-qI0w/FhMMQpFAbSwJ
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome;%s;--args;--disable-restore-session-state;--disable-web-security;--homepage;about:blank"

# Run Chrome tests on Travis CI (Ubuntu)
if [ ! -z "$TRAVIS"] ;  then
    sudo apt-get install chromium
    CHROME="/usr/bin/chromium;%s;--args;--disable-restore-session-state;--disable-web-security;--homepage;about:blank"
fi

JSTESTDRIVER="JsTestDriver.jar"

URL="http://js-test-driver.googlecode.com/files/JsTestDriver-1.3.4.b.jar"

# Automatically download JsTsetDriver JAR if we lack one
if [ ! -e $JSTESTDRIVER ] ; then
    echo "Downloading JsTestDriver"
    wget -O $JSTESTDRIVER "$URL"
fi

# Serve static resources using Python's SimpleHTTPServer (JsTestDriver server is broken for basic HTTP stuff)
python -m SimpleHTTPServer &

HTTP_SERVER_PID=$(echo $!)

killall "Google Chrome"
echo "Running FAST tests"
java -jar $JSTESTDRIVER --port 9876 --config jsTestDriver.conf --browser "$CHROME" --tests all --reset && exit 1

killall "Google Chrome"
echo "Running SLOW tests"
java -Xmx512M -jar $JSTESTDRIVER --port 9876 --config jsTestDriver-render.conf  --browser "$CHROME" --tests all --reset && exit 1

kill $HTTP_SERVER_PID

exit 0
