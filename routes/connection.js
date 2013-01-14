/**
 * WebSocket通信コントローラー
 */

exports.connection = function (io) {
  var meter = require('../lib/meter').meter,
    sockets = io.sockets;

  sockets.on('connection', function(socket) {

    // おっぱいタッチイベント　
    socket.on('oppai.touch', function(data) {
      var point = meter(data);
      sockets.emit('oppai.touched', point);
    });

    socket.on('hunter.entry', function() {
      socket.broadcast.emit('hunter.entry');
    });

    socket.on('hunter.position', function(camera) {
      socket.broadcast.emit('hunter.moved', socket.id, camera);
    });
  });
};
