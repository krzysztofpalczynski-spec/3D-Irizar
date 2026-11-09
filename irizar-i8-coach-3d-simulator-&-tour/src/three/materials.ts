import * as THREE from 'three';
import {
  createParkingPaverTexture,
  createParkingBayMarkingsTexture,
  createLicensePlateTexture,
  createBusSideLiveryTexture,
  createFrontFaceTexture,
  createRearFaceTexture,
  createWheelTexture,
  createSeatLeatherTexture,
  createInfotainmentTexture,
  createAisleCarpetTexture,
  createOverheadConsoleTexture,
  createDriverDashboardTexture,
} from './textures';

export interface SceneMaterials {
  busBodyPaint: THREE.MeshPhysicalMaterial;
  busBodyAccent: THREE.MeshPhysicalMaterial;
  busLiveryRight: THREE.MeshStandardMaterial;
  busLiveryLeft: THREE.MeshStandardMaterial;
  frontFace: THREE.MeshStandardMaterial;
  rearFace: THREE.MeshStandardMaterial;
  wheelFace: THREE.MeshStandardMaterial;
  busGlass: THREE.MeshPhysicalMaterial;
  busWindshield: THREE.MeshPhysicalMaterial;
  chromeTrim: THREE.MeshStandardMaterial;
  blackPlastic: THREE.MeshStandardMaterial;
  tireRubber: THREE.MeshStandardMaterial;
  wheelRim: THREE.MeshStandardMaterial;
  headlightLens: THREE.MeshPhysicalMaterial;
  headlightEmitter: THREE.MeshStandardMaterial;
  taillightLens: THREE.MeshPhysicalMaterial;
  taillightEmitter: THREE.MeshStandardMaterial;
  interiorFloor: THREE.MeshStandardMaterial;
  aisleCarpet: THREE.MeshStandardMaterial;
  seatLeather: THREE.MeshStandardMaterial;
  seatFabricDark: THREE.MeshStandardMaterial;
  seatArmrest: THREE.MeshStandardMaterial;
  seatTable: THREE.MeshStandardMaterial;
  infotainmentScreen: THREE.MeshStandardMaterial;
  overheadConsole: THREE.MeshStandardMaterial;
  driverDashboard: THREE.MeshStandardMaterial;
  steeringWheel: THREE.MeshStandardMaterial;
  interiorCeiling: THREE.MeshStandardMaterial;
  interiorAmbientLED: THREE.MeshStandardMaterial;
  licensePlate: THREE.MeshStandardMaterial;
  parkingPavement: THREE.MeshStandardMaterial;
  parkingMarkings: THREE.MeshStandardMaterial;
  curbStone: THREE.MeshStandardMaterial;
  grassLawn: THREE.MeshStandardMaterial;
  metalPole: THREE.MeshStandardMaterial;
  lampEmitter: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  dispose: () => void;
}

