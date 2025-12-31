# ⛺ Threejs Interactive Campsite

An immersive, interactive 3D nighttime camping environment developed using **Three.js** and **WebGL**. This project demonstrates core computer graphics principles through a stylized low-poly aesthetic.

## 🚀 Live Demo
(https://nisa-s.github.io/threejs-interactive-campsite/)

## ✨ Key Features

- **Procedural Generation:** Hundreds of trees, rocks, and bushes are generated dynamically with randomized scales and rotations.
- **Vertex Manipulation:** The terrain is not flat; I manually modified the `BufferAttribute` of the plane geometry to create a curved-earth effect.
- **Dynamic Lighting & Shadows:** - A moving **Moon** (DirectionalLight) that orbits the scene using trigonometry.
  - A flickering **Campfire** (PointLight) with real-time intensity jittering.
  - **PCFSoftShadowMap** for high-quality, smooth shadows.
- **Interactive Raycasting:** Click on the campfire to "add wood" and watch the flames and light intensity grow dynamically.
- **First-Person Navigation:** Explore the campsite using arrow keys with smooth damping (OrbitControls integration).
- **Atmospheric Effects:** Layered ground mist, a rotating star field (3000+ particles), and exponential fog.

## 🛠️ Technical Concepts Implemented

- **Vertex Shaders Logic:** Manual manipulation of geometry vertices for terrain shaping.
- **Vector Math:** Used for movement calculations and orbital mechanics (Sine/Cosine).
- **Material Properties:** Use of MeshStandardMaterial for PBR (Physically Based Rendering) effects.
- **Performance Optimization:** Geometry and material reuse to maintain high FPS with 500+ objects.

## 📖 How to Run

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/Threejs-Interactive-Campsite.git](https://github.com/YOUR_USERNAME/Threejs-Interactive-Campsite.git)
Open index.html using a local server (e.g., Live Server extension in VS Code).

📜 Academic Purpose
This project was developed as a term project for the Computer Graphics course.


Developed by: Nisanur Şen
