import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#e85d04", "#fb8500", "#22c55e", "#f4b942", "#2f9e9a"];
const CONFETTI = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: `${(index * 47 + 7) % 100}%`,
  color: COLORS[index % COLORS.length],
  width: index % 3 === 0 ? 7 : 5,
  height: index % 3 === 0 ? 12 : 8,
  delay: (index % 8) * 0.12,
  duration: 2.8 + (index % 4) * 0.3,
  rotation: 180 + (index % 5) * 140,
}));

export function OrderSuccessCelebration() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {CONFETTI.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute -top-5 rounded-sm"
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: "108vh", opacity: [0, 1, 1, 0], rotate: piece.rotation }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "linear" }}
          style={{
            left: piece.left,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}