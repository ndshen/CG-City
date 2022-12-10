import * as THREE from "three";

export function normalize2DArray(a) {
  const maxRow = a.map((row) => Math.max(...row));
  const maxValue = Math.max(...maxRow);

  const minRow = a.map((row) => Math.min(...row));
  const minValue = Math.min(...minRow);

  return a.map((row) =>
    row.map((cell) => (cell - minValue) / (maxValue - minValue))
  );
}

export function resizeObject(object, width, length, height) {
  object.scale.set(1, 1, 1);
  const box = new THREE.Box3().setFromObject(object);
  // const originSize = object
  //   .localToWorld(box.max)
  //   .sub(object.localToWorld(box.min));
  const originSize = box.getSize(new THREE.Vector3());
  object.scale.set(
    width / originSize.x,
    length / originSize.z,
    height / originSize.y
  );
}

export function getRandomElement(array) {
  if (array.length == 0) {
    return null;
  }
  return array[Math.floor(Math.random() * array.length)];
}

export function reCenterObj(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const boxCenter = box.getCenter(new THREE.Vector3());
  obj.position.set(-boxCenter.x, -boxCenter.y, -boxCenter.z);
}

export function setModelColor(modelConfig, obj, color) {
  if (Object.hasOwn(modelConfig, "setColor")) {
    modelConfig.setColor(obj, color);
  }
}
