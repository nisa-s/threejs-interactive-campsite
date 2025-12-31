// ============================================
// TEMEL KURULUM VE SAHNE
// ============================================

const scene = new THREE.Scene();

const skyColor = new THREE.Color(0x000510);
const horizonColor = new THREE.Color(0x1a1a3a);
scene.background = skyColor;
scene.fog = new THREE.Fog(0x050510, 50, 250);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Kamerayı başlangıçta biraz daha insan boyuna indiriyoruz
camera.position.set(0, 2.5, 12);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// OrbitControls (Mouse ile bakmak için)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Yerin altına girmeyi engelle
controls.minDistance = 2;
controls.maxDistance = 50;

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============================================
// 2. KLAVYE HAREKET SİSTEMİ
// ============================================

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

window.addEventListener("keydown", (event) => {
  if (event.code in keys) keys[event.code] = true;
});

window.addEventListener("keyup", (event) => {
  if (event.code in keys) keys[event.code] = false;
});

// Hareketi işleyen fonksiyon
function updateMovement(deltaTime) {
  const moveSpeed = 10 * deltaTime; // Hareket hızı
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0; // Sadece yatayda hareket (uçmayı engelle)
  direction.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(direction, camera.up).normalize();

  if (keys.ArrowUp) {
    camera.position.addScaledVector(direction, moveSpeed);
    controls.target.addScaledVector(direction, moveSpeed);
  }
  if (keys.ArrowDown) {
    camera.position.addScaledVector(direction, -moveSpeed);
    controls.target.addScaledVector(direction, -moveSpeed);
  }
  if (keys.ArrowRight) {
    camera.position.addScaledVector(right, moveSpeed);
    controls.target.addScaledVector(right, moveSpeed);
  }
  if (keys.ArrowLeft) {
    camera.position.addScaledVector(right, -moveSpeed);
    controls.target.addScaledVector(right, -moveSpeed);
  }
}

// ============================================
// 3. IŞIKLANDIRMA
// ============================================

// Ambient Light: Çok hafif genel aydınlatma
const ambientLight = new THREE.AmbientLight(0x1a2a3a, 0.3);
scene.add(ambientLight);

// Directional Light (Ay): Daha parlak ve belirgin
const moonLight = new THREE.DirectionalLight(0xcceeff, 1.5); // Intensity artırıldı
moonLight.position.set(20, 45, -10);
moonLight.castShadow = true;
// Gölge kalitesini artır
moonLight.shadow.mapSize.width = 4096;
moonLight.shadow.mapSize.height = 4096;
moonLight.shadow.camera.left = -50;
moonLight.shadow.camera.right = 50;
moonLight.shadow.camera.top = 50;
moonLight.shadow.camera.bottom = -50;
scene.add(moonLight);

const moonGeo = new THREE.SphereGeometry(10, 64, 64);
const moonTexture = textureLoader.load("./src/assets/textures/moon.jpg");
moonTexture.colorSpace = THREE.SRGBColorSpace;

const moonMat = new THREE.MeshBasicMaterial({
  map: moonTexture,
  fog: false,
});
const moon = new THREE.Mesh(moonGeo, moonMat);
moon.position.copy(moonLight.position);
scene.add(moon);

// Point Light (Ateş): Daha sıcak ve dinamik
let fireLight = new THREE.PointLight(0xff4400, 3.0, 20);
fireLight.castShadow = true;
fireLight.shadow.bias = -0.0005;
fireLight.userData.baseIntensity = 3.0;
// Ateş ışığının gölgesi daha detaylı olsun
fireLight.shadow.mapSize.width = 1024;
fireLight.shadow.mapSize.height = 1024;

// ============================================
// ZEMİN VE ÇEVRE
// ============================================

// Zemin Texture
const grassTexture = textureLoader.load("./src/assets/textures/grass.jpg");
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(40, 40);
grassTexture.colorSpace = THREE.SRGBColorSpace;

