import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BehaviorSubject, shareReplay, map, filter } from "rxjs";
import * as THREE from "three";

export const gltfAssetPath = {
  SMALL_CAR: "vehicleAssets/small car 2 gltf/smallCar2.gltf",
  MINI_BUS: "vehicleAssets/minibus gltf/minibus.gltf",
  ROAD: {
    STRAIGHT_ROAD: "roadAssets/straightroadPath/assets.gltf",
    CROSS_ROAD: "roadAssets/Fourway cross gltf/CG-City Assets.gltf",
    TRAFFIC_LIGHT:
      "roadAssets/trafficLightNewNoLights/trafficLightNewNoLights.gltf",
  },
  BUILDING: {
    ONE_LEVEL: [
      {
        path: "Building assets/2 building base gltf/2buildingbase2.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
    ],
    BASE: [
      {
        path: "Building assets/1 Building base gltf/1buildingbase.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
      {
        path: "Building assets/3 building base gltf/3buildingbase.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
    ],
    BODY: [
      {
        path: "Building assets/1 building body gltf/1buildingbody.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
      {
        path: "Building assets/2 building body gltf/2buildingbody2.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
      {
        path: "Building assets/3buildingBodyNewWindowNoRoof/3buildingBodyNewWindowNoRoof.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[0].children[1].material = newMaterial;
        },
        upAxis: "y",
      },
      // {
      //   path: "Building assets/3 building body gltf/3buildingbody.gltf",
      //   setColor: function (obj, color) {
      //     const newMaterial = new THREE.MeshStandardMaterial();
      //     newMaterial.color = color;
      //     obj.children[0].material = newMaterial;
      //   },
      // },
    ],
    ROOF: [
      {
        path: "Building assets/1 building roof gltf/1buildingroof.gltf",
        setColor: function (obj, color) {
          const newMaterial = new THREE.MeshStandardMaterial();
          newMaterial.color = color;
          obj.children[1].children[0].material = newMaterial;
          obj.children[1].children[1].material = newMaterial;
        },
      },
      // {
      //   path: "Building assets/4buildingRoof/4buildingRoof.gltf",
      //   setColor: function (obj, color) {
      //     const newMaterial = new THREE.MeshStandardMaterial();
      //     newMaterial.color = color;
      //     obj.children[1].children[0].material = newMaterial;
      //     obj.children[1].children[1].material = newMaterial;
      //   },
      //   fetchObject: function (gltf) {
      //     return gltf.scene;
      //   },
      // },
      // "Building assets/2 building roof gltf/2buildingroof.gltf",
    ],
  },
  GROUND: {
    PARKING_LOT: "groundAssets/parking gltf/parking.gltf",
    PARK: "groundAssets/parkWithTrees/parkWithTrees.gltf",
    CHRISTMAS_TREE: "groundAssets/christmasTree/christmasTree.gltf",
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
          //console.log("success");
          //console.log(gltf);

          loaded$.next(gltf);
        },
        (progress) => {
          //console.log("progress");
          //console.log(progress);
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
    gltf.scene.children[0].traverse(function (object) {
      // recursively enable shadows on all child meshes
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return gltf.scene.children[0];
  }
}
