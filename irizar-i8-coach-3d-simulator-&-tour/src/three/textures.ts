import * as THREE from 'three';
import { OSKAR_LOGO_BASE64 } from './logoBase64';

// Helper to configure a canvas texture
function createConfiguredCanvasTexture(
  canvas: HTMLCanvasElement,
  renderer?: THREE.WebGLRenderer,
  repeatX: number = 1,
  repeatY: number = 1
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

// 1. Realistic Cobblestone / Paver Parking Texture
export function createParkingPaverTexture(renderer?: THREE.WebGLRenderer): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Warm granite paver base
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#333333';
  bCtx.fillRect(0, 0, size, size);

  const stoneW = 32;
  const stoneH = 16;
  const rows = size / stoneH;
  const cols = size / stoneW;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * (stoneW / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * stoneW + offsetX;
      const y = r * stoneH;

      // Natural stone color variation (grey, beige, warm charcoal)
      const baseVal = 135 + Math.floor(Math.sin(r * 0.7 + c * 0.4) * 20);
      const rand = Math.floor(Math.random() * 25);
      const rVal = baseVal + rand;
      const gVal = baseVal + rand - 3;
      const bVal = baseVal + rand - 6;

      ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
      ctx.fillRect(x + 1, y + 1, stoneW - 2, stoneH - 2);

      // Fine stone surface texture
      for (let s = 0; s < 5; s++) {
        const sx = x + 2 + Math.random() * (stoneW - 4);
        const sy = y + 2 + Math.random() * (stoneH - 4);
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Bump map: mortar joints are dark, stone crowns are bright
      bCtx.fillStyle = '#111111';
      bCtx.strokeRect(x, y, stoneW, stoneH);
      bCtx.fillStyle = `rgb(${160 + rand * 2}, ${160 + rand * 2}, ${160 + rand * 2})`;
      bCtx.fillRect(x + 1, y + 1, stoneW - 2, stoneH - 2);
    }
  }

  const map = createConfiguredCanvasTexture(canvas, renderer, 16, 16);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(16, 16);

  return { map, bump };
}

