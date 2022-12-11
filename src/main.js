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
import { CGCityCopy } from "./cgcitycopy";
import { CGTrafficCopy } from "./cgtrafficcopy";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let firstPersonControls;
let orbitControls;
let city;
let cityCopies = [];
let weather;
let sky;
let traffic;
let trafficCopies = [];
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

function generateCity() {
  city = new CGCity(scene, cityConfig, new gltfLoader(), gltfAssetPath);
  city.generateCity();
}

function generateWeather() {
  weather = new CGWeather(scene, cityConfig, cityWidth() * 2, 300, 20000);
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
  let trafficConfig = JSON.parse(JSON.stringify(cityConfig));
  trafficConfig.gridSize = cityConfig.gridSize * 3;
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
  let colorIntensity = 0.3;
  let hemisphereLight = new THREE.HemisphereLight(
    skyColor,
    groundColor,
    colorIntensity
  );
  scene.add(hemisphereLight);

  // Create main directional light (used to simulate sunlight)
  let sunLightColor = 0xffffff;
  let sunLightIntensity = 1;
  let sunLight = new THREE.DirectionalLight(sunLightColor, sunLightIntensity);
  let sunLight_x = cityWidth() / 2;
  let sunLight_y = 500;
  let sunLight_z = cityWidth();

  sunLight.position.set(sunLight_x, sunLight_y, sunLight_z);
  sunLight.target.position.set(0, 0, 0);
  sunLight.castShadow = true;

  // Set the shadow camera properties
  sunLight.shadow.camera.near = 200;
  sunLight.shadow.camera.far = 1500;
  let d = cityWidth() * 3;
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
  generateCopies();
  sky.showSky();
  orbitControls.enabled = false;
}

function onFirstPersonDisabled() {
  hideCopies();
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
      generateCopies();
      break;
    case "c":
      hideCopies();
      break;
  }
}

function onKeyUp(event) {
  keyDict[event.key] = false;
}

function generateEventListener() {
  window.addEventListener("resize", resize);
  window.addEventListener("dblclick", () => {
    city.destroyCity();
    city.generateCity();
    traffic.destroyTraffic();
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

function generateCopies() {
  if (cityCopies.length == 0 || trafficCopies.length == 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i == 0 && j == 0) {
          continue;
        }
        cityCopies.push(
          new CGCityCopy(scene, city, i * cityWidth(), j * cityWidth())
        );
        trafficCopies.push(
          new CGTrafficCopy(scene, traffic, i * cityWidth(), j * cityWidth())
        );
      }
    }
  }

  cityCopies.forEach((cityCopy) => {
    cityCopy.showCity();
  });
  trafficCopies.forEach((trafficCopy) => {
    trafficCopy.showTraffic();
  });
}

function hideCopies() {
  cityCopies.forEach((cityCopy) => {
    cityCopy.hideCity();
  });
  trafficCopies.forEach((trafficCopy) => {
    trafficCopy.hideTraffic();
  });
}

// Animation
const clock = new THREE.Clock();
let prevTime = 0;
const tick = () => {
  let elapsedTime = clock.getElapsedTime() - prevTime;
  prevTime = clock.getElapsedTime();

  // Update weather
  if (weather && weather.gen) {
    weather.update(0.2);
  }

  // Update traffic
  if (traffic && traffic.gen && traffic.allGenerates()) {
    traffic.update(0.2);
  }
  trafficCopies.forEach((trafficCopy) => {
    trafficCopy.updateTraffic();
  });

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