// Hafif kavisli zemin (daha az yuvarlak)
const groundGeo = new THREE.PlaneGeometry(240, 240, 80, 80);
const groundMat = new THREE.MeshStandardMaterial({
  map: grassTexture,
  color: 0x557755,
  roughness: 1,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

// Kavis ekle (vertices'leri aşağı çek)
const positions = ground.geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getY(i); // PlaneGeometry'de Y aslında Z
  const distance = Math.sqrt(x * x + z * z);
  const curve = -distance * distance * 0.002; // Kavis miktarı (arttır = daha yuvarlak)
  positions.setZ(i, curve);
}
positions.needsUpdate = true;
ground.geometry.computeVertexNormals(); // Işık hesaplamalarını düzelt

scene.add(ground);

// ============================================
// AĞAÇLAR
// ============================================

const barkTexture = textureLoader.load("./src/assets/textures/bark.jpg");
barkTexture.colorSpace = THREE.SRGBColorSpace;

function createDetailedTree(x, z, scale = 1) {
  const treeGroup = new THREE.Group();
  treeGroup.name = "tree";

  // Gövde
  const trunkMat = new THREE.MeshStandardMaterial({
    map: barkTexture,
    color: 0x3d2817,
    roughness: 0.9,
  });
  const trunkGeo = new THREE.CylinderGeometry(
    0.2 * scale,
    0.4 * scale,
    2.5 * scale,
    7
  );
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.25 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Yapraklar (Katmanlı ve hafif renk varyasyonlu)
  const leafBaseColor = new THREE.Color(0x1a3300);

  for (let i = 0; i < 4; i++) {
    // 3 yerine 4 katman
    const layerColor = leafBaseColor.clone().multiplyScalar(1 + i * 0.1);
    const leafMat = new THREE.MeshStandardMaterial({
      color: layerColor,
      roughness: 0.8,
      flatShading: true,
    });

    const leafGeo = new THREE.ConeGeometry(
      (1.4 - i * 0.35) * scale,
      1.2 * scale,
      7
    );
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = (2.2 + i * 0.7) * scale;
    leaf.castShadow = true;
    leaf.name = "leaves"; // Animasyon için

    // Her katmana hafif rastgele bir rotasyon verelim ki doğal dursun
    leaf.rotation.y = Math.random() * Math.PI;
    treeGroup.add(leaf);
  }

  treeGroup.position.set(x, 0, z);

  // Her ağaca rastgele bir "rüzgar fazı" ekleyelim ki hepsi aynı anda sallanmasın
  treeGroup.userData.windOffset = Math.random() * 10;

  return treeGroup;
}

// ============================================
// ORMAN
// ============================================

const treeCount = 500;

for (let i = 0; i < treeCount; i++) {
  const angle = Math.random() * Math.PI * 2;

  // 15 metreden başla (kampın içi boş kalsın),
  const radius = 15 + Math.random() * 50;

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Uzaktaki ağaçlar daha heybetli olsun diye scale'i biraz artırdım
  const randomScale = 0.8 + Math.random() * 1.5;

  // Zemin eğimini hesapla
  const distance = Math.sqrt(x * x + z * z);
  const groundY = -distance * distance * 0.002;

  const tree = createDetailedTree(x, z, randomScale);
  tree.position.y = groundY;
  scene.add(tree);
}

// ============================================
// KAYA VE ÇALI OLUŞTURMA
// ============================================

function createRock(x, z, scale) {
  // Dodecahedron (12 yüzlü) köşeli taş için harikadır
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x555555, // Gri taş rengi
    roughness: 0.9, // Parlamasın
    flatShading: true, // Köşeli görünsün (Low Poly hissi)
  });

  const rock = new THREE.Mesh(geo, mat);

  // Zemin eğimine göre Y konumunu ayarla
  const distance = Math.sqrt(x * x + z * z);
  const groundY = -distance * distance * 0.002;

  // Taşı biraz zemine gömelim (-0.3) ki havada durmasın
  rock.position.set(x, groundY - 0.2 * scale, z);

  // Rastgele boyut ve dönme
  rock.scale.setScalar(scale);
  rock.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function createBush(x, z, scale) {
  // Çalı için Icosahedron (20 yüzlü) biraz daha yuvarlak ama hala köşeli
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2d4c1e, // Koyu yaprak yeşili
    roughness: 1,
    flatShading: true,
  });

  const bush = new THREE.Mesh(geo, mat);

  // Zemin eğimine göre Y konumu
  const distance = Math.sqrt(x * x + z * z);
  const groundY = -distance * distance * 0.002;

  bush.position.set(x, groundY + 0.3 * scale, z); // Yarısı yerde yarısı yukarıda
  bush.scale.setScalar(scale);

  // Hafif rastgele dönme
  bush.rotation.y = Math.random() * Math.PI;
  bush.rotation.z = (Math.random() - 0.5) * 0.2;

  bush.castShadow = true;
  bush.receiveShadow = true;
  scene.add(bush);
}

