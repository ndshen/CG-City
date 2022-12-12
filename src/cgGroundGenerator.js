import { map, first } from "rxjs";
import {
  getRandomElement,
  reCenterObj,
  resizeObjectWithYAxisUp,
  resizeObject,
} from "./util";

const GROUND_OPTIONS = ["PARK", "PARKING_LOT", "CHRISTMAS_TREE"];

export class CGGroundGenerator {
  constructor(config, modelLoader, assetPath) {
    this.config = config;
    this.modelLoader = modelLoader;
    this.assetPath = assetPath;
  }

  generateRandomGround() {
    return this.modelLoader
      .load(this.assetPath.GROUND[getRandomElement(GROUND_OPTIONS)])
      .pipe(map(this.preprocess), first());
  }

  preprocess = (obj) => {
    let object = obj;
    console.log(obj.name);
    if (object.name == "Tree_1") {
      object = this.preprocessPark(object);
    } else if (object.name == "Parking_lot_block") {
      object = this.preprocessParkingLot(object);
    } else if (object.name == "Low_poly_clouds_1") {
      object = this.preprocessChristmasTree(object);
    }
    return object;
  };

  preprocessPark = (obj) => {
    const park = obj.parent.clone();
    resizeObjectWithYAxisUp(
      park,
      this.config.blockWidth,
      this.config.blockWidth,
      10
    );
    reCenterObj(park);
    return park;
  };

  preprocessParkingLot = (obj) => {
    const parkingLot = obj.clone();
    resizeObject(parkingLot, this.config.blockWidth, this.config.blockWidth, 5);
    reCenterObj(parkingLot);

    console.log(parkingLot);
    return parkingLot;
  };

  preprocessChristmasTree = (obj) => {
    const christmasTree = obj.parent.clone();
    console.log(obj);
    resizeObjectWithYAxisUp(
      christmasTree,
      this.config.blockWidth,
      this.config.blockWidth,
      20
    );
    reCenterObj(christmasTree);
    return christmasTree;
  };
}
