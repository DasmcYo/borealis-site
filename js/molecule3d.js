/* ── BOREALIS — DHQ Orbital Visualization (Three.js) ── */
(function () {
  'use strict';

  const container = document.getElementById('mol3d');
  if (!container || typeof THREE === 'undefined') return;

  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  /* ── Scene ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 200);
  camera.position.set(0, 0.5, 17);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0x0c1020, 2.5));

  const Lkey = new THREE.PointLight(0xffd070, 5.5, 80);
  Lkey.position.set(10, 12, 14);
  scene.add(Lkey);

  const Lfill = new THREE.PointLight(0x2233aa, 2.5, 60);
  Lfill.position.set(-14, -6, 6);
  scene.add(Lfill);

  const Lrim = new THREE.PointLight(0xc9943a, 3.0, 50);
  Lrim.position.set(0, -2, -16);
  scene.add(Lrim);

  /* ── CENTER SPHERE — layered glow ── */
  const CENTER = new THREE.Group();
  scene.add(CENTER);

  // Outer glow halos (back-side rendering trick)
  [4.0, 3.2, 2.5, 2.0, 1.6].forEach((r, i) => {
    CENTER.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xC9943A, transparent: true,
        opacity: 0.018 + i * 0.022,
        depthWrite: false, side: THREE.BackSide,
      })
    ));
  });

  // Core
  const CORE = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 48, 48),
    new THREE.MeshPhongMaterial({
      color: 0xE8B855, emissive: 0xA05818,
      emissiveIntensity: 0.6, shininess: 200,
      specular: 0xffffff,
    })
  );
  CENTER.add(CORE);

  /* ── MECHANISM DATA ── */
  const MECH = {
    antioxid:  { label: 'Antioxidant',          sub: 'Mechanism I',   hex: '#C9943A', c: 0xC9943A },
    inflamm:   { label: 'Anti-inflammatory',    sub: 'Mechanism II',  hex: '#6366F1', c: 0x6366F1 },
    bioavail:  { label: 'Bioavailability ×2.8', sub: 'Mechanism III', hex: '#10B981', c: 0x10B981 },
    vasodilat: { label: 'Vasodilatory',         sub: 'Mechanism IV',  hex: '#E84545', c: 0xE84545 },
    neuro:     { label: 'Neuroprotective',      sub: 'Sub-mechanism', hex: '#8B5CF6', c: 0x8B5CF6 },
  };
  const DESC = {
    antioxid:  'Donates H⁺ to free radicals. ORAC value 5× higher than Vitamin C. Neutralises reactive oxygen species without itself becoming a pro-oxidant.',
    inflamm:   'Inhibits NF-κB pathway and COX-2 enzyme. Reduces pro-inflammatory cytokines IL-1β, IL-6 and TNF-α by 40–60% in controlled assays.',
    bioavail:  'Water-soluble: 200× better than Quercetin. AG forms a protective GI matrix, reduces first-pass degradation, extends half-life to 6–8 h.',
    vasodilat: 'Inhibits ACE, activates eNOS → endogenous NO synthesis. Reduces platelet aggregation and improves microcirculation and capillary integrity.',
    neuro:     'Crosses the blood-brain barrier. Detected in murine cerebrospinal fluid (PNAS 2019). Inhibits tau aggregation and protects myelin sheath.',
  };

  /* ── ORBITAL RINGS ── */
  const RING_DEFS = [
    { r: 5.4, tx: 0.0,  tz: 0.15, speed:  0.0025, nodes: ['antioxid', 'vasodilat'] },
    { r: 4.7, tx: 0.90, tz: 0.10, speed: -0.0033, nodes: ['inflamm', 'neuro']       },
    { r: 4.0, tx: 0.25, tz: 0.80, speed:  0.0042, nodes: ['bioavail']               },
  ];

  const RING_GROUPS = [];
  const NODE_MESHES = [];

  RING_DEFS.forEach(def => {
    const g = new THREE.Group();
    g.rotation.x = def.tx;
    g.rotation.z = def.tz;
    g.userData.spd = def.speed;
    scene.add(g);
    RING_GROUPS.push(g);

    // Orbit path
    g.add(new THREE.Mesh(
      new THREE.TorusGeometry(def.r, 0.014, 8, 140),
      new THREE.MeshBasicMaterial({ color: 0x3A4560, transparent: true, opacity: 0.28, depthWrite: false })
    ));

    // Nodes on this ring
    def.nodes.forEach((key, ni) => {
      const angle = (ni / def.nodes.length) * Math.PI * 2 + Math.PI * 0.15 * ni;
      const m = MECH[key];

      const ng = new THREE.Group();
      ng.position.set(Math.cos(angle) * def.r, 0, Math.sin(angle) * def.r);
      ng.userData = { key };

      // Glow halos
      [1.0, 0.75, 0.54].forEach((r, li) => {
        ng.add(new THREE.Mesh(
          new THREE.SphereGeometry(r, 16, 16),
          new THREE.MeshBasicMaterial({
            color: m.c, transparent: true,
            opacity: 0.05 + li * 0.04,
            depthWrite: false, side: THREE.BackSide,
          })
        ));
      });

      // Core node sphere
      const nm = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 24, 24),
        new THREE.MeshPhongMaterial({
          color: m.c, emissive: m.c,
          emissiveIntensity: 0.5, shininess: 160,
          specular: 0xffffff,
        })
      );
      nm.userData = { key };
      ng.add(nm);
      NODE_MESHES.push(nm);
      g.add(ng);
    });
  });

  /* ── AMBIENT PARTICLE FIELD ── */
  const PT_N = 320;
  const ptPos = new Float32Array(PT_N * 3);
  const ptSpd = new Float32Array(PT_N);
  for (let i = 0; i < PT_N; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r  = 5.5 + Math.random() * 9;
    ptPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    ptPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    ptPos[i*3+2] = r * Math.cos(ph);
    ptSpd[i]     = 0.25 + Math.random() * 0.75;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({
    color: 0xC9943A, size: 0.05, transparent: true,
    opacity: 0.30, sizeAttenuation: true, depthWrite: false,
  })));

  /* ── INTERACTION ── */
  const RAY   = new THREE.Raycaster();
  const MOUSE = new THREE.Vector2(-999, -999);

  const panel  = document.getElementById('mol3d-panel');
  const elSub  = document.getElementById('mp-sub');
  const elTitle= document.getElementById('mp-title');
  const elDesc = document.getElementById('mp-desc');
  const elDot  = document.getElementById('mp-dot');
  const hint   = document.getElementById('mol3d-hint');

  let activeKey = null;
  let paused    = false;
  let hovKey    = null;

  function showPanel(key) {
    const m = MECH[key];
    if (!m || !panel) return;
    activeKey = key; paused = true;
    if (elSub)   elSub.textContent   = m.sub;
    if (elTitle) elTitle.textContent = m.label;
    if (elDesc)  elDesc.textContent  = DESC[key];
    if (elDot)   elDot.style.background = m.hex;
    panel.style.borderColor = m.hex + '44';
    panel.classList.add('visible');
    if (hint) hint.style.opacity = '0';
  }

  function hidePanel() {
    activeKey = null; paused = false;
    if (panel) panel.classList.remove('visible');
    if (hint)  hint.style.opacity = '1';
  }

  container.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    MOUSE.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
    MOUSE.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
  });
  container.addEventListener('mouseleave', () => MOUSE.set(-999, -999));

  container.addEventListener('click', () => {
    RAY.setFromCamera(MOUSE, camera);
    const hits = RAY.intersectObjects(NODE_MESHES, true);
    if (hits.length) {
      const key = hits[0].object.userData.key || hits[0].object.parent?.userData.key;
      if (!key) return;
      activeKey === key ? hidePanel() : showPanel(key);
    } else {
      hidePanel();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  /* ── RENDER LOOP ── */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.016;

    // Rings rotate
    if (!paused) {
      RING_GROUPS.forEach(rg => { rg.rotation.y += rg.userData.spd; });
    }

    // Center breathe
    const pulse = 1 + Math.sin(t * 1.1) * 0.04;
    CENTER.scale.setScalar(pulse);
    CORE.material.emissiveIntensity = 0.5 + Math.sin(t * 1.1) * 0.14;

    // Hover detect
    RAY.setFromCamera(MOUSE, camera);
    const hits = RAY.intersectObjects(NODE_MESHES, true);
    const newHov = hits.length
      ? (hits[0].object.userData.key || hits[0].object.parent?.userData.key)
      : null;
    if (newHov !== hovKey) {
      hovKey = newHov;
      container.style.cursor = newHov ? 'pointer' : '';
    }

    // Animate nodes
    NODE_MESHES.forEach((nm, i) => {
      const key   = nm.userData.key;
      const isAct = key === activeKey;
      const isHov = key === hovKey;
      const base  = 1 + Math.sin(t * 1.5 + i * 1.3) * 0.06;
      nm.parent.scale.setScalar(isHov ? 1.6 : isAct ? 1.4 : base);
      nm.material.emissiveIntensity = isAct ? 0.8 + Math.sin(t * 2.2) * 0.2
                                    : isHov ? 0.65
                                    : 0.4  + Math.sin(t * 1.5 + i) * 0.12;
    });

    // Particles drift
    const pos = ptGeo.attributes.position.array;
    for (let i = 0; i < PT_N; i++) {
      const i3 = i * 3;
      pos[i3]   += Math.cos(t * ptSpd[i] * 0.28 + i * 0.9) * 0.003;
      pos[i3+1] += Math.sin(t * ptSpd[i] * 0.35 + i * 1.1) * 0.003;
      // Soft boundary
      const d = Math.sqrt(pos[i3]*pos[i3] + pos[i3+1]*pos[i3+1] + pos[i3+2]*pos[i3+2]);
      if (d > 15.5) { pos[i3] *= 0.88; pos[i3+1] *= 0.88; pos[i3+2] *= 0.88; }
    }
    ptGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  })();
})();
