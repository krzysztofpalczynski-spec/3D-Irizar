import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BusState, CameraMode } from '../types';
import { createMaterials, SceneMaterials } from './materials';
import { createIrizarCoach, BusComponents } from './busModel';
import { createParkingEnvironment, ParkingEnvironment } from './parkingEnvironment';
import { busAudio } from './audio';

// Scratch vectors for high-frequency physics math (zero GC pressure)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

export class BusSceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;

  private materials!: SceneMaterials;
  private bus!: BusComponents;
  private parking!: ParkingEnvironment;

  // Lighting
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private skyBackground!: THREE.Color;

  // Driving Physics State (14-meter Coach Kinematics)
  private busPos = new THREE.Vector3(0, 0, 0);
  private busHeading: number = 0; // 0 rad = facing +Z
  private busSpeed: number = 0; // m/s (1 m/s = 3.6 km/h)
  private busSteerAngle: number = 0; // Front wheel steer angle in radians
  private isBraking: boolean = false;
  private isReversing: boolean = false;
  private isAccelerating: boolean = false;
  private keysPressed: Record<string, boolean> = {};

  // Touch / Virtual driving inputs (for mobile users)
  private virtualThrottle: number = 0; // 0 to 1
  private virtualBrake: number = 0; // 0 to 1
  private virtualSteer: number = 0; // -1 (left) to +1 (right)

  // Camera Management
  private cameraMode: CameraMode = 'chase';
  private chaseCamPos = new THREE.Vector3(0, 6.6, -11.5);
  private chaseCamTarget = new THREE.Vector3(0, 2.4, 2.0);
  private isTransitioning: boolean = false;

  // Lifecycle & Performance
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  // State
  private state: BusState = {
    frontDoorOpen: false,
    middleDoorOpen: false,
    luggageBaysOpen: false,
    headlightsOn: false,
    interiorLightsOn: true,
    kneeling: false,
    engineRunning: false,
    timeOfDay: 'day',
    cameraMode: 'chase',
    audioEnabled: true,
    speedMultiplier: 1.0,
    speedKmh: 0,
    gear: 'P',
    rpm: 0,
    steerAngle: 0,
    isBraking: false,
  };

  // Callback to notify UI when engine start is needed
  public onEngineNeeded?: () => void;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.init();
  }

  private init() {
    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer configuration adhering to Three.js r160+ directives
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.skyBackground = new THREE.Color(0xbbe5fd);
    this.scene.background = this.skyBackground;
    this.scene.fog = new THREE.FogExp2(0xbbe5fd, 0.0022); // subtle fog for large 450m plaza

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Camera & Orbit Controls
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.2,
      600
    );
    this.camera.position.set(0, 6.6, -11.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 120;
    this.controls.target.set(0, 1.6, 1.5);
    this.controls.enabled = false; // Enabled only in 'orbit' mode

    // 6. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.75);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    this.sunLight.position.set(50, 70, 40);
    this.sunLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 180;
      const d = 35;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0004;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    // 7. Materials & Objects
    this.materials = createMaterials(this.renderer, this.isSoftwareGl);
    this.parking = createParkingEnvironment(this.materials);
    this.scene.add(this.parking.group);

    this.bus = createIrizarCoach(this.materials);
    this.scene.add(this.bus.rootGroup);

    // Initial camera position behind the bus
    this.setCameraMode('chase');

    // 8. Event Listeners
    this.setupEventListeners();

    // 9. Start Render Loop
    this.lastTime = performance.now();
    this.tick();
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;

    // Quick engine toggle on 'E'
    if (e.code === 'KeyE') {
      this.toggleEngine();
    }
    // Quick reset position on 'KeyR'
    if (e.code === 'KeyR') {
      this.resetBusPosition();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  // ==========================================
  // REALISTIC COACH DRIVING KINEMATICS PHYSICS
  // ==========================================
  private updateDrivingPhysics(delta: number) {
    // 1. Gather Inputs (Keyboard W/S/A/D, Arrow keys, or Touch)
    const keyForward = this.keysPressed['KeyW'] || this.keysPressed['ArrowUp'];
    const keyBackward = this.keysPressed['KeyS'] || this.keysPressed['ArrowDown'];
    const keyLeft = this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft'];
    const keyRight = this.keysPressed['KeyD'] || this.keysPressed['ArrowRight'];
    const keyHandbrake = this.keysPressed['Space'];

    let throttleInput = (keyForward ? 1.0 : 0.0) + this.virtualThrottle;
    let brakeInput = (keyBackward ? 1.0 : 0.0) + this.virtualBrake;
    let steerInput = 0;
    if (keyLeft) steerInput += 1.0;
    if (keyRight) steerInput -= 1.0;
    if (Math.abs(this.virtualSteer) > 0.05) steerInput -= this.virtualSteer;

    throttleInput = Math.min(1.0, Math.max(0.0, throttleInput));
    brakeInput = Math.min(1.0, Math.max(0.0, brakeInput));
    steerInput = Math.min(1.0, Math.max(-1.0, steerInput));

    // CRITICAL ENGINE RULE: Engine MUST be on to accelerate forward or backward
    const engineOn = this.state.engineRunning;
    if (!engineOn && (throttleInput > 0.1 || brakeInput > 0.1)) {
      if (this.onEngineNeeded) {
        this.onEngineNeeded();
      }
      throttleInput = 0;
      // Allow braking if rolling with engine off
    }

    // 2. Longitudinal Vehicle Dynamics (Acceleration / Braking / Reverse)
    this.isBraking = false;
    this.isAccelerating = false;
    this.isReversing = false;

    // Coach specs: Length 14m, Wheelbase 8.7m, Weight ~19 tons
    const maxForwardSpeed = 25.0; // m/s (~90 km/h)
    const maxReverseSpeed = -5.5; // m/s (~20 km/h)
    const engineAccel = 3.4; // m/s^2 at low speed
    const normalBrakeDecel = 7.2; // m/s^2
    const handbrakeDecel = 9.5; // m/s^2
    const naturalRollingDrag = 0.55; // coasting drag

    if (keyHandbrake) {
      // Emergency handbrake
      this.isBraking = true;
      this.busSpeed = THREE.MathUtils.damp(this.busSpeed, 0, handbrakeDecel, delta);
    } else if (throttleInput > 0 && engineOn) {
      // Forward throttle
      this.isAccelerating = true;
      if (this.busSpeed < -0.2) {
        // If currently moving backward, throttle acts as brake against reverse motion
        this.busSpeed += normalBrakeDecel * delta;
        this.isBraking = true;
      } else {
        // Accelerate forward with realistic torque curve tapering near top speed
        const speedRatio = Math.max(0, this.busSpeed) / maxForwardSpeed;
        const availableTorque = Math.max(0.25, 1.0 - Math.pow(speedRatio, 1.3));
        const effectiveAccel = engineAccel * availableTorque * throttleInput;
        this.busSpeed = Math.min(maxForwardSpeed, this.busSpeed + effectiveAccel * delta);
      }
    } else if (brakeInput > 0) {
      // S key behavior:
      // If moving forward (> 0.2 m/s), S is the foot brake!
      // If stationary or already in reverse, S engages Reverse gear and backs up!
      if (this.busSpeed > 0.2) {
        this.isBraking = true;
        this.busSpeed = Math.max(0, this.busSpeed - normalBrakeDecel * brakeInput * delta);
        if (this.busSpeed < 1.0) {
          busAudio.playBrakeAirSound();
        }
      } else if (engineOn) {
        // Reverse drive
        this.isReversing = true;
        const revAccel = 2.2 * brakeInput;
        this.busSpeed = Math.max(maxReverseSpeed, this.busSpeed - revAccel * delta);
      }
    } else {
      // Coasting with natural friction
      if (Math.abs(this.busSpeed) > 0.05) {
        this.busSpeed = THREE.MathUtils.damp(this.busSpeed, 0, naturalRollingDrag, delta);
      } else {
        this.busSpeed = 0;
      }
    }

    // 3. Lateral Dynamics & Ackermann Steering
    // Speed-dependent steering ratio: high speed reduces steering lock for smooth stability
    const maxSteerAngle = 0.54; // ~31 degrees steering lock
    const currentSpeedKmh = Math.abs(this.busSpeed * 3.6);
    const speedDamping = 1.0 / (1.0 + currentSpeedKmh * 0.035);
    const targetSteerAngle = steerInput * maxSteerAngle * speedDamping;

    // Steering wheel return-to-center spring & responsiveness
    const steerResponsiveness = 5.5;
    this.busSteerAngle = THREE.MathUtils.damp(this.busSteerAngle, targetSteerAngle, steerResponsiveness, delta);

    // Bicycle model kinematics:
    // Yaw rate: dHeading/dt = (v / L) * tan(delta_steer)
    const wheelbase = 8.7; // meters between front steering axle and center of rear tandem bogie
    if (Math.abs(this.busSpeed) > 0.01) {
      const yawRate = (this.busSpeed / wheelbase) * Math.tan(this.busSteerAngle);
      this.busHeading += yawRate * delta;
    }

    // 4. Update Bus 3D Position & Orientation
    const forwardX = Math.sin(this.busHeading);
    const forwardZ = Math.cos(this.busHeading);

    this.busPos.x += forwardX * this.busSpeed * delta;
    this.busPos.z += forwardZ * this.busSpeed * delta;

    // Plaza boundaries: keep bus within the huge 400m driving plaza
    const plazaLimit = 200;
    if (Math.abs(this.busPos.x) > plazaLimit) {
      this.busPos.x = Math.sign(this.busPos.x) * plazaLimit;
      this.busSpeed = 0;
    }
    if (Math.abs(this.busPos.z) > plazaLimit) {
      this.busPos.z = Math.sign(this.busPos.z) * plazaLimit;
      this.busSpeed = 0;
    }

    // Apply to 3D Bus Group
    this.bus.rootGroup.position.set(this.busPos.x, 0, this.busPos.z);
    this.bus.rootGroup.rotation.y = this.busHeading;

    // Follow light with bus for shadow coverage
    if (!this.isSoftwareGl && this.sunLight) {
      this.sunLight.target.position.set(this.busPos.x, 0, this.busPos.z);
      this.sunLight.target.updateMatrixWorld();
    }

    // 5. Wheel Rolling Physics
    // Wheel radius r = 0.52m -> circumference = 2 * PI * 0.52 = 3.267m
    const wheelRadius = 0.52;
    const rollDelta = (this.busSpeed * delta) / wheelRadius;

    // 6. Update Audio Engine Pitch & Throttle Response
    busAudio.updateEngineDrive(
      this.busSpeed * 3.6,
      this.isAccelerating,
      this.state.engineRunning,
      this.isReversing
    );

    // 7. Update Telemetry State for UI
    this.state.speedKmh = Math.round(this.busSpeed * 3.6);
    this.state.isBraking = this.isBraking;
    this.state.steerAngle = this.busSteerAngle;
    this.state.gear = !engineOn
      ? 'P'
      : this.busSpeed < -0.1
      ? 'R'
      : this.busSpeed > 0.4
      ? 'D'
      : 'N';
    this.state.rpm = !engineOn
      ? 0
      : Math.round(620 + Math.abs(this.busSpeed * 3.6) * 16 + (this.isAccelerating ? 280 : 0));

    // 8. Update Bus Model 3D Details (Steering pivots, wheel rotation, brake lights, doors)
    this.bus.update(delta, {
      frontDoorOpen: this.state.frontDoorOpen,
      middleDoorOpen: this.state.middleDoorOpen,
      luggageBaysOpen: this.state.luggageBaysOpen,
      kneeling: this.state.kneeling,
      headlightsOn: this.state.headlightsOn,
      interiorLightsOn: this.state.interiorLightsOn,
      steerAngle: this.busSteerAngle,
      rollDelta: rollDelta,
      isBraking: this.isBraking,
      isReversing: this.isReversing,
    });
  }

  // ==========================================
  // DYNAMIC DRIVING CAMERA CONTROLLERS
  // ==========================================
  private updateCamera(delta: number) {
    const forwardX = Math.sin(this.busHeading);
    const forwardZ = Math.cos(this.busHeading);

    switch (this.cameraMode) {
      case 'chase': {
        // Elevated chase camera from slightly above matching user screenshot (image_cb6358e8.png)
        const speedOffset = Math.min(3.5, Math.abs(this.busSpeed) * 0.14);
        const distanceBehind = 11.5 + speedOffset;
        const heightAbove = 6.6 + speedOffset * 0.18;

        _camOffset.set(
          this.busPos.x - forwardX * distanceBehind,
          heightAbove,
          this.busPos.z - forwardZ * distanceBehind
        );

        _targetPos.set(
          this.busPos.x + forwardX * 2.0,
          2.4,
          this.busPos.z + forwardZ * 2.0
        );

        // Smooth spring damping for natural vehicle feel
        this.camera.position.lerp(_camOffset, 6.5 * delta);
        this.chaseCamTarget.lerp(_targetPos, 8.0 * delta);
        this.camera.lookAt(this.chaseCamTarget);
        break;
      }

      case 'driver-hood': {
        // Immersive hood / windshield perspective right above front bumper
        const hoodX = this.busPos.x + forwardX * 6.8 + Math.cos(this.busHeading) * 0.65;
        const hoodY = 2.45;
        const hoodZ = this.busPos.z + forwardZ * 6.8 - Math.sin(this.busHeading) * 0.65;

        this.camera.position.set(hoodX, hoodY, hoodZ);
        _targetPos.set(
          this.busPos.x + forwardX * 28.0,
          2.0,
          this.busPos.z + forwardZ * 28.0
        );
        this.camera.lookAt(_targetPos);
        break;
      }

      case 'orbit': {
        // OrbitControls centers on the moving bus
        this.controls.target.lerp(_v1.set(this.busPos.x, 1.8, this.busPos.z), 6.0 * delta);
        this.controls.update();
        break;
      }

      case 'drone': {
        // Overhead top-down bird's-eye drone tracking view
        _camOffset.set(this.busPos.x, 38.0, this.busPos.z - 12.0);
        this.camera.position.lerp(_camOffset, 5.0 * delta);
        this.camera.lookAt(this.busPos.x, 0.5, this.busPos.z);
        break;
      }
    }
  }

  // Software WebGL pacing helper
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Vehicle Driving Physics loop
    this.updateDrivingPhysics(delta);

    // 2. Camera tracking loop
    this.updateCamera(delta);

    // 3. Render
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  // ==========================================
  // PUBLIC CONTROLLER METHODS
  // ==========================================
  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    this.state.cameraMode = mode;
    this.controls.enabled = mode === 'orbit';

    busAudio.playClickSound();

    if (mode === 'orbit') {
      // Place orbit camera at nice 3/4 hero angle relative to current bus position
      const forwardX = Math.sin(this.busHeading);
      const forwardZ = Math.cos(this.busHeading);
      const sideX = Math.cos(this.busHeading);
      const sideZ = -Math.sin(this.busHeading);

      this.camera.position.set(
        this.busPos.x - sideX * 9.5 - forwardX * 6.5,
        3.8,
        this.busPos.z - sideZ * 9.5 - forwardZ * 6.5
      );
      this.controls.target.set(this.busPos.x, 1.8, this.busPos.z);
    }
  }

  // Reset bus back to starting bay at (0, 0, 0)
  public resetBusPosition() {
    this.busPos.set(0, 0, 0);
    this.busHeading = 0;
    this.busSpeed = 0;
    this.busSteerAngle = 0;
    this.isBraking = false;
    this.isReversing = false;
    this.isAccelerating = false;

    this.bus.rootGroup.position.set(0, 0, 0);
    this.bus.rootGroup.rotation.y = 0;

    busAudio.playClickSound();
  }

  // Mobile / Touch driving inputs
  public setDriveInputs(throttle: number, brake: number, steer: number) {
    this.virtualThrottle = throttle;
    this.virtualBrake = brake;
    this.virtualSteer = steer;
  }

  public toggleFrontDoor() {
    this.state.frontDoorOpen = !this.state.frontDoorOpen;
    busAudio.playDoorSound(this.state.frontDoorOpen);
    return this.state.frontDoorOpen;
  }

  public toggleMiddleDoor() {
    this.state.middleDoorOpen = !this.state.middleDoorOpen;
    busAudio.playDoorSound(this.state.middleDoorOpen);
    return this.state.middleDoorOpen;
  }

  public toggleLuggageBays() {
    this.state.luggageBaysOpen = !this.state.luggageBaysOpen;
    busAudio.playDoorSound(this.state.luggageBaysOpen);
    return this.state.luggageBaysOpen;
  }

  public toggleKneeling() {
    this.state.kneeling = !this.state.kneeling;
    busAudio.playKneelSound();
    return this.state.kneeling;
  }

  public toggleHeadlights() {
    this.state.headlightsOn = !this.state.headlightsOn;
    busAudio.playClickSound();
    return this.state.headlightsOn;
  }

  public toggleInteriorLights() {
    this.state.interiorLightsOn = !this.state.interiorLightsOn;
    busAudio.playClickSound();
    return this.state.interiorLightsOn;
  }

  public toggleEngine() {
    this.state.engineRunning = !this.state.engineRunning;
    busAudio.setEngineRunning(this.state.engineRunning);
    return this.state.engineRunning;
  }

  public toggleAudio() {
    this.state.audioEnabled = !this.state.audioEnabled;
    busAudio.setMuted(!this.state.audioEnabled);
    return this.state.audioEnabled;
  }

  public setTimeOfDay(time: 'day' | 'sunset' | 'night') {
    this.state.timeOfDay = time;
    this.parking.update(time);

    if (time === 'day') {
      this.skyBackground.setHex(0xbbe5fd);
      this.scene.fog = new THREE.FogExp2(0xbbe5fd, 0.0022);
      this.sunLight.color.setHex(0xfff7ed);
      this.sunLight.intensity = 2.4;
      this.sunLight.position.set(50, 70, 40);
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.75;
      this.state.headlightsOn = false;
    } else if (time === 'sunset') {
      this.skyBackground.setHex(0xea580c);
      this.scene.fog = new THREE.FogExp2(0xea580c, 0.0032);
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 1.8;
      this.sunLight.position.set(70, 25, -30);
      this.hemiLight.color.setHex(0xfed7aa);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 0.55;
      this.state.headlightsOn = true;
    } else {
      // Night
      this.skyBackground.setHex(0x090d16);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.0045);
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.2;
      this.sunLight.position.set(-30, 45, -30);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.25;
      this.state.headlightsOn = true;
      this.state.interiorLightsOn = true;
    }
  }

  public getState(): BusState {
    return { ...this.state };
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.controls.dispose();
    this.materials.dispose();
    this.renderer.dispose();
    busAudio.setEngineRunning(false);

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