// 100 tane KAYA ekle
for (let i = 0; i < 100; i++) {
  const angle = Math.random() * Math.PI * 2;
  // Kamp merkezinden (5) uzak, dışlara doğru (40) dağıt
  const radius = 5 + Math.random() * 45;

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Boyut: 0.3 ile 0.8 arası
  const scale = 0.3 + Math.random() * 0.5;

  createRock(x, z, scale);
}

// 100 tane ÇALI ekle
for (let i = 0; i < 100; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 6 + Math.random() * 40; // Ağaçların arasına

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Boyut: 0.4 ile 1.0 arası
  const scale = 0.4 + Math.random() * 0.6;

  createBush(x, z, scale);
}
// ============================================
// DAĞLAR
// ============================================

function createLowPolyMountain(x, z, rotY) {
  const radius = 100 + Math.random() * 60;
  const height = 50 + Math.random() * 40;

  // Segment sayısını azıcık artır ki çok keskin durmasın (5-8 arası)
  const segments = 5 + Math.floor(Math.random() * 4);

  const geo = new THREE.ConeGeometry(radius, height, segments);

  const positions = geo.attributes.position;
  const topVertexIndex = 0;
  positions.setX(topVertexIndex, (Math.random() - 0.5) * 10);
  positions.setZ(topVertexIndex, (Math.random() - 0.5) * 10);

  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2b3240,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });

  const mountain = new THREE.Mesh(geo, mat);

  mountain.position.set(x, -10, z);
  mountain.rotation.y = rotY;

  mountain.receiveShadow = true;

  scene.add(mountain);
}

const mountainCount = 16;
for (let i = 0; i < mountainCount; i++) {
  const angle = (i / mountainCount) * Math.PI * 2;
  const distance = 110 + Math.random() * 20;

  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  const rotY = Math.random() * Math.PI;

  createLowPolyMountain(x, z, rotY);
}

// ============================================
// KAMP ATEŞİ
// ============================================

