import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./perlin.js";
import * as util from "./util.js";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let controls;

// city variables
const colors = {
  WHITE: 0xffffff,
  CITY_BASE: 0x5c4033, // Dark Brown
  BUILDING_BASE: 0x696969,
  GROUND_BASE: 0x00a300,
};
let buildingMap;

// adjustable configurations
const cityConfigurations = {
  gridSize: 20,
  roadWidth: 10,
  blockWidth: 25,

  cityBaseHeight: 5,
  buildingBaseHeight: 3,
  groundBaseHeight: 0.1,

  buildingScatter: 0.9, // range: [0, 1]
  buildingThreshold: 0.2, // range: [0, 1], smaller threshold -> more buildings
};

function init() {
  generateScene();
  generateRenderer();
  generateLighting();
  generateCamera();
  generateControls();

  generateBuildingMap(setPerlinNoiseSeed, getPerlinNoiseValue);
  generateCityBase();
  generateBlocks();

  generateEventListener();
}

function generateScene() {
  scene = new THREE.Scene();
}

function generateRenderer() {
  renderer = new THREE.WebGL1Renderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateLighting() {
  // Variables used to create the hemisphere light
  let skyColor = colors.WHITE;
  let groundColor = colors.WHITE;
  let colorIntensity = 0.4;

  // Create a light source positioned directly above the scene, with color fading from the sky color to the ground color.
  let hemisphereLight = new THREE.HemisphereLight(
    skyColor,
    groundColor,
    colorIntensity
  );

  // Create the directional lights which we use to simulate daylight:

  // Variables used to create the directional light
  let shadowLightColor = colors.WHITE;
  let shadowLightIntensity = 0.25;

  let shadowLight = new THREE.DirectionalLight(
    shadowLightColor,
    shadowLightIntensity
  );

  // Initialize the variables used to create the shadow light
  let x_position = getCityWidth() / 2;
  let y_position = 800;
  let z_position = getCityWidth() / 2;

  // Set the shadow camera position ( x, y, z ) in world space.
  shadowLight.position.set(x_position, y_position, z_position);

  // Variables used to create the back light
  let backLightColor = colors.WHITE;
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

function setPerlinNoiseSeed() {
  window.noise.seed(Math.random());
}

function getPerlinNoiseValue(x, y, frequency) {
  return Math.abs(window.noise.perlin2(x / frequency, y / frequency)); // +
  // Math.abs(window.noise.perlin2((x / frequency) * 0.5, (y / frequency) * 0.5)) +
  // Math.abs(window.noise.perlin2((x / frequency) * 0.5, (y / frequency) * 0.5))
}

function generateBuildingMap(noiseSeedFn, noiseValueFn) {
  noiseSeedFn();
  const gridSize = cityConfigurations.gridSize;

  buildingMap = Array(gridSize)
    .fill()
    .map(() => Array(gridSize).fill(0));

  // set initial buildingMap value using the noiseVaueFn (ex. perlin noise fn)
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      buildingMap[i][j] = noiseValueFn(
        i,
        j,
        1 / cityConfigurations.buildingScatter
      );
    }
  }

  // normalize the value to be in the range [0, 1]
  buildingMap = util.normalize2DArray(buildingMap);
}

function getCityWidth() {
  const gridSize = cityConfigurations.gridSize;
  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;

  return gridSize * blockWidth + (gridSize - 1) * roadWidth;
}

function generateCityBase() {
  const baseHeight = cityConfigurations.cityBaseHeight;
  const baseGeometry = new THREE.BoxGeometry(
    getCityWidth(),
    baseHeight,
    getCityWidth()
  );

  const baseMaterial = new THREE.MeshLambertMaterial({
    color: colors.CITY_BASE,
  });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.position.set(0, -(baseHeight / 2), 0);

  scene.add(baseMesh);
}

function isBuildingBlock(i, j) {
  return buildingMap[i][j] >= cityConfigurations.buildingThreshold;
}

function getSceneXCoordinate(i) {
  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;

  return i * (blockWidth + roadWidth) + blockWidth / 2 - getCityWidth() / 2;
}

function getSceneZCoordinate(j) {
  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;

  return j * (blockWidth + roadWidth) + blockWidth / 2 - getCityWidth() / 2;
}

function generateBuildingBase(x, z) {
  const baseHeight = cityConfigurations.buildingBaseHeight;
  const blockWidth = cityConfigurations.blockWidth;
  const baseGeometry = new THREE.BoxGeometry(
    blockWidth,
    baseHeight,
    blockWidth
  );
  const baseMaterial = new THREE.MeshLambertMaterial({
    color: colors.BUILDING_BASE,
  });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.position.set(x, baseHeight / 2, z);
  scene.add(baseMesh);
}

function generateGroundBase(x, z) {
  const baseHeight = cityConfigurations.groundBaseHeight;
  const blockWidth = cityConfigurations.blockWidth;
  const baseGeometry = new THREE.BoxGeometry(
    blockWidth,
    baseHeight,
    blockWidth
  );
  const baseMaterial = new THREE.MeshLambertMaterial({
    color: colors.GROUND_BASE,
  });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.position.set(x, baseHeight / 2, z);
  scene.add(baseMesh);
}

function generateBlocks() {
  const gridSize = cityConfigurations.gridSize;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = getSceneXCoordinate(i);
      const z = getSceneZCoordinate(j);
      if (isBuildingBlock(i, j)) {
        // is building block
        generateBuildingBase(x, z);
      } else {
        // is ground block
        generateGroundBase(x, z);
      }
    }
  }
}

function generateEventListener() {
  window.addEventListener("resize", resize);
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
