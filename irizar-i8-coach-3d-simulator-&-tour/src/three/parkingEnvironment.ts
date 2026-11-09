import * as THREE from 'three';
import { SceneMaterials } from './materials';
import { OSKAR_LOGO_BASE64 } from './logoBase64';

export interface ParkingEnvironment {
  group: THREE.Group;
  lampLights: THREE.PointLight[];
  skyMesh: THREE.Mesh;
  update: (timeOfDay: 'day' | 'sunset' | 'night') => void;
}

export function createParkingEnvironment(materials: SceneMaterials): ParkingEnvironment {
  const group = new THREE.Group();
  group.name = 'Parking_Environment';

  const lampLights: THREE.PointLight[] = [];

  // ==========================================
  // 1. EXPANSIVE GRADIENT ATMOSPHERIC SKY DOME
  // ==========================================
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sCtx = skyCanvas.getContext('2d')!;

  const drawSkyGradient = (time: 'day' | 'sunset' | 'night') => {
    const grad = sCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
    if (time === 'day') {
      grad.addColorStop(0, '#1d4ed8'); // zenith deep royal blue
      grad.addColorStop(0.4, '#38bdf8'); // sky blue
      grad.addColorStop(0.75, '#bae6fd'); // soft atmospheric horizon
      grad.addColorStop(1, '#e0f2fe'); // warm haze
    } else if (time === 'sunset') {
      grad.addColorStop(0, '#431407'); // deep amber
      grad.addColorStop(0.3, '#c2410c'); // fiery orange
      grad.addColorStop(0.65, '#ea580c'); // golden orange
      grad.addColorStop(0.85, '#f59e0b'); // horizon glow
      grad.addColorStop(1, '#fef08a');
    } else {
      grad.addColorStop(0, '#030712'); // midnight blue
      grad.addColorStop(0.4, '#090d16');
      grad.addColorStop(0.8, '#0f172a');
      grad.addColorStop(1, '#1e293b'); // distant city glow
    }
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    // Subtle soft distant clouds for daytime
    if (time === 'day') {
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 8; i++) {
        const cx = (i * 75) % skyCanvas.width;
        const cy = 240 + Math.sin(i * 1.5) * 40;
        sCtx.beginPath();
        sCtx.arc(cx, cy, 60, 0, Math.PI * 2);
        sCtx.arc(cx + 40, cy - 15, 45, 0, Math.PI * 2);
        sCtx.arc(cx + 70, cy + 5, 50, 0, Math.PI * 2);
        sCtx.fill();
      }
    }
  };

  drawSkyGradient('day');

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;

  // Sky dome enlarged to 550m for wide driving horizon
  const skyGeo = new THREE.SphereGeometry(550, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.position.y = 30;
  group.add(skyMesh);

  // ==========================================
  // 2. EXPANSIVE ASPHALT DRIVING PLAZA (450m x 450m)
  // ==========================================
  // Huge, flat, high-quality pavement ground with no blocking curbs in driving area
  const plazaSize = 450;
  const pavementGeo = new THREE.PlaneGeometry(plazaSize, plazaSize);
  const pavement = new THREE.Mesh(pavementGeo, materials.parkingPavement);
  pavement.rotation.x = -Math.PI / 2;
  pavement.position.y = 0;
  pavement.receiveShadow = true;
  group.add(pavement);

  // ==========================================
  // 3. ROAD & PARKING MARKINGS
  // ==========================================
  const markingsGroup = new THREE.Group();
  markingsGroup.position.y = 0.015;
  group.add(markingsGroup);

  // Helper for white / yellow painted asphalt lines
  const whitePaintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const yellowPaintMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // A. Dedicated Coach Starting Bay at (0, 0)
  const bayMarkingGeo = new THREE.PlaneGeometry(6.2, 17.5);
  const bayMarking = new THREE.Mesh(bayMarkingGeo, materials.parkingMarkings);
  bayMarking.rotation.x = -Math.PI / 2;
  bayMarking.position.set(0, 0, 0);
  markingsGroup.add(bayMarking);

  // Adjacent coach bays on left and right
  [-8.5, 8.5, -17.0, 17.0].forEach((offsetX) => {
    const adjBay = new THREE.Mesh(bayMarkingGeo, materials.parkingMarkings);
    adjBay.rotation.x = -Math.PI / 2;
    adjBay.position.set(offsetX, 0, 0);
    markingsGroup.add(adjBay);
  });

  // B. Starting Terminal Stop Line in front of coach bays (Z = 12)
  const stopLineGeo = new THREE.PlaneGeometry(42, 0.45);
  const stopLine = new THREE.Mesh(stopLineGeo, whitePaintMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(0, 0, 12);
  markingsGroup.add(stopLine);

  // C. Main Long Driving Circuit Avenues (North-South & East-West)
  // Dashed lane dividers for high-speed coach cruising
  const createDashedRoad = (
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    roadWidth: number = 12
  ) => {
    const road = new THREE.Group();
    const length = Math.hypot(endX - startX, endZ - startZ);
    const angle = Math.atan2(endX - startX, endZ - startZ);
    const midX = (startX + endX) / 2;
    const midZ = (startZ + endZ) / 2;

    road.position.set(midX, 0, midZ);
    road.rotation.y = angle;

    // Solid side edge lines
    const edgeGeo = new THREE.PlaneGeometry(0.22, length);
    const leftEdge = new THREE.Mesh(edgeGeo, whitePaintMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-roadWidth / 2, 0, 0);
    road.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, whitePaintMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(roadWidth / 2, 0, 0);
    road.add(rightEdge);

    // Dashed center line
    const dashLength = 3.5;
    const dashGap = 3.0;
    const cycle = dashLength + dashGap;
    const count = Math.floor(length / cycle);
    const dashGeo = new THREE.PlaneGeometry(0.25, dashLength);

    for (let i = 0; i < count; i++) {
      const dash = new THREE.Mesh(dashGeo, whitePaintMat);
      dash.rotation.x = -Math.PI / 2;
      const dz = -length / 2 + (i + 0.5) * cycle;
      dash.position.set(0, 0, dz);
      road.add(dash);
    }

    return road;
  };

  // Main East-West thoroughfare at Z = 28
  markingsGroup.add(createDashedRoad(-180, 28, 180, 28, 14));
  // Secondary East-West lane at Z = -28
  markingsGroup.add(createDashedRoad(-180, -28, 180, -28, 14));
  // North-South thoroughfare at X = 80
  markingsGroup.add(createDashedRoad(80, -180, 80, 180, 14));
  // North-South thoroughfare at X = -80
  markingsGroup.add(createDashedRoad(-80, -180, -80, 180, 14));
  // Northern loop connector at Z = 140
  markingsGroup.add(createDashedRoad(-160, 140, 160, 140, 16));
  // Southern loop connector at Z = -140
  markingsGroup.add(createDashedRoad(-160, -140, 160, -140, 16));

  // D. Large Coach Maneuvering Roundabout / Turning Circle at (0, 85)
  // With Green Lawn Island & Oskar Terminal Building (as requested)
  const createTurningCircle = (cx: number, cz: number, radius: number) => {
    const circleGroup = new THREE.Group();
    circleGroup.position.set(cx, 0, cz);

    // Outer and Inner Yellow Roadway Edge Markings
    const outerRingGeo = new THREE.RingGeometry(radius - 0.3, radius, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, yellowPaintMat);
    outerRing.rotation.x = -Math.PI / 2;
    circleGroup.add(outerRing);

    const innerRadius = radius - 12; // 16m inner radius
    const innerRingGeo = new THREE.RingGeometry(innerRadius - 0.3, innerRadius, 64);
    const innerRing = new THREE.Mesh(innerRingGeo, yellowPaintMat);
    innerRing.rotation.x = -Math.PI / 2;
    circleGroup.add(innerRing);

    // 1. Lush Green Lawn Island (replacing the grey circle)
    const islandRadius = innerRadius - 1.2; // 14.8m radius
    const grassGeo = new THREE.CircleGeometry(islandRadius, 48);
    const grassMesh = new THREE.Mesh(grassGeo, materials.grassLawn);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.y = 0.18; // slightly elevated lawn
    grassMesh.receiveShadow = true;
    circleGroup.add(grassMesh);

    // Raised Circular Curbstone Rim around the green island
    const curbHeight = 0.22;
    const curbRimGeo = new THREE.CylinderGeometry(islandRadius + 0.35, islandRadius + 0.45, curbHeight, 48, 1, true);
    const curbRim = new THREE.Mesh(curbRimGeo, materials.curbStone);
    curbRim.position.y = curbHeight / 2;
    curbRim.castShadow = true;
    curbRim.receiveShadow = true;
    circleGroup.add(curbRim);

    // 2. Oskar Building Structure on the Island
    const buildingGroup = new THREE.Group();
    circleGroup.add(buildingGroup);

    // Building Dimensions: 15.5m wide, 7.5m high, 11m deep
    const bWidth = 15.5;
    const bHeight = 7.5;
    const bDepth = 11.0;

    // Building Main Core Body
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark contemporary anthracite composite
      roughness: 0.4,
      metalness: 0.35,
    });
    const coreGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = bHeight / 2 + 0.18;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    buildingGroup.add(coreMesh);

    // Architectural Tinted Glass Curtain Wall (Ground Floor + 1st Floor windows)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.85,
    });
    const glassGeo = new THREE.PlaneGeometry(bWidth - 1.2, 3.2);
    // Front Glass (facing south towards approaching coach, -Z)
    const frontGlass = new THREE.Mesh(glassGeo, glassMat);
    frontGlass.position.set(0, 2.2, -bDepth / 2 - 0.02);
    buildingGroup.add(frontGlass);

    // Rear Glass (facing north, +Z)
    const rearGlass = new THREE.Mesh(glassGeo, glassMat);
    rearGlass.rotation.y = Math.PI;
    rearGlass.position.set(0, 2.2, bDepth / 2 + 0.02);
    buildingGroup.add(rearGlass);

    // Entrance Glass Canopy on Front (-Z)
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.2 });
    const canopyGeo = new THREE.BoxGeometry(6.0, 0.2, 2.6);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 3.6, -bDepth / 2 - 1.2);
    buildingGroup.add(canopy);

    // Canopy Chrome Support Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12);
    const p1 = new THREE.Mesh(pillarGeo, materials.chromeTrim);
    p1.position.set(-2.8, 1.85, -bDepth / 2 - 2.3);
    buildingGroup.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, materials.chromeTrim);
    p2.position.set(2.8, 1.85, -bDepth / 2 - 2.3);
    buildingGroup.add(p2);

    // Roof Architectural Trim & Parapet
    const parapetGeo = new THREE.BoxGeometry(bWidth + 0.6, 0.45, bDepth + 0.6);
    const parapet = new THREE.Mesh(parapetGeo, materials.chromeTrim);
    parapet.position.set(0, bHeight + 0.18, 0);
    buildingGroup.add(parapet);

    // 3. Official OSKAR Logo Signboard (using logo from provided link https://i.postimg.cc/kGtNrGN7/logo.png)
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 1024;
    logoCanvas.height = 360;
    const lCtx = logoCanvas.getContext('2d')!;

    const drawBuildingLogo = (logoImg?: HTMLImageElement) => {
      // Sleek architectural corporate sign panel
      lCtx.fillStyle = '#ffffff';
      lCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);

      // Gold & blue corporate accent stripes
      lCtx.fillStyle = '#f59e0b';
      lCtx.fillRect(0, 0, logoCanvas.width, 14);
      lCtx.fillStyle = '#0f2e59';
      lCtx.fillRect(0, logoCanvas.height - 18, logoCanvas.width, 18);

      // Top lettering
      lCtx.fillStyle = '#0f2e59';
      lCtx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      lCtx.textAlign = 'center';
      lCtx.fillText('CENTRUM TURYSTYKI • BIURO PODRÓŻY', logoCanvas.width / 2, 60);

      // Draw official Oskar logo image
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        lCtx.drawImage(logoImg, logoCanvas.width / 2 - 220, 75, 440, 185);
      } else {
        lCtx.fillStyle = '#002b66';
        lCtx.font = '900 110px "Arial Black", sans-serif';
        lCtx.fillText('SKAR', logoCanvas.width / 2 + 40, 205);
        lCtx.beginPath();
        lCtx.arc(logoCanvas.width / 2 - 130, 160, 55, 0, Math.PI * 2);
        lCtx.fillStyle = '#f59e0b';
        lCtx.fill();
        lCtx.lineWidth = 16;
        lCtx.strokeStyle = '#002b66';
        lCtx.stroke();
      }

      // Bottom URL
      lCtx.fillStyle = '#0284c7';
      lCtx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
      lCtx.textAlign = 'center';
      lCtx.fillText('www.oskar.com.pl', logoCanvas.width / 2, 315);
    };

    drawBuildingLogo();

    const buildingLogoTex = new THREE.CanvasTexture(logoCanvas);
    buildingLogoTex.colorSpace = THREE.SRGBColorSpace;

    const bLogoImg = new Image();
    bLogoImg.onload = () => {
      drawBuildingLogo(bLogoImg);
      buildingLogoTex.needsUpdate = true;
    };
    bLogoImg.src = OSKAR_LOGO_BASE64;

    const logoSignMat = new THREE.MeshStandardMaterial({
      map: buildingLogoTex,
      roughness: 0.25,
      metalness: 0.15,
    });

    const signBoardGeo = new THREE.PlaneGeometry(8.8, 3.1);
    // Front Logo Signboard (facing approaching coach, -Z)
    const frontSign = new THREE.Mesh(signBoardGeo, logoSignMat);
    frontSign.position.set(0, 5.5, -bDepth / 2 - 0.05);
    buildingGroup.add(frontSign);

    // Rear Logo Signboard (facing +Z)
    const rearSign = new THREE.Mesh(signBoardGeo, logoSignMat);
    rearSign.rotation.y = Math.PI;
    rearSign.position.set(0, 5.5, bDepth / 2 + 0.05);
    buildingGroup.add(rearSign);

    // Warm Interior & Entrance Light
    const buildingLight = new THREE.PointLight(0xffedd5, 1.8, 26, 1.5);
    buildingLight.position.set(0, 3.8, -bDepth / 2 - 1.5);
    buildingGroup.add(buildingLight);

    // Ornamental Maple Trees on the Green Lawn around the building
    const tree1 = createNaturalTree(0.95);
    tree1.position.set(-10.5, 0.18, -6.5);
    circleGroup.add(tree1);

    const tree2 = createNaturalTree(0.95);
    tree2.position.set(10.5, 0.18, -6.5);
    circleGroup.add(tree2);

    const tree3 = createNaturalTree(0.9);
    tree3.position.set(-10.5, 0.18, 6.5);
    circleGroup.add(tree3);

    const tree4 = createNaturalTree(0.9);
    tree4.position.set(10.5, 0.18, 6.5);
    circleGroup.add(tree4);

    return circleGroup;
  };

  markingsGroup.add(createTurningCircle(0, 85, 28));

  // E. Outer Perimeter Border Markings (Yellow double lines at +/- 200m)
  const borderLength = 400;
  const borderGeo = new THREE.PlaneGeometry(0.35, borderLength);

  const createPerimeterLines = () => {
    const pGroup = new THREE.Group();
    const offsets = [
      { x: -200, z: 0, rot: 0 },
      { x: 200, z: 0, rot: 0 },
      { x: 0, z: -200, rot: Math.PI / 2 },
      { x: 0, z: 200, rot: Math.PI / 2 },
    ];
    offsets.forEach((o) => {
      const line = new THREE.Mesh(borderGeo, yellowPaintMat);
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = o.rot;
      line.position.set(o.x, 0, o.z);
      pGroup.add(line);
    });
    return pGroup;
  };
  markingsGroup.add(createPerimeterLines());

  // ==========================================
  // 4. DISTANT PERIMETER LIGHT POLES (At boundaries, never blocking the driving plaza)
  // ==========================================
  const createLightPole = (x: number, z: number, rotateY: number = 0) => {
    const pole = new THREE.Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = rotateY;

    const baseGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.7, 8);
    const base = new THREE.Mesh(baseGeo, materials.metalPole);
    base.position.y = 0.35;
    pole.add(base);

    const mastGeo = new THREE.CylinderGeometry(0.1, 0.16, 8.5, 12);
    const mast = new THREE.Mesh(mastGeo, materials.metalPole);
    mast.position.y = 4.6;
    pole.add(mast);

    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 2.4);
    const arm = new THREE.Mesh(armGeo, materials.metalPole);
    arm.position.set(0, 8.85, 1.1);
    pole.add(arm);

    const lampHeadGeo = new THREE.BoxGeometry(0.42, 0.14, 0.95);
    const lampHead = new THREE.Mesh(lampHeadGeo, materials.metalPole);
    lampHead.position.set(0, 8.8, 2.1);
    pole.add(lampHead);

    const ledFaceGeo = new THREE.PlaneGeometry(0.36, 0.85);
    const ledFace = new THREE.Mesh(ledFaceGeo, materials.lampEmitter);
    ledFace.rotation.x = Math.PI / 2;
    ledFace.position.set(0, 8.72, 2.1);
    pole.add(ledFace);

    const pointLight = new THREE.PointLight(0xffedd5, 0, 45, 1.2);
    pointLight.position.set(0, 8.5, 2.1);
    pole.add(pointLight);
    lampLights.push(pointLight);

    return pole;
  };

  // Distant lights placed along outer perimeter at +/- 185m
  const poleCoords = [
    { x: 185, z: 120, r: -Math.PI / 2 },
    { x: 185, z: 0, r: -Math.PI / 2 },
    { x: 185, z: -120, r: -Math.PI / 2 },
    { x: -185, z: 120, r: Math.PI / 2 },
    { x: -185, z: 0, r: Math.PI / 2 },
    { x: -185, z: -120, r: Math.PI / 2 },
    { x: 120, z: 185, r: Math.PI },
    { x: -120, z: 185, r: Math.PI },
    { x: 120, z: -185, r: 0 },
    { x: -120, z: -185, r: 0 },
  ];

  poleCoords.forEach((p) => {
    group.add(createLightPole(p.x, p.z, p.r));
  });

  // ==========================================
  // 5. DISTANT NATURAL MAPLE TREES (Along outer perimeter)
  // ==========================================
  const createNaturalTree = (scale: number = 1.0) => {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.24 * scale, 0.42 * scale, 4.2 * scale, 10);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.92 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.1 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.82 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.85 });
    const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.88 });

    const foliageSpecs = [
      { x: 0, y: 4.2, z: 0, rx: 1.8, ry: 1.6, rz: 1.8, mat: leafMat1 },
      { x: 0.7, y: 4.8, z: 0.5, rx: 1.5, ry: 1.4, rz: 1.4, mat: leafMat2 },
      { x: -0.6, y: 4.7, z: -0.5, rx: 1.5, ry: 1.4, rz: 1.5, mat: leafMat3 },
      { x: 0.3, y: 5.6, z: -0.3, rx: 1.3, ry: 1.3, rz: 1.2, mat: leafMat1 },
    ];

    foliageSpecs.forEach((spec) => {
      const fGeo = new THREE.SphereGeometry(1, 14, 10);
      const fMesh = new THREE.Mesh(fGeo, spec.mat);
      fMesh.scale.set(spec.rx * scale, spec.ry * scale, spec.rz * scale);
      fMesh.position.set(spec.x * scale, spec.y * scale, spec.z * scale);
      fMesh.castShadow = true;
      tree.add(fMesh);
    });

    return tree;
  };

  // Line trees along the far edges
  for (let i = -6; i <= 6; i++) {
    const tNorth = createNaturalTree(1.3 + Math.abs(i % 3) * 0.2);
    tNorth.position.set(i * 30, 0, 195);
    group.add(tNorth);

    const tSouth = createNaturalTree(1.3 + Math.abs(i % 3) * 0.2);
    tSouth.position.set(i * 30, 0, -195);
    group.add(tSouth);

    if (Math.abs(i) > 1) {
      const tEast = createNaturalTree(1.4);
      tEast.position.set(195, 0, i * 30);
      group.add(tEast);

      const tWest = createNaturalTree(1.4);
      tWest.position.set(-195, 0, i * 30);
      group.add(tWest);
    }
  }

  // ==========================================
  // 6. DYNAMIC ENVIRONMENT UPDATE (Sky & Lighting)
  // ==========================================
  const update = (timeOfDay: 'day' | 'sunset' | 'night') => {
    drawSkyGradient(timeOfDay);
    skyTexture.needsUpdate = true;

    const isDark = timeOfDay === 'night' || timeOfDay === 'sunset';
    materials.lampEmitter.emissiveIntensity = isDark ? 2.5 : 0.05;
    lampLights.forEach((light) => {
      light.intensity = timeOfDay === 'night' ? 2.8 : timeOfDay === 'sunset' ? 1.2 : 0;
    });
  };

  return {
    group,
    lampLights,
    skyMesh,
    update,
  };
}