function createCampfire() {
  const group = new THREE.Group();
  group.name = "campfire";

  // Kömür/Kül tabanı
  const ashGeo = new THREE.CircleGeometry(0.8, 16);
  const ashMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1,
  });
  const ash = new THREE.Mesh(ashGeo, ashMat);
  ash.rotation.x = -Math.PI / 2;
  ash.position.y = 0.02;
  group.add(ash);

  // Taş Çemberi
  const rockGeo = new THREE.DodecahedronGeometry(0.2);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
  });

  for (let i = 0; i < 12; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const angle = (i / 12) * Math.PI * 2;
    rock.position.set(Math.cos(angle) * 0.9, 0.1, Math.sin(angle) * 0.9);
    rock.scale.setScalar(0.8 + Math.random() * 0.4);
    rock.castShadow = true;
    group.add(rock);
  }

  // Odunlar
  const logGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 5);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });

  const logs = [
    { rot: [0, 0, Math.PI / 2.2], pos: [0, 0.2, 0] },
    { rot: [0, Math.PI / 3, Math.PI / 2.2], pos: [0, 0.2, 0] },
    { rot: [0, -Math.PI / 3, Math.PI / 2.2], pos: [0, 0.2, 0] },
  ];

  logs.forEach((d) => {
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.set(...d.rot);
    log.position.set(...d.pos);
    log.castShadow = true;
    group.add(log);
  });

  // Alevler
  const flameGroup = new THREE.Group();
  flameGroup.name = "flames";
  group.add(flameGroup);

  const flameColors = [0xffaa00, 0xff4400, 0xffdd00];

  for (let i = 0; i < 8; i++) {
    const fGeo = new THREE.ConeGeometry(0.2, 1.2, 4);
    const fMat = new THREE.MeshBasicMaterial({
      color: flameColors[i % 3],
      transparent: true,
      opacity: 0.8,
    });
    const flame = new THREE.Mesh(fGeo, fMat);
    flame.position.set(
      (Math.random() - 0.5) * 0.3,
      0.2,
      (Math.random() - 0.5) * 0.3
    );
    flame.userData = {
      speed: 3 + Math.random() * 4,
      offset: Math.random() * 100,
      baseHeight: 0.5 + Math.random() * 0.5,
    };
    flameGroup.add(flame);
  }

  fireLight.position.y = 1;
  group.add(fireLight);

  return group;
}

const campfire = createCampfire();
const fireDistance = Math.sqrt(0 * 0 + 0 * 0);
const fireGroundY = -fireDistance * fireDistance * 0.002;
campfire.position.y = fireGroundY;
scene.add(campfire);

// ============================================
// ÇADIR
// ============================================

const fabricTexture = textureLoader.load("./src/assets/textures/fabric.jpg");
fabricTexture.colorSpace = THREE.SRGBColorSpace;

function createTent() {
  const group = new THREE.Group();
  group.name = "camping_tent";

  const tentShape = new THREE.Shape();
  tentShape.moveTo(-1.5, 0);
  tentShape.lineTo(1.5, 0);
  tentShape.lineTo(0, 2.5);
  tentShape.lineTo(-1.5, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 4,
    bevelEnabled: false,
  };

  const tentGeo = new THREE.ExtrudeGeometry(tentShape, extrudeSettings);

  tentGeo.center();

  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Mesh(tentGeo, tentMat);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // --- 2. KAPI ---
  const doorShape = new THREE.Shape();
  doorShape.moveTo(-0.8, 0);
  doorShape.lineTo(1.1, 0);
  doorShape.lineTo(0, 1.6);
  doorShape.lineTo(-1.1, 0);

  const doorGeo = new THREE.ShapeGeometry(doorShape);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.4,
    metalness: 0.5,
    side: THREE.DoubleSide,
  });

  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0, 2.01);
  door.position.y = 0;
  group.add(door);

  // --- 3. KAZIKLAR / DESTEKLER  ---
  const pegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  const pegMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

  const pegPositions = [
    { x: -1.35, z: 1.9 },
    { x: 1.35, z: 1.9 },
    { x: -1.35, z: -1.9 },
    { x: 1.35, z: -1.9 },
  ];

  pegPositions.forEach((pos) => {
    const peg = new THREE.Mesh(pegGeo, pegMat);

    peg.position.set(pos.x, 0.2, pos.z);

    group.add(peg);
  });

  // --- 4. TEPE ÇITASI ---
  const ridgeGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8);
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.rotation.x = Math.PI / 2;
  ridge.position.y = 2.2;
  group.add(ridge);

  return group;
}

const tent = createTent();
tent.position.set(0, 0, -5);
scene.add(tent);

// ============================================
//  KÜTÜK FONKSİYONU
// ============================================

