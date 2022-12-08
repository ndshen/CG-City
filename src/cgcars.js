import * as THREE from "three";
import * as util from "./util.js";


export class CGCars {
  constructor(scene, config, modelLoader, assetPath, cityWidth) {
    this.scene = scene;
    this.config = config;
    this.cityWidth = cityWidth;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;
    this.count = 200;

    this.allCarObjectIds = [];
    this.allCarObjects = [];
    this.movingDirs = [];
    this.allStartPts = [];
    this.gens = [];
    this.gen = false;
    this.speeds = [];
    this.trafficLights = [];
    this.isBlock = [];
    /**
     * Row:
     * green: 0-99, yellow: 100-119, red: 120-239
     * Column: 
     * green: 120-219, yellow: 220-239, red: 0-119
     * */
    this.trafficMod = 260;
    this.rowGreen = 100;
    this.rowYellow = 130;
    this.rowRed = 260;

    // build queue for starting points
    const gridSize = this.config.gridSize;
    for (let i = 0; i < (gridSize - 1) * (gridSize - 1); i++) {
      this.allStartPts.push(true);
    }

    // build traffic lights
    for (let i = 0; i < gridSize; i++) {
      this.trafficLights.push(Math.random() * this.trafficMod);
    }

    // build block and road map
    for (let i = 0; i < cityWidth; i++) {
      const j = i % (config.roadWidth + config.blockWidth);
      if (j < config.blockWidth) {
        this.isBlock.push(Math.floor(i / (config.roadWidth + config.blockWidth)));
      }
      else {
        this.isBlock.push(-1);
      }
    }
  }

  generateAllCars(mode) {
    this.modelLoader.load(this.assetPath.SMALL_CAR).subscribe(this.generateCars);
    this.gen = true;
  }

  allGenerates() {
    let gen = true;
    for (let i = 0; i < this.count; i++) {
      gen &= this.gens[i];
    }
    return gen;
  }

  generateCars = (obj) => {
    const roadWidth = this.config.roadWidth;

    let car = obj;
    const box = new THREE.Box3().setFromObject(car);
    const originSize = box.max.sub(box.min);
    util.resizeObject(car, originSize.x * 0.05 * roadWidth, originSize.z * 0.05 * roadWidth, originSize.y * 0.05 * roadWidth);
    this.maxCarSize = Math.max(originSize.x, originSize.z, originSize.y) * 0.05 * roadWidth;
    for (let i = 0; i < this.count; i++) {
      if (i < this.allStartPts.length) {
        const c = car.clone();
        this.onSmallCarLoad(c, originSize);
      }
    }
  }

  onSmallCarLoad(c, originSize) {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const gridSize = this.config.gridSize;

    let i;
    let j;

    while (true) {
      i = Math.floor(Math.random() * (gridSize - 1));
      j = Math.floor(Math.random() * (gridSize - 1));
      if (this.allStartPts[i * (gridSize - 1) + j]) {
        this.allStartPts[i * (gridSize - 1) + j] = false;
        break;
      }
    }

    const blockX = this.getBlockXCoordinate(i);
    const blockZ = this.getBlockZCoordinate(j);

    const offset = blockWidth / 2.0 + roadWidth / 2.8;

    /**
     * pick column or row
     * each road has two lines and we always pick one line
     * */
    if (Math.random() < 0.5) {
      if (Math.random() < 0.5) {
        c.position.set(
          blockX + offset,
          originSize.y * 0.5, // * roadWidth,
          blockZ
        );
        this.movingDirs.push(0);
      } else {
        // rotate car object so that it faces to the moving direction
        var axis = new THREE.Vector3(0., 0., 1.);
        c.rotateOnAxis(axis, Math.PI);
        c.position.set(
          blockX + offset + + roadWidth / 3.5,
          originSize.y * 0.5, //* roadWidth,
          blockZ
        );
        this.movingDirs.push(2);
      }
    }
    else {
      if (Math.random() < 0.5) {
        // rotate car object so that it faces to the moving direction
        var axis = new THREE.Vector3(0., 0., 1.);
        c.rotateOnAxis(axis, Math.PI / 2);

        c.position.set(
          blockX,
          originSize.y * 0.5, //* roadWidth,
          blockZ + offset + roadWidth / 3.5
        );
        this.movingDirs.push(1);
      }
      else {
        // rotate car object so that it faces to the moving direction
        var axis = new THREE.Vector3(0., 0., 1.);
        c.rotateOnAxis(axis, -Math.PI / 2);
        c.position.set(
          blockX,
          originSize.y * 0.5, // * roadWidth,
          blockZ + offset
        );
        this.movingDirs.push(3);
      }
    }
    this.addToScene(c);
    this.speeds.push(this.getSpeed());
    this.gens.push(true);
  }

