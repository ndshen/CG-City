import * as THREE from "three";
import { cityWidth } from "./config.js";

export class CGCityCopy {
  constructor(scene, city, offsetX, offsetZ) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetZ = offsetZ;

    this.objects = [];
    this.copyCity(city);
  }

  copyCity(city) {
    // destroy current copy if necessary
    this.hideCity();
    this.objects = [];

    city.objects.forEach((object) => {
      const objectCopy = object.clone();

      objectCopy.position.add(new THREE.Vector3(this.offsetX, 0, this.offsetZ));

      // don't draw things too far away
      if (
        Math.abs(objectCopy.position.x) < cityWidth() &&
        Math.abs(objectCopy.position.z) < cityWidth()
      ) {
        this.objects.push(objectCopy);
      }

      //this.objects.push(objectCopy);
    });
  }

  showCity() {
    this.objects.map((object) => {
      this.scene.add(object);
    });
  }

  hideCity() {
    this.objects.map((object) => {
      this.scene.remove(object);
    }); // remove objects from scene but keep cached copies
  }
}
