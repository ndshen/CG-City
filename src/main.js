import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CGCity } from "./city.js";
import { cityConfig } from "./config.js";
import { gltfLoader, gltfAssetPath } from "./gltfLoader.js";
import { CGWeather } from "./cgweather.js";
import { CGCars } from "./cgcars.js";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let controls;
let city;
let weather;
let cars;

function init() {
  generateScene();
  generateCamera();
  generateRenderer();
  generateCity();
  generateWeather();
  generateCars();
  generateLighting();
  generateControls();
  generateEventListener();
}

function generateScene() {
  scene = new THREE.Scene();
}

function generateRenderer() {
  renderer = new THREE.WebGL1Renderer({ canvas: canvas, antialias: true});
  renderer.shadowMapEnabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateCity() {
  city = new CGCity(scene, cityConfig, new gltfLoader(), gltfAssetPath);
  city.generateCity();
}

function generateWeather() {
  weather = new CGWeather(scene, cityConfig, city.cityWidth, 300, 20000);
  //weather.generateWeather();
}

function generateCars() {
  cars = new CGCars(scene, cityConfig, new gltfLoader(), gltfAssetPath, city.cityWidth);
  cars.generateCars();
}

function generateLighting() {
  // Create hemisphere light (used for ambient lighting)
  let skyColor = 0xffffff;
  let groundColor = 0xffffff;
  let colorIntensity = 0.4;
  let hemisphereLight = new THREE.HemisphereLight(
    skyColor,
    groundColor,
    colorIntensity
  );
  scene.add(hemisphereLight);

  // Create main directional light (used to simulate sunlight)
  let sunLightColor = 0xffffff;
  let sunLightIntensity = 0.8;
  let sunLight = new THREE.DirectionalLight(
    sunLightColor,
    sunLightIntensity
  );
  let sunLight_x = city.cityWidth / 4;
  let sunLight_y = 600;
  let sunLight_z = city.cityWidth / 3;
  
  sunLight.position.set(sunLight_x, sunLight_y, sunLight_z);
  sunLight.target.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadowDarkness = 0.5;

  // Set the shadow camera properties
  sunLight.shadow.camera.near = 200;
  sunLight.shadow.camera.far = 1000;
  let d = 500
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;

  scene.add(sunLight);
  scene.add(sunLight.target);

  //scene.add(new THREE.CameraHelper(sunLight.shadow.camera)); // toggle shadow camera debug

  // Create a back light for additional ambient lighting
  let backLightColor = 0xffffff;
  let backLightIntensity = 0.1;
  let backLight = new THREE.DirectionalLight(
    backLightColor,
    backLightIntensity
  );
  backLight.position.set(-120, 180, 60);
  scene.add(backLight);
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

// keyboard action
function logKey(event) {
  var keyCode = event.which;
  if (keyCode == 65 || keyCode == 97) {
    weather.destoryWeather();
    weather.generateWeather(0);
  }
  else if (keyCode == 83 || keyCode == 115) {
    weather.destoryWeather();
    weather.generateWeather(1);
  }
  else if (keyCode == 90 || keyCode == 122){
    weather.destoryWeather();
  }
}

function generateEventListener() {
  window.addEventListener("resize", resize);
  window.addEventListener("dblclick", () => {
    city.destoryCity();
    city.generateCity();
  });
  window.addEventListener('keypress', logKey);
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

// animation
const clock = new THREE.Clock()
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update particles
  if (weather && weather.gen) {
    weather.update(0.2);
  }
  window.requestAnimationFrame(tick)
}

tick();

init();
render();
