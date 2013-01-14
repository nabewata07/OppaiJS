/*jslint devel: true, unparam: true, sloppy: true, vars: false, nomen: true, plusplus: true, maxerr: 1000, indent: 4 */
/*global window, document, setInterval, clearInterval, setTimeout*/
(function (doc, win, $doc) {
  var CAMERA_ORBIT      = 0.0025,
      DISPLACEMENT      = 0.15,
      SPRING_STRENGTH   = 0.0005,
      DAMPEN            = 0.998,
      ORIGIN            = new THREE.Vector3(),
      DEPTH             = 600;

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
    this.createSprings();
    this.bindEvent();
    return this;
  }

  Oppai.prototype.initDoubleMountain = function () {
    var oppai_x_range = [-2.5, 2.5],
      oppai_y_range = [-2.5, 3],
      vertexInterval = 0.25,
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
        8 * exp(
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
    this.spring();
    this.onAnimation();
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
        that.emit('oppai.spring', intersects[0].face);
      }
      //renderer.render(scene, camera);
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
      interval = setInterval(function() {
        var right, left;
        // 最大max個の母乳を作る
        if (max > counter) {
          mesh_list.push({
            right: _make_mesh(right_x),
            left: _make_mesh(left_x)
          });
          counter++;
        }

        // 母乳の数分のアニメーション処理
        for (i in mesh_list) {
          right = mesh_list[i].right;
          left = mesh_list[i].left;
          
          right.position.z += 5;
          left.position.z += 5;
          right.position.y = Math.pow(right.position.z, 2) / 100;
          left.position.y = Math.pow(left.position.z, 2) / 100;
          if (right.position.z >= 100 && left.position.z >= 100) {
            right.visible = false;
            left.visible = false;
            delete mesh_list[i];
            if (mesh_list.length <= 0) {
              clearInterval(interval);
            }
          }
        }
        that.space.renderer.render(that.space.scene, that.space.camera);
      }, 50);

      function _make_mesh(x) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        that.space.scene.add(mesh);
        return mesh;
      }
    });
  };

  Oppai.prototype.createSprings = function() {
    var faces = this.mesh.geometry.faces,
      that = this;

    faces.forEach(function(face) {
      if (face instanceof THREE.Face3) {
        createSpring.call(that, face.a, face.b);
        createSpring.call(that, face.b, face.c);
        createSpring.call(that, face.c, face.a);
      } else {
        createSpring.call(that, face.a, face.b);
        createSpring.call(that, face.b, face.c);
        createSpring.call(that, face.c, face.d);
        createSpring.call(that, face.d, face.a);
      }
    });
  }

  function createSpring(start, end) {
    var vertices = this.mesh.geometry.vertices;
    var startVertex    = vertices[start];
    var endVertex      = vertices[end];

    // if the springs array does not
    // exist for a particular vertex
    // create it
    if(!startVertex.springs) {
      startVertex.springs = [];

      // take advantage of the one-time init
      // and create some other useful vars
      startVertex.normal = startVertex.clone().normalize();
      startVertex.originalPosition = startVertex.clone();
    }

    // repeat the above for the end vertex
    if(!endVertex.springs) {
      endVertex.springs = [];
      endVertex.normal = startVertex.clone().normalize();
      endVertex.originalPosition = endVertex.clone();
    }

    if(!startVertex.velocity) {
      startVertex.velocity = new THREE.Vector3();
    }

    // finally create a spring
    startVertex.springs.push({

      start   : startVertex,
      end     : endVertex,
      length  : startVertex.length(
        endVertex
      )

    });
  }

  Oppai.prototype.spring = function() {
    var magnitude = 0.006,
      that = this;

    this.on('oppai.spring', function(face) {
      displaceVertex(face.a, magnitude);
      displaceVertex(face.b, magnitude);
      displaceVertex(face.c, magnitude);

      // if this is a face4 do the final one
      if(face instanceof THREE.Face4) {
        displaceVertex.call(that, face.d, magnitude);
      }
    });
  }

  function displaceVertex(vertex, magnitude) {
    var vertices = this.mesh.geometry.vertices;

    // add to the velocity of the vertex in question
    // but make sure we're doing so along the normal
    // of the vertex, i.e. along the line from the
    // sphere centre to the vertex
    vertices[vertex].velocity.addSelf(

      vertices[vertex].normal.
      clone().
      multiplyScalar(magnitude)

    );
  }

  Oppai.prototype.onAnimation = function() {
    var oppai = this;
    this.space.on('animation.frame', function() {
      oppai.updateVertexSprings();
      oppai.mesh.geometry.verticesNeedUpdate = true;
      oppai.mesh.geometry.computeFaceNormals();
      oppai.mesh.geometry.computeVertexNormals();
    });
  };

  Oppai.prototype.updateVertexSprings = function() {
    // go through each spring and
    // work out what the extension is
    var vertices = this.mesh.geometry.vertices,
        vertexCount    = vertices.length,
        vertexSprings  = null,
        vertexSpring   = null,
        extension      = 0,
        length         = 0,
        force          = 0,
        vertex         = null,
        acceleration   = new THREE.Vector3(0, 0, 0);

    // go backwards, which should
    // be faster than a normal for-loop
    // although that's not always the case
    while(vertexCount--) {

      vertex = vertices[vertexCount];
      vertexSprings = vertex.springs;

      // miss any verts with no springs
      if(!vertexSprings) {
        continue;
      }

      // now go through each individual spring
      for(var v = 0; v < vertexSprings.length; v++) {
        // calculate the spring length compared
        // to its base length
        vertexSpring = vertexSprings[v];
        length = vertexSpring.start.length(vertexSpring.end);

        // now work out how far the spring has
        // extended and use this to create a
        // force which will pull on the vertex
        extension = vertexSpring.length - length;

        // pull the start vertex
        acceleration.copy(vertexSpring.start.normal).multiplyScalar(extension * SPRING_STRENGTH);
        vertexSpring.start.velocity.addSelf(acceleration);

        // pull the end vertex
        acceleration.copy(vertexSpring.end.normal).multiplyScalar(extension * SPRING_STRENGTH);
        vertexSpring.end.velocity.addSelf(acceleration);

        // add the velocity to the position using
        // basic Euler integration
        vertexSpring.start.addSelf(
          vertexSpring.start.velocity);
        vertexSpring.end.addSelf(
          vertexSpring.end.velocity);

        // dampen the spring's velocity so it doesn't
        // ping back and forth forever
        vertexSpring.start.velocity.multiplyScalar(DAMPEN);
        vertexSpring.end.velocity.multiplyScalar(DAMPEN);

      }

      // attempt to dampen the vertex back
      // to its original position so it doesn't
      // get out of control
      vertex.addSelf(
        vertex.originalPosition.clone().subSelf(
          vertex
        ).multiplyScalar(0.03)
      );
    }

  };

  //export
  win.app.object.Oppai = Oppai;
}(document, window, jQuery(document)));
