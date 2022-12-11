import * as THREE from "three";
import { cityWidth } from "./config.js";

export class CGTrafficCopy {
  constructor(scene, traffic, offsetX, offsetZ) {
    this.scene = scene;
    this.traffic = traffic;
    this.offsetX = offsetX;
    this.offsetZ = offsetZ;
    this.hidden = false;

    this.cars = [];
    this.lightObjRAs = [];
    this.lightObjRBs = [];
    this.lightObjCAs = [];
    this.lightObjCBs = [];

    this.copyWithOffset(this.traffic.allCarObjects, this.cars);
    this.copyWithOffset(this.traffic.lightObjRAs, this.lightObjRAs);
    this.copyWithOffset(this.traffic.lightObjRBs, this.lightObjRBs);
    this.copyWithOffset(this.traffic.lightObjCAs, this.lightObjCAs);
    this.copyWithOffset(this.traffic.lightObjCBs, this.lightObjCBs);
  }

  copyWithOffset(original, copy) {
    original.forEach((object) => {
      const objectCopy = object.clone();
      objectCopy.position.add(new THREE.Vector3(this.offsetX, 0, this.offsetZ));
      copy.push(objectCopy);
    });
  }

  showTraffic() {
    this.hidden = false;
    this.cars.map(this.showObject);
    this.lightObjRAs.map(this.showObject);
    this.lightObjRBs.map(this.showObject);
    this.lightObjCAs.map(this.showObject);
    this.lightObjCBs.map(this.showObject);
  }

  hideTraffic() {
    this.hidden = true;
    this.cars.map(this.hideObject);
    this.lightObjRAs.map(this.hideObject);
    this.lightObjRBs.map(this.hideObject);
    this.lightObjCAs.map(this.hideObject);
    this.lightObjCBs.map(this.hideObject);
  }

  showObject = (object) => {
    if (
      Math.abs(object.position.x) < cityWidth() &&
      Math.abs(object.position.z) < cityWidth()
    ) {
      this.scene.add(object);
    }
  };

  hideObject = (object) => {
    this.scene.remove(object);
  };

  updateTraffic() {
    if (this.hidden) {
      return;
    }

    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i].position.x =
        this.traffic.allCarObjects[i].position.x + this.offsetX;
      this.cars[i].position.z =
        this.traffic.allCarObjects[i].position.z + this.offsetZ;

      if (
        Math.abs(this.cars[i].position.x) > cityWidth() ||
        Math.abs(this.cars[i].position.z) > cityWidth()
      ) {
        this.scene.remove(this.cars[i]);
      } else {
        this.scene.add(this.cars[i]);
      }
    }
  }
}
