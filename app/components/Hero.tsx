"use client";

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Hero() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="py-20 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-relaxed">
        Complete Tasks <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="inline-block"
        >✅</motion.span> Earn Points <motion.div
          className="inline-block text-2xl"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {Array.from({ length: 5 }, (_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  x: [-10, 0, 0, -10]
                }}
                transition={{ 
                  duration: 8,
                  times: [
                    0,
                    (i + 1) * 0.1,
                    0.5 + (4 - i) * 0.1,
                    1
                  ],
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >⭐</motion.span>
            ))}
          </AnimatePresence>
        </motion.div>
        <br className="my-2" />
        Get Certificates 📜 Badges <motion.span
          animate={{ 
            y: [-4, 4, -4]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ 
            display: "inline-block",
            transformOrigin: "center"
          }}
        >🏅</motion.span> & trophies <motion.span
          animate={{ 
            rotateY: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 1],
            scale: {
              times: [0, 0.5, 1]
            }
          }}
          style={{ 
            display: "inline-block",
            perspective: "1000px"
          }}
        >🏆</motion.span>
        <br className="my-2" />
        <div className="relative inline-block">
          Become the Top Intern&nbsp;&nbsp;&nbsp;
          <AnimatePresence>
            {!isScrolled && (
              <motion.span
                className="absolute -right-12"
                initial={{ opacity: 1, y: -50 }}
                animate={{ y: 400 }}
                exit={{ opacity: 0, y: 400 }}
                transition={{ 
                  type: "spring",
                  duration: 2,
                  bounce: 0.2
                }}
              >
                ⬇️
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Join our internship program to showcase your skills and stand out from the crowd
      </p>
      <div className="flex gap-4 justify-center mb-8">
        <Button size="lg" className="relative z-10">Get Started</Button>
        <Button size="lg" variant="outline" className="relative z-10">Learn More</Button>
      </div>
    </div>
  )
} 