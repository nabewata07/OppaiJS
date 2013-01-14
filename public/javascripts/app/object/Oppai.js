/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {
  function Oppai(space, socket) {
    // inherit EE
    EventEmitter.call(this)
    this.space = space;
    this.socket = socket;
  }

  Oppai.prototype = Object.create(EventEmitter.prototype);

  Oppai.new = function (/*args*/) {
    var oppai = Object.create(Oppai.prototype);
    args = Array.prototype.slice.call(arguments);
    Oppai.apply(oppai, args);
    return oppai;
  };

  Oppai.prototype.build = function () {
    this.initDoubleMountain();
    this.bindEvent();
    return this;
  }

  Oppai.prototype.initDoubleMountain = function () {
    var oppai_x_range = [-2.5, 2.5],
      oppai_y_range = [-2.5, 3],
      vertexInterval = 0.02,
      scale = 50, vertexes,
      iy = 0, ix = 0, face,
      geometry = new THREE.Geometry(), pointes = [],
      y, x, i, j, idx = 0, pointA, pointB, pointC, pointD, n4 = {};

    for (y = oppai_y_range[0]; y < oppai_y_range[1]; y += vertexInterval, iy++) {
      ix = 0;
      for (x = oppai_x_range[0]; x < oppai_x_range[1]; x += vertexInterval, ix++) {
        z = this.workOutZ(x, y);
        vertexes = new THREE.Vector3(x, y, z);
        pointes.push(vertexes);
        geometry.vertices.push(vertexes);
      }
    }

    for (i = 0; i < iy-1; i++) {
      for (j = 0; j < ix-1; j++) {
        face = new THREE.Face4(idx, idx+1, ix+idx+1, ix+idx)
        pointA = pointes[idx];
        pointB = pointes[idx+1];
        pointC = pointes[idx+ix+1];
        pointD = pointes[idx+ix];

        n4.x = (pointD.y - pointC.y)*(pointA.z - pointD.z) - (pointD.z - pointC.z)*(pointA.y - pointD.y);
        n4.y = (pointD.z - pointC.z)*(pointA.x - pointD.x) - (pointD.x - pointC.x)*(pointA.z - pointD.z);
        n4.z = (pointD.x - pointC.x)*(pointA.y - pointD.y) - (pointD.y - pointC.y)*(pointA.x - pointD.x);
        face.normal = new THREE.Vector3(n4.x, n4.y, n4.z);
        geometry.faces.push(face);

        idx++;
      }
    }

    material = new THREE.MeshNormalMaterial({color:0xff0000});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(1,1,1);
    mesh.geometry.dynamic = true;
    mesh.scale =  new THREE.Vector3(25, 25, 25);
    this.mesh = mesh;
  };

  Oppai.prototype.workOutZ = function (x, y) {
    var e, z, pow = Math.pow, exp = Math.exp, abs = Math.abs, E = Math.E;

    return 1/6 * (
        6 * exp(
            -( pow( 2/3 * abs(x)-1, 2 ) + pow( 2/3*y, 2)) -
            1/3*pow( 2/3*y + 1/2, 3 )
        ) +
        2/3 * exp( pow(-E, 11) * pow( pow( abs(2/3 * x)-1, 2 ) + pow(2/3 * y, 2), 2 )) +
        2/3 * y - pow(2/3 * x, 4)
    )
  };

  Oppai.prototype.appear = function () {
    this.space.scene.add(this.mesh);
  };

  Oppai.prototype.bindEvent = function () {
    this.touch();
    this.milk();
  };

  Oppai.prototype.touch = function () {
    var projector = new THREE.Projector(),
        that = this;

    $(this.space.renderer.domElement).live('click', function(e) {
      var renderer = that.space.renderer,
          camera = that.space.camera,
          scene = that.space.scene,
          meshArray = [that.mesh],
          x =   ((e.pageX - e.target.offsetLeft) / renderer.domElement.width)  * 2 - 1,
          y = - ((e.pageY - e.target.offsetTop) / renderer.domElement.height) * 2 + 1,
          vector = new THREE.Vector3(x, y, 1),
          ray, intersects, color, point;

      projector.unprojectVector(vector, camera);
      ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
      intersects = ray.intersectObjects(meshArray);
      if (intersects.length > 0) {
        point = intersects[0].point;

        // クリックイベントをサーバー側へ送信
        that.socket.emit('oppai.touch', point);
      }
      renderer.render(scene, camera);
    });
  };

  Oppai.prototype.milk = function () {
    var geometry = new THREE.SphereGeometry(3, 5, 3),
        material = new THREE.MeshNormalMaterial({color:0xffffcc}),
        right_x = 45,
        left_x = -45,
        y = 0,
        z = 20,
        that = this;

    this.on('oppai.milk', function () {
      var mesh_list = [],
          i,
          counter = 0,
          max = 10,
          interval;

      // アニメーション
      that.space.on('animation.frame', function milk() {
        // 最大max個の母乳を作る
        if (max > counter) {
          mesh_list.push({
            right: _make_mesh(right_x),
            left: _make_mesh(left_x)
          });
          counter++;
        }

        if (mesh_list.every(function(mesh) {
          return mesh.done;
        })) {
          delete mesh_list;
          that.space.removeListener('animation.frame', milk);
        }

        // 母乳の数分のアニメーション処理
        mesh_list.forEach(function(mesh, index) {
          var right = mesh.right;
          var left = mesh.left;
          right.position.z += 5;
          left.position.z += 5;
          right.position.y = Math.pow(right.position.z, 2) / 100;
          left.position.y = Math.pow(left.position.z, 2) / 100;
          if (right.position.z >= 150 && left.position.z >= 150) {
            right.visible = false;
            left.visible = false;
            mesh.done = true;
          }
        });
      });

      function _make_mesh(x) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        that.space.scene.add(mesh);
        return mesh;
      }
    });
  };

  //export
  win.app.object.Oppai = Oppai;
}(document, window, jQuery(document)));
