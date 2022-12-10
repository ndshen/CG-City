import * as THREE from "three";
import * as util from "./util.js";

export class CGTraffic {
  constructor(scene, config, modelLoader, assetPath, cityWidth) {
    this.scene = scene;
    this.config = config;
    this.cityWidth = cityWidth;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;

    this.allCarObjectIds = [];
    this.allCarObjects = [];
    this.movingDirs = [];
    this.allStartPts = [];
    this.gens = [];
    this.lightGens = [];
    this.speeds = [];
    this.trafficLights = [];
    this.isBlock = [];
    this.lightObjRAs = [];
    this.lightObjRBs = [];
    this.lightObjCAs = [];
    this.lightObjCBs = [];
    /**
     * Row:
     * green: 0-99, yellow: 100-119, red: 120-239
     * Column:
     * green: 120-219, yellow: 220-239, red: 0-119
     * */
    this.trafficMod = 500;
    this.rowGreen = 150;
    this.rowYellow = 250;
    this.rowRed = 500;
  }

  init() {
    this.count = Math.min(100, (this.config.gridSize - 1) * (this.config.gridSize - 1));
    this.gen = false;
    this.ryg = [0xff0000, 0xffff00, 0x00ff00];

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
    for (let i = 0; i < this.cityWidth; i++) {
      const j = i % (this.config.roadWidth + this.config.blockWidth);
      if (j < this.config.blockWidth) {
        this.isBlock.push(
          Math.floor(i / (this.config.roadWidth + this.config.blockWidth))
        );
      } else {
        this.isBlock.push(-1);
      }
    }
  }

  generateTrafficLights() {
    this.modelLoader
      .load(this.assetPath.ROAD.TRAFFIC_LIGHT)
      .subscribe(this.onTrafficLightLoad);
  }

