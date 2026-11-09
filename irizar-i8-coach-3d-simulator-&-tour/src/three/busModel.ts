import * as THREE from 'three';
import { SceneMaterials } from './materials';

export interface BusComponents {
  rootGroup: THREE.Group;
  frontDoorGroup: THREE.Group;
  middleDoorGroup: THREE.Group;
  luggageFlapsGroup: THREE.Group;
  wheelsGroup: THREE.Group;
  headlightsGroup: THREE.Group;
  interiorLightsGroup: THREE.Group;
  driverCockpit: THREE.Group;
  seatsGroup: THREE.Group;
  contactShadowMesh: THREE.Mesh;
  frontSpotlights: THREE.SpotLight[];
  update: (delta: number, busState: {
    frontDoorOpen: boolean;
    middleDoorOpen: boolean;
    luggageBaysOpen: boolean;
    kneeling: boolean;
    headlightsOn: boolean;
    interiorLightsOn: boolean;
    steerAngle: number;
    rollDelta: number;
    isBraking: boolean;
    isReversing: boolean;
  }) => void;
}

export function createIrizarCoach(materials: SceneMaterials): BusComponents {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Irizar_i8_Coach';

  // Overall coach dimensions (meters)
  // Length: 15.0m, Width: 2.55m, Height: 3.82m (15-meter Tri-Axle Flagship)
  const busLength = 15.0;
  const busWidth = 2.55;
  const halfL = busLength / 2; // 7.5m
  const halfW = busWidth / 2; // 1.275m

  // Vertical layout - High-Deck Touring Coach Proportions (Irizar i8)
  const chassisBottomY = 0.38;
  const waistlineY = 2.02; // Elevated waistline: windows start higher, tall luggage flanks below!
  const roofLineY = 3.55;
  const roofApexY = 3.82;
  const passengerFloorY = 1.72; // Raised high-deck passenger cabin floor

  // European LHD Configuration:
  // Bus faces +Z.
  // Driver sits on the LEFT of the bus (+X in our coordinates: viewer's right when facing front).
  // Passenger doors are on the RIGHT of the bus (-X in our coordinates: viewer's left when facing front, curb side).
  const driverSideX = 1; // +X is driver side
  const curbSideX = -1;  // -X is passenger curb side with doors

  // ==========================================
  // 1. CHASSIS & UNDERBODY
  // ==========================================
  const undercarriageGeo = new THREE.BoxGeometry(busWidth - 0.2, 0.42, busLength - 1.2);
  const undercarriage = new THREE.Mesh(undercarriageGeo, materials.blackPlastic);
  undercarriage.position.set(0, 0.55, 0);
  rootGroup.add(undercarriage);

  // Ground Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(busWidth + 1.2, busLength + 1.8);
  const contactShadowMesh = new THREE.Mesh(shadowGeo, materials.contactShadow);
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.set(0, 0.015, 0);
  rootGroup.add(contactShadowMesh);

  // Wheel Well Inner Liners
  const createWheelLiner = (x: number, z: number, length: number) => {
    const linerGeo = new THREE.BoxGeometry(0.35, 0.65, length);
    const liner = new THREE.Mesh(linerGeo, materials.blackPlastic);
    liner.position.set(x, 0.72, z);
    return liner;
  };
  rootGroup.add(createWheelLiner(halfW - 0.18, 5.1, 1.5));
  rootGroup.add(createWheelLiner(-halfW + 0.18, 5.1, 1.5));
  rootGroup.add(createWheelLiner(halfW - 0.18, -4.3, 3.2));
  rootGroup.add(createWheelLiner(-halfW + 0.18, -4.3, 3.2));

  // ==========================================
  // 2. SOLID AERODYNAMIC ROOF & SPOILER
  // ==========================================
  const roofGroup = new THREE.Group();
  rootGroup.add(roofGroup);

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfW, roofLineY);
  roofShape.quadraticCurveTo(0, roofApexY, halfW, roofLineY);
  roofShape.lineTo(halfW - 0.04, roofLineY - 0.08);
  roofShape.quadraticCurveTo(0, roofApexY - 0.08, -halfW + 0.04, roofLineY - 0.08);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    steps: 1,
    depth: busLength - 0.2,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.06,
    bevelSegments: 4,
  });
  const roofMesh = new THREE.Mesh(roofGeo, materials.busBodyPaint);
  roofMesh.position.set(0, 0, halfL - 0.1);
  roofMesh.rotation.y = Math.PI;
  roofGroup.add(roofMesh);

  // Third High-Mount Brake Light (cleanly integrated into roofline, without bulky roof pods)
  const thirdBrakeLightGeo = new THREE.BoxGeometry(0.85, 0.05, 0.04);
  const thirdBrakeLight = new THREE.Mesh(thirdBrakeLightGeo, materials.taillightEmitter);
  thirdBrakeLight.position.set(0, roofApexY - 0.04, -halfL - 0.01);
  roofGroup.add(thirdBrakeLight);

  // ==========================================
  // 3. FULLY SYMMETRICAL AERODYNAMIC FRONT NOSE
  // ==========================================
  // Using theta from -Math.PI / 2 to +Math.PI / 2:
  // In Three.js: x = radius * sin(theta), z = radius * cos(theta).
  // At -PI/2: x = -radius, z = 0 (far curb side).
  // At 0:     x = 0, z = +radius (center of nose!).
  // At +PI/2: x = +radius, z = 0 (far driver side).
  // BOTH sides are 100% complete and fully symmetric!
  const frontGroup = new THREE.Group();
  rootGroup.add(frontGroup);

  const noseRadius = halfW; // 1.275m
  const noseHeight = 1.35;
  const frontNoseGeo = new THREE.CylinderGeometry(
    noseRadius,
    noseRadius,
    noseHeight,
    32,
    1,
    false,
    -Math.PI / 2,
    Math.PI
  );
  const frontNose = new THREE.Mesh(frontNoseGeo, materials.frontFace);
  frontNose.scale.set(1.0, 1.0, 0.55);
  frontNose.position.set(0, 1.02, halfL - 0.7);
  frontGroup.add(frontNose);

  // Bumper lower lip
  const bumperLipGeo = new THREE.CylinderGeometry(
    noseRadius - 0.02,
    noseRadius - 0.02,
    0.35,
    32,
    1,
    false,
    -Math.PI / 2,
    Math.PI
  );
  const bumperLip = new THREE.Mesh(bumperLipGeo, materials.blackPlastic);
  bumperLip.scale.set(1.01, 1.0, 0.56);
  bumperLip.position.set(0, 0.52, halfL - 0.7);
  frontGroup.add(bumperLip);

  // Polish Front License Plate "KR 3X746"
  const plateGeo = new THREE.PlaneGeometry(0.62, 0.15);
  const frontPlate = new THREE.Mesh(plateGeo, materials.licensePlate);
  frontPlate.position.set(0, 0.48, halfL - 0.7 + noseRadius * 0.55 + 0.02);
  frontGroup.add(frontPlate);

  // Swept Panoramic Curved Windshield (full symmetry from -PI/2 to +PI/2)
  const windshieldHeight = 2.05;
  const windshieldGeo = new THREE.CylinderGeometry(
    noseRadius - 0.03,
    noseRadius - 0.03,
    windshieldHeight,
    32,
    1,
    true,
    -Math.PI / 2,
    Math.PI
  );
  const windshield = new THREE.Mesh(windshieldGeo, materials.busWindshield);
  windshield.scale.set(0.98, 1.0, 0.52);
  windshield.rotation.x = -0.16;
  windshield.position.set(0, 2.45, halfL - 0.7);
  frontGroup.add(windshield);

  // Front A-pillars
  const aPillarGeo = new THREE.BoxGeometry(0.08, windshieldHeight, 0.12);
  const aPillarRight = new THREE.Mesh(aPillarGeo, materials.busBodyAccent);
  aPillarRight.position.set(halfW - 0.06, 2.45, halfL - 0.7);
  aPillarRight.rotation.x = -0.16;
  frontGroup.add(aPillarRight);

  const aPillarLeft = new THREE.Mesh(aPillarGeo, materials.busBodyAccent);
  aPillarLeft.position.set(-halfW + 0.06, 2.45, halfL - 0.7);
  aPillarLeft.rotation.x = -0.16;
  frontGroup.add(aPillarLeft);

  // Windshield Wipers
  const wiperGeo = new THREE.BoxGeometry(0.02, 0.95, 0.02);
  const wiperLeft = new THREE.Mesh(wiperGeo, materials.blackPlastic);
  wiperLeft.position.set(-0.35, 1.7, halfL - 0.35);
  wiperLeft.rotation.z = 0.32;
  wiperLeft.rotation.x = -0.16;
  frontGroup.add(wiperLeft);

  const wiperRight = new THREE.Mesh(wiperGeo, materials.blackPlastic);
  wiperRight.position.set(0.45, 1.7, halfL - 0.35);
  wiperRight.rotation.z = 0.32;
  wiperRight.rotation.x = -0.16;
  frontGroup.add(wiperRight);

  // Aerodynamic Wing Mirrors
  const createWingMirror = (isDriverSide: boolean) => {
    const mirrorGroup = new THREE.Group();
    const side = isDriverSide ? 1 : -1;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * (halfW - 0.12), 3.48, halfL - 0.8),
      new THREE.Vector3(side * (halfW + 0.32), 3.52, halfL - 0.5),
      new THREE.Vector3(side * (halfW + 0.36), 3.12, halfL - 0.25),
      new THREE.Vector3(side * (halfW + 0.32), 2.38, halfL - 0.15),
    ]);
    const stalkGeo = new THREE.TubeGeometry(curve, 20, 0.042, 10, false);
    const stalk = new THREE.Mesh(stalkGeo, materials.busBodyPaint);
    mirrorGroup.add(stalk);

    const housingGeo = new THREE.BoxGeometry(0.16, 0.68, 0.14);
    const housing = new THREE.Mesh(housingGeo, materials.busBodyPaint);
    housing.position.set(side * (halfW + 0.32), 2.38, halfL - 0.15);
    housing.rotation.y = side * 0.12;
    mirrorGroup.add(housing);

    const mirrorGlassGeo = new THREE.PlaneGeometry(0.12, 0.62);
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, materials.chromeTrim);
    mirrorGlass.rotation.y = isDriverSide ? -Math.PI / 2 - 0.2 : Math.PI / 2 + 0.2;
    mirrorGlass.position.set(side * (halfW + 0.32) - side * 0.07, 2.38, halfL - 0.16);
    mirrorGroup.add(mirrorGlass);

    return mirrorGroup;
  };
  frontGroup.add(createWingMirror(true));
  frontGroup.add(createWingMirror(false));

  // ==========================================
  // 4. AUTHENTIC IRIZAR i8 REAR FACE (Matching image_b6f15311.png)
  // ==========================================
  const rearGroup = new THREE.Group();
  rearGroup.position.set(0, 0, -halfL);
  rootGroup.add(rearGroup);

  // Structural rear endwall backing
  const rearBackGeo = new THREE.BoxGeometry(busWidth - 0.08, 3.20, 0.16);
  const rearBack = new THREE.Mesh(rearBackGeo, materials.busBodyPaint);
  rearBack.position.set(0, 1.96, 0.08);
  rearGroup.add(rearBack);

  // High-fidelity textured rear facade with authentic Irizar i8 graphics:
  // - Aerodynamic hexagonal window with camera pod & chrome sill sweep
  // - Central auxiliary reflector & 3 signature curved smile louvers
  // - Chrome "i8 integral" badge
  // - Ruby-red LED light blade clusters with reverse/indicator inserts
  // - Recessed Polish license plate "KR 3X746" with EU strip
  // - Bumper seam, lower reflectors & 4 ultrasonic sensors
  const rearFacadeGeo = new THREE.PlaneGeometry(busWidth - 0.08, 3.20);
  const rearFacade = new THREE.Mesh(rearFacadeGeo, materials.rearFace);
  rearFacade.position.set(0, 1.96, -0.005);
  rearFacade.rotation.y = Math.PI;
  rearGroup.add(rearFacade);

  // Smooth vertical rear corner pillared fairings (rounding left and right edges into sides)
  const cornerRadius = 0.09;
  const cornerGeo = new THREE.CylinderGeometry(cornerRadius, cornerRadius, 3.20, 16);
  const cornerRight = new THREE.Mesh(cornerGeo, materials.busBodyPaint);
  cornerRight.position.set(halfW - cornerRadius, 1.96, 0.02);
  rearGroup.add(cornerRight);

  const cornerLeft = new THREE.Mesh(cornerGeo, materials.busBodyPaint);
  cornerLeft.position.set(-halfW + cornerRadius, 1.96, 0.02);
  rearGroup.add(cornerLeft);

  // 3D Physical Chrome Sill Bar under the rear window (swept arc catching highlights)
  const sillCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, 2.52, -0.012),
    new THREE.Vector3(-0.50, 2.44, -0.015),
    new THREE.Vector3(0, 2.41, -0.018),
    new THREE.Vector3(0.50, 2.44, -0.015),
    new THREE.Vector3(0.95, 2.52, -0.012),
  ]);
  const sillGeo = new THREE.TubeGeometry(sillCurve, 24, 0.018, 8, false);
  const sillMesh = new THREE.Mesh(sillGeo, materials.chromeTrim);
  rearGroup.add(sillMesh);

  // 3D Aerodynamic Tail Light Glass Lenses (giving realistic optical refraction)
  const tlLensShape = new THREE.Shape();
  tlLensShape.moveTo(-0.06, -0.55);
  tlLensShape.lineTo(0.06, -0.55);
  tlLensShape.quadraticCurveTo(0.08, 0, 0.04, 0.55);
  tlLensShape.lineTo(-0.04, 0.55);
  tlLensShape.quadraticCurveTo(-0.02, 0, -0.06, -0.55);
  tlLensShape.closePath();

  const tlLensGeo = new THREE.ExtrudeGeometry(tlLensShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
  });

  const tlLensRight = new THREE.Mesh(tlLensGeo, materials.taillightLens);
  tlLensRight.position.set(halfW - 0.23, 1.52, -0.02);
  tlLensRight.rotation.y = Math.PI;
  rearGroup.add(tlLensRight);

  const tlLensLeft = new THREE.Mesh(tlLensGeo, materials.taillightLens);
  tlLensLeft.position.set(-halfW + 0.23, 1.52, -0.02);
  tlLensLeft.rotation.y = Math.PI;
  rearGroup.add(tlLensLeft);

  // 3D Active Emissive Tail Light Strips (wired to headlight switch)
  const tlStripGeo = new THREE.BoxGeometry(0.04, 0.95, 0.015);
  const tlStripRight = new THREE.Mesh(tlStripGeo, materials.taillightEmitter);
  tlStripRight.position.set(halfW - 0.23, 1.52, -0.012);
  rearGroup.add(tlStripRight);

  const tlStripLeft = new THREE.Mesh(tlStripGeo, materials.taillightEmitter);
  tlStripLeft.position.set(-halfW + 0.23, 1.52, -0.012);
  rearGroup.add(tlStripLeft);

  // 3D Lower Bumper Step / Aerodynamic Diffuser Base
  const bumperBaseGeo = new THREE.BoxGeometry(busWidth - 0.04, 0.32, 0.09);
  const bumperBase = new THREE.Mesh(bumperBaseGeo, materials.busBodyAccent);
  bumperBase.position.set(0, 0.52, 0.01);
  rearGroup.add(bumperBase);

  // Subtle license plate 3D frame border
  const plateBezelGeo = new THREE.BoxGeometry(0.66, 0.18, 0.012);
  const plateBezel = new THREE.Mesh(plateBezelGeo, materials.blackPlastic);
  plateBezel.position.set(0, 0.56, -0.008);
  rearGroup.add(plateBezel);

  // ==========================================
  // 5. SIDE WALLS & INTEGRATED OSKAR LIVERY
  // ==========================================
  // Driver side (+X): Continuous solid wall with livery
  // Curb side (-X): Solid wall with front & middle entrance door openings
  const sidePanelLength = 14.55;
  const sidePanelHeight = waistlineY - chassisBottomY; // ~1.27m
  const sidePanelY = (chassisBottomY + waistlineY) / 2;

  // Driver side (+X) solid body with livery - reaching rear face cleanly
  const driverSideGeo = new THREE.PlaneGeometry(sidePanelLength, sidePanelHeight);
  const driverSidePanel = new THREE.Mesh(driverSideGeo, materials.busLiveryLeft);
  driverSidePanel.rotation.y = Math.PI / 2;
  driverSidePanel.position.set(halfW, sidePanelY, -0.225);
  rootGroup.add(driverSidePanel);

  // Curb side (-X) solid body with livery (split around doors)
  // Segment 1: Ahead of front door (Z: 6.1 to 6.8)
  const curbFrontLength = 0.7;
  const curbFrontGeo = new THREE.PlaneGeometry(curbFrontLength, sidePanelHeight);
  const curbFrontPanel = new THREE.Mesh(curbFrontGeo, materials.busBodyPaint);
  curbFrontPanel.rotation.y = -Math.PI / 2;
  curbFrontPanel.position.set(-halfW, sidePanelY, 6.45);
  rootGroup.add(curbFrontPanel);

  // Segment 2: Between front door and middle door (Z: 0.1 to 5.1)
  const curbMidLength = 5.0;
  const curbMidGeo = new THREE.PlaneGeometry(curbMidLength, sidePanelHeight);
  const curbMidPanel = new THREE.Mesh(curbMidGeo, materials.busLiveryRight);
  curbMidPanel.rotation.y = -Math.PI / 2;
  curbMidPanel.position.set(-halfW, sidePanelY, 2.6);
  rootGroup.add(curbMidPanel);

  // Segment 3: Behind middle door to rear (Z: -7.5 to -0.9) - reaching rear face cleanly
  const curbRearLength = 6.6;
  const curbRearGeo = new THREE.PlaneGeometry(curbRearLength, sidePanelHeight);
  const curbRearPanel = new THREE.Mesh(curbRearGeo, materials.busLiveryRight);
  curbRearPanel.rotation.y = -Math.PI / 2;
  curbRearPanel.position.set(-halfW, sidePanelY, -4.2);
  rootGroup.add(curbRearPanel);

  // ==========================================
  // 6. CONTINUOUS PRIVACY TINTED WINDOW RIBBON
  // ==========================================
  const windowBeltHeight = roofLineY - waistlineY; // 1.87m
  const windowBeltY = (waistlineY + roofLineY) / 2;

  // Driver side (+X) continuous glass
  const driverGlassGeo = new THREE.PlaneGeometry(sidePanelLength, windowBeltHeight);
  const driverGlass = new THREE.Mesh(driverGlassGeo, materials.busGlass);
  driverGlass.rotation.y = Math.PI / 2;
  driverGlass.position.set(halfW - 0.005, windowBeltY, -0.225);
  rootGroup.add(driverGlass);

  const pillarGeo = new THREE.BoxGeometry(0.06, windowBeltHeight, 0.08);
  for (let z = -5.5; z <= 5.5; z += 1.8) {
    const pillar = new THREE.Mesh(pillarGeo, materials.busBodyAccent);
    pillar.position.set(halfW - 0.03, windowBeltY, z);
    rootGroup.add(pillar);
  }

  // Curb side (-X) windows (leaving door openings)
  const cWin1Geo = new THREE.PlaneGeometry(curbFrontLength, windowBeltHeight);
  const cWin1 = new THREE.Mesh(cWin1Geo, materials.busGlass);
  cWin1.rotation.y = -Math.PI / 2;
  cWin1.position.set(-halfW + 0.005, windowBeltY, 6.45);
  rootGroup.add(cWin1);

  const cWin2Geo = new THREE.PlaneGeometry(curbMidLength, windowBeltHeight);
  const cWin2 = new THREE.Mesh(cWin2Geo, materials.busGlass);
  cWin2.rotation.y = -Math.PI / 2;
  cWin2.position.set(-halfW + 0.005, windowBeltY, 2.6);
  rootGroup.add(cWin2);

  const cWin3Geo = new THREE.PlaneGeometry(curbRearLength, windowBeltHeight);
  const cWin3 = new THREE.Mesh(cWin3Geo, materials.busGlass);
  cWin3.rotation.y = -Math.PI / 2;
  cWin3.position.set(-halfW + 0.005, windowBeltY, -4.2);
  rootGroup.add(cWin3);

  // Signature Irizar B-Pillar forward-swept silver arch
  const bPillarShape = new THREE.Shape();
  bPillarShape.moveTo(0, 0);
  bPillarShape.lineTo(0.38, 0);
  bPillarShape.lineTo(0.18, windowBeltHeight + 0.05);
  bPillarShape.lineTo(-0.12, windowBeltHeight + 0.05);
  bPillarShape.closePath();

  const bPillarGeo = new THREE.ExtrudeGeometry(bPillarShape, { depth: 0.04, bevelEnabled: false });
  const bPillarRight = new THREE.Mesh(bPillarGeo, materials.chromeTrim);
  bPillarRight.position.set(halfW + 0.01, waistlineY, 4.5);
  bPillarRight.rotation.y = Math.PI / 2;
  rootGroup.add(bPillarRight);

  const bPillarLeft = new THREE.Mesh(bPillarGeo, materials.chromeTrim);
  bPillarLeft.position.set(-halfW - 0.01, waistlineY, 4.5);
  bPillarLeft.rotation.y = -Math.PI / 2;
  rootGroup.add(bPillarLeft);

  // ==========================================
  // 7. ANIMATED ENTRANCE DOORS (ON CURB SIDE -X)
  // ==========================================
  const doorWidth = 1.0;
  const doorHeight = roofLineY - chassisBottomY; // ~3.14m

  // Front Passenger Door on curb side (-X, Z = 5.1m)
  const frontDoorGroup = new THREE.Group();
  frontDoorGroup.position.set(-halfW, (chassisBottomY + roofLineY) / 2, 5.1);
  rootGroup.add(frontDoorGroup);

  const doorLowerHeight = waistlineY - chassisBottomY;
  const doorLowerGeo = new THREE.BoxGeometry(0.06, doorLowerHeight, doorWidth);
  const frontDoorLower = new THREE.Mesh(doorLowerGeo, materials.busBodyPaint);
  frontDoorLower.position.set(0, -doorHeight / 2 + doorLowerHeight / 2, 0);
  frontDoorGroup.add(frontDoorLower);

  const doorUpperHeight = roofLineY - waistlineY;
  const doorUpperGeo = new THREE.BoxGeometry(0.05, doorUpperHeight, doorWidth);
  const frontDoorUpper = new THREE.Mesh(doorUpperGeo, materials.busGlass);
  frontDoorUpper.position.set(0, doorHeight / 2 - doorUpperHeight / 2, 0);
  frontDoorGroup.add(frontDoorUpper);

  const doorSealGeo = new THREE.BoxGeometry(0.07, doorHeight, 0.04);
  const fdf1 = new THREE.Mesh(doorSealGeo, materials.blackPlastic);
  fdf1.position.set(0, 0, doorWidth / 2);
  frontDoorGroup.add(fdf1);
  const fdf2 = new THREE.Mesh(doorSealGeo, materials.blackPlastic);
  fdf2.position.set(0, 0, -doorWidth / 2);
  frontDoorGroup.add(fdf2);

  // Middle Passenger Door on curb side (-X, Z = -0.4m)
  const middleDoorGroup = new THREE.Group();
  middleDoorGroup.position.set(-halfW, (chassisBottomY + roofLineY) / 2, -0.4);
  rootGroup.add(middleDoorGroup);

  const middleDoorLower = new THREE.Mesh(doorLowerGeo, materials.busBodyPaint);
  middleDoorLower.position.set(0, -doorHeight / 2 + doorLowerHeight / 2, 0);
  middleDoorGroup.add(middleDoorLower);

  const middleDoorUpper = new THREE.Mesh(doorUpperGeo, materials.busGlass);
  middleDoorUpper.position.set(0, doorHeight / 2 - doorUpperHeight / 2, 0);
  middleDoorGroup.add(middleDoorUpper);

  const mdf1 = new THREE.Mesh(doorSealGeo, materials.blackPlastic);
  mdf1.position.set(0, 0, doorWidth / 2);
  middleDoorGroup.add(mdf1);
  const mdf2 = new THREE.Mesh(doorSealGeo, materials.blackPlastic);
  mdf2.position.set(0, 0, -doorWidth / 2);
  middleDoorGroup.add(mdf2);

  // Luggage Flaps on curb side (-X)
  const luggageFlapsGroup = new THREE.Group();
  luggageFlapsGroup.position.set(-halfW, waistlineY - 0.05, 1.8);
  rootGroup.add(luggageFlapsGroup);

  for (let i = 0; i < 3; i++) {
    const flapGeo = new THREE.BoxGeometry(0.05, 1.05, 1.25);
    const flap = new THREE.Mesh(flapGeo, materials.busBodyPaint);
    flap.position.set(0, -0.52, -i * 1.4);
    luggageFlapsGroup.add(flap);

    const handleGeo = new THREE.BoxGeometry(0.07, 0.08, 0.22);
    const handle = new THREE.Mesh(handleGeo, materials.blackPlastic);
    handle.position.set(0, -0.88, -i * 1.4);
    luggageFlapsGroup.add(handle);
  }

  // ==========================================
  // 8. TRI-AXLE WHEELS WITH CHROME HUBCAPS & STEERING
  // ==========================================
  const wheelsGroup = new THREE.Group();
  rootGroup.add(wheelsGroup);

  const createWheel = () => {
    const wheel = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.32, 32);
    const tire = new THREE.Mesh(tireGeo, materials.tireRubber);
    tire.rotation.z = Math.PI / 2;
    wheel.add(tire);

    const wheelFaceGeo = new THREE.CircleGeometry(0.51, 32);
    const wheelFace = new THREE.Mesh(wheelFaceGeo, materials.wheelFace);
    wheelFace.rotation.y = Math.PI / 2;
    wheelFace.position.x = 0.165;
    wheel.add(wheelFace);

    return wheel;
  };

  const wheelY = 0.52;
  const wheelTrack = halfW - 0.15;

  // Front Steer Pivots (front wheels turn with steering input)
  const steerPivotFL = new THREE.Group();
  steerPivotFL.position.set(wheelTrack, wheelY, 5.1);
  wheelsGroup.add(steerPivotFL);

  const wheelFL = createWheel();
  steerPivotFL.add(wheelFL);

  const steerPivotFR = new THREE.Group();
  steerPivotFR.position.set(-wheelTrack, wheelY, 5.1);
  wheelsGroup.add(steerPivotFR);

  const wheelFR = createWheel();
  wheelFR.rotation.y = Math.PI;
  steerPivotFR.add(wheelFR);

  // Rear Drive Axle
  const wheelRL1 = createWheel();
  wheelRL1.position.set(wheelTrack, wheelY, -3.6);
  wheelsGroup.add(wheelRL1);

  const wheelRR1 = createWheel();
  wheelRR1.rotation.y = Math.PI;
  wheelRR1.position.set(-wheelTrack, wheelY, -3.6);
  wheelsGroup.add(wheelRR1);

  // Rear Tag Axle
  const wheelRL2 = createWheel();
  wheelRL2.position.set(wheelTrack, wheelY, -5.0);
  wheelsGroup.add(wheelRL2);

  const wheelRR2 = createWheel();
  wheelRR2.rotation.y = Math.PI;
  wheelRR2.position.set(-wheelTrack, wheelY, -5.0);
  wheelsGroup.add(wheelRR2);

  // ==========================================
  // 9. COMPLETE PASSENGER CABIN & ENTRANCE STAIRS
  // ==========================================
  const interiorGroup = new THREE.Group();
  rootGroup.add(interiorGroup);

  const floorGeo = new THREE.BoxGeometry(busWidth - 0.16, 0.12, busLength - 1.2);
  const floorMesh = new THREE.Mesh(floorGeo, materials.interiorFloor);
  floorMesh.position.set(0, passengerFloorY, -0.2);
  interiorGroup.add(floorMesh);

  const carpetGeo = new THREE.PlaneGeometry(0.56, busLength - 2.8);
  const carpetMesh = new THREE.Mesh(carpetGeo, materials.aisleCarpet);
  carpetMesh.rotation.x = -Math.PI / 2;
  carpetMesh.position.set(0, passengerFloorY + 0.065, -0.4);
  interiorGroup.add(carpetMesh);

  // Front Entrance Stairs on curb side (-X) leading to elevated cabin floor
  for (let s = 0; s < 4; s++) {
    const stepHeight = 0.31;
    const stepDepth = 0.28;
    const stepY = 0.45 + s * stepHeight;
    const stepZ = 5.4 - s * stepDepth;

    const stepGeo = new THREE.BoxGeometry(0.78, 0.08, stepDepth);
    const stepMesh = new THREE.Mesh(stepGeo, materials.interiorFloor);
    stepMesh.position.set(-halfW + 0.45, stepY, stepZ);
    interiorGroup.add(stepMesh);
  }

  // Entrance Handrail on curb side (-X)
  const handrailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-halfW + 0.15, 0.6, 5.4),
    new THREE.Vector3(-halfW + 0.18, 1.2, 5.0),
    new THREE.Vector3(-halfW + 0.18, 1.9, 4.4),
    new THREE.Vector3(-0.3, 2.0, 4.2),
  ]);
  const handrailGeo = new THREE.TubeGeometry(handrailCurve, 16, 0.024, 8, false);
  const handrail = new THREE.Mesh(handrailGeo, materials.chromeTrim);
  interiorGroup.add(handrail);

  // Interior Ceiling
  const ceilingGeo = new THREE.BoxGeometry(busWidth - 0.22, 0.08, busLength - 1.2);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, materials.interiorCeiling);
  ceilingMesh.position.set(0, roofLineY - 0.02, -0.2);
  interiorGroup.add(ceilingMesh);

  // Ambient Interior LED Neon Strip
  const ledStripGeo2 = new THREE.BoxGeometry(0.08, 0.02, busLength - 2.0);
  const interiorLEDLeft = new THREE.Mesh(ledStripGeo2, materials.interiorAmbientLED);
  interiorLEDLeft.position.set(-0.35, roofLineY - 0.05, -0.2);
  interiorGroup.add(interiorLEDLeft);

  const interiorLEDRight = new THREE.Mesh(ledStripGeo2, materials.interiorAmbientLED);
  interiorLEDRight.position.set(0.35, roofLineY - 0.05, -0.2);
  interiorGroup.add(interiorLEDRight);

  // Overhead Luggage Racks
  const rackLength = busLength - 2.8;
  const rackGeo = new THREE.BoxGeometry(0.72, 0.18, rackLength);

  const rackLeft = new THREE.Mesh(rackGeo, materials.interiorCeiling);
  rackLeft.position.set(-halfW + 0.45, roofLineY - 0.35, -0.4);
  interiorGroup.add(rackLeft);

  const rackRight = new THREE.Mesh(rackGeo, materials.interiorCeiling);
  rackRight.position.set(halfW - 0.45, roofLineY - 0.35, -0.4);
  interiorGroup.add(rackRight);

  // Overhead Passenger Service Units
  for (let p = 0; p < 10; p++) {
    const psuZ = 3.6 - p * 0.95;
    const psuGeo = new THREE.PlaneGeometry(0.35, 0.22);

    const psuLeft = new THREE.Mesh(psuGeo, materials.overheadConsole);
    psuLeft.rotation.x = Math.PI / 2;
    psuLeft.position.set(-halfW + 0.45, roofLineY - 0.45, psuZ);
    interiorGroup.add(psuLeft);

    const psuRight = new THREE.Mesh(psuGeo, materials.overheadConsole);
    psuRight.rotation.x = Math.PI / 2;
    psuRight.position.set(halfW - 0.45, roofLineY - 0.45, psuZ);
    interiorGroup.add(psuRight);
  }

  // ==========================================
  // 10. DRIVER COCKPIT (ON DRIVER SIDE +X)
  // ==========================================
  // In Poland / Europe (LHD), driver sits on LEFT of bus (+X)
  const driverCockpit = new THREE.Group();
  driverCockpit.position.set(0.65, 0.82, 4.6);
  interiorGroup.add(driverCockpit);

  const driverFloorGeo = new THREE.BoxGeometry(1.0, 0.1, 1.8);
  const driverFloor = new THREE.Mesh(driverFloorGeo, materials.interiorFloor);
  driverFloor.position.set(0, 0.05, 0.2);
  driverCockpit.add(driverFloor);

  const dashGeo = new THREE.BoxGeometry(0.95, 0.42, 0.65);
  const dashboard = new THREE.Mesh(dashGeo, materials.blackPlastic);
  dashboard.position.set(0, 0.65, 0.8);
  dashboard.rotation.x = -0.15;
  driverCockpit.add(dashboard);

  const clusterGeo = new THREE.PlaneGeometry(0.55, 0.24);
  const clusterMesh = new THREE.Mesh(clusterGeo, materials.driverDashboard);
  clusterMesh.rotation.x = -0.35;
  clusterMesh.position.set(0, 0.84, 0.62);
  driverCockpit.add(clusterMesh);

  const columnGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 12);
  const column = new THREE.Mesh(columnGeo, materials.blackPlastic);
  column.rotation.x = 0.55;
  column.position.set(0, 0.6, 0.45);
  driverCockpit.add(column);

  const steeringWheelGeo = new THREE.TorusGeometry(0.24, 0.026, 12, 28);
  const steeringWheelMesh = new THREE.Mesh(steeringWheelGeo, materials.steeringWheel);
  steeringWheelMesh.rotation.x = 0.55;
  steeringWheelMesh.position.set(0, 0.85, 0.32);
  driverCockpit.add(steeringWheelMesh);

  const driverSeatGroup = new THREE.Group();
  driverSeatGroup.position.set(0, 0.1, -0.15);
  driverCockpit.add(driverSeatGroup);

  const dSeatCushionGeo = new THREE.BoxGeometry(0.52, 0.14, 0.52);
  const dSeatCushion = new THREE.Mesh(dSeatCushionGeo, materials.seatFabricDark);
  dSeatCushion.position.set(0, 0.4, 0);
  driverSeatGroup.add(dSeatCushion);

  const dSeatBackGeo = new THREE.BoxGeometry(0.5, 0.85, 0.12);
  const dSeatBack = new THREE.Mesh(dSeatBackGeo, materials.seatFabricDark);
  dSeatBack.position.set(0, 0.85, -0.22);
  dSeatBack.rotation.x = -0.08;
  driverSeatGroup.add(dSeatBack);

  // Guide Seat on curb side (-X)
  const guideSeatGroup = new THREE.Group();
  guideSeatGroup.position.set(-0.72, 1.45, 4.2);
  interiorGroup.add(guideSeatGroup);

  const guideCushion = new THREE.Mesh(dSeatCushionGeo, materials.seatLeather);
  guideCushion.position.set(0, 0.22, 0);
  guideSeatGroup.add(guideCushion);

  const guideBack = new THREE.Mesh(dSeatBackGeo, materials.seatLeather);
  guideBack.position.set(0, 0.68, -0.22);
  guideSeatGroup.add(guideBack);

  // ==========================================
  // 11. LUXURY PASSENGER SEATING (2+2 CONFIGURATION)
  // ==========================================
  const seatsGroup = new THREE.Group();
  interiorGroup.add(seatsGroup);

  const buildPassengerSeat = (hasScreen: boolean = true) => {
    const seat = new THREE.Group();

    const cushionGeo = new THREE.BoxGeometry(0.46, 0.14, 0.48);
    const cushion = new THREE.Mesh(cushionGeo, materials.seatLeather);
    cushion.position.set(0, 0.38, 0);
    seat.add(cushion);

    const backGeo = new THREE.BoxGeometry(0.46, 0.88, 0.14);
    const backrest = new THREE.Mesh(backGeo, materials.seatLeather);
    backrest.position.set(0, 0.82, -0.2);
    backrest.rotation.x = -0.06;
    seat.add(backrest);

    const headrestGeo = new THREE.BoxGeometry(0.38, 0.22, 0.12);
    const headrest = new THREE.Mesh(headrestGeo, materials.seatLeather);
    headrest.position.set(0, 1.34, -0.23);
    seat.add(headrest);

    const accentGeo = new THREE.BoxGeometry(0.32, 0.02, 0.02);
    const accent = new THREE.Mesh(accentGeo, materials.chromeTrim);
    accent.position.set(0, 1.25, -0.16);
    seat.add(accent);

    if (hasScreen) {
      const screenHousingGeo = new THREE.BoxGeometry(0.32, 0.22, 0.03);
      const screenHousing = new THREE.Mesh(screenHousingGeo, materials.blackPlastic);
      screenHousing.position.set(0, 0.95, -0.28);
      seat.add(screenHousing);

      const screenFaceGeo = new THREE.PlaneGeometry(0.28, 0.18);
      const screenFace = new THREE.Mesh(screenFaceGeo, materials.infotainmentScreen);
      screenFace.rotation.y = Math.PI;
      screenFace.position.set(0, 0.95, -0.3);
      seat.add(screenFace);

      const tableGeo = new THREE.BoxGeometry(0.36, 0.025, 0.24);
      const table = new THREE.Mesh(tableGeo, materials.seatTable);
      table.position.set(0, 0.62, -0.28);
      seat.add(table);
    }

    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8);
    const leg1 = new THREE.Mesh(legGeo, materials.blackPlastic);
    leg1.position.set(0, 0.19, 0);
    seat.add(leg1);

    const armGeo = new THREE.BoxGeometry(0.06, 0.05, 0.35);
    const armrest = new THREE.Mesh(armGeo, materials.seatArmrest);
    armrest.position.set(0.24, 0.62, 0);
    seat.add(armrest);

    return seat;
  };

  const rowCount = 9;
  const rowPitch = 0.92;
  const aisleOffset = 0.28;
  const seatWidth = 0.48;

  for (let r = 0; r < rowCount; r++) {
    const rowZ = 3.4 - r * rowPitch;

    // Driver side (+X) seats
    const seatL1 = buildPassengerSeat(r > 0);
    seatL1.position.set(aisleOffset + seatWidth / 2, passengerFloorY + 0.06, rowZ);
    seatsGroup.add(seatL1);

    const seatL2 = buildPassengerSeat(r > 0);
    seatL2.position.set(aisleOffset + seatWidth * 1.5 + 0.04, passengerFloorY + 0.06, rowZ);
    seatsGroup.add(seatL2);

    // Curb side (-X) seats (leaving middle door stairwell clear at row 4)
    if (r !== 4) {
      const seatR1 = buildPassengerSeat(r > 0);
      seatR1.position.set(-aisleOffset - seatWidth / 2, passengerFloorY + 0.06, rowZ);
      seatsGroup.add(seatR1);

      const seatR2 = buildPassengerSeat(r > 0);
      seatR2.position.set(-aisleOffset - seatWidth * 1.5 - 0.04, passengerFloorY + 0.06, rowZ);
      seatsGroup.add(seatR2);
    }
  }

  // ==========================================
  // 12. DYNAMIC LIGHTING SOURCES
  // ==========================================
  const headlightsGroup = new THREE.Group();
  rootGroup.add(headlightsGroup);

  const createSpot = (x: number) => {
    const spot = new THREE.SpotLight(0xffffff, 4.5, 38, Math.PI / 5, 0.4, 1.2);
    spot.position.set(x, 0.86, halfL + 0.3);
    spot.target.position.set(x * 0.8, 0, halfL + 25);
    rootGroup.add(spot.target);
    return spot;
  };

  const frontSpotRight = createSpot(0.85);
  const frontSpotLeft = createSpot(-0.85);
  headlightsGroup.add(frontSpotRight);
  headlightsGroup.add(frontSpotLeft);
  const frontSpotlights = [frontSpotRight, frontSpotLeft];

  const interiorLightsGroup = new THREE.Group();
  rootGroup.add(interiorLightsGroup);

  for (let i = 0; i < 4; i++) {
    const intLight = new THREE.PointLight(0xfff7ed, 1.2, 7.5, 1.5);
    intLight.position.set(0, roofLineY - 0.2, 3.0 - i * 2.8);
    interiorLightsGroup.add(intLight);
  }

  // ==========================================
  // 13. ANIMATION & KINEMATICS UPDATE METHOD
  // ==========================================
  let currentFrontDoor = 0;
  let currentMiddleDoor = 0;
  let currentLuggage = 0;
  let currentKneel = 0;

  const update = (
    delta: number,
    state: {
      frontDoorOpen: boolean;
      middleDoorOpen: boolean;
      luggageBaysOpen: boolean;
      kneeling: boolean;
      headlightsOn: boolean;
      interiorLightsOn: boolean;
      steerAngle: number;
      rollDelta: number;
      isBraking: boolean;
      isReversing: boolean;
    }
  ) => {
    const doorSpeed = 2.5;
    const targetFront = state.frontDoorOpen ? 1 : 0;
    const targetMiddle = state.middleDoorOpen ? 1 : 0;
    const targetLuggage = state.luggageBaysOpen ? 1 : 0;
    const targetKneel = state.kneeling ? 1 : 0;

    currentFrontDoor = THREE.MathUtils.damp(currentFrontDoor, targetFront, doorSpeed, delta);
    currentMiddleDoor = THREE.MathUtils.damp(currentMiddleDoor, targetMiddle, doorSpeed, delta);
    currentLuggage = THREE.MathUtils.damp(currentLuggage, targetLuggage, doorSpeed, delta);
    currentKneel = THREE.MathUtils.damp(currentKneel, targetKneel, 2.0, delta);

    // Front door plug-swing kinematics (slides out towards -X curb side, then swings back)
    frontDoorGroup.position.x = -halfW - currentFrontDoor * 0.22;
    frontDoorGroup.rotation.y = currentFrontDoor * 1.45;

    // Middle door kinematics
    middleDoorGroup.position.x = -halfW - currentMiddleDoor * 0.22;
    middleDoorGroup.rotation.y = currentMiddleDoor * 1.45;

    // Luggage flaps hinge upward
    luggageFlapsGroup.rotation.z = -currentLuggage * 1.35;

    // Bus ECAS Kneeling suspension (tilts down on curb side -X by 8cm)
    rootGroup.position.y = -currentKneel * 0.08;
    rootGroup.rotation.z = -currentKneel * 0.025;

    // ==========================================
    // VEHICLE DRIVING KINEMATICS ANIMATION
    // ==========================================
    // Steer front wheels
    steerPivotFL.rotation.y = state.steerAngle;
    steerPivotFR.rotation.y = state.steerAngle;

    // Turn driver cockpit steering wheel
    steeringWheelMesh.rotation.z = -state.steerAngle * 2.5;

    // Roll wheels proportionally to vehicle displacement
    wheelFL.rotation.x += state.rollDelta;
    wheelFR.rotation.x -= state.rollDelta;
    wheelRL1.rotation.x += state.rollDelta;
    wheelRR1.rotation.x -= state.rollDelta;
    wheelRL2.rotation.x += state.rollDelta;
    wheelRR2.rotation.x -= state.rollDelta;

    // Headlights & Taillights
    materials.headlightEmitter.emissiveIntensity = state.headlightsOn ? 3.0 : 0.05;
    // Intensify taillights to bright glowing red when braking
    const taillightBase = state.headlightsOn ? 2.5 : 0.6;
    materials.taillightEmitter.emissiveIntensity = state.isBraking ? 5.2 : taillightBase;
    frontSpotlights.forEach((spot) => {
      spot.intensity = state.headlightsOn ? 4.5 : 0;
    });

    // Interior lights
    materials.interiorAmbientLED.emissiveIntensity = state.interiorLightsOn ? 2.2 : 0.15;
    interiorLightsGroup.visible = state.interiorLightsOn;
  };

  return {
    rootGroup,
    frontDoorGroup,
    middleDoorGroup,
    luggageFlapsGroup,
    wheelsGroup,
    headlightsGroup,
    interiorLightsGroup,
    driverCockpit,
    seatsGroup,
    contactShadowMesh,
    frontSpotlights,
    update,
  };
}
