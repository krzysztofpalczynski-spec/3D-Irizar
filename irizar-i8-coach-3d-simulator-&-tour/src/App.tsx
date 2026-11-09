import { useEffect, useRef, useState } from 'react';
import { BusSceneManager } from './three/sceneManager';
import { HUD } from './components/HUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { BusState, CameraMode, TimeOfDay } from './types';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<BusSceneManager | null>(null);

  // Sync state for React UI
  const [busState, setBusState] = useState<BusState>({
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
  });

  const [engineAlert, setEngineAlert] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch capability
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (!mountRef.current) return;

    // Instantiate scene manager
    const manager = new BusSceneManager(mountRef.current);
    sceneManagerRef.current = manager;

    // Engine start prompt callback
    manager.onEngineNeeded = () => {
      setEngineAlert(true);
      setTimeout(() => setEngineAlert(false), 3500);
    };

    setBusState(manager.getState());

    // Lightweight telemetry sync loop for speedometer & gear gauge (~15 FPS)
    const syncInterval = window.setInterval(() => {
      if (sceneManagerRef.current) {
        setBusState(sceneManagerRef.current.getState());
      }
    }, 65);

    return () => {
      clearInterval(syncInterval);
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Handlers for HUD interaction
  const handleSelectCamera = (mode: CameraMode) => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setCameraMode(mode);
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleFrontDoor = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleFrontDoor();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleMiddleDoor = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleMiddleDoor();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleLuggage = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleLuggageBays();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleKneel = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleKneeling();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleHeadlights = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleHeadlights();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleInteriorLights = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleInteriorLights();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleEngine = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleEngine();
    setEngineAlert(false);
    setBusState(sceneManagerRef.current.getState());
  };

  const handleToggleAudio = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.toggleAudio();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleResetPosition = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.resetBusPosition();
    setBusState(sceneManagerRef.current.getState());
  };

  const handleChangeTimeOfDay = (time: TimeOfDay) => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setTimeOfDay(time);
    setBusState(sceneManagerRef.current.getState());
  };

  const handleDriveInputs = (throttle: number, brake: number, steer: number) => {
    sceneManagerRef.current?.setDriveInputs(throttle, brake, steer);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Three.js WebGL canvas mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Driving HUD */}
      <HUD
        state={busState}
        engineAlert={engineAlert}
        onSelectCamera={handleSelectCamera}
        onToggleFrontDoor={handleToggleFrontDoor}
        onToggleMiddleDoor={handleToggleMiddleDoor}
        onToggleLuggage={handleToggleLuggage}
        onToggleKneel={handleToggleKneel}
        onToggleHeadlights={handleToggleHeadlights}
        onToggleInteriorLights={handleToggleInteriorLights}
        onToggleEngine={handleToggleEngine}
        onToggleAudio={handleToggleAudio}
        onResetPosition={handleResetPosition}
        onChangeTimeOfDay={handleChangeTimeOfDay}
      />

      {/* On-screen touch pedals & steer buttons for mobile/tablet */}
      <VirtualJoystick
        visible={isTouchDevice}
        engineRunning={busState.engineRunning}
        onToggleEngine={handleToggleEngine}
        onDriveInputs={handleDriveInputs}
      />
    </div>
  );
}
