import React, { useState, useEffect } from 'react';
import { CameraMode, TimeOfDay, BusState } from '../types';
import {
  Compass,
  Video,
  Eye,
  Camera,
  Sun,
  Sunset,
  Moon,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  DoorOpen,
  Power,
  Sliders,
  RotateCcw,
  Sparkles,
  Gauge,
  AlertTriangle,
} from 'lucide-react';

interface HUDProps {
  state: BusState;
  engineAlert: boolean;
  onSelectCamera: (mode: CameraMode) => void;
  onToggleFrontDoor: () => void;
  onToggleMiddleDoor: () => void;
  onToggleLuggage: () => void;
  onToggleKneel: () => void;
  onToggleHeadlights: () => void;
  onToggleInteriorLights: () => void;
  onToggleEngine: () => void;
  onToggleAudio: () => void;
  onResetPosition: () => void;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  engineAlert,
  onSelectCamera,
  onToggleFrontDoor,
  onToggleMiddleDoor,
  onToggleLuggage,
  onToggleKneel,
  onToggleHeadlights,
  onToggleInteriorLights,
  onToggleEngine,
  onToggleAudio,
  onResetPosition,
  onChangeTimeOfDay,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'driving' | 'doors' | 'lighting'>('driving');

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      {/* 1. TOP-LEFT MINIMAL SPEC & SPEEDOMETER / TELEMETRY BADGE */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto select-none flex flex-col gap-2 max-w-sm">
        <div className="bg-slate-900/90 text-white border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h1 className="font-bold text-sm tracking-wide text-white">IRIZAR i8 • OSKAR PREMIUM</h1>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950 border border-sky-600/50 text-sky-300">
              SYMULATOR JAZDY
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Autokar turystyczny 14m • Trzyosiowy • DAF 480 KM
          </p>

          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Rejestracja: <strong className="text-white">KR 6U376</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Oskar.com.pl</span>
          </div>

          {/* TELEMETRY WIDGET (Speedometer + Gear + RPM) */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-xl p-2.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prędkość</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-mono leading-none tracking-tight">
                  {state.speedKmh}
                </span>
                <span className="text-xs font-semibold text-slate-400">km/h</span>
              </div>
            </div>

            {/* GEAR SELECTOR */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Skrzynia</span>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                {(['P', 'R', 'N', 'D'] as const).map((g) => (
                  <span
                    key={g}
                    className={`text-xs font-black px-1.5 py-0.5 rounded ${
                      state.gear === g
                        ? g === 'R'
                          ? 'bg-amber-500 text-slate-950'
                          : g === 'D'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-sky-500 text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* RPM BAR */}
            <div className="w-20">
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 font-mono">
                <span>RPM</span>
                <span>{state.rpm}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, (state.rpm / 2200) * 100)}%` }}
                />
              </div>
              {state.isBraking && (
                <span className="text-[9px] font-bold text-red-400 mt-1 block text-center animate-pulse">
                  🛑 HAMOWANIE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ENGINE GATE WARNING PROMPT (When user presses W/S while engine is OFF) */}
        {engineAlert && !state.engineRunning && (
          <div className="bg-amber-950/95 border-2 border-amber-500 rounded-xl p-3 shadow-2xl animate-bounce flex items-center gap-2.5 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-white">Silnik jest wyłączony!</p>
              <p className="text-amber-200 mt-0.5">
                Kliknij przycisk <strong>„Włącz silnik”</strong> (lub klawisz <strong>E</strong>), aby ruszyć autokarem.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP-RIGHT CONTROLS: PROMINENT ENGINE BUTTON & AUDIO */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto select-none">
        {/* Reset Position Button */}
        <button
          onClick={onResetPosition}
          className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition"
          title="Ustaw autokar z powrotem na stanowisku początkowym (Klawisz R)"
        >
          <RotateCcw className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Reset na start</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 shadow-lg transition ${
            state.audioEnabled
              ? 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
              : 'bg-red-950/90 text-red-200 border-red-800/80 hover:bg-red-900'
          }`}
          title={state.audioEnabled ? 'Wycisz dźwięki' : 'Włącz dźwięki autokaru'}
        >
          {state.audioEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{state.audioEnabled ? 'Dźwięk WŁ' : 'Wyciszony'}</span>
        </button>

        {/* CRITICAL: PROMINENT ENGINE START / STOP BUTTON */}
        <button
          onClick={onToggleEngine}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-2xl transition transform active:scale-95 ${
            state.engineRunning
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300 shadow-amber-500/40 ring-4 ring-amber-500/20 animate-pulse'
          }`}
          title={state.engineRunning ? 'Kliknij, aby zgasić silnik DAF' : 'Kliknij, aby odpalić silnik DAF (Klawisz E)'}
        >
          <Power className={`w-4 h-4 ${state.engineRunning ? 'text-white' : 'text-slate-950'}`} />
          <span>{state.engineRunning ? 'SILNIK PRACUJE (WYŁĄCZ)' : 'WŁĄCZ SILNIK'}</span>
        </button>
      </div>

      {/* 3. CENTER BOTTOM DRIVING HINTS BAR */}
      <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <div className="bg-slate-950/80 border border-slate-700/60 backdrop-blur-md px-4 py-2 rounded-full text-slate-200 text-xs font-medium shadow-xl flex items-center gap-3">
          <span><strong className="text-emerald-400 font-bold">[W]</strong> Gaz</span>
          <span className="text-slate-600">•</span>
          <span><strong className="text-red-400 font-bold">[S]</strong> Hamulec / Wsteczny</span>
          <span className="text-slate-600">•</span>
          <span><strong className="text-sky-400 font-bold">[A / D]</strong> Skręt</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline"><strong className="text-amber-400 font-bold">[Spacja]</strong> Ręczny</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline"><strong className="text-purple-400 font-bold">[R]</strong> Reset</span>
        </div>
      </div>

      {/* 4. COLLAPSIBLE BOTTOM CONTROL DOCK */}
      <div
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none transition-transform duration-300 ease-out"
        style={{
          maxWidth: 'min(920px, 95vw)',
          transform: collapsed ? 'translate(-50%, calc(100% - 36px))' : 'translate(-50%, 0)',
        }}
      >
        {/* Collapse / Expand Toggle Button */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="bg-slate-900/95 hover:bg-slate-800 text-slate-200 border-t border-x border-slate-700/80 rounded-t-xl px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-sky-400" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-400" />}
            <span>{collapsed ? 'Pokaż panel sterowania (H)' : 'Ukryj panel (H)'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 shadow-2xl text-white backdrop-blur-md">
          {/* Top Category Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('driving')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'driving'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Kamery & Jazda</span>
              </button>

              <button
                onClick={() => setActiveTab('doors')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'doors'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Drzwi & Zawieszenie</span>
              </button>

              <button
                onClick={() => setActiveTab('lighting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'lighting'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Światła & Środowisko</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Plaza Parkingu 450m</span>
            </div>
          </div>

          {/* TAB 1: DRIVING CAMERAS */}
          {activeTab === 'driving' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onSelectCamera('chase')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  state.cameraMode === 'chase'
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-inner'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Video className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kamera zza autokaru</span>
                </div>
                <span className="text-[10px] text-slate-400">Główna kamera do jazdy</span>
              </button>

              <button
                onClick={() => onSelectCamera('driver-hood')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  state.cameraMode === 'driver-hood'
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-inner'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Widok z maski</span>
                </div>
                <span className="text-[10px] text-slate-400">Linia wzroku kierowcy</span>
              </button>

              <button
                onClick={() => onSelectCamera('orbit')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  state.cameraMode === 'orbit'
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-inner'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Widok 360° (Orbit)</span>
                </div>
                <span className="text-[10px] text-slate-400">Obracaj myszką dookoła</span>
              </button>

              <button
                onClick={() => onSelectCamera('drone')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  state.cameraMode === 'drone'
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-inner'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dron z góry</span>
                </div>
                <span className="text-[10px] text-slate-400">Widok na cały parking</span>
              </button>
            </div>
          )}

          {/* TAB 2: DOORS & PNEUMATIC CONTROLS */}
          {activeTab === 'doors' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={onToggleFrontDoor}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  state.frontDoorOpen
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">Przednie Drzwi Pasażerskie</span>
                <span className="text-[11px] font-bold mt-2">
                  {state.frontDoorOpen ? '🟢 OTWARTE' : '⚪ ZAMKNIĘTE'}
                </span>
              </button>

              <button
                onClick={onToggleMiddleDoor}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  state.middleDoorOpen
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">Środkowe Drzwi Wyjściowe</span>
                <span className="text-[11px] font-bold mt-2">
                  {state.middleDoorOpen ? '🟢 OTWARTE' : '⚪ ZAMKNIĘTE'}
                </span>
              </button>

              <button
                onClick={onToggleLuggage}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  state.luggageBaysOpen
                    ? 'bg-amber-950/80 border-amber-500 text-amber-100'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">Klapy Bagażników (Luki)</span>
                <span className="text-[11px] font-bold mt-2">
                  {state.luggageBaysOpen ? '🟡 OTWARTE' : '⚪ ZAMKNIĘTE'}
                </span>
              </button>

              <button
                onClick={onToggleKneel}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  state.kneeling
                    ? 'bg-sky-950/80 border-sky-400 text-sky-100'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">Przyklęk ECAS (-8 cm)</span>
                <span className="text-[11px] font-bold mt-2">
                  {state.kneeling ? '🔵 AKTYWNY (Obniżony)' : '⚪ POZIOM DROGOWY'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: LIGHTING & ENVIRONMENT */}
          {activeTab === 'lighting' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Time of Day */}
              <div className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl p-2 flex items-center justify-between gap-1">
                <button
                  onClick={() => onChangeTimeOfDay('day')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    state.timeOfDay === 'day' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Dzień</span>
                </button>
                <button
                  onClick={() => onChangeTimeOfDay('sunset')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    state.timeOfDay === 'sunset' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Zmierzch</span>
                </button>
                <button
                  onClick={() => onChangeTimeOfDay('night')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    state.timeOfDay === 'night' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Noc</span>
                </button>
              </div>

              {/* Headlights Toggle */}
              <button
                onClick={onToggleHeadlights}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  state.headlightsOn
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Reflektory LED: {state.headlightsOn ? 'WŁ' : 'WYŁ'}</span>
              </button>

              {/* Interior Mood Lights */}
              <button
                onClick={onToggleInteriorLights}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  state.interiorLightsOn
                    ? 'bg-sky-400/20 border-sky-400 text-sky-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Neony Wnętrza: {state.interiorLightsOn ? 'WŁ' : 'WYŁ'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
