#!/bin/sh
#
# Run all the tests - this will kill your Chrome
#

PWD=`pwd`
CHROME="$PWD/chrome-wrapper.sh"

# http://code.google.com/p/js-test-driver/source/browse/trunk/JsTestDriver/src/com/google/jstestdriver/browser/CommandLineBrowserRunner.java
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

#echo $CHROME
#$CHROME

# Serve static resources
python -m SimpleHTTPServer &

HTTP_SERVER_PID=$(echo $!)

killall "Google Chrome"
echo "Running FAST tests"
java -jar JsTestDriver-1.3.4-a.jar --verbose --port 9876 --config jsTestDriver.conf --browser "$CHROME" --tests all --reset

echo "Running SLOW tests"
java -Xmx512M -jar JsTestDriver-1.3.4-a.jar --port 9876 --config jsTestDriver-render.conf  --browser "$CHROME" --tests all --reset


kill $HTTP_SERVER_PID