  onTrafficLightLoad = (obj) => {
    const blockWidth = this.config.blockWidth;
    const roadWidth = this.config.roadWidth;
    const gridSize = this.config.gridSize;

    let tLight = obj.clone();
    const box = new THREE.Box3().setFromObject(obj);
    const originSize = box.max.sub(box.min);
    util.resizeObject(
      tLight,
      originSize.x * roadWidth * 10,
      originSize.z * roadWidth * 10,
      originSize.y * roadWidth * 10
    );
    this.lightHeight = originSize.y * roadWidth * 10;
    let l = tLight.clone();

    /*
     * group objects
     *
     */
    var group = new THREE.Group();
    group.position.set(0, 0, 0);
    group.add(l);

    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const blockX = this.getBlockXCoordinate(i);
        const blockZ = this.getBlockZCoordinate(j);
        let lightRA = group.clone();
        /*
         * Row
         */
        // red
        lightRA.add(
          this.getSphere(-0.1, this.lightHeight - 0.65, 0.2, 0x808080)
        );
        // yellow
        lightRA.add(
          this.getSphere(-0.1, this.lightHeight - 1.82, 0.2, 0x808080)
        );
        // green
        lightRA.add(
          this.getSphere(-0.1, this.lightHeight - 2.95, 0.2, 0x808080)
        );
        lightRA.position.set(
          blockX + blockWidth * 0.7,
          0,
          blockZ + blockWidth * 0.7
        );

        let lightRB = group.clone();
        // red
        lightRB.add(
          this.getSphere(-0.1, this.lightHeight - 0.65, 0.2, 0x808080)
        );
        // yellow
        lightRB.add(
          this.getSphere(-0.1, this.lightHeight - 1.82, 0.2, 0x808080)
        );
        // green
        lightRB.add(
          this.getSphere(-0.1, this.lightHeight - 2.95, 0.2, 0x808080)
        );
        var axis = new THREE.Vector3(0, 1, 0);
        lightRB.rotateOnAxis(axis, Math.PI);
        lightRB.position.set(
          blockX + blockWidth * 0.7 + roadWidth * 0.6,
          0,
          blockZ + blockWidth * 0.7 + roadWidth * 0.6
        );

        this.lightObjRAs.push(lightRA);
        this.lightObjRBs.push(lightRB);

        this.scene.add(lightRA);
        this.scene.add(lightRB);
        /*
         * Column
         */
        // red
        let lightCA = group.clone();
        lightCA.add(
          this.getSphere(-0.1, this.lightHeight - 0.65, 0.2, 0x808080)
        );
        // yellow
        lightCA.add(
          this.getSphere(-0.1, this.lightHeight - 1.82, 0.2, 0x808080)
        );
        // green
        lightCA.add(
          this.getSphere(-0.1, this.lightHeight - 2.95, 0.2, 0x808080)
        );
        var axis = new THREE.Vector3(0, 1, 0);
        lightCA.rotateOnAxis(axis, -Math.PI / 2);
        lightCA.position.set(
          blockX + blockWidth * 0.7 + roadWidth * 0.6,
          0,
          blockZ + blockWidth * 0.7
        );

        let lightCB = group.clone();
        // red
        lightCB.add(
          this.getSphere(-0.1, this.lightHeight - 0.65, 0.2, 0x808080)
        );
        // yellow
        lightCB.add(
          this.getSphere(-0.1, this.lightHeight - 1.82, 0.2, 0x808080)
        );
        // green
        lightCB.add(
          this.getSphere(-0.1, this.lightHeight - 2.95, 0.2, 0x808080)
        );

        lightCB.rotateOnAxis(axis, Math.PI / 2);
        lightCB.position.set(
          blockX + blockWidth * 0.7,
          0,
          blockZ + blockWidth * 0.7 + roadWidth * 0.6
        );

        this.lightObjCAs.push(lightCA);
        this.lightObjCBs.push(lightCB);

        this.scene.add(lightCA);
        this.scene.add(lightCB);

        this.lightGens.push(true);
      }
    }
  };

  getSphere(x, y, z, color) {
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 10, 10),
      new THREE.MeshBasicMaterial({ color: color })
    );
    sphere.position.set(x, y, z);
    return sphere;
  }

  generateTraffic(mode) {
    this.generateTrafficLights();
    this.modelLoader
      .load(this.assetPath.SMALL_CAR)
      .subscribe(this.generateCars);
    this.gen = true;
  }

  allGenerates() {
    const carsCond = this.gens.length == this.count;
    const lightsCond =
      this.lightGens.length ==
      (this.config.gridSize - 1) * (this.config.gridSize - 1);
    return carsCond && lightsCond;
  }

  generateCars = (obj) => {
    const roadWidth = this.config.roadWidth;

    let car = obj.clone();
    const box = new THREE.Box3().setFromObject(obj);
    const originSize = box.max.sub(box.min);
    util.resizeObject(
      car,
      originSize.x * 0.05 * roadWidth,
      originSize.z * 0.05 * roadWidth,
      originSize.y * 0.05 * roadWidth
    );
    this.maxCarSize =
      Math.max(originSize.x, originSize.z, originSize.y) * 0.05 * roadWidth;
    for (let i = 0; i < this.count; i++) {
      if (i < this.allStartPts.length) {
        car.children[10].material = new THREE.MeshBasicMaterial({ color:  0x000000});
        const c = car.clone();
        if (Math.random() < 0.25)
          c.children[10].material.color.setHex(0x1ffe01);
        else if (Math.random() < 0.5)
          c.children[10].material.color.setHex(0x6361ac);
        else if (Math.random() < 0.75)
          c.children[10].material.color.setHex(0xbf8523);
        else 
          c.children[10].material.color.setHex(0xebead9);
        this.onSmallCarLoad(c, originSize);
      }
    }
  };

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
        var axis = new THREE.Vector3(0, 0, 1);
        c.rotateOnAxis(axis, Math.PI);
        c.position.set(
          blockX + offset + +roadWidth / 3.5,
          originSize.y * 0.5, //* roadWidth,
          blockZ
        );
        this.movingDirs.push(2);
      }
    } else {
      if (Math.random() < 0.5) {
        // rotate car object so that it faces to the moving direction
        var axis = new THREE.Vector3(0, 0, 1);
        c.rotateOnAxis(axis, Math.PI / 2);

        c.position.set(
          blockX,
          originSize.y * 0.5, //* roadWidth,
          blockZ + offset + roadWidth / 3.5
        );
        this.movingDirs.push(1);
      } else {
        // rotate car object so that it faces to the moving direction
        var axis = new THREE.Vector3(0, 0, 1);
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
    return (Math.random() + 1) * 0.35;
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

  destoryTraffic() {
    if (this.gen) {
      this.gen = false;
      for (let i = 0; i < this.count; i++) {
        if (this.gens[i]) {
          this.scene.remove(this.allCarObjects[i]);
        }
      }

      for (
        let i = 0;
        i < (this.config.gridSize - 1) * (this.config.gridSize - 1);
        i++
      ) {
        if (this.lightGens[i]) {
          this.scene.remove(this.lightObjCAs[i]);
          this.scene.remove(this.lightObjCBs[i]);
          this.scene.remove(this.lightObjRAs[i]);
          this.scene.remove(this.lightObjRBs[i]);
        }
      }
    }
    this.gen = false;
    this.allCarObjectIds = [];
    this.allCarObjects = [];
    this.movingDirs = [];
    this.allStartPts = [];
    this.gens = [];
    this.lightGens = [];
    this.speeds = [];
    this.trafficLights = [];
    this.isBlock = [];
    this.lightObjRAs = [];
    this.lightObjRBs = [];
    this.lightObjCAs = [];
    this.lightObjCBs = [];
    this.ryg = [];
  }

  addToScene(object) {
    this.allCarObjectIds.push(object.uuid);
    this.allCarObjects.push(object);
    this.scene.add(object);
  }

  update(elapsedTime) {
    /**
     * Change light of traffic lights
     *
     * */
    for (let i = 0; i < this.config.gridSize - 1; i++) {
      for (let k = 0; k < this.config.gridSize - 1; k++) {
        // Row
        let curLights = this.trafficLights[k];
        let l = -1;
        if (curLights < this.rowGreen) l = 2;
        else if (curLights >= this.rowYellow) l = 0;
        else l = 1;
        let idx = i * (this.config.gridSize - 1) + k;
        for (let j = 0; j < 3; j++) {
          if (l == j) {
            //  console.log(this.lightObjCAs[i]);
            this.lightObjRAs[idx].children[j + 1].material.color.setHex(
              this.ryg[j]
            );
            this.lightObjRBs[idx].children[j + 1].material.color.setHex(
              this.ryg[j]
            );
          } else {
            this.lightObjRAs[idx].children[j + 1].material.color.setHex(
              0x808080
            );
            this.lightObjRBs[idx].children[j + 1].material.color.setHex(
              0x808080
            );
          }
        }

        //Col
        curLights = this.trafficLights[k];
        l = -1;
        if (
          curLights >= this.rowYellow &&
          curLights < this.rowYellow + this.rowGreen
        )
          l = 2;
        else if (curLights < this.rowYellow) l = 0;
        else l = 1;
        idx = i * (this.config.gridSize - 1) + k;
        for (let j = 0; j < 3; j++) {
          if (l == j) {
            //  console.log(this.lightObjCAs[i]);
            this.lightObjCAs[idx].children[j + 1].material.color.setHex(
              this.ryg[j]
            );
            this.lightObjCBs[idx].children[j + 1].material.color.setHex(
              this.ryg[j]
            );
          } else {
            this.lightObjCAs[idx].children[j + 1].material.color.setHex(
              0x808080
            );
            this.lightObjCBs[idx].children[j + 1].material.color.setHex(
              0x808080
            );
          }
        }
      }
    }

    /**
     * Check traffic lights
     * */
    for (let i = 0; i < this.count; i++) {
      const x = this.allCarObjects[i].position.x;
      const z = this.allCarObjects[i].position.z;
      // re-initlalize speed for stopping car
      if (this.speeds[i] == 0) this.speeds[i] = this.getSpeed();
      if (this.movingDirs[i] == 0) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(z + this.cityWidth * 0.5)];
        const nextBlock =
          this.isBlock[Math.ceil(z + this.speeds[i] + this.cityWidth * 0.5)];
        const curLights = this.trafficLights[curBlock];
        if (
          !(
            curBlock < 0 ||
            curBlock == this.config.gridSize - 1 ||
            curBlock == nextBlock ||
            curLights < this.rowGreen
          )
        )
          this.speeds[i] = 0;
      } else if (this.movingDirs[i] == 1) {
        // stop car by traffic lights
        const curBlock = this.isBlock[Math.ceil(x + this.cityWidth * 0.5)];
        const nextBlock =
          this.isBlock[Math.ceil(x + this.speeds[i] + this.cityWidth * 0.5)];
        const curLights = this.trafficLights[
          this.isBlock[Math.ceil(z + this.cityWidth * 0.5 - this.config.roadWidth)]
        ]
        if (
          !(
            curBlock < 0 ||
            curBlock == this.config.gridSize - 1 ||
            curBlock == nextBlock ||
            (curLights >= this.rowYellow &&
              curLights < this.rowGreen + this.rowYellow)
          )
        )
          this.speeds[i] = 0;
      } else if (this.movingDirs[i] == 2) {
        // stop car by traffic lights
        const curBlock =
          this.isBlock[
            Math.ceil(z + this.cityWidth * 0.5 - this.maxCarSize * 1.2)
          ];
        const nextBlock =
          this.isBlock[
            Math.ceil(
              z - this.speeds[i] + this.cityWidth * 0.5 - this.maxCarSize * 1.2
            )
          ];
        const curLights = this.trafficLights[curBlock - 1];
        if (
          !(curBlock <= 0 || curBlock == nextBlock || curLights < this.rowGreen)
        )
          this.speeds[i] = 0;
      } else if (this.movingDirs[i] == 3) {
        // stop car by traffic lights
        const curBlock =
          this.isBlock[
            Math.ceil(x + this.cityWidth * 0.5 - this.maxCarSize * 1.2)
          ];
        const nextBlock =
          this.isBlock[
            Math.ceil(
              x - this.speeds[i] + this.cityWidth * 0.5 - this.maxCarSize * 1.2
            )
          ];
        const curLights = this.trafficLights[
          this.isBlock[Math.ceil(z + this.cityWidth * 0.5 - this.config.roadWidth)]
        ]
        if (
          !(
            curBlock <= 0 ||
            curBlock == nextBlock ||
            (curLights >= this.rowYellow &&
              curLights < this.rowGreen + this.rowYellow)
          )
        )
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
          if (
            j == i ||
            Math.abs(x - this.allCarObjects[j].position.x) > 0.00001 ||
            z > this.allCarObjects[j].position.z
          )
            continue;
          if (
            z + this.speeds[i] >=
            this.allCarObjects[j].position.z - this.maxCarSize * 1.5
          ) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i], this.allCarObjects[j].position.z - z);
          }
        }
      } else if (this.movingDirs[i] == 1) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.x + this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if (
            j == i ||
            z != this.allCarObjects[j].position.z ||
            x > this.allCarObjects[j].position.x
          )
            continue;
          if (
            x + this.speeds[i] >=
            this.allCarObjects[j].position.x - this.maxCarSize * 1.5
          ) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i], this.allCarObjects[j].position.x - x);
          }
        }
      } else if (this.movingDirs[i] == 2) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.z - this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if (
            j == i ||
            Math.abs(x - this.allCarObjects[j].position.x) > 0.00001 ||
            z < this.allCarObjects[j].position.z
          )
            continue;
          if (
            z - this.speeds[i] <=
            this.allCarObjects[j].position.z + this.maxCarSize * 1.5
          ) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i], z - this.allCarObjects[j].position.z);
          }
        }
      } else if (this.movingDirs[i] == 3) {
        /*
         * position after moving
         * console.log(this.allCarObjects[i].position.x - this.speeds[i]);
         */
        for (let j = 0; j < this.count; j++) {
          if (
            j == i ||
            z != this.allCarObjects[j].position.z ||
            x < this.allCarObjects[j].position.x
          )
            continue;
          if (
            x - this.speeds[i] <=
            this.allCarObjects[j].position.x + this.maxCarSize * 1.5
          ) {
            // car[i] a little bit slower
            this.speeds[i] = Math.min(0.8 * this.speeds[j], this.speeds[i], x - this.allCarObjects[j].position.x);
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
