'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Terminal, Home, Activity, Menu, X } from 'lucide-react';

export default function NavbarComponent() {
  // 1. Single state variable to track open/closed status
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 2. Helper functions to update state
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);
  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <>
      <nav className="w-full bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-100 text-lg">
            <Activity className="w-6 h-6 text-amber-500" />
            <span>Trading Control Center</span>
          </Link>

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/engine-logs" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>Engine Logs</span>
            </Link>
          </div>

          {/* Mobile Hamburger / X Button with Smooth Icon Swap Animation */}
          <button
            onClick={handleToggleMenu}
            className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none transition-transform duration-300"
            aria-label="Toggle Navigation Menu"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              {/* Menu (Hamburger) Icon */}
              <Menu
                className={`w-6 h-6 absolute transition-all duration-300 transform ${
                  isMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              {/* Close (X) Icon */}
              <X
                className={`w-6 h-6 absolute transition-all duration-300 transform ${
                  isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                }`}
              />
            </div>
          </button>

        </div>
      </nav>

      {/* Backdrop Blur Overlay */}
      {isMenuOpen && (
        <div
          onClick={handleCloseMenu}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sliding Mobile Menu Drawer (Occupies 70% of Viewport Width from Right) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[70vw] max-w-sm bg-slate-950 border-l border-slate-800 p-6 z-50 md:hidden flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Header Inside Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={handleCloseMenu}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={handleCloseMenu}
              className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-slate-400" />
              <span>Home</span>
            </Link>

            <Link
              href="/engine-logs"
              onClick={handleCloseMenu}
              className="flex items-center gap-3 px-3 py-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors"
            >
              <Terminal className="w-5 h-5" />
              <span>Engine Logs</span>
            </Link>
          </nav>
        </div>

        {/* Drawer Footer Meta */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 font-mono">
          System Status: <span className="text-emerald-400">ONLINE</span>
        </div>
      </aside>
    </>
  );
}