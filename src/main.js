import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CGCity } from "./city.js";
import { cityConfig } from "./config.js";
import { gltfLoader, gltfAssetPath } from "./gltfLoader.js";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let controls;
let city;

function init() {
  generateScene();
  generateRenderer();
  generateCity();
  generateLighting();
  generateCamera();
  generateControls();
  generateEventListener();
}

function generateScene() {
  scene = new THREE.Scene();
}

function generateRenderer() {
  renderer = new THREE.WebGL1Renderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateCity() {
  city = new CGCity(scene, cityConfig, new gltfLoader(), gltfAssetPath);
  city.generateCity();
}

function generateLighting() {
  // Variables used to create the hemisphere light
  let skyColor = 0xffffff;
  let groundColor = 0xffffff;
  let colorIntensity = 0.4;

  // Create a light source positioned directly above the scene, with color fading from the sky color to the ground color.
  let hemisphereLight = new THREE.HemisphereLight(
    skyColor,
    groundColor,
    colorIntensity
  );

  // Create the directional lights which we use to simulate daylight:

  // Variables used to create the directional light
  let shadowLightColor = 0xffffff;
  let shadowLightIntensity = 0.25;

  let shadowLight = new THREE.DirectionalLight(
    shadowLightColor,
    shadowLightIntensity
  );

  // Initialize the variables used to create the shadow light
  let x_position = city.cityWidth / 2;
  let y_position = 800;
  let z_position = city.cityWidth / 2;

  // Set the shadow camera position ( x, y, z ) in world space.
  shadowLight.position.set(x_position, y_position, z_position);

  // Variables used to create the back light
  let backLightColor = 0xffffff;
  let backLightIntensity = 0.1;

  let backLight = new THREE.DirectionalLight(
    backLightColor,
    backLightIntensity
  );

  // Set the back light position ( x, y, z ) in world space.
  backLight.position.set(-120, 180, 60);

  scene.add(backLight, shadowLight, hemisphereLight);
}

function generateCamera() {
  let fieldOfView = 75;
  let aspect = window.innerWidth / window.innerHeight;
  let nearPlane = 1;
  let farPlane = 5000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspect,
    nearPlane,
    farPlane
  );
  camera.position.x = 500;
  camera.position.y = 500;
  camera.position.z = 500;
  camera.up.set(0, 1, 0);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);
}

function generateControls() {
  controls = new OrbitControls(camera, canvas);
  controls.maxPolarAngle = Math.PI / 2;
}

function generateEventListener() {
  window.addEventListener("resize", resize);
  window.addEventListener("dblclick", () => {
    city.destoryCity();
    city.generateCity();
  });
}

// Function called on window resize events.
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function render() {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

init();
render();
