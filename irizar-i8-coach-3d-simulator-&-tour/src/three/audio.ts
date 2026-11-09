// Web Audio API procedural sound synthesizer for realistic coach effects & driving physics
class BusAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private lastBrakeSoundTime: number = 0;
  private lastReverseBeepTime: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (muted) {
        if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } else {
        if (this.engineGain) this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }
    }
  }

  // Realistic pneumatic bus door air hiss & latch click
  public playDoorSound(open: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(open ? 1200 : 900, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.7);

    // Mechanical latch clunk
    const clunkTime = now + (open ? 0.05 : 0.55);
    const clunk = this.ctx.createOscillator();
    const clunkGain = this.ctx.createGain();
    clunk.type = 'triangle';
    clunk.frequency.setValueAtTime(140, clunkTime);
    clunk.frequency.exponentialRampToValueAtTime(45, clunkTime + 0.09);

    clunkGain.gain.setValueAtTime(0.25, clunkTime);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, clunkTime + 0.1);

    clunk.connect(clunkGain);
    clunkGain.connect(this.ctx.destination);
    clunk.start(clunkTime);
    clunk.stop(clunkTime + 0.12);
  }

  // Bus ECAS kneeling pneumatic sound
  public playKneelSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 1.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 1.2);
  }

  // Brake air hiss sound when slowing down or stopping
  public playBrakeAirSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBrakeSoundTime < 2.5) return;
    this.lastBrakeSoundTime = now;

    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.45);
  }

  // Reverse warning beep (standard commercial vehicle reverse buzzer)
  public updateReverseBeep(isReversing: boolean) {
    if (!isReversing || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastReverseBeepTime < 0.9) return;
    this.lastReverseBeepTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.setValueAtTime(0.04, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Engine start/stop
  public setEngineRunning(running: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (running && !this.engineOsc1) {
      const now = this.ctx.currentTime;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, now);
      this.engineGain.gain.exponentialRampToValueAtTime(0.09, now + 0.5);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(42, now); // ~600 RPM idle pulse

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(84, now);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(160, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    } else if (!running && this.engineOsc1) {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineOsc1 = null;
          this.engineOsc2 = null;
          this.engineFilter = null;
        } catch {
          // ignore
        }
      }, 450);
    }
  }

  // Modulate engine pitch and throttle gain during driving
  public updateEngineDrive(speedKmh: number, isAccelerating: boolean, engineRunning: boolean, isReversing: boolean) {
    if (!engineRunning || this.isMuted || !this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineGain) {
      return;
    }
    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmh);
    const speedRatio = Math.min(absSpeed / 85, 1);

    // Calculate base frequency: 40Hz at idle up to 135Hz at top speed
    const throttleBoost = isAccelerating ? 15 : 0;
    const targetFreq1 = 40 + speedRatio * 85 + throttleBoost;
    const targetFreq2 = targetFreq1 * 2;
    const targetCutoff = 150 + speedRatio * 350 + (isAccelerating ? 120 : 0);
    const targetVolume = isAccelerating ? 0.12 : 0.08 + speedRatio * 0.04;

    this.engineOsc1.frequency.setTargetAtTime(targetFreq1, now, 0.1);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq2, now, 0.1);
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.12);
    }
    this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.15);

    if (isReversing) {
      this.updateReverseBeep(true);
    }
  }

  // Interactive UI click
  public playClickSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const busAudio = new BusAudioSynthesizer();
