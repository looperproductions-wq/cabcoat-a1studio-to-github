import React from 'react';
import { Construction, PaintBucket, Sparkles } from 'lucide-react';

export const MaintenanceScreen = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto backdrop-blur-md bg-white/5 p-8 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-10 relative">
           <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl shadow-xl relative transform -rotate-6 transition-transform hover:rotate-0 duration-500">
             <PaintBucket className="w-16 h-16 text-white" />
           </div>
           <div className="absolute -top-4 -right-4 text-amber-300 animate-bounce delay-100">
             <Sparkles className="w-8 h-8" />
           </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-8 tracking-tighter leading-tight">
          Leveling Up.
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed font-light">
          We are taking <span className="text-white font-semibold">CabCoat AI</span> offline while we mix new colors and polish the pixels.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-indigo-300 text-sm font-medium transition-colors">
            <Construction className="w-4 h-4" />
            <span>Under Construction</span>
          </div>
          <div className="text-slate-500 text-sm">
             Check back soon for V2.0
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 flex flex-col items-center gap-2 z-10 opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
          A CabCoat.com Product
        </span>
      </div>
    </div>
  );
};