import * as THREE from "three";
import { map, first, combineLatest } from "rxjs";
import {
  getRandomElement,
  reCenterObj,
  resizeObject,
  setModelColor,
} from "./util";

const ONE_LEVEL_BUILDING_COLORS = [
  new THREE.Color(0x99e1d9),
  new THREE.Color(0xf7f17e),
  new THREE.Color(0xb2e4db),
];

const MULTI_LEVEL_BUILDING_COLORS = [
  new THREE.Color("rgb(112, 101, 99)"),
  new THREE.Color("rgb(116, 131, 134)"),
  new THREE.Color("rgb(242, 239, 234)"),
  new THREE.Color("rgb(239, 131, 84)"),
  new THREE.Color("rgb(216, 247, 147)"),
];

export class CGBuildingGenerator {
  constructor(config, modelLoader, assetPath) {
    this.config = config;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;
  }

  generateRandomBuilding(level) {
    if (level == 1) {
      const randomModelConfig = getRandomElement(
        this.assetPath.BUILDING.ONE_LEVEL
      );
      return this.modelLoader.load(randomModelConfig.path).pipe(
        map((obj) => {
          const building = obj.clone();

          this.resizeAndRecenter(
            building,
            this.buildingComponentWidth,
            this.buildingComponentWidth,
            this.config.buildingLevelHeight
          );

          setModelColor(
            randomModelConfig,
            building,
            getRandomElement(ONE_LEVEL_BUILDING_COLORS)
          );
          return building;
        })
      );
    }

    // return a multi-level building
    const baseConfig = getRandomElement(this.assetPath.BUILDING.BASE);
    const bodyConfig = getRandomElement(this.assetPath.BUILDING.BODY);
    const roofConfig = getRandomElement(this.assetPath.BUILDING.ROOF);
    const baseLoaded$ = this.modelLoader.load(baseConfig.path).pipe(first());
    const bodyLoaded$ = this.modelLoader.load(bodyConfig.path).pipe(first());
    const roofLoaded$ = this.modelLoader.load(roofConfig.path).pipe(first());

    return combineLatest(baseLoaded$, roofLoaded$, bodyLoaded$).pipe(
      map(([originBase, originRoof, originBody]) =>
        this.composeMultiLevelBuilding(
          originBase,
          baseConfig,
          originBody,
          bodyConfig,
          originRoof,
          roofConfig,
          level
        )
      )
    );
  }

  resizeAndRecenter(obj, width, length, height) {
    resizeObject(obj, width, length, height);
    reCenterObj(obj);
  }

  composeMultiLevelBuilding = (
    originBase,
    baseConfig,
    originBody,
    bodyConfig,
    originRoof,
    roofConfig,
    level
  ) => {
    const base = originBase.clone();
    const roof = originRoof.clone();

    const building = new THREE.Group();
    const buildingColor = getRandomElement(MULTI_LEVEL_BUILDING_COLORS);

    // base
    this.resizeAndRecenter(
      base,
      this.buildingComponentWidth,
      this.buildingComponentWidth,
      this.config.buildingLevelHeight
    );
    base.position.add(
      new THREE.Vector3(0, this.config.buildingLevelHeight * 0.5, 0)
    );
    setModelColor(baseConfig, base, buildingColor);
    building.add(base);

    // bodies
    const bodyNum = level - 1;
    for (let i = 0; i < bodyNum; i++) {
      const b = originBody.clone();
      this.resizeAndRecenter(
        b,
        this.buildingComponentWidth,
        this.buildingComponentWidth,
        this.config.buildingLevelHeight
      );
      b.position.add(
        new THREE.Vector3(0, (i + 1 + 0.5) * this.config.buildingLevelHeight, 0)
      );
      setModelColor(bodyConfig, b, buildingColor);
      building.add(b);
    }

    if (Math.random() > this.config.buildingRoofProb) {
      reCenterObj(building);
      return building;
    }

    // roof
    this.resizeAndRecenter(
      roof,
      this.buildingComponentWidth,
      this.buildingComponentWidth,
      this.config.buildingLevelHeight
    );
    roof.position.add(
      new THREE.Vector3(
        0,
        this.config.buildingLevelHeight * (bodyNum + 1 + 0.5),
        0
      )
    );
    setModelColor(roofConfig, roof, buildingColor);
    building.add(roof);

    reCenterObj(building);
    return building;
  };

  get buildingComponentWidth() {
    return this.config.blockWidth - 2 * this.config.buildingPadding;
  }
}
