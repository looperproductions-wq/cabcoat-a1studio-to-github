import React from 'react';
import { X, Globe, Server, Cpu, ArrowRight, User, ShieldCheck } from 'lucide-react';

interface ProcessInfographicProps {
  onClose: () => void;
}

export const ProcessInfographic: React.FC<ProcessInfographicProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">System Architecture</h2>
            <p className="text-slate-500">How your website talks to the AI</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50/50">
          
          {/* Visual Flow */}
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 mb-12 relative">
            
            {/* Step 1: User */}
            <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative z-10 flex flex-col items-center text-center group hover:border-indigo-300 transition-colors">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">1. Your Customer</h3>
              <p className="text-sm text-slate-500">
                Visits your website and uploads a photo of their kitchen.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-300">
              <ArrowRight className="w-8 h-8" />
            </div>

            {/* Step 2: Vercel/Website */}
            <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative z-10 flex flex-col items-center text-center group hover:border-purple-300 transition-colors">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-100 text-purple-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border border-purple-200">
                You Are Here
              </div>
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">2. Your Website (Vercel)</h3>
              <p className="text-sm text-slate-500">
                Hosts the code and securely holds your <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">API_KEY</span>.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                <ShieldCheck className="w-3 h-3" /> Secure Gateway
              </div>
            </div>

             {/* Arrow */}
             <div className="hidden md:flex items-center justify-center text-slate-300">
              <ArrowRight className="w-8 h-8" />
            </div>

            {/* Step 3: Google AI */}
            <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative z-10 flex flex-col items-center text-center group hover:border-amber-300 transition-colors">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">3. Google Gemini</h3>
              <p className="text-sm text-slate-500">
                Receives the image + instructions, paints the cabinets, and sends it back.
              </p>
            </div>

          </div>

          {/* Detailed Breakdown */}
          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Why do I need Vercel?
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                You cannot just run this code from a file on your computer because it needs a "Build Step" to translate the React code into something browsers understand.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Vercel acts as the "Engine" that builds your site and puts it on the internet. It also acts as a security guard, keeping your API Key safe so only your website can use it.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                How do I put this on my site?
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Since your main website (Wix, WordPress) might not support complex AI apps directly, we use an <strong>Iframe</strong>.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Think of an Iframe like a "Window". Your main website cuts a rectangular hole in the page, and shows your Vercel app through that window. To the user, it looks like one seamless website.
              </p>
            </div>

          </div>

        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};