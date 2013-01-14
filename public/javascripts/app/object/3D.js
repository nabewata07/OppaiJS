/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {
  function Space(frame, socket) {
    // inherit EE
    EventEmitter.call(this)
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.canvas_frame = frame;
    this.width = frame.clientWidth;
    this.height = frame.clientHeight;
    this.socket = socket;
    this.build();
    frame.appendChild(this.renderer.domElement);
  }

  Space.prototype = Object.create(EventEmitter.prototype);

  Space.new = function (/*args*/) {
    var space = Object.create(Space.prototype);
    args = Array.prototype.slice.call(arguments);
    Space.apply(space, args);
    return space;
  };

  Space.prototype.build = function () {
    if (this.isReady) return;
    this.initRenderer();
    this.initCamera();
    this.initSence();
    this.initLight();
    this.initTrackball();
    this.isReady = true;
  }


  Space.prototype.initRenderer = function () {
    this.renderer.setSize(this.width, this.height);
    //this.renderer.setClearColorHex(0x000000, 1.0); 
    this.renderer.setClearColorHex(0xFFFFFF, 1.0); 
  };

  Space.prototype.initCamera = function () {
    var width = this.width,
      height = this.height,
      camera;

    camera = new THREE.PerspectiveCamera( 45 , width / height , 1 , 10000 );
    camera.position.x = 100;
    camera.position.y = 100;
    camera.position.z = 100;
    camera.up.x = -10;
    camera.up.y = 10;
    camera.up.z = 10;
    camera.lookAt({x: 0, y: 0, z: 0 });
    this.camera = camera;
  };

  Space.prototype.initSence = function () {
    this.scene = new THREE.Scene();
  };

  Space.prototype.initLight = function () {
    var light = new THREE.DirectionalLight(0xFF0000, 1.0, 0);
    light.position.set( 100, 100, 200 );
    this.scene.add(light);
  };

  Space.prototype.initTrackball = function () {
    var that = this,
      scene = this.scene,
      camera = this.camera,
      renderer = this.renderer,
      socket = this.socket,
      prev = camera.position.clone(),
      trackball = new THREE.TrackballControls(camera, renderer.domElement);

    trackball.zoomSpeed = 0.1;
    trackball.minDistance = 80;
    trackball.maxDistance = 1000;
    prev.set(0, 0, 0);

    this.trackball = trackball;

    (function animate() {
      var current = camera.position;
      that.emit('animation.frame');

      // update scene rendering
      requestAnimationFrame(animate);
      trackball.update();
      renderer.render(scene, camera);

      // notify camera position
      if (!current.equals(prev)) {
        socket.emit('hunter.position', [current.x, current.y, current.z]);
        prev.set(current.x, current.y, current.z);
      }
    }());
  };

  Space.prototype.draw = function () {
    var that = this;
    this.renderer.clear();  
    this.renderer.render(this.scene, this.camera);
  };

  //export
  win.app.object.Space = Space;
}(document, window, jQuery(document)));

