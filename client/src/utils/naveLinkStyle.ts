  // Utility function to highlight active route links
  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`;
