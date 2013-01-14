/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {
  function Meter(oppai, socket) {
    // inherit EE
    EventEmitter.call(this)
    this.oppai = oppai;
    this.socket = socket;
  }

  Meter.prototype = Object.create(EventEmitter.prototype);

  Meter.new = function (/*args*/) {
    var voice = Object.create(Meter.prototype);
    args = Array.prototype.slice.call(arguments);
    Meter.apply(voice, args);
    return voice;
  };

  Meter.prototype.build = function () {
    this.initMeter();
    return this;
　}

  Meter.prototype.initMeter = function () {
    var meter = 0,
        max = 100,
        that = this;
    // メーターアップ
    this.socket.on('oppai.touched', function(point) {
      meter += point;
      console.log(meter);
      if (meter >= max) {
        // 母乳噴射イベント
        that.oppai.emit('oppai.milk');
        meter = 0;
      }
    });
  };

  //export
  win.app.object.Meter = Meter;
}(document, window, jQuery(document)));

