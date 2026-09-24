import React from 'react';
import { User, Menu } from 'lucide-react';
import Image from 'next/image';
import NavbarComponent from "@/components/NavbarComponent";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function HeaderComponet({
  title = "Engine Dashboard",
  subtitle = "Live Execution Metrics & Terminal Logs",
  onRefresh,
}: HeaderProps) {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 px-6 py-4 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      {/* LEFT GROUP: Logo + Navbar */}
        <div className="flex items-center gap-6">
      <NavbarComponent />
      <Image
            src="/logo.svg" 
            alt="Trading Control Center Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority 
          />
          <User />
          </div>
          
        {/* RIGHT GROUP: User Profile */}
        <div className="flex items-center gap-3">
          <User />
        </div>
      </div>
    </header>
  );
}