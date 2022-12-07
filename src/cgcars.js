import * as THREE from "three";
import * as util from "./util.js";


export class CGCars {
  constructor(scene, config, modelLoader, assetPath, cityWidth) {
    this.scene = scene;
    this.config = config;
    this.cityWidth = cityWidth;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;
    this.allCarObjects = [];

    this.allStartPts = [];

    // build queue for starting points
    const gridSize = this.config.gridSize;
    for (let i = 0; i < (gridSize - 1) * (gridSize - 1); i++) {
      this.allStartPts.push(true);
    }

  }

  generateCars(mode) {
    this.generateCar();
  }

  generateCar() {
    for (let i = 0; i < 50 ; i++) {
      if (this.allStartPts.length !== 0) {
        this.modelLoader.load(this.assetPath.SMALL_CAR, this.onSmallCarLoad);
        console.log(this.allStartPts.length);
      }
    }
    //this.modelLoader.load(this.assetPath.MINI_BUS, this.onMiniBusLoad);
  }

  onSmallCarLoad = (obj) => {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const gridSize = this.config.gridSize;

    let car = obj;
    const box = new THREE.Box3().setFromObject(car);
    const originSize = box.max.sub(box.min);
    util.resizeObject(car, originSize.x * 0.05 * roadWidth, originSize.z * 0.05 * roadWidth, originSize.y * 0.05 * roadWidth);

    const c = car.clone();

    //let startPts = this.allStartPts.pop();

    let i; //gridSize / 2;
    let j; //gridSize / 2;

    while (true) {
      i = Math.floor(Math.random() * (gridSize - 1));
      j = Math.floor(Math.random() * (gridSize - 1));
      if (this.allStartPts[i * (gridSize - 1) + j]) {
        this.allStartPts[i * (gridSize - 1) + j] = false;
        break;
      }
    }


    console.log(i);

    const blockX = this.getBlockXCoordinate(i);
    const blockZ = this.getBlockZCoordinate(j);


    const offset = blockWidth / 2.0 + roadWidth / 2.8;

    if (Math.random() < 0.5) {
      c.position.set(
        blockX + offset,
        originSize.y * 0.05 * roadWidth,
        blockZ
      );
    }
    else {
      var axis = new THREE.Vector3(0., 0., 1.);
      c.rotateOnAxis(axis, Math.PI / 2);

      c.position.set(
        blockX,
        originSize.y * 0.05 * roadWidth,
        blockZ + offset
      );
    }

    this.addToScene(c);
  }

  onMiniBusLoad = (obj) => {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const roadHeight = this.config.roadHeight;
    const gridSize = this.config.gridSize;

    let car = obj;
    const box = new THREE.Box3().setFromObject(car);
    const originSize = box.max.sub(box.min);
    util.resizeObject(car, originSize.x * 10 * roadWidth, originSize.y * 10 * roadWidth, originSize.z * 10 * roadWidth);

    const c = car.clone();
    c.position.set(
      roadWidth / 8,
      roadHeight + 1,
      0
    );
    this.addToScene(c);
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

  destoryCars() {
    if (this.gen) {
      this.gen = false;
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
  }

  addToScene(object) {
    this.allCarObjects.push(object.uuid);
    this.scene.add(object);
  }


  update(elapsedTime) {
  }
}
