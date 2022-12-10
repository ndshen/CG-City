import * as THREE from "three";
import * as util from "./util.js";
import * as perlin from "./perlin";
import { CGBuildingGenerator } from "./building.js";

export class CGCity {
  constructor(scene, config, modelLoader, assetPath) {
    this.scene = scene;
    this.config = config;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;

    // stores the uuids of all the objects generated in the city
    this.objectIds = [];
    // cache a copy of all objects
    this.objects = [];

    // a gridSize X gridSize 2D array, indicates which blocks are ground and which are buildings
    this.buildingMap = [[]];

    this.buildingGeneratror = new CGBuildingGenerator(
      config,
      modelLoader,
      assetPath
    );
  }

  generateCity() {
    this.generateBuildingMap(
      perlin.setPerlinNoiseSeed,
      perlin.getPerlinNoiseValue
    );
    this.generateCityBase();
    this.generateBlocks();
    this.generateRoads();
  }

  destroyCity() {
    this.objectIds.map(this.removeObject);
    this.objectIds = [];
    this.objects = [];
  }

  hideCity() {
    this.objectIds.map(this.removeObject); // remove objects from scene but keep cached copies
  }

  showCity() {
    this.objects.map(this.addCachedObject);
  }

  removeObject = (objectId) => {
    const object = this.scene.getObjectByProperty("uuid", objectId);
    // object.geometry.dispose();
    // object.material.dispose();
    this.scene.remove(object);
  };

  addCachedObject = (object) => {
    this.scene.add(object);
  };

  generateBuildingMap(noiseSeedFn, noiseValueFn) {
    noiseSeedFn();
    const gridSize = this.config.gridSize;

    this.buildingMap = Array(gridSize)
      .fill()
      .map(() => Array(gridSize).fill(0));

    // set initial buildingMap value using the noiseVaueFn (ex. perlin noise fn)
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        this.buildingMap[i][j] = noiseValueFn(
          i,
          j,
          1 / this.config.buildingScatter
        );
      }
    }

    // normalize the value to be in range [0, 1]
    this.buildingMap = util.normalize2DArray(this.buildingMap);
  }

  addToScene(object) {
    object.position.add(new THREE.Vector3().fromArray(this.config.origin));
    object.castShadow = true;
    object.receiveShadow = true;
    this.objectIds.push(object.uuid);
    this.objects.push(object);
    this.scene.add(object);
  }

  generateCityBase() {
    const baseHeight = this.config.cityBaseHeight;
    const baseGeometry = new THREE.BoxGeometry(
      this.cityWidth,
      baseHeight,
      this.cityWidth
    );

    const baseMaterial = new THREE.MeshLambertMaterial({
      color: this.config.colors.CITY_BASE,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(0, -(baseHeight / 2), 0);

    this.addToScene(baseMesh);
  }

  isBuildingBlock(i, j) {
    return this.buildingMap[i][j] >= this.config.buildingThreshold;
  }

  getBlockXCoordinate(i) {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;

    return i * (blockWidth + roadWidth) + blockWidth / 2 - this.cityWidth / 2;
  }

  getBlockZCoordinate(j) {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;

    return j * (blockWidth + roadWidth) + blockWidth / 2 - this.cityWidth / 2;
  }

  generateBuildingBase(x, z) {
    const baseHeight = this.config.buildingBaseHeight;
    const blockWidth = this.config.blockWidth;
    const baseGeometry = new THREE.BoxGeometry(
      blockWidth,
      baseHeight,
      blockWidth
    );
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: this.config.colors.BUILDING_BASE,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, baseHeight / 2, z);
    this.addToScene(baseMesh);
  }

  generateGroundBase(x, z) {
    const baseHeight = this.config.groundBaseHeight;
    const blockWidth = this.config.blockWidth;
    const baseGeometry = new THREE.BoxGeometry(
      blockWidth,
      baseHeight,
      blockWidth
    );
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: this.config.colors.GROUND_BASE,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, baseHeight / 2, z);
    this.addToScene(baseMesh);
  }

  getBuildingLevel(i, j) {
    if (this.buildingMap[i][j] < this.config.buildingThreshold) {
      return 0;
    }

    const maxBuildingLevel = this.config.maxBuildingLevel;
    const minBuildingLevel = 1;
    return Math.floor(
      ((this.buildingMap[i][j] - this.config.buildingThreshold) /
        (1 - this.config.buildingThreshold)) *
        (maxBuildingLevel - minBuildingLevel) +
        minBuildingLevel
    );
  }

  generateBuilding(x, z, level) {
    this.buildingGeneratror
      .generateRandomBuilding(level)
      .subscribe((building) => {
        const bSize = new THREE.Box3()
          .setFromObject(building)
          .getSize(new THREE.Vector3());
        building.position.add(
          new THREE.Vector3(x, this.config.buildingBaseHeight + bSize.y / 2, z)
        );
        this.addToScene(building);
      });
  }

  generateBlocks() {
    const gridSize = this.config.gridSize;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = this.getBlockXCoordinate(i);
        const z = this.getBlockZCoordinate(j);
        if (this.isBuildingBlock(i, j)) {
          // is building block
          this.generateBuildingBase(x, z);
          this.generateBuilding(x, z, this.getBuildingLevel(i, j));
        } else {
          // is ground block
          this.generateGroundBase(x, z);
        }
      }
    }
  }

  onStraightRoadLoaded = (obj) => {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const roadHeight = this.config.roadHeight;
    const gridSize = this.config.gridSize;

    let road = obj;
    util.resizeObject(road, blockWidth, roadWidth, roadHeight);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const blockX = this.getBlockXCoordinate(i);
        const blockZ = this.getBlockZCoordinate(j);

        if (j < gridSize - 1) {
          const roadCol = road.clone();
          roadCol.position.set(
            blockX,
            roadHeight / 2,
            blockZ + (blockWidth + roadWidth) / 2
          );

          this.addToScene(roadCol);
        }

        if (i < gridSize - 1) {
          let roadRow = road.clone();
          roadRow.rotation.z += Math.PI / 2;
          roadRow.position.set(
            blockX + (blockWidth + roadWidth) / 2,
            roadHeight / 2,
            blockZ
          );

          this.addToScene(roadRow);
        }
      }
    }
  };

  onCrossRoadLoaded = (obj) => {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const roadHeight = this.config.roadHeight;
    const gridSize = this.config.gridSize;

    let crossRoad = obj;
    util.resizeObject(crossRoad, roadWidth, roadWidth, roadHeight);

    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const blockX = this.getBlockXCoordinate(i);
        const blockZ = this.getBlockZCoordinate(j);

        const c = crossRoad.clone();
        c.position.set(
          blockX + (blockWidth + roadWidth) / 2,
          roadHeight / 2,
          blockZ + (blockWidth + roadWidth) / 2
        );

        this.addToScene(c);
      }
    }
  };

  generateRoads() {
    this.modelLoader
      .load(this.assetPath.ROAD.STRAIGHT_ROAD)
      .subscribe(this.onStraightRoadLoaded);
    this.modelLoader
      .load(this.assetPath.ROAD.CROSS_ROAD)
      .subscribe(this.onCrossRoadLoaded);
  }

  get cityWidth() {
    return (
      this.config.gridSize * this.config.blockWidth +
      (this.config.gridSize - 1) * this.config.roadWidth
    );
  }
}
