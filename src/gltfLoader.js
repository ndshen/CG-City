import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const gltfAssetPath = {
  STRAIGHT_ROAD: "roadAssets/straightroadPath/assets.gltf",
  CROSS_ROAD: "roadAssets/Fourway cross gltf/CG-City Assets.gltf",
  SMALL_CAR: "vehicleAssets/small car 2 gltf/smallCar2.gltf",
  MINI_BUS: "vehicleAssets/minibus gltf/minibus.gltf",
};

export class gltfLoader {
  constructor() {
    this.loader = new GLTFLoader();
  }

  load(filePath, callback) {
    this.loader.load(
      filePath,
      (gltf) => {
        console.log("success");
        console.log(gltf);
        callback(gltf.scene.children[0]);
      },
      (progress) => {
        console.log("progress");
        console.log(progress);
      },
      (error) => {
        console.log("error");
        console.log(error);
      }
    );
  }
}