function createSittingLog(x, z, rot) {
  // 1. Geometri: Biraz daha detaylı
  const r1 = 0.22 + Math.random() * 0.05;
  const r2 = 0.22 + Math.random() * 0.05;
  const height = 2;
  const geo = new THREE.CylinderGeometry(r1, r2, height, 12, 4);

  // 2. Vertex Jitter (Yamuklaştırma - Doğallık Katma)
  const posAttribute = geo.attributes.position;
  for (let i = 0; i < posAttribute.count; i++) {
    const y = posAttribute.getY(i);
    if (Math.abs(y) < height / 2 - 0.01) {
      const randomOffset = (Math.random() - 0.5) * 0.03;

      const currentX = posAttribute.getX(i);
      const currentZ = posAttribute.getZ(i);

      posAttribute.setX(i, currentX + currentX * randomOffset);
      posAttribute.setZ(i, currentZ + currentZ * randomOffset);
    }
  }
  geo.computeVertexNormals();

  // 3. Materyaller (Çoklu Materyal Kullanımı)
  // Index 0: Yan Yüzey (Kabuk)
  // Index 1: Üst Kapak (Kesik Odun)
  // Index 2: Alt Kapak (Kesik Odun)

  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTexture,
    color: 0x888888,
    roughness: 0.9,
    flatShading: false,
  });

  const innerWoodMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 1.0,
    map: null,
  });

  // Silindir geometrisi materyal dizisini destekler: [Yan, Üst, Alt]
  const materials = [barkMat, innerWoodMat, innerWoodMat];

  const log = new THREE.Mesh(geo, materials);

  // Pozisyonlama
  log.rotation.z = Math.PI / 2;
  log.rotation.y = rot;

  // Zemin hesaplama
  const distance = Math.sqrt(x * x + z * z);
  const groundY = -distance * distance * 0.002;

  // Yüksekliği yarıçap kadar yukarı al + çok az göm (-0.05)
  log.position.set(x, groundY + 0.2, z);

  log.castShadow = true;
  log.receiveShadow = true;

  scene.add(log);
}

// Mevcut çağırma kodların aynı kalsın:
createSittingLog(0, 2.5, 0);
createSittingLog(2.5, 0, Math.PI / 2);
createSittingLog(-2.5, 0, Math.PI / 2);

// ============================================
// YILDIZLAR
// ============================================

const starsGeo = new THREE.BufferGeometry();
const starCount = 3000;
const starPos = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);

for (let i = 0; i < starCount; i++) {
  const r = 300 + Math.random() * 300;

  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);

  let x = r * Math.sin(phi) * Math.cos(theta);
  let y = Math.abs(r * Math.sin(phi) * Math.sin(theta));
  let z = r * Math.cos(phi);

  if (y < 20) y = 20 + Math.random() * 50;

  starPos[i * 3] = x;
  starPos[i * 3 + 1] = y;
  starPos[i * 3 + 2] = z;

  starSizes[i] = 5.0 + Math.random() * 5.0;
}

starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
starsGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

const starsMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.5,
  transparent: true,
  opacity: 1,
  sizeAttenuation: true,
  fog: false,
});

const stars = new THREE.Points(starsGeo, starsMat);
scene.add(stars);

// ============================================
// ETKİLEŞİM VE ANİMASYON DÖNGÜSÜ
// ============================================

// Odun sayacı
let woodCount = 0;
const maxWood = 5;

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    // Ateşe tıklayınca odun ekle
    if (obj.parent && obj.parent.name === "flames") {
      if (woodCount < maxWood) {
        woodCount++;

        // Alevin büyümesi (scale ve intensity artışı)
        const flames = campfire.getObjectByName("flames");
        flames.scale.setScalar(1 + woodCount * 0.15);
        fireLight.userData.baseIntensity = 3.0 + woodCount * 0.8;

        // 5 odun dolduğunda sıfırla
        if (woodCount === maxWood) {
          setTimeout(() => {
            woodCount = 0;
            flames.scale.setScalar(1);
            fireLight.userData.baseIntensity = 3.0;
          }, 2000);
        }
      }
    }
  }
});

