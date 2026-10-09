/* The 3D mycelium scene (formerly the full-screen intro), now the site's
 * easter egg. Loaded on demand by assets/site.js after three.js r128.
 *
 *   var s = MyceliumScene.start(containerEl, { motionButton, pointerTarget });
 *   s.stop();   // stops rendering and frees the GPU resources
 *
 * start() returns null if WebGL or three.js is unavailable.
 */
(function () {
  'use strict';

  function supportsWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function start(container, opts) {
    opts = opts || {};
    if (typeof THREE === 'undefined' || !supportsWebGL()) return null;
    var THREE_ = window.THREE;

    var width = container.clientWidth || window.innerWidth;
    var height = container.clientHeight || window.innerHeight;

    var renderer;
    try {
      renderer = new THREE_.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x050505, 1);
    container.appendChild(renderer.domElement);

    var scene = new THREE_.Scene();
    var camera = new THREE_.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);
    var group = new THREE_.Group();
    scene.add(group);

    // palette: violet -> magenta -> hot pink -> red/orange (matches the QR code)
    function hueSweepColor(t) {
      var h0 = 268, h1 = 372, s = 0.75, v = 0.95;
      var h = ((h0 + t * (h1 - h0)) % 360) / 360;
      var c = new THREE_.Color();
      c.setHSL(h, s, v * 0.5);
      return c;
    }
    function randomDir(rnd) {
      var v = new THREE_.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
      return v.lengthSq() > 0 ? v.normalize() : new THREE_.Vector3(0, 1, 0);
    }
    function perturb(dir, rnd, maxDeg) {
      var axis = randomDir(rnd);
      var angle = THREE_.MathUtils.degToRad((rnd() - 0.5) * 2 * maxDeg);
      var q = new THREE_.Quaternion().setFromAxisAngle(axis, angle);
      return dir.clone().applyQuaternion(q).normalize();
    }

    // procedural 3D mycelium network
    (function growNetwork() {
      var rnd = mulberry32(7);
      var radius = 3.4, seeds = 8, tasks = [];
      for (var i = 0; i < seeds; i++) {
        tasks.push({ pos: new THREE_.Vector3(0, 0, 0), dir: randomDir(rnd), len: radius * (0.8 + rnd() * 0.3), depth: 0, t: i / seeds });
      }
      var guard = 0;
      while (tasks.length && guard < 400) {
        guard++;
        var task = tasks.pop();
        if (task.len < radius * 0.12 || task.depth > 3) continue;
        var steps = Math.max(4, Math.floor(task.len / (radius * 0.09)));
        var segLen = task.len / steps;
        var pts = [task.pos.clone()];
        var pos = task.pos.clone();
        var dir = task.dir.clone();
        for (var s = 0; s < steps; s++) {
          dir = perturb(dir, rnd, 14);
          var next = pos.clone().addScaledVector(dir, segLen);
          if (next.length() > radius) break;
          pts.push(next);
          pos = next;
        }
        if (pts.length > 1) {
          var curve = new THREE_.CatmullRomCurve3(pts);
          var tubeR = Math.max(0.012, 0.05 * (1 - task.depth * 0.22));
          var mat = new THREE_.MeshBasicMaterial({ color: hueSweepColor(task.t) });
          group.add(new THREE_.Mesh(new THREE_.TubeGeometry(curve, pts.length * 2, tubeR, 5, false), mat));
          var node = new THREE_.Mesh(new THREE_.SphereGeometry(tubeR * 1.8, 6, 6), mat);
          node.position.copy(pos);
          group.add(node);
        }
        if (task.depth < 3 && rnd() < 0.85) {
          var branches = 1 + Math.floor(rnd() * 2);
          for (var b = 0; b < branches; b++) {
            tasks.push({
              pos: pos.clone(), dir: perturb(dir, rnd, 45), len: task.len * (0.55 + rnd() * 0.2),
              depth: task.depth + 1, t: Math.min(1, Math.max(0, task.t + (rnd() - 0.5) * 0.12))
            });
          }
        }
      }
    })();

    // ambient spore particles
    var sporeCount = 140;
    var sporePos = new Float32Array(sporeCount * 3);
    var sporeCol = new Float32Array(sporeCount * 3);
    var rnd2 = mulberry32(42);
    for (var i = 0; i < sporeCount; i++) {
      var r = 3.6 + rnd2() * 2.2;
      var d = randomDir(rnd2);
      sporePos[i * 3] = d.x * r; sporePos[i * 3 + 1] = d.y * r; sporePos[i * 3 + 2] = d.z * r;
      var col = hueSweepColor(rnd2());
      sporeCol[i * 3] = col.r; sporeCol[i * 3 + 1] = col.g; sporeCol[i * 3 + 2] = col.b;
    }
    var sporeGeo = new THREE_.BufferGeometry();
    sporeGeo.setAttribute('position', new THREE_.BufferAttribute(sporePos, 3));
    sporeGeo.setAttribute('color', new THREE_.BufferAttribute(sporeCol, 3));
    var spores = new THREE_.Points(sporeGeo, new THREE_.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.85 }));
    scene.add(spores);

    // interaction: device tilt (mobile) or pointer position (desktop)
    var targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;
    function onOrientation(e) {
      if (e.beta === null || e.gamma === null) return;
      var beta = Math.max(-45, Math.min(45, e.beta - 45));
      var gamma = Math.max(-45, Math.min(45, e.gamma));
      targetRotX = THREE_.MathUtils.degToRad(beta * 0.5);
      targetRotY = THREE_.MathUtils.degToRad(gamma * 0.6);
    }
    function onPointer(e) {
      targetRotY = ((e.clientX / window.innerWidth) * 2 - 1) * 0.5;
      targetRotX = ((e.clientY / window.innerHeight) * 2 - 1) * 0.35;
    }
    var pointerTarget = opts.pointerTarget || container;
    pointerTarget.addEventListener('pointermove', onPointer);

    var motionBtn = opts.motionButton;
    function onMotionClick() {
      DeviceOrientationEvent.requestPermission().then(function (state) {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', onOrientation);
          motionBtn.style.display = 'none';
        }
      }).catch(function () {});
    }
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function' && motionBtn) {
      motionBtn.style.display = 'inline-block';
      motionBtn.addEventListener('click', onMotionClick);
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', onOrientation);
    }

    var rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);
      group.rotation.y += 0.0016;
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;
      group.rotation.x = curRotX;
      spores.rotation.y = group.rotation.y * 0.6;
      spores.rotation.x = curRotX * 0.4;
      group.rotation.y += curRotY * 0.02;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      var w = container.clientWidth || window.innerWidth;
      var h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return {
      stop: function () {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('deviceorientation', onOrientation);
        pointerTarget.removeEventListener('pointermove', onPointer);
        if (motionBtn) { motionBtn.removeEventListener('click', onMotionClick); motionBtn.style.display = 'none'; }
        scene.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  window.MyceliumScene = { start: start };
})();
