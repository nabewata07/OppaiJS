/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {
  // export name space
  win.app = {};
  win.app.object = {};

  $(window).on('load', function () {
    var space, oppai, frame, voice, meter, me, oppaiHunters = {},
    object = win.app.object,
    socket = io.connect();

    frame = doc.querySelector('#oppai');

    // build 3D Space
    space = object.Space.new(frame, socket);

    // 私はおっぱいハンター
    me = object.Hunter.new(space, socket);
    me.trackOtherHunters(); // 他のハンターをトラッキング

    // build object
    oppai = object.Oppai.new(space, socket).build();
    oppai.appear();

    // init voice
    voice = object.Voice.new(oppai, socket).build();
    // init meter 
    meter = object.Meter.new(oppai, socket).build();

    // draw all Object
    space.draw();

    // resize
    $(this).on('resize', function() {
      space.renderer.setSize(frame.offsetWidth, frame.offsetHeight);
      space.camera.aspect = frame.offsetWidth / frame.offsetHeight;
      space.camera.updateProjectionMatrix();
    });
  });
}(document, window, jQuery(document)));
