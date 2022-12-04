import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./perlin.js";
import * as util from "./util.js";

const gui = new dat.GUI();

// THREE.js variables
let canvas = document.querySelector("canvas.webgl");
let scene;
let renderer;
let camera;
let controls;
let gltfLoader = new GLTFLoader();

// city variables
const colors = {
  WHITE: 0xffffff,
  CITY_BASE: 0x5c4033, // Dark Brown
  BUILDING_BASE: 0x696969,
  GROUND_BASE: 0x00a300,
};
const assetPath = {
  STRAIGHT_ROAD: "/roadAssets/straightroadPath/assets.gltf",
  CROSS_ROAD: "/roadAssets/Fourway cross gltf/CG-City Assets.gltf",
};
let buildingMap;

// adjustable configurations
const cityConfigurations = {
  gridSize: 20,
  roadWidth: 10,
  blockWidth: 25,

  cityBaseHeight: 10,
  buildingBaseHeight: 3,
  groundBaseHeight: 1,
  roadHeight: 1,

  buildingScatter: 0.8, // range: [0, 1]
  buildingThreshold: 0.3, // range: [0, 1], smaller threshold -> more buildings
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
  generateRoads();

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

function getBlockXCoordinate(i) {
  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;

  return i * (blockWidth + roadWidth) + blockWidth / 2 - getCityWidth() / 2;
}

function getBlockZCoordinate(j) {
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
      const x = getBlockXCoordinate(i);
      const z = getBlockZCoordinate(j);
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

function loadGLTF(gltfPath, callback) {
  gltfLoader.load(
    gltfPath,
    (gltf) => {
      callback(gltf);
    },
    (progress) => {
      console.log("progress");
      console.log(progress);
    },
    (error) => {
      console.log("error");
      console.log(error);
    }
  );
}

function onStraightRoadLoaded(gltf) {
  console.log("straight road loaded success");
  console.log(gltf);

  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;
  const roadHeight = cityConfigurations.roadHeight;
  const gridSize = cityConfigurations.gridSize;

  let road = gltf.scene.children[0];
  resizeObject(road, blockWidth, roadWidth, roadHeight);

  console.log(road);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const blockX = getBlockXCoordinate(i);
      const blockZ = getBlockZCoordinate(j);

      if (j < gridSize - 1) {
        const roadCol = road.clone();
        roadCol.position.set(
          blockX,
          roadHeight / 2,
          blockZ + (blockWidth + roadWidth) / 2
        );

        scene.add(roadCol);
      }

      if (i < gridSize - 1) {
        let roadRow = road.clone();
        roadRow.rotation.z += Math.PI / 2;
        roadRow.position.set(
          blockX + (blockWidth + roadWidth) / 2,
          roadHeight / 2,
          blockZ
        );

        scene.add(roadRow);
      }
    }
  }
}

function onCrossRoadLoaded(gltf) {
  console.log("cross road loaded success");
  console.log(gltf);

  const blockWidth = cityConfigurations.blockWidth;
  const roadWidth = cityConfigurations.roadWidth;
  const roadHeight = cityConfigurations.roadHeight;
  const gridSize = cityConfigurations.gridSize;

  let crossRoad = gltf.scene.children[0];
  resizeObject(crossRoad, roadWidth, roadWidth, roadHeight);

  console.log(crossRoad);

  for (let i = 0; i < gridSize - 1; i++) {
    for (let j = 0; j < gridSize - 1; j++) {
      const blockX = getBlockXCoordinate(i);
      const blockZ = getBlockZCoordinate(j);

      const c = crossRoad.clone();
      c.position.set(
        blockX + (blockWidth + roadWidth) / 2,
        roadHeight / 2,
        blockZ + (blockWidth + roadWidth) / 2
      );

      scene.add(c);
    }
  }
}

function generateRoads() {
  loadGLTF(assetPath.STRAIGHT_ROAD, onStraightRoadLoaded);
  loadGLTF(assetPath.CROSS_ROAD, onCrossRoadLoaded);
}

function generateEventListener() {
  window.addEventListener("resize", resize);
}

function resizeObject(object, width, length, height) {
  object.scale.set(1, 1, 1);
  const box = new THREE.Box3().setFromObject(object);
  const originSize = box.max.sub(box.min);
  object.scale.set(
    width / originSize.x,
    length / originSize.z,
    height / originSize.y
  );
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
