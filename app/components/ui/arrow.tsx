import { motion } from "framer-motion";

interface ArrowProps {
  opacity: any;
}

export function Arrow({ opacity }: ArrowProps) {
  return (
    <motion.div 
      style={{
        opacity,
        display: "inline-block",
        marginRight: "0.5rem",
        position: "relative",
        top: "0.2rem"
      }}
    >
      <motion.span 
        className="text-rose-500 text-3xl inline-block"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        ➡️
      </motion.span>
    </motion.div>
  );
} 