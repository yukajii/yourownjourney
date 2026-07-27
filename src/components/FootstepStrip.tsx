import React, { useEffect, useState } from "react";
import leftFoot from "../assets/up.png"; // left / “up”
import rightFoot from "../assets/down.png"; // right / “down”

interface Props {
  running: boolean;
  width?: number; // strip width in px (default 400)
  cadence?: number; // ms between new footprints (default 700)
}

const SLOTS = 8; // four pairs, then the trail restarts

export const FootstepStrip: React.FC<Props> = ({ running, width = 400, cadence = 700 }) => {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (!running) {
      setSteps(0);
      return;
    }
    const id = setInterval(() => setSteps((n) => (n + 1) % (SLOTS + 1)), cadence);
    return () => clearInterval(id);
  }, [running, cadence]);

  /* horizontal spacing auto-computed from strip width */
  const stepPx = width / SLOTS;

  return (
    <div className="relative mx-auto overflow-hidden" style={{ width, height: 34 }} aria-hidden>
      {Array.from({ length: steps }, (_, idx) => {
        const isLeft = idx % 2 === 0;
        return (
          <img
            key={idx}
            src={isLeft ? leftFoot : rightFoot}
            alt=""
            className="absolute opacity-80"
            style={{
              left: idx * stepPx + stepPx / 2 - 12, // centre each 24-px sprite
              top: isLeft ? 4 : 18, // stagger rows
              width: 24,
              height: 12,
              imageRendering: "pixelated",
            }}
          />
        );
      })}
    </div>
  );
};

export default FootstepStrip;
