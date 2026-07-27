/**
 * A short chime plus a haptic buzz, used to announce a pomodoro transition.
 *
 * Deliberately avoids the Notification API: it would demand a permission
 * prompt on first use, and vibration + sound already carry across a locked
 * Android screen for an installed app.
 */
export const alarm = () => {
  navigator.vibrate?.([180, 90, 180]);

  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

    osc.connect(gain).connect(ctx.destination);
    osc.onended = () => void ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    /* Autoplay policy or no audio device — the buzz is enough. */
  }
};
