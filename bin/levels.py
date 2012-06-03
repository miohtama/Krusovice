"""

    Get time -> loudness data for a song.

    Orignal implementation:

    http://stackoverflow.com/questions/9344888/getting-max-amplitude-for-an-audio-file-per-second

    http://gstreamer.freedesktop.org/data/doc/gstreamer/head/gst-plugins-good-plugins/html/gst-plugins-good-plugins-level.html

    Dependencies
    ----------------

    (Macports)::

        sudo port install py27-gst-python gst-plugins-good gst-plugins-ugly


    .. note ::

        You need MP3 decoder from "ugly".

    Loudness data generation
    ---------------------------

    Installation using virtualenv::

        python virtualenv.py --system-site-packages -p /opt/local/bin/python2.7 venv
        source venv/bin/activate
        pip install plac ipdb


    Usage
    ------

        python bin/levels.py demos/test-song.mp3

    ->

        Creates demos/test-song.levels.json which contains falling loudness peak data

    Output
    -------

    Exported JSON format:

    {
        // Samping interval in seconds
        interval : 0.01,

        fields =  ["peak", "decay", "rms"],

        // Tuples of [peak, decay, RMS]
        // Time position is tuple index * internval
        peaks : [ [0.0, 0.0, 0.06] , [0.0, 0.5, 0.0] ... ]

    }


"""

from __future__ import print_function

__copyright__ = "Copyright 2012 Mikko Ohtamaa http://opensourcehacker.com"
__license__ = "AGPL"

import sys
import pygst
import json

pygst.require('0.10')
import gst, gobject
import plac

gst_running = True

def get_peaks(filename, interval):
    """
    Extract VU peak data from a file.

    Decode it using gtreamer and use level module to extract peak data.
    """

    interval = int(interval * 1000000000L)

    pipeline_txt = (
        'filesrc location="%s" ! decodebin ! audioconvert ! '
        'audio/x-raw-int,channels=1,rate=44100,endianness=1234,'
        'width=32,depth=32,signed=(bool)True !'
        'level name=level interval=%d !'
        'fakesink' % (filename, interval))

    pipeline = gst.parse_launch(pipeline_txt)

    level = pipeline.get_by_name('level')
    bus = pipeline.get_bus()
    bus.add_signal_watch()

    peaks = []

    def show_peak(bus, message):

        global gst_running

        # Terminate app when end of stream is detected
        if message.type == gst.MESSAGE_EOS:
            pipeline.set_state(gst.STATE_NULL)
            gst_running = False
            return

        # filter only on level plug-in messages
        if message.src is not level or \
           not message.structure.has_key("peak"):
            return

        time = message.structure["stream-time"] / 1000000000L

        # 0 = first channel = mono
        data = (message.structure["peak"][0], message.structure["decay"][0], message.structure["rms"][0])

        print("%.5f: %s" % (time, data))

        peaks.append(data)

    # connect the callback
    bus.connect('message', show_peak)

    # run the pipeline until we got eos
    pipeline.set_state(gst.STATE_PLAYING)
    ctx = gobject.gobject.main_context_default()
    while ctx and gst_running:
        ctx.iteration()

    return peaks


def normalize(peaks):
    """
    Normalize peak, decay, rms data.
    """

    flatten = []
    for data in peaks:
        flatten.append(data[0])
        flatten.append(data[1])
        flatten.append(data[2])

    _min = min(flatten)
    _max = max(flatten)

    d = _max - _min

    print("Min: %f Max: %f" % (_min, _max))

    return [((peak - _min) / d, (decay - _min) / d, (rms - _min) / d) for peak, decay, rms in peaks]


# http://plac.googlecode.com/hg/doc/plac.html

@plac.annotations(
    interval=("Samping rate time in seconds", "option", "i"),
    filename=("MP3 for which to generate .levels.json data", "positional"),
    )
def run(filename, interval=1.0 / 60.0):
    """
    """
    peaks = get_peaks(filename, interval)
    peaks = normalize(peaks)

    output_filename = filename.replace(".mp3", ".levels.json")

    data = dict(
        interval=interval,
        fields=["peak", "decay", "rms"],
        peaks=peaks
    )

    f = open(output_filename, "wt")
    json.dump(data, f)
    f.flush()
    f.close()


def main():

    gobject.threads_init()
    exitcode = plac.call(run)
    sys.exit(exitcode)

if __name__ == "__main__":
    main()