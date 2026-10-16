// Crop Definitions matching FARM_SYSTEM_SPEC.md
// Growth times can be configured in seconds for testing/gameplay pacing

const CROPS = {
  crop_radish: {
    id: 'crop_radish',
    name: 'Radish',
    vietnameseName: 'Củ cải đỏ',
    unlockLevel: 1,
    seedPrice: 15,
    baseSellPrice: 35,
    growthSeconds: 20, // 20s for interactive gameplay demo
    stages: 3,
    yieldMin: 1,
    yieldMax: 1,
    expGain: 15,
    spriteFolder: '/assets/sprites/crops/radish/'
  },
  crop_wheat: {
    id: 'crop_wheat',
    name: 'Wheat',
    vietnameseName: 'Lúa mì',
    unlockLevel: 1,
    seedPrice: 10,
    baseSellPrice: 25,
    growthSeconds: 15,
    stages: 3,
    yieldMin: 1,
    yieldMax: 2,
    expGain: 12,
    spriteFolder: '/assets/sprites/crops/wheat/'
  },
  crop_carrot: {
    id: 'crop_carrot',
    name: 'Carrot',
    vietnameseName: 'Cà rốt',
    unlockLevel: 2,
    seedPrice: 20,
    baseSellPrice: 48,
    growthSeconds: 30,
    stages: 3,
    yieldMin: 1,
    yieldMax: 1,
    expGain: 20,
    spriteFolder: '/assets/sprites/crops/carrot/'
  },
  crop_tomato: {
    id: 'crop_tomato',
    name: 'Tomato',
    vietnameseName: 'Cà chua',
    unlockLevel: 2,
    seedPrice: 50,
    baseSellPrice: 30,
    growthSeconds: 40,
    stages: 3,
    yieldMin: 1,
    yieldMax: 2,
    expGain: 25,
    spriteFolder: '/assets/sprites/crops/tomato/'
  },
  crop_strawberry: {
    id: 'crop_strawberry',
    name: 'Strawberry',
    vietnameseName: 'Dâu tây',
    unlockLevel: 3,
    seedPrice: 100,
    baseSellPrice: 120,
    growthSeconds: 50,
    stages: 3,
    yieldMin: 1,
    yieldMax: 2,
    expGain: 40,
    spriteFolder: '/assets/sprites/crops/strawberry/'
  }
};

const SEED_TO_CROP = {
  seed_radish: 'crop_radish',
  seed_wheat: 'crop_wheat',
  seed_carrot: 'crop_carrot',
  seed_tomato: 'crop_tomato',
  seed_strawberry: 'crop_strawberry'
};

module.exports = {
  CROPS,
  SEED_TO_CROP
};
