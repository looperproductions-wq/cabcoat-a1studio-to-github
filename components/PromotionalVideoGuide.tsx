import React from 'react';
import { X, Video, Mic, Monitor, MousePointer, Layout, ArrowRight } from 'lucide-react';

interface PromotionalVideoGuideProps {
  onClose: () => void;
}

export const PromotionalVideoGuide: React.FC<PromotionalVideoGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Promotional Video Script</h2>
            <p className="text-slate-500">A 60-second commercial plan for CabinetVision AI</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left: Script */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <Mic className="w-5 h-5 text-indigo-600" />
                 <h3 className="font-bold text-slate-900">Voiceover Script</h3>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">0:00 - The Problem</span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "Renovating a kitchen is expensive. And picking the wrong cabinet color? That’s a mistake you stare at every day."
                  </p>
                </div>
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">0:10 - The Solution</span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "Stop guessing. Start seeing. Introducing CabinetVision AI by CabCoat.com."
                  </p>
                </div>
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">0:20 - The Demo</span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "Just snap a photo of your existing kitchen. In seconds, our AI paints your cabinets with photorealistic precision. Try Benjamin Moore Hale Navy, or a classic White."
                  </p>
                </div>
                 <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">0:40 - The Details</span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "Swap hardware instantly. Gold bars, matte black knobs—see exactly how the light hits them before you buy."
                  </p>
                </div>
                 <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">0:50 - Call to Action</span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "Design your dream kitchen today. Visit CabCoat.com and try the visualizer for free."
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Visuals */}
             <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <Video className="w-5 h-5 text-indigo-600" />
                 <h3 className="font-bold text-slate-900">Visual Storyboard</h3>
              </div>
              
               <div className="space-y-4">
                 
                 <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-400" /> Show the "Before"
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Start with a zoomed-in shot of an outdated kitchen photo.
                      </p>
                    </div>
                 </div>

                 <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <MousePointer className="w-4 h-4 text-slate-400" /> The Upload
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Screen record clicking <strong>"Upload Photo"</strong>. Show the loading spinner for anticipation.
                      </p>
                    </div>
                 </div>

                 <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">3</div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-slate-400" /> The Reveal
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Use the <strong>"Original / AI Preview"</strong> toggle button to flash back and forth quickly between the old and new colors.
                      </p>
                    </div>
                 </div>

                 <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">4</div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-slate-400" /> Rapid Fire
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Quick cuts of clicking different color bubbles: Green -> Blue -> Black.
                      </p>
                    </div>
                 </div>

               </div>
            </div>

          </div>

        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Got it, ready to record
          </button>
        </div>
      </div>
    </div>
  );
};