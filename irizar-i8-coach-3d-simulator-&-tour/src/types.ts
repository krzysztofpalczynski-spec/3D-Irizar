export type CameraMode = 'chase' | 'driver-hood' | 'orbit' | 'drone';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface BusState {
  frontDoorOpen: boolean;
  middleDoorOpen: boolean;
  luggageBaysOpen: boolean;
  headlightsOn: boolean;
  interiorLightsOn: boolean;
  kneeling: boolean;
  engineRunning: boolean;
  timeOfDay: TimeOfDay;
  cameraMode: CameraMode;
  audioEnabled: boolean;
  speedMultiplier: number;
  // Driving Telemetry
  speedKmh: number;
  gear: 'P' | 'D' | 'R' | 'N';
  rpm: number;
  steerAngle: number;
  isBraking: boolean;
}

export interface CameraPreset {
  id: CameraMode;
  label: string;
  sublabel: string;
  iconName?: string;
}
