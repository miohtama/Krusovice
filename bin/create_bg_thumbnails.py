# -*- coding: utf8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

"""

    Generate thumbnaisl image for backgrounds.

    These images are used on UI. This script will load a page containing <canvas>
    preview of all thumbnails and write to files.

"""

import traceback
import urlparse
import datetime
import os
import sys
import subprocess
import time
import base64
import json
import tempfile
import urllib
import urllib2

from cStringIO import StringIO

from PIL import Image

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys

XVFB = True

if "darwin" in sys.platform:
    # no xvfb on mac
    XVFB = False


# Selenium driver
browser = None

def check_ready():
    """
    See when the script raises all ready flag.

    Interacting with Javascript
    http://stackoverflow.com/questions/5585343/getting-the-return-value-of-javascript-code-in-selenium
    """
    val = browser.execute_script("return window.backgrounds.ready")
    return bool(val)

def check_failed():
    """
    See if the script has raised failed flag.

    Interacting with Javascript
    http://stackoverflow.com/questions/5585343/getting-the-return-value-of-javascript-code-in-selenium
    """
    val = browser.execute_script("return window.backgrounds.failedMessage")
    return val


def decode_data_uri(data_uri):
    """
    Return raw bytes payload of data_uri
    """

    print "Got frame data:" + str(len(data_uri))

    print "Data URI header:" + data_uri[0:40]

    # u'data:image/png;base64,iVBORw0KGgoA
    header_len = data_uri.find(",")
    payload = data_uri[header_len+1:]

    binary = base64.b64decode(payload)

    print "Binary id:" + binary[0:4]
    io = StringIO(binary)

    img = Image.open(io)

    raw = img.tostring("raw", "RGB")

    return img


def grab_all(filename, output_folder):
    """
    Open file:// HTML source in the Firefox and run a script which will extracts <canvas> images out of it.
    """
    global browser

    if XVFB:
        # Run in XVFB on the server
        print "Starting Xvfb at :5"
        xvfb = subprocess.Popen(["Xvfb", ":5", "-screen", "0", "1024x768x24"])
        os.environ['DISPLAY'] = ':5'

    profile = webdriver.firefox.firefox_profile.FirefoxProfile()

    # Allow file:// AJAX requets

    # Allow XPCOM functions
    print "Enabling file:// AJAX requets"
    #set_pref = profile.set_preference

    # https://developer.mozilla.org/En/Same-origin_policy_for_file%3A_URIs
    # http://www.generalinterface.org/docs/display/DEVBLOG/2010/04/15/Stopping+the+repetitious+security+prompt+on+Firefox+GI+Builder
    profile.set_preference("security.fileuri.strict_origin_policy", False);

    browser = webdriver.Firefox(firefox_profile=profile)
    browser.get("file://" + os.path.abspath(filename)) # Load page

    print "Preparing media assets"
    while check_ready():
        time.sleep(1)

    print "Starting capture"

    ids = browser.execute_script("return window.backgrounds.getBackgroundIds()")

    for id in ids:
        fname = os.path.join(output_folder, id + ".png")
        print "Capturing image:" + id + " to:" + fname
        data = browser.execute_script("return window.backgrounds.getBackgroundThumbnail('" + id + "')")
        img = decode_data_uri(data)
        img.save(fname)

def main():
    filename = sys.argv[1]
    output_folder = sys.argv[2]
    try:
        grab_all(filename, output_folder)
    finally:
        if browser != None:
            browser.close()

if __name__ == "__main__":
    main()
