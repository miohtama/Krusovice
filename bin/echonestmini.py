"""

    Mini Echo Nest server.

    This will allow you to interact with Echo Nest API from Javascript.

    Usage::

        # First create virtualenv
        easy_install Flask
        export ECHO_NEST_API_KEY="xxxx"
        bin/echonestmini.py

    A working ffmpeg is needed in order to run Echo Nest.

"""


# -*- coding: utf8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

from cStringIO import StringIO
import sys
import os
import sys
import json
import traceback
import transaction
from json import JSONEncoder

import echonest.audio as audio
from echonest.audio import AudioQuantum
from echonest.audio import AudioAnalysis
from pyechonest.track import Track

from flask import Flask, request


#: Where our uploads go
UPLOAD_FOLDER = '/tmp/echonestmini'

#: This are Echo Nest data we expose to JS
AUDIO_ANALYSIS_KEYS = """bars beats duration end_of_fade_in identifier key loudness
metadata mode pyechonest_track sections segments source start_of_fade_out tatums tempo
time_signature""".split()

#: Create Flask mini web sever handling our requests
server = Flask(__name__)

server.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


class EchoNestEncoder(JSONEncoder):
    """
    Helper JSON encoder to export Echo Nest audio data to JSON.
    Support our special callbacks to convert Python objects directly to JSON.
    """

    def map_instance_variables(self, obj, *args):
        dct = {}

        # convert seconds -> milliseconds
        convert_to_ms = ["start", "duration"]
        for a in args:
            val = getattr(obj, a)

            if a in convert_to_ms:
                val *= 1000

            dct[a] = val

        return dct

    def default(self, o):
        if isinstance(o, AudioQuantum):
            return self.map_instance_variables(o, "start", "duration", "confidence")

        elif isinstance(o, AudioAnalysis):
            return self.map_instance_variables(o, *AUDIO_ANALYSIS_KEYS)

        elif isinstance(o, Track) or isinstance(o, audio.LocalAudioFile):
            # Don't know what should be serialized
            return {}

        else:
            JSONEncoder.default(self, o)


def analyze(filepath):
    """ Create .json blob out of Echo Nest analysis """
    encoder = EchoNestEncoder(ensure_ascii=True)
    data = audio.LocalAudioFile(filepath)
    json = encoder.encode(data.analysis)
    return json


def create_full_analysis(song_file):
    if not 'FFMPEG' in os.environ:
        print("FFMPEG environment variable not set, defaulting to 'ffmpeg' in path")
        os.environ['FFMPEG'] = 'ffmpeg'

    try:
        _do_create_analysis(song, song_file, hash)
    except Exception as e:
        fmte = traceback.format_exc()
        update_state(song, phase="failed", error_message=fmte)
        print(e, file=sys.stderr)

    json_data = analyze(song_file)
    return json_data


def main():

    if not os.path.exists(UPLOAD_FOLDER):
        os.mkdir(UPLOAD_FOLDER)

    # Config logging
    level = logging.INFO
    logging.basicConfig(level=level, stream=sys.stdout, format=LOG_FORMAT)
    logger.info("Starting echonestmini")

    server.run("localhost", 9999)


@server.route("/song")
def song():
    """
    Handle MP3 upload and return its Echo Nest data.
    """

    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('uploaded_file',
                                    filename=filename))