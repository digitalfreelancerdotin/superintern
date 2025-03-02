"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"

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
          <div>
            <Link href="/dashboard/intern">
              <Button variant="outline" className="mr-2">Dashboard</Button>
            </Link>
            <Button variant="outline">Login</Button>
          </div>
        </div>
      </div>
    </nav>
  )
} 