const colors = {
  CITY_BASE: 0x5c4033, // Dark Brown
  BUILDING_BASE: 0x696969, // Grey
  GROUND_BASE: 0x00a300, // Green
};

// adjustable city configurations
export const cityConfig = {
  colors: colors,

  origin: [0, 0, 0],

  gridSize: 20,
  roadWidth: 10,
  blockWidth: 25,

  cityBaseHeight: 10,
  buildingBaseHeight: 3,
  groundBaseHeight: 1,
  roadHeight: 1,

  buildingScatter: 0.8, // range: [0, 1]
  buildingThreshold: 0.3, // range: [0, 1], smaller threshold -> more buildings
};
