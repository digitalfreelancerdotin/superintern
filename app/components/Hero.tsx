"use client";

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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
    <div className="relative min-h-[800px] bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto relative h-full">
        {/* Superwoman on the left */}
        <div className="absolute left-[15%] lg:left-[20%] bottom-20 z-10 w-[200px] lg:w-[300px]">
          <Image
            src="/superwoman.png"
            alt="Superwoman"
            width={300}
            height={300}
            className="object-contain w-full h-auto"
          />
        </div>

        {/* Superman on the right */}
        <div className="absolute right-[15%] lg:right-[20%] bottom-20 z-10 w-[200px] lg:w-[300px]">
          <Image
            src="/superman.png"
            alt="Superman"
            width={300}
            height={300}
            className="object-contain w-full h-auto"
          />
        </div>

        {/* Hero Content */}
        <div className="py-32 lg:py-40 px-4 text-center relative z-20">
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
              Be the Super-Intern&nbsp;&nbsp;&nbsp;
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
            Showcase your skills and standout
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="relative z-10">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="relative z-10">Learn More</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 