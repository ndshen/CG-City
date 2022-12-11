import * as THREE from "three";
import { cityWidth } from "./config.js";

export class CGSky {
  constructor(scene) {
    this.scene = scene;

    this.skyLoaded = false;
    this.skyType = -1;
  }

  updateSkyType(skyType) {
    this.skyType = skyType;
    if (this.skyLoaded) {
      this.scene.remove(this.skyMesh);
      this.showSky();
    }
  }

  showSky() {
    if (!this.skyGeometry) {
      //this.skyGeometry = new THREE.SphereGeometry(cityWidth() * 0.75 * 3);
      this.skyGeometry = new THREE.BoxGeometry(
        cityWidth() * 2,
        300,
        cityWidth() * 2
      );
    }

    let skyTexturePath = "textures/sky/clearSky.png";
    switch (this.skyType) {
      case -1:
        skyTexturePath = "textures/sky/clearSky.png";
        break;
      case 0:
        skyTexturePath = "textures/sky/snowySky.png";
        break;
      case 1:
        skyTexturePath = "textures/sky/rainySky.png";
        break;
    }

    let loader = new THREE.TextureLoader(),
      texture = loader.load(skyTexturePath);

    this.skyMaterial = new THREE.MeshBasicMaterial({ map: texture });
    this.skyMaterial.side = THREE.BackSide;
    this.skyMesh = new THREE.Mesh(this.skyGeometry, this.skyMaterial);

    this.scene.add(this.skyMesh);
    this.skyLoaded = true;
  }

  hideSky() {
    if (this.skyLoaded) {
      this.skyMaterial.dispose();
      this.scene.remove(this.skyMesh);
      this.skyLoaded = false;
    }
  }
}
