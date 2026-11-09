import React, { useState, useEffect } from 'react';

interface VirtualDriveControlsProps {
  onDriveInputs: (throttle: number, brake: number, steer: number) => void;
  visible: boolean;
  engineRunning: boolean;
  onToggleEngine: () => void;
}

export const VirtualJoystick: React.FC<VirtualDriveControlsProps> = ({
  onDriveInputs,
  visible,
  engineRunning,
  onToggleEngine,
}) => {
  const [gasActive, setGasActive] = useState(false);
  const [brakeActive, setBrakeActive] = useState(false);
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);

  useEffect(() => {
    const throttle = gasActive ? 1.0 : 0.0;
    const brake = brakeActive ? 1.0 : 0.0;
    const steer = (rightActive ? 1.0 : 0.0) - (leftActive ? 1.0 : 0.0);
    onDriveInputs(throttle, brake, steer);
  }, [gasActive, brakeActive, leftActive, rightActive, onDriveInputs]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-5 select-none">
      {/* LEFT: STEERING CONTROLS */}
      <div className="flex items-center gap-3 pointer-events-auto mb-20 sm:mb-24">
        <button
          onTouchStart={() => setLeftActive(true)}
          onTouchEnd={() => setLeftActive(false)}
          onMouseDown={() => setLeftActive(true)}
          onMouseUp={() => setLeftActive(false)}
          onMouseLeave={() => setLeftActive(false)}
          className={`w-16 h-16 rounded-2xl border-2 font-bold text-2xl flex items-center justify-center shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
            leftActive
              ? 'bg-sky-500 border-sky-300 text-white shadow-sky-500/50'
              : 'bg-slate-900/80 border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          title="Skręć w lewo (Klawisz A)"
        >
          ◀
        </button>

        <button
          onTouchStart={() => setRightActive(true)}
          onTouchEnd={() => setRightActive(false)}
          onMouseDown={() => setRightActive(true)}
          onMouseUp={() => setRightActive(false)}
          onMouseLeave={() => setRightActive(false)}
          className={`w-16 h-16 rounded-2xl border-2 font-bold text-2xl flex items-center justify-center shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
            rightActive
              ? 'bg-sky-500 border-sky-300 text-white shadow-sky-500/50'
              : 'bg-slate-900/80 border-slate-600 text-slate-200 hover:bg-slate-800'
          }`}
          title="Skręć w prawo (Klawisz D)"
        >
          ▶
        </button>
      </div>

      {/* CENTER HINT (If engine is off) */}
      {!engineRunning && (
        <button
          onClick={onToggleEngine}
          className="pointer-events-auto mb-24 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl animate-pulse flex items-center gap-2"
        >
          <span>⚡ Włącz silnik, aby ruszyć!</span>
        </button>
      )}

      {/* RIGHT: THROTTLE & BRAKE PEDALS */}
      <div className="flex items-center gap-3 pointer-events-auto mb-20 sm:mb-24">
        <button
          onTouchStart={() => setBrakeActive(true)}
          onTouchEnd={() => setBrakeActive(false)}
          onMouseDown={() => setBrakeActive(true)}
          onMouseUp={() => setBrakeActive(false)}
          onMouseLeave={() => setBrakeActive(false)}
          className={`w-16 h-20 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
            brakeActive
              ? 'bg-red-600 border-red-400 text-white shadow-red-500/50'
              : 'bg-slate-900/80 border-red-700/60 text-red-200 hover:bg-slate-800'
          }`}
          title="Hamulec / Wsteczny (Klawisz S)"
        >
          <span className="text-lg">▼</span>
          <span className="text-[10px] uppercase font-extrabold mt-0.5">HAMUJ</span>
        </button>

        <button
          onTouchStart={() => setGasActive(true)}
          onTouchEnd={() => setGasActive(false)}
          onMouseDown={() => setGasActive(true)}
          onMouseUp={() => setGasActive(false)}
          onMouseLeave={() => setGasActive(false)}
          className={`w-18 h-24 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
            gasActive
              ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-emerald-500/50'
              : 'bg-emerald-950/80 border-emerald-600 text-emerald-200 hover:bg-emerald-900'
          }`}
          title="Dodaj gazu (Klawisz W)"
        >
          <span className="text-xl">▲</span>
          <span className="text-[11px] uppercase font-extrabold mt-1">GAZ</span>
        </button>
      </div>
    </div>
  );
};
