
import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';

const APP_VERSION = 'v2.0.0';
const SHEEN_OPTIONS = ['Default', 'Matte', 'Satin', 'Semi-Gloss', 'High-Gloss'];
const GENERATION_LIMIT = 2;
const MAINTENANCE_MODE = false;

const App: React.FC = () => {
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing...');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [customColor, setCustomColor] = useState<string>('');
  const [selectedHardware, setSelectedHardware] = useState<HardwareOption>(HARDWARE_OPTIONS[0]);
  const [selectedSheen, setSelectedSheen] = useState<string>('Default');
  const [aiSuggestions, setAiSuggestions] = useState<ColorOption[]>([]);
  const [analysisReasoning, setAnalysisReasoning] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedCount = localStorage.getItem('cabcoat_gen_count');
    const storedEmail = localStorage.getItem('cabcoat_user_email');
    if (storedCount) setGenerationCount(parseInt(storedCount, 10));
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const handleUnlock = (email: string) => { 
    localStorage.setItem('cabcoat_user_email', email); 
    setUserEmail(email); 
    setShowEmailGate(false); 
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
      setError('Please upload a valid image file (JPEG or PNG).'); 
      return; 
    }

    try {
      setStatus('analyzing'); 
      setLoadingMessage("Analyzing Kitchen Layout..."); 
      setError(null); 
      setGeneratedImage(null);
      setSelectedColor(null); 
      setCustomColor(''); 
      setSelectedHardware(HARDWARE_OPTIONS[0]); 
      setSelectedSheen('Default'); 
      setCustomInstruction('');
      const base64 = await fileToBase64(file);
      setImage(base64);
      const analysis = await analyzeKitchenAndSuggestColors(base64);
      setAiSuggestions(analysis.suggestedColors.map(c => ({ ...c, isAI: true })));
      setAnalysisReasoning(analysis.reasoning);
      setStatus('idle');
    } catch (err: any) { 
      console.error(err);
      setError(`Analysis Failed: ${err.message}`); 
      setStatus('idle'); 
    }
  };

  const handleGenerate = async (newColor?: ColorOption | null, newHardware?: HardwareOption, specificMessage?: string) => {
    if (!image) return;
    
    if (!userEmail && generationCount >= GENERATION_LIMIT) { 
      setShowEmailGate(true); 
      return; 
    }

    const hardwareToUse = newHardware || selectedHardware;
    let effectiveColorName = null; 
    let effectiveColorHex = null;
    
    if (newColor) { 
      effectiveColorName = newColor.name; 
      effectiveColorHex = newColor.hex; 
      setSelectedColor(newColor); 
      setCustomColor(''); 
    }
    else if (newColor === null) { 
      effectiveColorName = null; 
      effectiveColorHex = null; 
      setSelectedColor(null); 
      setCustomColor(''); 
    }
    else { 
      if (customColor.trim()) effectiveColorName = customColor; 
      else if (selectedColor) { 
        effectiveColorName = selectedColor.name; 
        effectiveColorHex = selectedColor.hex; 
      } 
    }

    if (!effectiveColorName && hardwareToUse.id === 'none' && !customInstruction.trim() && selectedSheen === 'Default' && newColor !== null) { 
      setError("Please select a color or style to visualize."); 
      return; 
    }

    if (newHardware) setSelectedHardware(newHardware);
    let msg = specificMessage || "Processing...";
    if (!specificMessage) { 
      if (newColor) msg = `Applying ${newColor.name}...`; 
      else if (newHardware) msg = `Installing ${newHardware.name}...`; 
      else if (customColor) msg = `Applying ${customColor}...`; 
      else msg = "Updating design..."; 
    }
    setLoadingMessage(msg);

    if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
      setStatus('generating'); 
      setError(null);
      const newImageBase64 = await generateCabinetPreview(image, effectiveColorName, effectiveColorHex, hardwareToUse.name, customInstruction, selectedSheen);
      setGeneratedImage(newImageBase64); 
      setStatus('complete');
      if (!userEmail) { 
        const newCount = generationCount + 1; 
        setGenerationCount(newCount); 
        localStorage.setItem('cabcoat_gen_count', newCount.toString()); 
      }
    } catch (err: any) { 
      console.error(err); 
      setError(`Design Engine Error: ${err.message}`); 
      setStatus('idle'); 
    }
  };

  const resetApp = () => { 
    setImage(null); 
    setGeneratedImage(null); 
    setStatus('idle'); 
    setSelectedColor(null); 
    setCustomColor(''); 
    setSelectedHardware(HARDWARE_OPTIONS[0]); 
    setSelectedSheen('Default'); 
    setAiSuggestions([]); 
    setAnalysisReasoning(''); 
    setCustomInstruction(''); 
    setError(null); 
    if (fileInputRef.current) fileInputRef.current.value = ''; 
    if (cameraInputRef.current) cameraInputRef.current.value = ''; 
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {showEmailGate && <EmailGateModal onUnlock={handleUnlock} />}
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <PaintBucket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">CabCoat AI</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Professional Visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {image && (
              <button onClick={resetApp} className="text-sm font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-slate-100 rounded-lg">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-red-100 p-2 rounded-xl">
               <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-900 font-black uppercase tracking-tight text-sm mb-1">System Message</h4>
              <p className="text-red-700 text-sm leading-relaxed font-medium">{error}</p>
            </div>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
            <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter max-w-3xl">Visualize Your Dream Kitchen</h2>
            <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium">
              Experience the transformation instantly. Upload a photo and see your cabinets repainted with professional precision.
            </p>
            <div className="flex items-center gap-3 bg-white shadow-xl shadow-indigo-50 border border-indigo-50 text-indigo-700 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest mb-16">
              <Zap className="w-5 h-5 fill-indigo-500 animate-pulse" /> 
              <span>2 High-Def Renders Included</span>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-xl mx-auto">
              <div className="relative group flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                  <Upload className="w-7 h-7" /> Upload Photo
                </button>
              </div>
              <div className="relative group flex-1">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-100 hover:border-indigo-200 px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-slate-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                  <Camera className="w-7 h-7" /> Snap Photo
                </button>
              </div>
            </div>
            <p className="mt-12 text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">Professional Cabinet Painting Engine</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-8">
              <div ref={resultsRef} className="bg-white rounded-3xl shadow-2xl shadow-slate-200 p-3 relative scroll-mt-24 overflow-hidden border border-slate-100">
                {(status === 'analyzing' || status === 'generating') && <LoadingOverlay message={loadingMessage} />}
                {generatedImage ? (
                  <ImageComparator originalImage={image} generatedImage={generatedImage} activeColor={selectedColor || (customColor ? {name: customColor, hex: '#cccccc'} : null)} />
                ) : (
                  <div className="relative w-full bg-slate-100 rounded-2xl overflow-hidden min-h-[500px] group">
                    <img src={`data:image/jpeg;base64,${image}`} alt="Original Kitchen" className="w-full h-auto block" />
                    {status === 'idle' && !generatedImage && (
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] group-hover:backdrop-blur-0 transition-all flex items-center justify-center pointer-events-none">
                        <span className="bg-white/95 text-slate-900 px-8 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl scale-110">Original Perspective</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {analysisReasoning && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100"><Sparkles className="w-5 h-5 text-white" /></div>
                    <h3 className="font-black text-indigo-900 uppercase tracking-tight text-lg">AI Design Analysis</h3>
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed font-medium">{analysisReasoning}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-slate-300" /> Refining Details
                </h3>
                <textarea 
                  value={customInstruction} 
                  onChange={(e) => setCustomInstruction(e.target.value)} 
                  placeholder="E.g., Keep island wood, paint walls light gray..." 
                  className="w-full text-sm p-5 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none min-h-[120px] bg-slate-50 placeholder:text-slate-300 text-slate-700 mb-5 transition-all font-medium" 
                />
                <button onClick={() => handleGenerate(undefined, undefined, "Applying custom tweaks...")} className="w-full text-xs font-black text-indigo-600 uppercase tracking-widest border-2 border-indigo-50 py-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm">Apply Tweaks</button>
              </div>

              <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-300" /> Custom Finish
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color Brand / Name</label>
                    <input type="text" value={customColor} onChange={(e) => {setCustomColor(e.target.value); if(e.target.value) setSelectedColor(null);}} placeholder="e.g. SW Naval" className="w-full text-sm p-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-indigo-400" /> Desired Sheen
                    </label>
                    <select value={selectedSheen} onChange={(e) => setSelectedSheen(e.target.value)} className="w-full text-sm p-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 font-black appearance-none cursor-pointer">
                      {SHEEN_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                  <button onClick={() => handleGenerate(undefined, undefined, "Applying custom finish...")} disabled={status !== 'idle' && status !== 'complete'} className="w-full bg-slate-900 hover:bg-black text-white text-sm font-black uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50">
                    <PaintBucket className="w-5 h-5" /> Render Preview
                  </button>
                </div>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Design Palette
                  </h3>
                  <div className="space-y-4">
                    {aiSuggestions.map((color) => (
                      <button key={color.name} onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} disabled={status !== 'idle' && status !== 'complete'} className={`w-full flex items-center gap-5 p-4 rounded-2xl border-2 transition-all hover:shadow-lg active:scale-[0.98] ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                        <div className="w-14 h-14 rounded-2xl shadow-inner border border-black/5 shrink-0 rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: color.hex }} />
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-black text-slate-900 truncate tracking-tight">{color.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest truncate">{color.description}</p>
                        </div>
                        {selectedColor?.name === color.name && (<Check className="w-5 h-5 text-indigo-600" />)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Trending Modern Classics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleGenerate(null, undefined, "Restoring original finish...")} className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedColor === null && !customColor ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className="w-16 h-16 rounded-2xl shadow-sm mb-4 border border-black/5 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"><Ban className="w-6 h-6 text-slate-300" /></div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center">Original</span>
                  </button>
                  {POPULAR_COLORS.slice(0, 3).map((color) => (
                    <button key={color.name} onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}>
                      <div className="w-16 h-16 rounded-2xl shadow-sm mb-4 border border-black/5" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center truncate w-full">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-20 px-4 mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start max-w-sm">
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-indigo-600 p-2 rounded-xl">
                 <PaintBucket className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">CabCoat AI</h2>
             </div>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Photorealistic Visualization</p>
             <p className="text-sm text-slate-500 font-medium leading-relaxed">
               Advanced visualization for cabinet painting and interior transformations.
             </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-5">
            <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
               <ShieldCheck className="w-5 h-5" /> Enterprise Visualizer
            </div>
            <div className="mt-4 text-[10px] text-slate-400 uppercase font-black tracking-[0.4em] space-y-2 opacity-60">
                <p>{APP_VERSION} © CabCoat AI - All Rights Reserved</p>
                <p>Repaint with Confidence</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
