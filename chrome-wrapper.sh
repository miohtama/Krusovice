#!/bin/sh
#
# We need this wrapper script to pass --disable-web-security to Chrome,
# JsTestDriver own APIs, though should support it, fail silently
#

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

echo "Executing $CHROME --disable-web-security $@" > test.log
"$CHROME" --disable-web-security "$@"