'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Terminal, Home, Activity, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface User {
  email?: string;
  id?: string;
}

// 2. Define the NavbarProps interface
interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function NavbarComponent({ user, onLogout }: NavbarProps) {
  // 1. Single state variable to track open/closed status
  const [isMenuOpen, setIsMenuOpen] = useState(false);

// Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // 2. Helper functions to update state
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);
  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
  <>
    <nav className="w-full border-b border-black/10 dark:border-white/10 px-4 py-3 sticky top-0 z-50 backdrop-blur-md text-foreground">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Desktop Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
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
          className="md:hidden p-2 text-foreground/70 hover:text-foreground focus:outline-none hover:bg-amber-500/20 hover:border-amber-500/60 active:bg-amber-500/30 active:scale-95 transition-all duration-150 cursor-pointer"
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

    {/* Sliding Mobile Menu Drawer */}
    <aside
      className={`fixed top-0 left-0 bottom-0 w-[80vw] max-w-sm bg-[var(--background)] text-foreground border-r border-black/10 dark:border-white/10 p-6 z-50 md:hidden flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* Header Inside Drawer */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <span className="text-sm font-bold text-foreground/60 uppercase tracking-wider">Navigation</span>
          <button
            onClick={handleCloseMenu}
            className="p-1 text-foreground/60 hover:text-foreground rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-4">
          <Link
            href="/"
            onClick={handleCloseMenu}
            className="flex items-center gap-3 px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 text-foreground/60" />
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
        <ThemeToggle />
        {user && (
              <button
                type="button"
                onClick={() => {
                  handleCloseMenu();
                  if (onLogout) onLogout();
                }}
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            )}
      </div>

      {/* Drawer Footer Meta */}
      <div className="pt-4 border-t border-black/10 dark:border-white/10 text-xs text-foreground/50 font-mono">
        System Status: <span className="text-emerald-500 dark:text-emerald-400">ONLINE</span>
      </div>
    </aside>
  </>
);
}