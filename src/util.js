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
  const originSize = box.max.sub(box.min);
  object.scale.set(
    width / originSize.x,
    length / originSize.z,
    height / originSize.y
  );
}
