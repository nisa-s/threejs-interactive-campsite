# ⛺ Three.js Interactive Campsite

An immersive, interactive 3D nighttime camping environment built with Three.js and WebGL. Demonstrates core computer graphics principles through a stylized low-poly aesthetic.

🔗 **[Live Demo](https://nisa-s.github.io/threejs-interactive-campsite/)**

---

## ✨ Features

### Procedural Generation
Hundreds of trees, rocks, and bushes generated dynamically with randomized scales and rotations — no two scenes look identical.

### Vertex Manipulation
Custom curved-earth terrain effect achieved by directly modifying `BufferAttribute` geometry vertices.

### Dynamic Lighting & Shadows
- **Moon** — a `DirectionalLight` that orbits the scene using sine/cosine calculations
- **Campfire** — a `PointLight` with real-time intensity jitter for a flickering flame effect
- **PCFSoftShadowMap** — high-quality, smooth shadows across the entire scene

### Interactive Raycasting
Click on the campfire to add wood — flame height and light intensity grow dynamically with each click.

### First-Person Navigation
Explore the campsite with arrow keys and smooth damping via `OrbitControls`.

### Atmospheric Effects
- Layered ground mist
- Rotating star field (3000+ particles)
- Exponential fog for realistic depth

---

## 🛠️ Technical Highlights

| Concept | Implementation |
|---|---|
| Vertex Shader Logic | Manual geometry vertex manipulation for terrain shaping |
| Vector Math | Sine/cosine orbital mechanics and movement calculations |
| PBR Materials | `MeshStandardMaterial` for physically based rendering |
| Performance | Strict geometry & material reuse — 500+ objects at stable FPS |

---

## 🚀 Getting Started

### Option 1 — Live Server

```bash
git clone https://github.com/nisa-s/threejs-interactive-campsite.git
```

Open `index.html` with a local development server (e.g. the **Live Server** extension in VS Code).

### Option 2 — Node.js

```bash
npm install
npm run dev
```

---

## 📜 Academic Context

Developed as a term project for the **Computer Graphics** course.

**Developer:** Nisanur Şen