// 2. Bus Bay Ground Decal
export function createParkingBayMarkingsTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Painted parking perimeter lines
  ctx.strokeStyle = '#facc15'; // European yellow coach bay marking
  ctx.lineWidth = 26;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Dashed lane marks
  ctx.strokeStyle = '#ffffff';
  ctx.setLineDash([48, 32]);
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(80, 80);
  ctx.lineTo(80, canvas.height - 80);
  ctx.moveTo(canvas.width - 80, 80);
  ctx.lineTo(canvas.width - 80, canvas.height - 80);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lettering
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STANOWISKO AUTOKAROWE', canvas.width / 2, 280);
  ctx.font = 'bold 48px "Arial", sans-serif';
  ctx.fillText('OSKAR PREMIUM CLASS', canvas.width / 2, 360);

  // Bus graphic icon
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 + 100);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 18;
  ctx.strokeRect(-160, -320, 320, 640);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(-140, -300, 280, 100);
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-140, -170 + i * 110, 120, 80);
    ctx.fillRect(20, -170 + i * 110, 120, 80);
  }
  ctx.restore();

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 3. License Plate Texture (KR 3X746)
export function createLicensePlateTexture(plateNumber: string = 'KR 3X746'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 114;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Blue EU strip on left
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(8, 8, 55, canvas.height - 16);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(35, 38, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PL', 35, 92);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 68px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText(plateNumber, 290, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. Authentic High-Resolution OSKAR Livery Texture (Left and Right - matching p_1_90b64b9d.jpg & l_1_eaabf3b5.jpg)
export function createBusSideLiveryTexture(renderer?: THREE.WebGLRenderer, isRightSide: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const texture = createConfiguredCanvasTexture(canvas, renderer);

  const drawLivery = (logoImageLoaded?: HTMLImageElement) => {
    // 1. Light Metallic Silver Base (as requested)
    ctx.fillStyle = '#d0d5db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle automotive body panel depth shading in silver tones
    const panelShade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    panelShade.addColorStop(0, '#d8dce2');
    panelShade.addColorStop(0.2, '#d0d5db');
    panelShade.addColorStop(0.85, '#c5cbd3');
    panelShade.addColorStop(1, '#b6bdc6');
    ctx.fillStyle = panelShade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Luggage Bay Panel Seam Cutlines
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 3;
    const seamStarts = isRightSide ? [350, 680, 1010, 1340] : [480, 810, 1140, 1470];
    seamStarts.forEach((sx) => {
      ctx.beginPath();
      ctx.moveTo(sx, 110);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();

      // Flush black latch handle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 120, canvas.height - 80, 62, 20);
    });

    if (!isRightSide) {
      // ==========================================
      // DRIVER SIDE (LEFT SIDE, l_1_eaabf3b5.jpg)
      // Front is Left (x ~ 0..600), Rear is Right (x ~ 1300..2048)
      // ==========================================

      // A. FRONT: Winter Ski Holiday Graphic (sweep into front wheel arch)
      const skiGrad = ctx.createLinearGradient(0, 0, 650, canvas.height);
      skiGrad.addColorStop(0, 'rgba(186, 230, 253, 0.85)');
      skiGrad.addColorStop(0.6, 'rgba(125, 211, 252, 0.5)');
      skiGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = skiGrad;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, 240);
      ctx.quadraticCurveTo(240, 180, 520, 310);
      ctx.quadraticCurveTo(620, 370, 680, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Snowy mountain peaks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(60, canvas.height);
      ctx.lineTo(160, 210);
      ctx.lineTo(240, 290);
      ctx.lineTo(350, 195);
      ctx.lineTo(440, 320);
      ctx.lineTo(540, 260);
      ctx.lineTo(620, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Ski slopes & ski tracks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(160, 210);
      ctx.bezierCurveTo(220, 300, 280, 340, 380, canvas.height);
      ctx.moveTo(350, 195);
      ctx.bezierCurveTo(390, 280, 420, 330, 480, canvas.height);
      ctx.stroke();

      // Cheerful kids in ski gear (lime jacket, pink jacket & ski goggles)
      ctx.fillStyle = '#84cc16'; // Lime jacket
      ctx.beginPath();
      ctx.roundRect(140, 320, 75, 95, 12);
      ctx.fill();
      ctx.fillStyle = '#fde047'; // Ski goggles
      ctx.fillRect(152, 335, 48, 16);

      ctx.fillStyle = '#ec4899'; // Pink jacket
      ctx.beginPath();
      ctx.roundRect(240, 335, 70, 85, 12);
      ctx.fill();
      ctx.fillStyle = '#38bdf8'; // Blue ski goggles
      ctx.fillRect(250, 348, 44, 15);

      // B. MID-CHASSIS: Rome Architecture & Golden Mediterranean Sun
      const romeGrad = ctx.createLinearGradient(600, 260, 1300, canvas.height);
      romeGrad.addColorStop(0, '#fef08a');
      romeGrad.addColorStop(0.4, '#fde047');
      romeGrad.addColorStop(0.7, '#eab308');
      romeGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = romeGrad;

      // Saint Peter's Basilica Dome silhouette & arches
      ctx.beginPath();
      ctx.moveTo(700, canvas.height);
      ctx.lineTo(760, 350);
      ctx.arc(820, 340, 45, Math.PI, 0); // Dome
      ctx.rect(805, 275, 30, 20); // Lantern
      ctx.lineTo(880, 360);
      // Colonnades / arches
      for (let ax = 900; ax <= 1260; ax += 70) {
        ctx.arc(ax + 20, 380, 22, Math.PI, 0);
        ctx.lineTo(ax + 44, canvas.height);
      }
      ctx.lineTo(1320, canvas.height);
      ctx.lineTo(700, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Historic sunlit bridge arches
      ctx.fillStyle = 'rgba(202, 138, 4, 0.45)';
      ctx.fillRect(720, 420, 560, 18);

      // C. REAR: Vibrant Turquoise Ocean Wave & Holiday Swimmers (x ~ 1300..2048)
      const oceanGrad = ctx.createLinearGradient(1280, 0, 2048, canvas.height);
      oceanGrad.addColorStop(0, '#22d3ee');
      oceanGrad.addColorStop(0.35, '#06b6d4');
      oceanGrad.addColorStop(0.7, '#0284c7');
      oceanGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = oceanGrad;

      ctx.beginPath();
      ctx.moveTo(1260, canvas.height);
      ctx.bezierCurveTo(1340, 230, 1520, 140, 1780, 160);
      ctx.bezierCurveTo(1920, 175, 2000, 190, 2048, 180);
      ctx.lineTo(2048, canvas.height);
      ctx.lineTo(1260, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Ocean wave foam crest
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(1360, 260);
      ctx.bezierCurveTo(1440, 200, 1560, 160, 1720, 175);
      ctx.bezierCurveTo(1760, 190, 1790, 220, 1720, 230);
      ctx.bezierCurveTo(1620, 215, 1480, 240, 1360, 290);
      ctx.closePath();
      ctx.fill();

      // Water glitter reflections / sun caustics
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      for (let w = 1380; w < 1980; w += 85) {
        ctx.beginPath();
        ctx.moveTo(w, 320 + (w % 35));
        ctx.quadraticCurveTo(w + 35, 305, w + 70, 320 + (w % 35));
        ctx.stroke();
      }

      // Leaping Cliff Diver Silhouette
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(1490, 230, 10, 26, -0.65, 0, Math.PI * 2); // Body
      ctx.arc(1472, 212, 9, 0, Math.PI * 2); // Head
      ctx.fill();

      // Cheerful Boy with Yellow Diving Goggles & Swimming Girl
      ctx.fillStyle = '#fde047'; // Yellow mask strap & frame
      ctx.beginPath();
      ctx.roundRect(1560, 275, 72, 24, 10);
      ctx.fill();
      ctx.fillStyle = '#0284c7'; // Mask lens
      ctx.fillRect(1568, 280, 56, 14);

      // Smiling girl in turquoise sea
      ctx.fillStyle = '#fed7aa'; // Face
      ctx.beginPath();
      ctx.arc(1670, 310, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e'; // Hair
      ctx.beginPath();
      ctx.arc(1670, 302, 28, Math.PI, 0);
      ctx.fill();

      // D. DRIVER SIDE ENGINE RADIATOR GRILLE (Behind tandem wheels, matching l_1_eaabf3b5.jpg)
      const grilleX = 1750;
      const grilleY = 180;
      const grilleW = 240;
      const grilleH = 280;

      // Dark ventilation housing
      ctx.fillStyle = '#090d16';
      ctx.fillRect(grilleX, grilleY, grilleW, grilleH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(grilleX, grilleY, grilleW, grilleH);

      // Vertical metallic louver slats
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      for (let gx = grilleX + 14; gx < grilleX + grilleW - 8; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, grilleY + 8);
        ctx.lineTo(gx, grilleY + grilleH - 8);
        ctx.stroke();
      }

      // E. OSKAR LOGO & BRANDING ON WHITE MID-BODY
      // "Centrum Turystyki" above logo
      ctx.fillStyle = '#0f2e59';
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Centrum Turystyki', 890, 80);

      // Draw official Oskar logo from provided link https://i.postimg.cc/kGtNrGN7/logo.png
      if (logoImageLoaded && logoImageLoaded.complete && logoImageLoaded.naturalWidth > 0) {
        ctx.drawImage(logoImageLoaded, 880, 95, 360, 152);
      } else {
        // Fallback vector logo
        ctx.fillStyle = '#002b66';
        ctx.font = '900 95px "Arial Black", sans-serif';
        ctx.fillText('SKAR', 990, 205);

        // Yellow radiating sun 'O'
        ctx.beginPath();
        ctx.arc(930, 168, 48, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#002b66';
        ctx.stroke();

        ctx.fillStyle = '#0f2e59';
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.fillText('BIURO PODRÓŻY', 910, 242);
      }

      // Website URL across the golden architecture
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 10;
      ctx.fillText('www.oskar.com.pl', 880, 310);
      ctx.shadowBlur = 0;

      // Chrome model badge
      ctx.fillStyle = '#475569';
      ctx.font = 'italic bold 28px sans-serif';
      ctx.fillText('Irizar i8 • integral', 1380, 80);

    } else {
      // ==========================================
      // PASSENGER / CURB SIDE (RIGHT SIDE, p_1_90b64b9d.jpg)
      // Rear is Left (x ~ 0..700), Front is Right (x ~ 1400..2048)
      // ==========================================

      // A. REAR: Vibrant Turquoise Ocean Wave & Holiday Swimmers (x ~ 0..720)
      const oceanGrad = ctx.createLinearGradient(0, 0, 720, canvas.height);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(0.4, '#0284c7');
      oceanGrad.addColorStop(0.7, '#06b6d4');
      oceanGrad.addColorStop(1, '#22d3ee');
      ctx.fillStyle = oceanGrad;

      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.bezierCurveTo(80, 185, 240, 170, 420, 160);
      ctx.bezierCurveTo(580, 150, 700, 240, 780, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Ocean wave foam crest
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(180, 180);
      ctx.bezierCurveTo(280, 160, 420, 175, 540, 230);
      ctx.bezierCurveTo(460, 240, 320, 215, 240, 230);
      ctx.closePath();
      ctx.fill();

      // Water caustics
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      for (let w = 40; w < 680; w += 85) {
        ctx.beginPath();
        ctx.moveTo(w, 320 + (w % 35));
        ctx.quadraticCurveTo(w + 35, 305, w + 70, 320 + (w % 35));
        ctx.stroke();
      }

      // Leaping Cliff Diver
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(320, 230, 10, 26, 0.65, 0, Math.PI * 2);
      ctx.arc(338, 212, 9, 0, Math.PI * 2);
      ctx.fill();

      // Swimmer boy with yellow diving goggles
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(140, 280, 72, 24, 10);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(148, 285, 56, 14);

      // Swimmer girl
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(260, 310, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(260, 302, 28, Math.PI, 0);
      ctx.fill();

      // B. MID-CHASSIS: Rome Architecture & Golden Mediterranean Sun
      const romeGrad = ctx.createLinearGradient(700, 260, 1420, canvas.height);
      romeGrad.addColorStop(0, '#ca8a04');
      romeGrad.addColorStop(0.3, '#eab308');
      romeGrad.addColorStop(0.6, '#fde047');
      romeGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = romeGrad;

      ctx.beginPath();
      ctx.moveTo(760, canvas.height);
      ctx.lineTo(820, 360);
      for (let ax = 840; ax <= 1180; ax += 70) {
        ctx.arc(ax + 20, 380, 22, Math.PI, 0);
        ctx.lineTo(ax + 44, canvas.height);
      }
      ctx.lineTo(1240, 350);
      ctx.arc(1300, 340, 45, Math.PI, 0); // Dome
      ctx.rect(1285, 275, 30, 20);
      ctx.lineTo(1380, 350);
      ctx.lineTo(1440, canvas.height);
      ctx.lineTo(760, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Sunlit bridge
      ctx.fillStyle = 'rgba(202, 138, 4, 0.45)';
      ctx.fillRect(780, 420, 600, 18);

      // C. FRONT: Winter Ski Holiday Graphic (sweep into front door & wheel arch)
      const skiGrad = ctx.createLinearGradient(1400, canvas.height, 2048, 200);
      skiGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      skiGrad.addColorStop(0.4, 'rgba(125, 211, 252, 0.5)');
      skiGrad.addColorStop(1, 'rgba(186, 230, 253, 0.85)');
      ctx.fillStyle = skiGrad;

      ctx.beginPath();
      ctx.moveTo(1420, canvas.height);
      ctx.quadraticCurveTo(1520, 340, 1680, 290);
      ctx.quadraticCurveTo(1860, 220, 2048, 240);
      ctx.lineTo(2048, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Snowy mountains near front
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(1500, canvas.height);
      ctx.lineTo(1620, 250);
      ctx.lineTo(1720, 320);
      ctx.lineTo(1850, 210);
      ctx.lineTo(1960, 290);
      ctx.lineTo(2048, canvas.height);
      ctx.closePath();
      ctx.fill();

      // D. OSKAR LOGO & BRANDING ON WHITE MID-BODY
      // "Centrum Turystyki" above logo
      ctx.fillStyle = '#0f2e59';
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Centrum Turystyki', 830, 80);

      // Draw official Oskar logo from provided link https://i.postimg.cc/kGtNrGN7/logo.png
      if (logoImageLoaded && logoImageLoaded.complete && logoImageLoaded.naturalWidth > 0) {
        ctx.drawImage(logoImageLoaded, 820, 95, 360, 152);
      } else {
        // Fallback vector logo
        ctx.fillStyle = '#002b66';
        ctx.font = '900 95px "Arial Black", sans-serif';
        ctx.fillText('SKAR', 930, 205);

        ctx.beginPath();
        ctx.arc(870, 168, 48, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#002b66';
        ctx.stroke();

        ctx.fillStyle = '#0f2e59';
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.fillText('BIURO PODRÓŻY', 850, 242);
      }

      // Website URL
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 10;
      ctx.fillText('www.oskar.com.pl', 830, 310);
      ctx.shadowBlur = 0;

      // Chrome model badge
      ctx.fillStyle = '#475569';
      ctx.font = 'italic bold 28px sans-serif';
      ctx.fillText('Irizar i8 • integral', 560, 80);
    }
  };

  // Immediate vector render
  drawLivery();

  // Asynchronously / synchronously overlay the exact official Oskar logo PNG image
  const logoImg = new Image();
  logoImg.onload = () => {
    drawLivery(logoImg);
    texture.needsUpdate = true;
  };
  logoImg.src = OSKAR_LOGO_BASE64;
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    drawLivery(logoImg);
  }

  return texture;
}

// 5. Front Mask Grille & Headlight Texture
export function createFrontFaceTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Silver metallic paint background
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Central dark intake section
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(250, 280, 524, 160, 24);
  ctx.fill();

  // Mesh honey-comb pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  for (let y = 290; y < 430; y += 14) {
    for (let x = 260; x < 760; x += 20) {
      ctx.strokeRect(x, y, 16, 10);
    }
  }

  // Chrome V-smile bar
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(120, 220);
  ctx.quadraticCurveTo(512, 360, 904, 220);
  ctx.stroke();

  // Headlight clusters (Left and Right)
  const drawHeadlight = (x: number, isRight: boolean) => {
    ctx.save();
    ctx.translate(x, 180);
    if (!isRight) ctx.scale(-1, 1);

    // Dark housing
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(240, -40);
    ctx.lineTo(220, 90);
    ctx.lineTo(20, 80);
    ctx.closePath();
    ctx.fill();

    // Chrome projector lenses
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(60, 35, 26, 0, Math.PI * 2);
    ctx.arc(140, 25, 22, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Boomerang LED DRL
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(10, 65);
    ctx.lineTo(190, 75);
    ctx.lineTo(220, -25);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  drawHeadlight(110, true);
  drawHeadlight(914, false);

  // Center Irizar Logo
  ctx.save();
  ctx.translate(512, 230);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 48, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Irizar', 0, 8);
  ctx.restore();

  // "Centrum Turystyki OSKAR" front lettering
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Centrum Turystyki OSKAR', 512, 140);

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 6. Authentic Irizar i8 Rear Face Texture (matching user photo image_b6f15311.png)
export function createRearFaceTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;

  // 1. Light Metallic Silver background (matching silver body)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#d8dce2');
  bgGrad.addColorStop(0.3, '#d0d5db');
  bgGrad.addColorStop(0.7, '#c5cbd3');
  bgGrad.addColorStop(1, '#b6bdc6');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle 3D side shoulder shading
  const leftShadow = ctx.createLinearGradient(0, 0, 160, 0);
  leftShadow.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
  leftShadow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = leftShadow;
  ctx.fillRect(0, 0, 160, canvas.height);

  const rightShadow = ctx.createLinearGradient(canvas.width, 0, canvas.width - 160, 0);
  rightShadow.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
  rightShadow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = rightShadow;
  ctx.fillRect(canvas.width - 160, 0, 160, canvas.height);

  // 2. Rear Window (Trapezoid / Hexagon with chamfered top corners & curved lower sill)
  ctx.save();
  // Outer black ceramic frit border
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(180, 110);
  ctx.lineTo(844, 110);
  ctx.lineTo(890, 480);
  ctx.quadraticCurveTo(512, 530, 134, 480);
  ctx.closePath();
  ctx.fill();

  // Glossy dark tinted glass
  const glassGrad = ctx.createLinearGradient(0, 140, 0, 480);
  glassGrad.addColorStop(0, '#020617');
  glassGrad.addColorStop(0.5, '#0f172a');
  glassGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(215, 140);
  ctx.lineTo(809, 140);
  ctx.lineTo(845, 455);
  ctx.quadraticCurveTo(512, 498, 179, 455);
  ctx.closePath();
  ctx.fill();

  // Glass reflection highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(230, 150);
  ctx.lineTo(460, 150);
  ctx.lineTo(360, 470);
  ctx.lineTo(210, 450);
  ctx.closePath();
  ctx.fill();

  // Top center rearview camera pod
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(476, 120, 72, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(512, 137, 10, 0, Math.PI * 2);
  ctx.fill();

  // Chrome lower window sill bar (sweeping across bottom of window)
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(134, 480);
  ctx.quadraticCurveTo(512, 530, 890, 480);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 3. Central Red Auxiliary Reflector (above louvers)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(456, 580, 112, 18, 9);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 4. Three Distinctive Irizar Horizontal Curved Smile Louvers / Vents
  const drawLouver = (y: number, w: number, h: number) => {
    ctx.save();
    ctx.translate(512, y);

    // Deep black recessed slot
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(0, h * 1.8, w / 2, 0);
    ctx.quadraticCurveTo(0, h * 0.4, -w / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Upper shadow and lower chrome/silver bevel rim
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(0, h * 1.8, w / 2, 0);
    ctx.stroke();

    ctx.restore();
  };

  drawLouver(640, 460, 28);
  drawLouver(705, 410, 26);
  drawLouver(765, 340, 24);

  // Chrome "i8 integral" badge to the right of louvers
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('i8', 660, 755);
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('integral', 705, 755);

  // Lower Engine Hatch Vacation Sea Wrap (matching p_1_90b64b9d.jpg & l_1_eaabf3b5.jpg)
  const rearSeaGrad = ctx.createLinearGradient(0, 810, 0, 1140);
  rearSeaGrad.addColorStop(0, '#06b6d4');
  rearSeaGrad.addColorStop(0.4, '#0284c7');
  rearSeaGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = rearSeaGrad;
  ctx.beginPath();
  ctx.moveTo(140, 810);
  ctx.lineTo(884, 810);
  ctx.lineTo(920, 1140);
  ctx.lineTo(104, 1140);
  ctx.closePath();
  ctx.fill();

  // Vacation beach family on the rear hatch
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(320, 960, 120, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small rear Oskar logo on beach wrap
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Centrum Turystyki', 260, 925);
  ctx.font = '900 44px "Arial Black", sans-serif';
  ctx.fillText('OSKAR', 260, 965);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('www.oskar.com.pl', 260, 995);

  // Central engine hatch latch handle
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(476, 960, 72, 42, 8);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(492, 975, 40, 12);

  // 5. Sculpted Vertical Curved LED Tail Light Clusters
  const drawTailLight = (isRight: boolean) => {
    ctx.save();
    const xBase = isRight ? 840 : 184;
    ctx.translate(xBase, 720);
    if (!isRight) ctx.scale(-1, 1);

    // Outer dark bezel
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(45, 180, 55, 420);
    ctx.lineTo(-45, 420);
    ctx.quadraticCurveTo(-40, 180, -20, 0);
    ctx.closePath();
    ctx.fill();

    // Deep ruby-red lens
    const lensGrad = ctx.createLinearGradient(0, 0, 40, 420);
    lensGrad.addColorStop(0, '#7f1d1d');
    lensGrad.addColorStop(0.5, '#991b1b');
    lensGrad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.quadraticCurveTo(40, 180, 50, 414);
    ctx.lineTo(-40, 414);
    ctx.quadraticCurveTo(-35, 180, -16, 6);
    ctx.closePath();
    ctx.fill();

    // Bright Glowing LED Light Guides (Red neon C-ribbons)
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 9;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.quadraticCurveTo(34, 180, 42, 400);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, 30);
    ctx.quadraticCurveTo(16, 180, 22, 400);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Clear Reverse Light and Amber Indicator horizontal segments in middle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-18, 190, 48, 24);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-18, 220, 48, 24);

    ctx.restore();
  };

  drawTailLight(true);
  drawTailLight(false);

  // 6. Lower Bumper, Parking Sensors & Polish License Plate "KR 3X746"
  // Bumper seam crease
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 1140);
  ctx.lineTo(944, 1140);
  ctx.stroke();

  // Recessed license plate well
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.roundRect(280, 1200, 464, 130, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Polish License Plate "KR 6U376" (matching p_1_90b64b9d.jpg & l_1_eaabf3b5.jpg)
  ctx.save();
  ctx.translate(300, 1215);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 424, 100);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(2, 2, 420, 96);

  // Blue EU strip
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(6, 6, 48, 88);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(30, 32, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PL', 30, 78);

  // Black plate characters
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 62px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '5px';
  ctx.fillText('KR 6U376', 236, 74);
  ctx.restore();

  // Bumper horizontal slim red reflectors
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(140, 1240, 90, 14, 6);
  ctx.roundRect(794, 1240, 90, 14, 6);
  ctx.fill();

  // 4 Black ultrasonic parking sensors
  ctx.fillStyle = '#1e293b';
  [185, 340, 684, 839].forEach((sx) => {
    ctx.beginPath();
    ctx.arc(sx, 1180, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Lower diffuser bottom edge
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 6. Wheel Chrome Rim & Tire Texture
export function createWheelTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;

  // Outer black tire tread
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(center, center, center - 4, 0, Math.PI * 2);
  ctx.fill();

  // Sidewall groove
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(center, center, center - 40, 0, Math.PI * 2);
  ctx.stroke();

  // Chrome wheel rim
  const rimGrad = ctx.createRadialGradient(center, center, 40, center, center, 190);
  rimGrad.addColorStop(0, '#cbd5e1');
  rimGrad.addColorStop(0.5, '#f8fafc');
  rimGrad.addColorStop(0.85, '#94a3b8');
  rimGrad.addColorStop(1, '#475569');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(center, center, 190, 0, Math.PI * 2);
  ctx.fill();

  // Polished spokes / vents
  ctx.fillStyle = '#18181b';
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const sx = center + Math.cos(angle) * 125;
    const sy = center + Math.sin(angle) * 125;
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chrome center hubcap & lug nuts
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(center, center, 65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const lx = center + Math.cos(angle) * 45;
    const ly = center + Math.sin(angle) * 45;
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Irizar center chrome emblem
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(center, center, 24, 0, Math.PI * 2);
  ctx.fill();

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 7. Luxury Seat Leather Texture
export function createSeatLeatherTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#262626';
  ctx.fillRect(160, 0, 192, canvas.height);

  ctx.strokeStyle = '#e2d9cd';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(158, 0);
  ctx.lineTo(158, canvas.height);
  ctx.moveTo(354, 0);
  ctx.lineTo(354, canvas.height);
  ctx.stroke();

  ctx.fillStyle = '#171717';
  for (let y = 10; y < canvas.height; y += 16) {
    for (let x = 175; x < 340; x += 16) {
      ctx.beginPath();
      ctx.arc(x + (y % 32 === 0 ? 8 : 0), y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 8. Infotainment Screen UI Texture
export function createInfotainmentTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('OSKAR MULTIMEDIA HUB', 32, 40);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('14:35  •  Wi-Fi 5G OK  •  Trasa: Kraków ➔ Rzym', canvas.width - 32, 40);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('Witaj w podróży z OSKAR', 48, 130);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '22px sans-serif';
  ctx.fillText('Wybierz rozrywkę pokładową na czas jazdy autokarem Irizar i8', 48, 170);

  const tiles = [
    { title: 'Filmy & Seriale', color: '#ef4444', icon: '🎬', sub: '120+ tytułów' },
    { title: 'Muzyka & Radio', color: '#10b981', icon: '🎵', sub: 'Stacje online' },
    { title: 'Trasa i Mapa GPS', color: '#3b82f6', icon: '🗺️', sub: 'Prędkość: 98 km/h' },
    { title: 'Gry Pokładowe', color: '#8b5cf6', icon: '🎮', sub: 'Quizy & Arcade' },
    { title: 'Przewodnik Oskar', color: '#f59e0b', icon: '🏛️', sub: 'Atrakcje na trasie' },
    { title: 'Kamera Przednia', color: '#06b6d4', icon: '📹', sub: 'Widok na żywo' },
  ];

  const startX = 48;
  const startY = 210;
  const tileW = 280;
  const tileH = 170;
  const gapX = 36;
  const gapY = 30;

  tiles.forEach((tile, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = startX + col * (tileW + gapX);
    const y = startY + row * (tileH + gapY);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(x, y, tileW, tileH, 16);
    ctx.fill();

    ctx.fillStyle = tile.color;
    ctx.beginPath();
    ctx.roundRect(x, y, 8, tileH, [16, 0, 0, 16]);
    ctx.fill();

    ctx.fillStyle = tile.color;
    ctx.beginPath();
    ctx.arc(x + 50, y + 55, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tile.icon, x + 50, y + 65);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(tile.title, x + 95, y + 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px sans-serif';
    ctx.fillText(tile.sub, x + 95, y + 85);
  });

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, canvas.height - 65, canvas.width, 65);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('▶ Teraz odtwarzane: Dźwięk przestrzenny Dolby Atmos • Gniazdo 230V & USB aktywne', 48, canvas.height - 26);

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 9. Carpet Runner Texture for Aisle
export function createAisleCarpetTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(12, 0, 8, canvas.height);
  ctx.fillRect(canvas.width - 20, 0, 8, canvas.height);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(24, 0, 4, canvas.height);
  ctx.fillRect(canvas.width - 28, 0, 4, canvas.height);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  return createConfiguredCanvasTexture(canvas, renderer, 1, 14);
}

// 10. Overhead Passenger Console
export function createOverheadConsoleTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(140, 128, 48, 0, Math.PI * 2);
  ctx.arc(372, 128, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(140, 128, 30, 0, Math.PI * 2);
  ctx.arc(372, 128, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(140, 128, 20, 0, Math.PI * 2);
  ctx.arc(372, 128, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(256, 128, 18, 0, Math.PI * 2);
  ctx.fill();

  return createConfiguredCanvasTexture(canvas, renderer);
}

// 11. Driver Dashboard
export function createDriverDashboardTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(260, 200);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 140, Math.PI * 0.75, Math.PI * 2.25);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('0', 0, 10);
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('km/h', 0, 50);
  ctx.restore();

  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IRIZAR i8 • DAF MX-13 480 KM', 512, 80);

  ctx.fillStyle = '#10b981';
  ctx.font = '24px sans-serif';
  ctx.fillText('ZAWIESZENIE: POZIOM STANDARD', 512, 130);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('DRZWI ZAMKNIĘTE • HAMULEC POSTOJOWY WŁ.', 512, 175);

  ctx.save();
  ctx.translate(760, 200);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 140, Math.PI * 0.75, Math.PI * 2.25);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('600', 0, 10);
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('RPM IDLE', 0, 50);
  ctx.restore();

  return createConfiguredCanvasTexture(canvas, renderer);
}
