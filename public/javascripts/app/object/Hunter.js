/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {

  function Hunter(space, socket) {
    // inherit EE
    EventEmitter.call(this)
    this.space = space;
    this.socket = socket;
  }

  Hunter.prototype = Object.create(EventEmitter.prototype);

  Hunter.new = function (/*args*/) {
    var hunter = Object.create(Hunter.prototype);
    Hunter.apply(hunter, arguments);
    return hunter;
  };

  Hunter.others = {};

  Hunter.prototype.trackOtherHunters = function () {
    var socket = this.socket,
      space = this.space;

    // おっぱいハンターが動いた！
    socket.on('hunter.moved', function(id, xyz) {
      var hunter;

      // 新手のおっぱいハンターがあらわれた！
      if (!(id in Hunter.others)) {
        hunter = Hunter.others[id] = Hunter.new(space, socket);
        hunter.plot.apply(hunter, xyz);
      }
      // 知ってるハンター
      else {
        hunter = Hunter.others[id];
        hunter.update.apply(hunter, xyz);
      }
    });

    socket.on('hunter.entry', function() {
      var position = space.camera.position;
      socket.emit('hunter.position', [position.x, position.y, position.z]);
    });

    socket.emit('hunter.entry');
  };

  /**
   * ハンターをプロット
   *
   * TODO: 球の平面にテクスチャ描画
   */
  Hunter.prototype.plot = function (x, y, z) {
    var geo = new THREE.SphereGeometry(5, 32, 16);
      shader = THREE.ShaderUtils.lib['fresnel'],
      uniforms = THREE.UniformsUtils.clone(shader.uniforms),
      mesh;

    this.mesh = mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xdddddd, shading: THREE.SmoothShading } ));

    mesh.position.set(x, y, z);
    this.space.scene.add(mesh);
  }

  /**
   * Update hunter position
   */
  Hunter.prototype.update = function (x, y, z) {
    mesh.position.set(x, y, z);
  };

  //export
  win.app.object.Hunter = Hunter;
}(document, window, jQuery(document)));


