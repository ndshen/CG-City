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

/**
 * Axes Helper
 */
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// Map
const mapWidth = 20;
const mapHeight = 20;
const roadPercentage = 0.5;
const roadLength = 5;

const boxMinDepth = 1;
const boxMaxDepth = 5;

let map = Array(mapHeight)
  .fill()
  .map(() => Array(mapWidth).fill(0));

for (let i = 0; i < mapHeight; i++) {
  for (let j = 0; j < mapWidth; j++) {
    if (map[i][j] == 0) {
      if (Math.random() < roadPercentage) {
        // is road
        for (let k = 0; k < roadLength; k++) {
          if (map[i][j + k] == 0) {
            map[i][k] = boxMinDepth;
          }
        }

        for (let k = 0; k < roadLength; k++) {
          if (i + k < mapHeight && map[i + k][j] == 0) {
            map[i + k][j] = boxMinDepth;
          }
        }
      } else {
        // is building
        map[i][j] = boxMaxDepth;
      }
    }
  }
}

// Object
const boxWidth = 1;
const boxHeight = 1;

const boxGroup = new THREE.Group();
for (let i = 0; i < mapHeight; i++) {
  for (let j = 0; j < mapWidth; j++) {
    let boxDepth = map[i][j];
    const box = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const material = new THREE.MeshStandardMaterial({
      color: "green",
      wireframe: true,
    });
    const mesh = new THREE.Mesh(box, material);
    mesh.position.x = j * boxWidth + boxWidth / 2 - (mapWidth * boxWidth) / 2;
    mesh.position.y =
      i * boxHeight + boxHeight / 2 - (mapHeight * boxHeight) / 2;
    mesh.position.z = boxDepth / 2;

    boxGroup.add(mesh);
  }
}

scene.add(boxGroup);
gui.add(boxGroup.rotation, "z").min(0).max(100);

// Lights
const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.x = 2;
pointLight.position.y = 2;
pointLight.position.z = 10;
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
camera.position.x = -10;
camera.position.y = -10;
camera.position.z = 10;
camera.up.set(0, 0, 1);
camera.lookAt(boxGroup.position);
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

  boxGroup.rotation.z += 0.001;
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
