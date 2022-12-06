import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BehaviorSubject, shareReplay, map, filter } from "rxjs";

export const gltfAssetPath = {
  SMALL_CAR: "vehicleAssets/small car 2 gltf/smallCar2.gltf",
  MINI_BUS: "vehicleAssets/minibus gltf/minibus.gltf",
  ROAD: {
    STRAIGHT_ROAD: "roadAssets/straightroadPath/assets.gltf",
    CROSS_ROAD: "roadAssets/Fourway cross gltf/CG-City Assets.gltf",
  },
};

export class gltfLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }

  load(filePath) {
    if (!this.cache.has(filePath)) {
      const loaded$ = new BehaviorSubject(null);
      this.cache[filePath] = loaded$.pipe(
        filter(Boolean),
        map(this.fetchObjectFromGLTF),
        shareReplay(1)
      );

      this.loader.load(
        filePath,
        (gltf) => {
          console.log("success");
          console.log(gltf);

          loaded$.next(gltf);
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

    return this.cache[filePath].asObservable();
  }

  fetchObjectFromGLTF(gltf) {
    return gltf.scene.children[0];
  }
}