export function createMaterials(renderer?: THREE.WebGLRenderer, isSoftwareGl: boolean = false): SceneMaterials {
  const paverTextures = createParkingPaverTexture(renderer);
  const parkingMarkingsTex = createParkingBayMarkingsTexture(renderer);
  const licensePlateTex = createLicensePlateTexture('KR 6U376');
  const busLiveryRightTex = createBusSideLiveryTexture(renderer, true);
  const busLiveryLeftTex = createBusSideLiveryTexture(renderer, false);
  const frontFaceTex = createFrontFaceTexture(renderer);
  const rearFaceTex = createRearFaceTexture(renderer);
  const wheelTex = createWheelTexture(renderer);
  const seatLeatherTex = createSeatLeatherTexture(renderer);
  const infotainmentTex = createInfotainmentTexture(renderer);
  const aisleCarpetTex = createAisleCarpetTexture(renderer);
  const overheadConsoleTex = createOverheadConsoleTexture(renderer);
  const dashboardTex = createDriverDashboardTexture(renderer);

  // Light metallic silver coach paint with glossy clearcoat (as requested)
  const busBodyPaint = new THREE.MeshPhysicalMaterial({
    color: 0xd0d5db, // Light metallic silver
    metalness: 0.35,
    roughness: 0.20,
    clearcoat: isSoftwareGl ? 0 : 0.95,
    clearcoatRoughness: 0.05,
  });

  // Dark accent trim
  const busBodyAccent = new THREE.MeshPhysicalMaterial({
    color: 0x18202f,
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: isSoftwareGl ? 0 : 0.6,
  });

  // Livery side body materials
  const busLiveryRight = new THREE.MeshStandardMaterial({
    map: busLiveryRightTex,
    metalness: 0.45,
    roughness: 0.2,
  });

  const busLiveryLeft = new THREE.MeshStandardMaterial({
    map: busLiveryLeftTex,
    metalness: 0.45,
    roughness: 0.2,
  });

  // Front face with grille, Irizar logo and headlights
  const frontFace = new THREE.MeshStandardMaterial({
    map: frontFaceTex,
    metalness: 0.45,
    roughness: 0.22,
  });

  // Rear face with aerodynamic window, chrome sill bar, 3 smile louvers, i8 badge & LED taillights
  const rearFace = new THREE.MeshStandardMaterial({
    map: rearFaceTex,
    metalness: 0.45,
    roughness: 0.22,
  });

  // High detail wheel texture
  const wheelFace = new THREE.MeshStandardMaterial({
    map: wheelTex,
    metalness: 0.85,
    roughness: 0.18,
  });

  // Tinted coach privacy glass
  const busGlass = new THREE.MeshPhysicalMaterial({
    color: 0x090f1a,
    metalness: 0.25,
    roughness: 0.04,
    transparent: true,
    opacity: 0.88,
    transmission: isSoftwareGl ? 0 : 0.25,
    ior: 1.54,
    depthWrite: false,
  });

  // Panoramic front windshield
  const busWindshield = new THREE.MeshPhysicalMaterial({
    color: 0x111c2a,
    metalness: 0.15,
    roughness: 0.04,
    transparent: true,
    opacity: 0.65,
    transmission: isSoftwareGl ? 0 : 0.45,
    ior: 1.52,
    depthWrite: false,
  });

  // Polished chrome
  const chromeTrim = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.08,
  });

  // Matte black trim
  const blackPlastic = new THREE.MeshStandardMaterial({
    color: 0x111318,
    metalness: 0.1,
    roughness: 0.75,
  });

  // Wheel rubber
  const tireRubber = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.05,
    roughness: 0.88,
  });

  // Wheel alloy rims
  const wheelRim = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.12,
  });

  // Headlight glass
  const headlightLens = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.8,
  });

  // Headlight LED emitter
  const headlightEmitter = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xecfeff,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  // Taillight red glass
  const taillightLens = new THREE.MeshPhysicalMaterial({
    color: 0x991b1b,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  // Taillight LED emitter
  const taillightEmitter = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.5,
    roughness: 0.15,
  });

  // Interior floor
  const interiorFloor = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.75,
    metalness: 0.1,
  });

  // Aisle carpet
  const aisleCarpet = new THREE.MeshStandardMaterial({
    map: aisleCarpetTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Seat leather
  const seatLeather = new THREE.MeshStandardMaterial({
    map: seatLeatherTex,
    roughness: 0.58,
    metalness: 0.08,
  });

  // Seat backing
  const seatFabricDark = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.8,
    metalness: 0.05,
  });

  // Armrest
  const seatArmrest = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Table
  const seatTable = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Infotainment screen tablet
  const infotainmentScreen = new THREE.MeshStandardMaterial({
    map: infotainmentTex,
    roughness: 0.18,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveMap: infotainmentTex,
    emissiveIntensity: 0.55,
  });

  // Overhead console
  const overheadConsole = new THREE.MeshStandardMaterial({
    map: overheadConsoleTex,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Driver digital dashboard
  const driverDashboard = new THREE.MeshStandardMaterial({
    map: dashboardTex,
    roughness: 0.22,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveMap: dashboardTex,
    emissiveIntensity: 0.65,
  });

  // Driver steering wheel
  const steeringWheel = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.55,
    metalness: 0.25,
  });

  // Interior ceiling
  const interiorCeiling = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
    metalness: 0.05,
  });

  // Interior ambient LED strip
  const interiorAmbientLED = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });

  // License plate
  const licensePlate = new THREE.MeshStandardMaterial({
    map: licensePlateTex,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Parking pavement
  const parkingPavement = new THREE.MeshStandardMaterial({
    map: paverTextures.map,
    bumpMap: paverTextures.bump,
    bumpScale: 0.035,
    roughness: 0.72,
    metalness: 0.12,
  });

  // Painted parking line markings
  const parkingMarkings = new THREE.MeshStandardMaterial({
    map: parkingMarkingsTex,
    transparent: true,
    opacity: 0.92,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Curbstone
  const curbStone = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Grass lawn
  const grassLawn = new THREE.MeshStandardMaterial({
    color: 0x245838,
    roughness: 0.9,
    metalness: 0.02,
  });

  // Metal pole
  const metalPole = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.85,
  });

  // Street lamp emitter
  const lampEmitter = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfef3c7,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  // Contact shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const contactShadow = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  return {
    busBodyPaint,
    busBodyAccent,
    busLiveryRight,
    busLiveryLeft,
    frontFace,
    rearFace,
    wheelFace,
    busGlass,
    busWindshield,
    chromeTrim,
    blackPlastic,
    tireRubber,
    wheelRim,
    headlightLens,
    headlightEmitter,
    taillightLens,
    taillightEmitter,
    interiorFloor,
    aisleCarpet,
    seatLeather,
    seatFabricDark,
    seatArmrest,
    seatTable,
    infotainmentScreen,
    overheadConsole,
    driverDashboard,
    steeringWheel,
    interiorCeiling,
    interiorAmbientLED,
    licensePlate,
    parkingPavement,
    parkingMarkings,
    curbStone,
    grassLawn,
    metalPole,
    lampEmitter,
    contactShadow,
    dispose: () => {
      [
        busBodyPaint,
        busBodyAccent,
        busLiveryRight,
        busLiveryLeft,
        frontFace,
        rearFace,
        wheelFace,
        busGlass,
        busWindshield,
        chromeTrim,
        blackPlastic,
        tireRubber,
        wheelRim,
        headlightLens,
        headlightEmitter,
        taillightLens,
        taillightEmitter,
        interiorFloor,
        aisleCarpet,
        seatLeather,
        seatFabricDark,
        seatArmrest,
        seatTable,
        infotainmentScreen,
        overheadConsole,
        driverDashboard,
        steeringWheel,
        interiorCeiling,
        interiorAmbientLED,
        licensePlate,
        parkingPavement,
        parkingMarkings,
        curbStone,
        grassLawn,
        metalPole,
        lampEmitter,
        contactShadow,
      ].forEach((m) => m.dispose());
    },
  };
}
