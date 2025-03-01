"use client";

import { useScroll, useTransform, motion, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export function Features() {
  const containerRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 40,
    stiffness: 30,
    mass: 2,
    restDelta: 0.001
  });

  const arrowTop = useTransform(
    smoothProgress, 
    [0, 0.1, 0.9, 1], 
    ['0', isScrollingUp ? '0' : '33%', '130%', '130%']
  );
  
  const arrowOpacity = useTransform(
    smoothProgress, 
    [0, 0.85, 0.9], 
    [1, 1, 0]
  );

  useEffect(() => {
    let prevScroll = scrollYProgress.get();
    
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest > 0.1) {
        setHasScrolled(true);
      }
      
      // Detect scroll direction
      if (latest < prevScroll) {
        setIsScrollingUp(true);
      } else {
        setIsScrollingUp(false);
      }
      prevScroll = latest;
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="py-20 px-4 relative min-h-screen">
      <div className="max-w-4xl mx-auto space-y-32 relative">
        {/* Vertical Line with Moving Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 h-[calc(100%-2rem)]">
          <div className="h-full w-[2px] bg-blue-500 relative">
            <motion.div 
              className="absolute left-1/2 transform -translate-x-1/2 text-2xl"
              initial={{ top: "33%" }}
              style={{ 
                top: hasScrolled ? arrowTop : "33%",
                opacity: arrowOpacity
              }}
            >
              ⬇️
            </motion.div>
          </div>
        </div>

        {/* First Row - Left Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm">
            <h3 className="text-2xl font-bold mb-4">
              Pick Free Tasks
            </h3>
            <p className="text-slate-600 mb-4">Start your journey by completing free tasks and earning points. Build your portfolio while learning new skills.</p>
          </div>
          <div className="max-w-sm" /> {/* Empty div for spacing */}
        </div>

        {/* Second Row - Right Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm" /> {/* Empty div for spacing */}
          <div className="max-w-sm text-right">
            <h3 className="text-2xl font-bold mb-4">
              Unlock Paid Tasks
            </h3>
            <p className="text-slate-600">Once you reach the required points threshold, gain access to paid tasks and start earning rewards.</p>
          </div>
        </div>

        {/* Third Row - Left Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm">
            <h3 className="text-2xl font-bold mb-4">
              Refer Friends
            </h3>
            <p className="text-slate-600">Invite your friends to join TopInterns. Earn bonus points when they complete their first task.</p>
          </div>
          <div className="max-w-sm" /> {/* Empty div for spacing */}
        </div>

        {/* Fourth Row - Right Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm" /> {/* Empty div for spacing */}
          <div className="max-w-sm text-right">
            <h3 className="text-2xl font-bold mb-4">
              Earn Badges
            </h3>
            <p className="text-slate-600">Get recognized for your achievements. Earn badges as you complete tasks and get them approved by admins.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 