/* ── BOREALIS — DHQ 3D Molecule Visualization (Three.js) ── */
(function () {
  'use strict';

  const container = document.getElementById('mol3d');
  if (!container || typeof THREE === 'undefined') return;

  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  /* ── Scene / Camera / Renderer ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 200);
  camera.position.set(0, 1.2, 17);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x141830, 1.4));

  const L1 = new THREE.PointLight(0xffe080, 4.0, 80);
  L1.position.set(7, 11, 9);
  scene.add(L1);

  const L2 = new THREE.PointLight(0x3355cc, 2.2, 60);
  L2.position.set(-12, -5, 6);
  scene.add(L2);

  const L3 = new THREE.PointLight(0xc9943a, 2.5, 50);
  L3.position.set(-4, 7, -12);
  scene.add(L3);

  /* ── Atom positions (DHQ C15H12O7, approx. Å × 1.3) ── */
  const s = 1.3;
  const rawAtoms = [
    /* Ring A — benzene / resorcinol */
    { id:'C5',  p:[ 0.00, 0.00,  1.40], t:'C', g:null },
    { id:'C6',  p:[ 1.21, 0.00,  0.70], t:'C', g:null },
    { id:'C7',  p:[ 1.21, 0.00, -0.70], t:'C', g:'inflamm' },
    { id:'C8',  p:[ 0.00, 0.00, -1.40], t:'C', g:null },
    { id:'C4a', p:[-1.21, 0.00, -0.70], t:'C', g:null },
    { id:'C8a', p:[-1.21, 0.00,  0.70], t:'C', g:null },
    /* OH on Ring A */
    { id:'O5',  p:[ 0.50, 1.30,  2.05], t:'O', g:'antioxid' },
    { id:'O7',  p:[ 2.00, 1.30, -1.10], t:'O', g:'inflamm' },
    /* Central chromanone ring */
    { id:'O1',  p:[-2.35, 0.30,  0.70], t:'O', g:null },
    { id:'C2',  p:[-2.95, 0.40, -0.10], t:'C', g:'bioavail' },
    { id:'C3',  p:[-2.40, 0.30, -1.30], t:'C', g:'bioavail' },
    /* Carbonyl O at C4 */
    { id:'O4',  p:[-1.00,-1.10, -1.45], t:'O', g:'vasodilat' },
    /* OH at C2, C3 */
    { id:'O2',  p:[-3.85, 1.35, -0.10], t:'O', g:'bioavail' },
    { id:'O3',  p:[-3.20, 1.35, -1.65], t:'O', g:'bioavail' },
    /* Ring B — catechol */
    { id:'C1p', p:[-4.20, 0.10, -0.20], t:'C', g:null },
    { id:'C2p', p:[-5.00, 0.65,  0.50], t:'C', g:null },
    { id:'C3p', p:[-5.80, 0.30,  0.10], t:'C', g:'neuro' },
    { id:'C4p', p:[-5.60,-0.50, -0.80], t:'C', g:'neuro' },
    { id:'C5p', p:[-4.70,-1.05, -1.55], t:'C', g:null },
    { id:'C6p', p:[-3.90,-0.70, -1.10], t:'C', g:null },
    /* OH at C3', C4' */
    { id:'O3p', p:[-6.65, 0.75,  0.65], t:'O', g:'neuro' },
    { id:'O4p', p:[-6.35,-0.95, -1.35], t:'O', g:'neuro' },
  ];

  /* Scale and center */
  rawAtoms.forEach(a => { a.p = a.p.map(v => v * s); });
  const cx = rawAtoms.reduce((acc,a)=>acc+a.p[0],0)/rawAtoms.length;
  const cy = rawAtoms.reduce((acc,a)=>acc+a.p[1],0)/rawAtoms.length;
  const cz = rawAtoms.reduce((acc,a)=>acc+a.p[2],0)/rawAtoms.length;
  rawAtoms.forEach(a => { a.p[0]-=cx; a.p[1]-=cy; a.p[2]-=cz; });

  /* ── Bond list ── */
  const bondList = [
    /* Ring A */
    ['C5','C6'],['C6','C7'],['C7','C8'],['C8','C4a'],['C4a','C8a'],['C8a','C5'],
    /* Ring A OH */
    ['C5','O5'],['C7','O7'],
    /* Central ring */
    ['C8a','O1'],['O1','C2'],['C2','C3'],['C3','C4a'],['C4a','O4'],
    /* C2, C3 OH */
    ['C2','O2'],['C3','O3'],
    /* C2 → Ring B */
    ['C2','C1p'],
    /* Ring B */
    ['C1p','C2p'],['C2p','C3p'],['C3p','C4p'],['C4p','C5p'],['C5p','C6p'],['C6p','C1p'],
    /* Ring B OH */
    ['C3p','O3p'],['C4p','O4p'],
  ];

  /* ── Group metadata ── */
  const groups = {
    antioxid:  { hex:'#C9943A', title:'Antioxidant',          sub:'Mechanism I',   desc:'Donates H⁺ to free radicals. ORAC value 5× higher than Vitamin C. Neutralises reactive oxygen species without becoming a pro-oxidant.' },
    inflamm:   { hex:'#6366F1', title:'Anti-inflammatory',    sub:'Mechanism II',  desc:'Inhibits NF-κB pathway and COX-2 enzyme. Reduces pro-inflammatory cytokines IL-1β, IL-6 and TNF-α by 40–60% in vitro.' },
    bioavail:  { hex:'#10B981', title:'Bioavailability ×2.8', sub:'Mechanism III', desc:'Water-soluble, 200× better than Quercetin. AG matrix in GI tract slows degradation and extends absorption; half-life 6–8 h, no oil matrix needed.' },
    vasodilat: { hex:'#E84545', title:'Vasodilatory',         sub:'Mechanism IV',  desc:'Inhibits ACE, activates eNOS → endogenous NO production. Reduces platelet aggregation, improves microcirculation and capillary wall integrity.' },
    neuro:     { hex:'#8B5CF6', title:'Neuroprotective',      sub:'Sub-mechanism', desc:'Crosses blood-brain barrier. Detected in mouse CSF (PNAS 2019). Inhibits tau protein aggregation and protects myelin from oxidative attack.' },
  };

  /* ── Build molecule ── */
  const mol = new THREE.Group();
  scene.add(mol);

  const geoC = new THREE.SphereGeometry(0.40, 24, 24);
  const geoO = new THREE.SphereGeometry(0.33, 24, 24);

  const atomMap   = {};
  const clickable = [];

  rawAtoms.forEach(atom => {
    const isO = atom.t === 'O';
    const gk  = atom.g;
    const g   = gk ? groups[gk] : null;

    const mat = new THREE.MeshPhongMaterial({
      color:    g ? parseInt(g.hex.slice(1),16) : (isO ? 0xCC4422 : 0x6B7A90),
      emissive: g ? parseInt(g.hex.slice(1),16) : 0x000000,
      emissiveIntensity: g ? 0.18 : 0,
      shininess: g ? 110 : (isO ? 80 : 60),
      specular:  isO ? 0x441100 : 0x223344,
    });

    const mesh = new THREE.Mesh(isO ? geoO : geoC, mat);
    mesh.position.fromArray(atom.p);
    mesh.userData = { id: atom.id, gk, g };
    mol.add(mesh);
    atomMap[atom.id] = mesh;
    if (gk) clickable.push(mesh);
  });

  /* ── Build bonds ── */
  function cylinder(p1, p2, color) {
    const dir = p2.clone().sub(p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.08, 0.08, len, 8, 1);
    const mat = new THREE.MeshPhongMaterial({ color, shininess: 20 });
    const m   = new THREE.Mesh(geo, mat);
    m.position.copy(p1.clone().add(p2).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
    return m;
  }

  bondList.forEach(([a,b]) => {
    const mA = atomMap[a], mB = atomMap[b];
    if (!mA || !mB) return;
    const ra = rawAtoms.find(x=>x.id===a);
    const rb = rawAtoms.find(x=>x.id===b);
    const useO = ra?.t==='O' || rb?.t==='O';
    mol.add(cylinder(mA.position, mB.position, useO ? 0x7A5035 : 0x4A5568));
  });

  /* ── Info panel ── */
  const panel  = document.getElementById('mol3d-panel');
  const pSub   = document.getElementById('mp-sub');
  const pTitle = document.getElementById('mp-title');
  const pDesc  = document.getElementById('mp-desc');
  const pDot   = document.getElementById('mp-dot');
  const hint   = document.getElementById('mol3d-hint');

  let activeGk = null;
  let paused   = false;

  function showPanel(gk) {
    const g = groups[gk];
    if (!g || !panel) return;
    activeGk = gk;
    if (pSub)   pSub.textContent   = g.sub;
    if (pTitle) pTitle.textContent = g.title;
    if (pDesc)  pDesc.textContent  = g.desc;
    if (pDot)   pDot.style.background = g.hex;
    if (panel)  panel.style.borderColor = g.hex + '55';
    panel.classList.add('visible');
    if (hint)   hint.style.opacity = '0';
    paused = true;
  }

  function hidePanel() {
    if (!panel) return;
    activeGk = null;
    paused   = false;
    panel.classList.remove('visible');
    if (hint) hint.style.opacity = '1';
  }

  /* ── Interaction ── */
  const ray    = new THREE.Raycaster();
  const mouse  = new THREE.Vector2(-999, -999);
  let hoveredId = null;

  container.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    mouse.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
    mouse.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
  });

  container.addEventListener('mouseleave', () => {
    mouse.set(-999, -999);
    hoveredId = null;
    container.style.cursor = '';
  });

  container.addEventListener('click', () => {
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(clickable);
    if (hits.length) {
      const gk = hits[0].object.userData.gk;
      if (activeGk === gk) hidePanel();
      else showPanel(gk);
    } else {
      hidePanel();
    }
  });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  /* ── Render loop ── */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.016;

    if (!paused) {
      mol.rotation.y += 0.0025;
      mol.rotation.x  = Math.sin(t * 0.22) * 0.06;
    }

    /* Hover detect */
    ray.setFromCamera(mouse, camera);
    const hits  = ray.intersectObjects(clickable);
    const newId = hits.length ? hits[0].object.userData.id : null;

    if (newId !== hoveredId) {
      if (hoveredId) {
        const old = clickable.find(m => m.userData.id === hoveredId);
        if (old) old.scale.setScalar(1);
      }
      hoveredId = newId;
      if (newId) {
        const cur = clickable.find(m => m.userData.id === newId);
        if (cur) cur.scale.setScalar(1.45);
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = '';
      }
    }

    /* Pulse active atoms */
    clickable.forEach((mesh, i) => {
      const isHov = mesh.userData.id  === hoveredId;
      const isAct = mesh.userData.gk  === activeGk;
      if (isHov) return;
      if (isAct) {
        mesh.scale.setScalar(1.35 + Math.sin(t * 2.2) * 0.07);
        mesh.material.emissiveIntensity = 0.5 + Math.sin(t * 2.2) * 0.18;
      } else {
        mesh.scale.setScalar(1 + Math.sin(t * 1.7 + i * 1.4) * 0.055);
        mesh.material.emissiveIntensity = 0.12 + Math.sin(t * 1.7 + i) * 0.07;
      }
    });

    renderer.render(scene, camera);
  })();
})();
