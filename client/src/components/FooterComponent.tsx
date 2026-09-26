import React from 'react';
import Image from 'next/image';

export default function FooterComponent() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center">
      <Image
            src="/bigview-image.png" 
            alt="bigview Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority 
          />
        
      </div>
    </footer>
  );
}