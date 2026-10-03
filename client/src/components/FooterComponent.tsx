import React from 'react';
import Image from 'next/image';

export default function FooterComponent() {
	const currentYear = new Date().getFullYear();
	
  return (
  <footer className="w-full border-t border-black/50 dark:border-white/10 text-foreground/60 text-xs mt-auto">
    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center">
      <Image
        src="/bigview-image.jpg" 
        alt="bigview Logo"
        width={32}
        height={32}
        className="w-8 h-8 object-contain"
        priority 
      />
     <p className="m-0 tracking-[0.025em]">
          &copy; {currentYear} BigView. All rights reserved.
        </p>
    </div>
  </footer>
);
}
