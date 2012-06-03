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

    Generate loudness .json info for MP3 files::

        python virtualenv.py --system-site-packages -p /opt/local/bin/python2.7 venv
        source venv/bin/activate
        pip install plac



"""

import sys
import pygst

pygst.require('0.10')
import gst, gobject
import plac

def get_peaks(filename):
    """
    Extract VU peak data from a file.

    Decode it using gtreamer and use level module to extract peak data.
    """

    pipeline_txt = (
        'filesrc location="%s" ! decodebin ! audioconvert ! '
        'audio/x-raw-int,channels=1,rate=44100,endianness=1234,'
        'width=32,depth=32,signed=(bool)True !'
        'level name=level interval=1000000000 !'
        'fakesink' % filename)

    pipeline = gst.parse_launch(pipeline_txt)

    level = pipeline.get_by_name('level')
    bus = pipeline.get_bus()
    bus.add_signal_watch()

    peaks = []
    do_run = True

    def show_peak(bus, message):

        print "Got message: %s" % message

        if message.type == gst.MESSAGE_EOS:
            pipeline.set_state(gst.STATE_NULL)
            do_run = False
            return
        # filter only on level messages
        if message.src is not level or \
           not message.structure.has_key("peak"):
            return
        peaks.append(message.structure['peak'][0])


    # connect the callback
    bus.connect('message', show_peak)

    # run the pipeline until we got eos
    pipeline.set_state(gst.STATE_PLAYING)
    ctx = gobject.gobject.main_context_default()
    while ctx and do_run:
        ctx.iteration()

    return peaks

def normalize(peaks):
    """
    Normalize peak data.
    """
    _min = min(peaks)
    _max = max(peaks)
    d = _max - _min
    return [(x - _min) / d for x in peaks]

@plac.annotations(
    filename=("MP3 for which to generate .loudness.json data", "positional"),
    )
def run(filename):
    """
    """
    peaks = get_peaks(filename)
    peaks = normalize(peaks)

def main():

    gobject.threads_init()
    exitcode = plac.call(run)
    sys.exit(exitcode)

if __name__ == "__main__":
    main()