import React, { useEffect, useState } from "react";
import leftFoot  from "../assets/up.png";    // left / “up”
import rightFoot from "../assets/down.png";  // right / “down”

interface Props {
  running: boolean;
  width?:   number;   // strip width in px (default 400)
  cadence?: number;   // ms between new footprints (default 700)
}

type Side = "left" | "right";

export const FootstepStrip: React.FC<Props> = ({
  running,
  width   = 400,
  cadence = 700,
}) => {
  const [steps, setSteps] = useState<Side[]>([]);

  /* emit footprints while running */
  useEffect(() => {
    if (!running) {
      setSteps([]);
      return;
    }

    const id = setInterval(() => {
      setSteps(prev => {
        const next = [...prev, prev.length % 2 === 0 ? "left" : "right"];

        /* if we reached 8 footprints (4 pairs) schedule a reset */
        if (next.length === 8) {
          setTimeout(() => setSteps([]), 200);  // brief pause then clear
        }
        return next;
      });
    }, cadence);

    return () => clearInterval(id);
  }, [running, cadence]);

  /* horizontal spacing auto-computed from strip width */
  const stepPx = width / 8;      // eight equal slots

  return (
    <div
      className="relative overflow-hidden mx-auto"
      style={{ width, height: 34 }}
    >
      {steps.map((side, idx) => (
        <img
          key={idx}
          src={side === "left" ? leftFoot : rightFoot}
          alt=""
          className="absolute opacity-80"
          style={{
            left: idx * stepPx + stepPx / 2 - 12, // center each 24-px sprite
            top:  side === "left" ? 4 : 18,       // stagger rows
            width: 24,
            height: 12,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  );
};

export default FootstepStrip;
