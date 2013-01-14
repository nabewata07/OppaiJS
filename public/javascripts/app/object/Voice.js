/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {

  function Voice(oppai, socket) {
    // inherit EE
    EventEmitter.call(this)
    this.oppai = oppai;
    this.socket = socket;
  }

  Voice.prototype = Object.create(EventEmitter.prototype);

  Voice.new = function (/*args*/) {
    var voice = Object.create(Voice.prototype);
    args = Array.prototype.slice.call(arguments);
    Voice.apply(voice, args);
    return voice;
  };

  Voice.prototype.build = function () {
    this.initVoice();
    this.bindEvent();
    return this;
　}

  Voice.prototype.initVoice = function () {
    var normalAudio = new Audio("");
    var hardAudio = new Audio("");
    var normal_wav = "/music/1.wav";
    var hard_wav = "/music/2.wav";
    var canPlayWav = ("" != normalAudio.canPlayType("audio/wav"));

    if (canPlayWav) {
      normalAudio.src = normal_wav;
      hardAudio.src = hard_wav;
    }

    this.socket.on('oppai.touched', function () {
      normalAudio.play();
    });

    this.oppai.on('oppai.milk', function () {
      hardAudio.play();
    });
  };

  Voice.prototype.bindEvent = function () {
  };

  //export
  win.app.object.Voice = Voice;
}(document, window, jQuery(document)));

