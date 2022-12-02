import "./style.css";
import * as THREE from "three";
// import * as THREE_TERRAIN from "three.terrain.js";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Object
const geometry = new THREE.PlaneGeometry(3, 3, 64, 64);

// Materails
const material = new THREE.MeshStandardMaterial({
  color: "green",
  wireframe: true,
});

// Mesh
const plane = new THREE.Mesh(geometry, material);

scene.add(plane);
gui.add(plane.rotation, "x").min(0).max(100);

// terain

// Generate a terrain
// var xS = 63,
//   yS = 63;
// terrainScene = THREE_TERRAIN.Terrain({
//   easing: THREE_TERRAIN.Terrain.Linear,
//   frequency: 2.5,
//   heightmap: THREE_TERRAIN.Terrain.DiamondSquare,
//   material: new THREE.MeshBasicMaterial({ color: 0x5566aa }),
//   maxHeight: 100,
//   minHeight: -100,
//   steps: 1,
//   xSegments: xS,
//   xSize: 1024,
//   ySegments: yS,
//   ySize: 1024,
// });
// // Assuming you already have your global scene, add the terrain to it
// scene.add(terrainScene);

// Optional:
// // Get the geometry of the terrain across which you want to scatter meshes
// var geo = terrainScene.children[0].geometry;
// // Add randomly distributed foliage
// decoScene = TTHREE_TERRAINHREE.Terrain.ScatterMeshes(geo, {
//   mesh: new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6)),
//   w: xS,
//   h: yS,
//   spread: 0.02,
//   randomness: Math.random,
// });
// terrainScene.add(decoScene);

// Lights

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.x = 2;
pointLight.position.y = 2;
pointLight.position.z = 2;
scene.add(pointLight);

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  1,
  1000
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 5;
camera.lookAt(plane.position);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
});

// animate
const tick = () => {
  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