  getSpeed() {
    return (Math.random() + 1) * 0.25; 
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
      for (let i = 0; i < this.count; i++) {
        if (this.gens[i]){
          this.allCarObjects[i].geometry.dispose();
          this.allCarObjects[i].material.dispose();
          this.scene.remove(this.allCarObjects[i]);
        }
      }
      //this.allCarObjects.map(this.removeObject);
      this.allCarObjects = [];
      this.allCarObjectIds = [];
      this.allStartPts = [];
      this.movingDirs = [];
      this.gens = [];
      this.speeds = [];
    }
  }

  addToScene(object) {
    this.allCarObjectIds.push(object.uuid);
    this.allCarObjects.push(object);
    this.scene.add(object);
  }

  update(elapsedTime) {

    /**
     * Check traffic lights
     * */
    for (let i = 0; i < this.count; i++) {
      const x = this.allCarObjects[i].position.x;
      const z = this.allCarObjects[i].position.z;
      // re-initlalize speed for stopping car
      if (this.speeds[i] == 0)
        this.speeds[i] = this.getSpeed();
      if (this.movingDirs[i] == 0) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(z + this.cityWidth * 0.5)];
        const nextBlock = this.isBlock[Math.ceil(z + this.speeds[i] + this.cityWidth * 0.5)];
        const curLights = this.trafficLights[curBlock];
        if (!(curBlock < 0 || curBlock == this.config.gridSize - 1 || curBlock == nextBlock || curLights < this.rowGreen))
          this.speeds[i] = 0;
      }
      else if (this.movingDirs[i] == 1) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(x + this.cityWidth * 0.5)];
        const nextBlock = this.isBlock[Math.ceil(x + this.speeds[i] + this.cityWidth * 0.5)];
        const curLights = this.trafficLights[curBlock];
        if (!(curBlock < 0 || curBlock == this.config.gridSize - 1 || curBlock == nextBlock ||
          (curLights >= this.rowYellow && curLights < this.rowGreen + this.rowYellow)))
          this.speeds[i] = 0;
      }
      else if (this.movingDirs[i] == 2) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(z + this.cityWidth * 0.5 - this.maxCarSize * 1.2)];
        const nextBlock = this.isBlock[Math.ceil(z - this.speeds[i] + this.cityWidth * 0.5 - this.maxCarSize * 1.2)];
        const curLights = this.trafficLights[curBlock - 1];
        if (!(curBlock <= 0 || curBlock == nextBlock || curLights < this.rowGreen))
          this.speeds[i] = 0;
      }
      else if (this.movingDirs[i] == 3) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(x + this.cityWidth * 0.5 - this.maxCarSize * 1.2)];
        const nextBlock = this.isBlock[Math.ceil(x - this.speeds[i] + this.cityWidth * 0.5 - this.maxCarSize * 1.2)];
        const curLights = this.trafficLights[curBlock - 1];
        if (!(curBlock <= 0 || curBlock == nextBlock ||
          (curLights >= this.rowYellow && curLights < this.rowGreen + this.rowYellow)))
          this.speeds[i] = 0;
      }
    }

    /*
     * check collision
     */
    for (let i = 0; i < this.count; i++) {
      const x = this.allCarObjects[i].position.x;
      const z = this.allCarObjects[i].position.z;
      if (this.movingDirs[i] == 0) {
        /*
        * position after moving
        * console.log(this.allCarObjects[i].position.z + this.speeds[i]);
        */
        for (let j = 0; j < this.count; j++) {
          if (j == i || Math.abs(x-this.allCarObjects[j].position.x)>0.00001 || (z > this.allCarObjects[j].position.z))
            continue;
          if ((z + this.speeds[i]) >= this.allCarObjects[j].position.z - this.maxCarSize * 1.5) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i]);
          }
        }
      }
      else if (this.movingDirs[i] == 1) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.x + this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if ((j == i) || (z != this.allCarObjects[j].position.z) || (x > this.allCarObjects[j].position.x))
            continue;
          if ((x + this.speeds[i]) >= this.allCarObjects[j].position.x - this.maxCarSize * 1.5) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i]);
          }
        }
      }
      else if (this.movingDirs[i] == 2) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.z - this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if ((j == i) || Math.abs(x - this.allCarObjects[j].position.x) > 0.00001 || (z < this.allCarObjects[j].position.z))
            continue;
          if ((z - this.speeds[i]) <= this.allCarObjects[j].position.z + this.maxCarSize * 1.5) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i]);
          }
        }
      }
      else if (this.movingDirs[i] == 3) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.x - this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if ((j == i) || (z != this.allCarObjects[j].position.z) || (x < this.allCarObjects[j].position.x))
            continue;
          if ((x - this.speeds[i]) <= this.allCarObjects[j].position.x + this.maxCarSize * 1.5) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i]);
          }
        }
      }

      // move forward
      this.allCarObjects[i].translateX(-this.speeds[i]);


      // boundary case
      if (Math.abs(this.allCarObjects[i].position.x) > this.cityWidth / 2) {
        this.allCarObjects[i].position.x = -this.allCarObjects[i].position.x;
      }
      if (Math.abs(this.allCarObjects[i].position.z) > this.cityWidth / 2) {
        this.allCarObjects[i].position.z = -this.allCarObjects[i].position.z;
      }
    }
    for (let i = 0; i < this.config.gridSize; i++) {
      this.trafficLights[i] = (this.trafficLights[i] + 1) % this.trafficMod;
    }
  }
}
