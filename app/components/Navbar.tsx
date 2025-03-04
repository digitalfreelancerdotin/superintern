"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthButton } from "@/app/components/auth/auth-button"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 border-b bg-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-2xl">⬇️</span>
                <span className="text-xl font-bold">TopInterns</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  )
} 