// MOUSE HAREKETİ
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// RESIZE HANDLER
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ANIMATE FUNCTION
function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const delta = clock.getDelta(); // Frame süresi

  // KLAVYE HAREKETİNİ GÜNCELLE
  updateMovement(0.015); // Delta yerine sabit küçük bir sayı daha pürüzsüz yapabilir

  // ============================================
  // AY
  // ============================================

  const moonSpeed = 0.03;
  const angle = time * moonSpeed;

  moonLight.position.set(
    Math.sin(angle) * 140,
    45 + Math.cos(angle) * 20,
    -160
  );

  // Işık hep merkeze baksın
  moonLight.target.position.set(0, 0, 0);
  moonLight.target.updateMatrixWorld();

  // Görseli ışığa yapıştır
  moon.position.copy(moonLight.position);

  // Işık şiddeti sabit
  moonLight.intensity = 1.5;

  // ATEŞ ANİMASYONU

  const flames = campfire.getObjectByName("flames");
  if (flames) {
    flames.children.forEach((flame, i) => {
      const speed = flame.userData.speed;
      const offset = flame.userData.offset;

      // Yüksekliği değiştir (titreşim)
      flame.scale.y = 1 + Math.sin(time * speed + offset) * 0.4;
      flame.position.y = 0.2 + Math.abs(Math.sin(time * speed * 0.5)) * 0.2;

      // Sağa sola yatma (Rüzgar etkisi gibi)
      flame.rotation.z = Math.sin(time * 5 + i) * 0.2;
      flame.rotation.x = Math.cos(time * 3 + i) * 0.2;

      // Opaklık titremesi
      flame.material.opacity = 0.5 + Math.random() * 0.5;
    });
  }

  // Işık titremesi (Flicker Effect)
  fireLight.intensity =
    fireLight.userData.baseIntensity + (Math.random() - 0.5) * 1.5;
  fireLight.position.x = (Math.random() - 0.5) * 0.1;
  fireLight.position.z = (Math.random() - 0.5) * 0.1;

  //  AĞAÇ SALLANMASI
  scene.traverse((object) => {
    if (object.name === "tree") {
      const windForce =
        Math.sin(time * 1.5 + object.userData.windOffset) * 0.05;
      object.rotation.z = windForce; // Gövde sallanması

      // Yaprakların kendi içinde ekstra sallanması
      object.children.forEach((child) => {
        if (child.name === "leaves") {
          child.rotation.x = Math.sin(time * 2) * 0.02;
        }
      });
    }
  });

  // ÇADIR SALLANMASI
  const tentBody = tent.getObjectByName("tent_body");
  if (tentBody) {
    tentBody.scale.x = 1 + Math.sin(time * 3) * 0.02;
    tentBody.scale.z = 1 + Math.cos(time * 2.5) * 0.02;
    tent.rotation.z = Math.sin(time) * 0.02;
  }

  // YILDIZLARIN DÖNMESİ
  stars.rotation.y = time * 0.01;

  controls.update();
  renderer.render(scene, camera);
}
scene.fog.density = 0.002;

// ============================================
// YERDEKİ SİS
// ============================================
function createGroundMist() {
  const geo = new THREE.PlaneGeometry(25, 25);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Rastgele 100 tane sis parçası atalım
  for (let i = 0; i < 100; i++) {
    const mist = new THREE.Mesh(geo, mat);

    // Kampın etrafına ve dağlara doğru yayalım (40 ile 140 metre arası)
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 100;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Yere çok yakın olsun (0.5 ile 3 metre arası)
    mist.position.set(x, 1 + Math.random() * 2, z);

    // Yere paralel yatır (Su birikintisi gibi durmasın diye hafif açılı)
    mist.rotation.x = -Math.PI / 2;
    mist.rotation.z = Math.random() * Math.PI; // Rastgele çevir

    scene.add(mist);
  }
}

// Fonksiyonu çalıştır
createGroundMist();

animate();
