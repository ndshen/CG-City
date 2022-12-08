import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BehaviorSubject, shareReplay, map, filter } from "rxjs";

export const gltfAssetPath = {
  SMALL_CAR: "vehicleAssets/small car 2 gltf/smallCar2.gltf",
  MINI_BUS: "vehicleAssets/minibus gltf/minibus.gltf",
  ROAD: {
    STRAIGHT_ROAD: "roadAssets/straightroadPath/assets.gltf",
    CROSS_ROAD: "roadAssets/Fourway cross gltf/CG-City Assets.gltf",
  },
  BUILDING: {
    BASE: [
      "Building assets/1 Building base gltf/1buildingbase.gltf",
      "Building assets/2 building base gltf/2buildingbase2.gltf",
      "Building assets/3 building base gltf/3buildingbase.gltf",
    ],
    BODY: [
      "Building assets/1 building body gltf/1buildingbody.gltf",
      "Building assets/2 building body gltf/2buildingbody2.gltf",
      //"Building assets/3 building body gltf/3buildingbody.gltf",
    ],
    ROOF: [
      "Building assets/1 building roof gltf/1buildingroof.gltf",
      //"Building assets/2 building roof gltf/2buildingroof.gltf",
    ],
    ROOF: [
      "Building assets/1 building roof gltf/1buildingroof.gltf",
    ],
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
      this.cache.set(
        filePath,
        loaded$.pipe(
          filter(Boolean),
          map(this.fetchObjectFromGLTF),
          shareReplay(1)
        )
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

    return this.cache.get(filePath).asObservable();
  }

  fetchObjectFromGLTF(gltf) {
    return gltf.scene.children[0];
  }
}
