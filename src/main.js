import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CGCity } from "./city.js";
import { cityConfig, cityWidth, cityRadius } from "./config.js";
import { gltfLoader, gltfAssetPath } from "./gltfLoader.js";
import { CGWeather } from "./cgweather.js";
import { CGSky } from "./cgsky.js";
import { CGTraffic } from "./cgtraffic.js";
import { CGFirstPersonControls } from "./cgFirstPersonControls";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let firstPersonControls;
let orbitControls;
let cities = [];
let weather;
let sky;
let traffic;
let keyDict = {};

function init() {
  generateScene();
  generateCamera();
  generateRenderer();
  generateCity();
  generateWeather();
  generateSky();
  generateTrafficSystem();
  generateLighting();
  generateControls();
  generateEventListener();
}

function generateScene() {
  scene = new THREE.Scene();
}

function generateRenderer() {
  renderer = new THREE.WebGL1Renderer({ canvas: canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateCity(origin = [0, 0]) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let cityBlockConfig = JSON.parse(JSON.stringify(cityConfig));
      cityBlockConfig.origin[0] += i * cityWidth();
      cityBlockConfig.origin[2] += j * cityWidth();
      cities.push(
        new CGCity(scene, cityBlockConfig, new gltfLoader(), gltfAssetPath)
      );
    }
  }

  cities.forEach((cityBlock) => {
    cityBlock.generateCity();
  });
}

function generateWeather() {
  weather = new CGWeather(scene, cityConfig, cityWidth(), 300, 20000);
  //weather.generateWeather();
}

function generateSky() {
  sky = new CGSky(scene);
}

const parameters = {
  weather: 2,
};
gui
  .add(parameters, "weather")
  .min(0)
  .max(2)
  .step(1)
  .onChange(() => {
    weather.destroyWeather();
    weather.generateWeather(parameters.weather);
    console.log(parameters.weather);
  });

function generateTrafficSystem() {
  traffic = new CGTraffic(
    scene,
    cityConfig,
    new gltfLoader(),
    gltfAssetPath,
    cityWidth()
  );
  traffic.init();
  traffic.generateTraffic();
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
  let sunLight = new THREE.DirectionalLight(sunLightColor, sunLightIntensity);
  let sunLight_x = cityWidth() / 4;
  let sunLight_y = 600;
  let sunLight_z = cityWidth() / 2;

  sunLight.position.set(sunLight_x, sunLight_y, sunLight_z);
  sunLight.target.position.set(0, 0, 0);
  sunLight.castShadow = false;

  // Set the shadow camera properties
  sunLight.shadow.camera.near = 200;
  sunLight.shadow.camera.far = 1500;
  let d = 750;
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
  orbitControls = new OrbitControls(camera, canvas);
  orbitControls.maxPolarAngle = Math.PI / 2;

  firstPersonControls = new CGFirstPersonControls(
    camera,
    canvas,
    onFirstPersonEnabled,
    onFirstPersonDisabled
  );
}

function onFirstPersonEnabled() {
  sky.showSky();
  orbitControls.enabled = false;
}

function onFirstPersonDisabled() {
  sky.hideSky();
  orbitControls.enabled = true;
}

// keyboard action
function onKeyDown(event) {
  keyDict[event.key] = true;
  switch (event.key) {
    case "1":
      weather.destroyWeather();
      weather.generateWeather(0);
      sky.updateSkyType(0);
      break;
    case "2":
      weather.destroyWeather();
      weather.generateWeather(1);
      sky.updateSkyType(1);
      break;
    case "0":
      weather.destroyWeather();
      sky.updateSkyType(-1);
      break;
    case "z":
      firstPersonControls.enable();
      break;
    case "x":
      cities.forEach((cityBlock) => {
        cityBlock.hideCity();
      });
      break;
    case "c":
      cities.forEach((cityBlock) => {
        cityBlock.showCity();
      });
      break;
  }
}

function onKeyUp(event) {
  keyDict[event.key] = false;
}

function generateEventListener() {
  window.addEventListener("resize", resize);
  window.addEventListener("dblclick", () => {
    cities.forEach((cityBlock) => {
      cityBlock.destroyCity();
      cityBlock.generateCity();
    });
    traffic.destoryTraffic();
    traffic.init();
    traffic.generateTraffic();
  });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
}

// Function called on window resize events.
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function render() {
  //controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

// animation
const clock = new THREE.Clock();
let prevTime = 0;
const tick = () => {
  let elapsedTime = clock.getElapsedTime() - prevTime;
  prevTime = clock.getElapsedTime();

  // Update particles
  if (weather && weather.gen) {
    weather.update(0.2);
  }
  // Update particles
  if (traffic && traffic.gen && traffic.allGenerates()) {
    traffic.update(0.2);
  }
  window.requestAnimationFrame(tick);

  // Update camera position
  if (firstPersonControls.isEnabled()) {
    firstPersonControls.updatePosition(keyDict, elapsedTime);

    if (Math.abs(camera.position.x) > cityRadius()) {
      camera.position.x = -Math.sign(camera.position.x) * (cityRadius() - 1);
    }
    if (Math.abs(camera.position.z) > cityRadius()) {
      camera.position.z = -Math.sign(camera.position.z) * (cityRadius() - 1);
    }
  }
};

init();
render();
tick();
