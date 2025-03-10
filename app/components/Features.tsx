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
    <div ref={containerRef} className="py-12 px-4 relative min-h-screen">
      <div className="max-w-4xl mx-auto space-y-16 relative">
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
          <div className="max-w-sm group cursor-pointer">
            <div className="transition-all duration-300 ease-in-out -translate-y-1 shadow-lg rounded-xl p-6 bg-gray-50">
              <h3 className="text-2xl font-bold mb-4 text-indigo-600">
                Pick Free Tasks
              </h3>
              <p className="text-gray-700 mb-4">
                Start your journey by completing free tasks and earning points. Build your portfolio while learning new skills.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg">
              <img 
                src="/postits.png" 
                alt="Task post-it notes"
                className="w-full transform transition-all duration-500 ease-in-out group-hover:scale-110 group-hover:shadow-xl rounded-lg"
                style={{ maxWidth: '400px' }}
              />
            </div>
          </div>
          <div className="max-w-sm" /> {/* Empty div for spacing */}
        </div>

        {/* Second Row - Right Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm" /> {/* Empty div for spacing */}
          <div className="max-w-sm text-right group cursor-pointer">
            <div className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg rounded-xl p-6 hover:bg-gray-50">
              <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                Unlock Paid Tasks
              </h3>
              <p className="text-slate-600 group-hover:text-gray-700 transition-colors duration-300">
                Once you reach the required points threshold, gain access to paid tasks and start earning rewards.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg">
              <img 
                src="/paid-freelancing-gigs.png" 
                alt="Paid freelancing opportunities illustration"
                className="w-full transform transition-all duration-500 ease-in-out group-hover:scale-110 group-hover:shadow-xl rounded-lg"
                style={{ maxWidth: '400px', marginLeft: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* Third Row - Left Content with Image */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm group cursor-pointer">
            <div className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg rounded-xl p-6 hover:bg-gray-50">
              <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                Refer Friends
              </h3>
              <p className="text-slate-600 group-hover:text-gray-700 transition-colors duration-300">
                Invite your friends to join TopInterns. Earn bonus points when they complete their first task.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg">
              <img 
                src="/superheroes.png" 
                alt="Superhero developers with laptops"
                className="w-full transform transition-all duration-500 ease-in-out group-hover:scale-110 group-hover:shadow-xl rounded-lg"
                style={{ maxWidth: '400px' }}
              />
            </div>
          </div>
          <div className="max-w-sm" /> {/* Empty div for spacing */}
        </div>

        {/* Fourth Row - Right Content */}
        <div className="flex items-center justify-between gap-16">
          <div className="max-w-sm" /> {/* Empty div for spacing */}
          <div className="max-w-sm text-right group transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg rounded-xl p-6 hover:bg-gray-50">
            <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-600 transition-colors duration-300">
              Earn Badges
            </h3>
            <p className="text-slate-600 group-hover:text-gray-700 transition-colors duration-300">
              Get recognized for your achievements. Earn badges as you complete tasks and get them approved by admins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 