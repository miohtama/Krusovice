Test dynamic effects
---------------------

Chrome only (Web Audio API).

Go to koti.kapsi.fi/~miohtama/krusovice/demos/timing-tester.html

If the show doesn't start right after load, hit refresh (fresh cache).

Test with your own MP3 file
----------------------------

Break CORS sandbox to allow echonest.com uploads with --disable-web-security::

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security \
    -–allow-file-access-from-files

Get Echo Nest API key:

https://developer.echonest.com/account/register

Go to koti.kapsi.fi/~miohtama/krusovice/demos/timing-tester.html

Fill in the API key field.

Choose MP3 file to upload.

Upload + Echo Nest processing takes around two minutes or so depending on the connection speed.

The show starts automatically when the song has been uploaded.

Enjoy.