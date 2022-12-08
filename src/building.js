import * as THREE from "three";
import { map, first, forkJoin, combineLatest } from "rxjs";
import { getRandomElement, reCenterObj, resizeObject } from "./util";

export class CGBuildingGenerator {
  constructor(config, modelLoader, assetPath) {
    this.config = config;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;
  }

  generateRandomBuilding(level) {
    const baseLoaded$ = this.modelLoader
      .load(getRandomElement(this.assetPath.BUILDING.BASE))
      .pipe(first());
    const roofLoaded$ = this.modelLoader
      .load(getRandomElement(this.assetPath.BUILDING.ROOF))
      .pipe(first());

    const bodies = [];
    for (let i = 1; i < level; i++) {
      bodies.push(
        this.modelLoader.load(getRandomElement(this.assetPath.BUILDING.BODY))
      );
    }

    return combineLatest(baseLoaded$, roofLoaded$, ...bodies).pipe(
      map(this.composeBuilding)
    );
  }

  composeBuilding = ([b, r, ...bodies]) => {
    const base = b.clone();
    const roof = r.clone();

    const building = new THREE.Group();

    // base
    resizeObject(
      base,
      this.buildingComponentWidth,
      this.buildingComponentWidth,
      this.config.buildingLevelHeight
    );
    const baseSize = new THREE.Box3()
      .setFromObject(base)
      .getSize(new THREE.Vector3());
    reCenterObj(base);
    base.position.add(new THREE.Vector3(0, baseSize.y / 2, 0));
    building.add(base);

    // bodies
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i].clone();
      resizeObject(
        body,
        this.buildingComponentWidth,
        this.buildingComponentWidth,
        this.config.buildingLevelHeight
      );
      reCenterObj(body);
      body.position.add(
        new THREE.Vector3(
          0,
          baseSize.y +
            i * this.config.buildingLevelHeight +
            this.config.buildingLevelHeight / 2,
          0
        )
      );
      building.add(body);
    }

    // roof
    resizeObject(
      roof,
      this.buildingComponentWidth,
      this.buildingComponentWidth,
      this.config.buildingLevelHeight
    );
    const roofSize = new THREE.Box3()
      .setFromObject(base)
      .getSize(new THREE.Vector3());
    reCenterObj(roof);
    roof.position.add(
      new THREE.Vector3(
        0,
        baseSize.y +
          this.config.buildingLevelHeight * bodies.length +
          roofSize.y / 2,
        0
      )
    );
    building.add(roof);

    return building;
  };

  get buildingComponentWidth() {
    return this.config.blockWidth - 2 * this.config.buildingPadding;
  }
}
