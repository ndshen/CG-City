const colors = {
  CITY_BASE: 0x5c4033, // Dark Brown
  BUILDING_BASE: 0x696969, // Grey
  GROUND_BASE: 0x00a300, // Green
};

// adjustable city configurations
export const cityConfig = {
  colors: colors,

  origin: [0, 0, 0],

  gridSize: 8,
  roadWidth: 25,
  blockWidth: 25,

  cityBaseHeight: 10,
  buildingBaseHeight: 2,
  groundBaseHeight: 1,
  roadHeight: 1,

  buildingScatter: 0.7, // range: [0, 1]
  buildingThreshold: 0.2, // range: [0, 1], smaller threshold -> more buildings

  maxBuildingLevel: 10,
  buildingLevelHeight: 10,
  buildingPadding: 2,
};

export function cityWidth() {
  return (
    cityConfig.gridSize * cityConfig.blockWidth +
    (cityConfig.gridSize - 1) * cityConfig.roadWidth
  );
}

export function cityRadius() {
  return cityWidth() / 2;
}
