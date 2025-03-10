"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between w-full px-4 py-4">
      {/* Navigation for desktop */}
      <nav className="hidden md:block flex-1">
        <ul className="flex space-x-6">
          <li>
            <button 
              onClick={() => scrollToSection('tasks')}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Tasks
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollToSection('leaderboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Leaderboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollToSection('refer')}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Refer Friends
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-lg md:hidden z-50">
          <ul className="py-2 px-4">
            <li className="py-2">
              <button 
                onClick={() => scrollToSection('tasks')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tasks
              </button>
            </li>
            <li className="py-2">
              <button 
                onClick={() => scrollToSection('leaderboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Leaderboard
              </button>
            </li>
            <li className="py-2">
              <button 
                onClick={() => scrollToSection('refer')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Refer Friends
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Login and menu button */}
      <div className="flex items-center space-x-4">
        <Button variant="outline">Login</Button>
        <button
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </header>
  );
} 