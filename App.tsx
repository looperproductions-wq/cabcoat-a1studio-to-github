
import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Palette, Droplet, Camera, Zap, ChevronRight } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';

const SHEEN_OPTIONS = ['Default', 'Matte', 'Satin', 'Semi-Gloss', 'High-Gloss'];
const GENERATION_LIMIT = 2;

const App: React.FC = () => {
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
      setError('Please upload a valid image (JPEG/PNG).'); 
      return; 
    }

    try {
      setStatus('analyzing'); 
      setLoadingMessage("Analyzing Kitchen..."); 
      setError(null); 
      setGeneratedImage(null);
      const base64 = await fileToBase64(file);
      setImage(base64);
      
      const analysis = await analyzeKitchenAndSuggestColors(base64);
      if (!analysis.isKitchen) {
        setError("AI could not verify this is a kitchen. Please try a different photo.");
        setImage(null);
        setStatus('idle');
        return;
      }
      setAiSuggestions(analysis.suggestedColors.map(c => ({ ...c, isAI: true })));
      setAnalysisReasoning(analysis.reasoning);
      setStatus('idle');
    } catch (err: any) { 
      setError(err.message); 
      setStatus('idle'); 
    }
  };

  const handleGenerate = async (newColor?: ColorOption | null, newHardware?: HardwareOption) => {
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
    } else if (newColor === null) {
      setSelectedColor(null);
      setCustomColor('');
    } else { 
      effectiveColorName = customColor || selectedColor?.name || null;
      effectiveColorHex = selectedColor?.hex || null;
    }

    setLoadingMessage("Painting Cabinets...");
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
      setError(err.message); 
      setStatus('idle'); 
    }
  };

  const resetApp = () => { 
    setImage(null); 
    setGeneratedImage(null); 
    setStatus('idle'); 
    setError(null);
    setSelectedColor(null);
    setCustomColor('');
    if (fileInputRef.current) fileInputRef.current.value = ''; 
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
          {image && (
            <button onClick={resetApp} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="flex-1 text-left">
              <h4 className="text-red-900 font-black uppercase tracking-tight text-sm mb-1">System Message</h4>
              <p className="text-red-700 text-sm font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95">
            <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter max-w-3xl">Visualize Your New Kitchen</h2>
            <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium">
              Take the guesswork out of cabinet painting. Upload a photo and see your dream color in photorealistic 4K.
            </p>
            <div className="flex items-center gap-3 bg-white shadow-xl border border-indigo-50 text-indigo-700 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest mb-16">
              <Zap className="w-5 h-5 fill-indigo-500 animate-pulse" /> 
              <span>2 High-Def Renders Included</span>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-xl mx-auto">
              <div className="relative flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                  <Upload className="w-7 h-7" /> Upload Photo
                </button>
              </div>
              <div className="relative flex-1">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-100 px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                  <Camera className="w-7 h-7" /> Take Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <div ref={resultsRef} className="bg-white rounded-3xl shadow-2xl p-3 relative min-h-[500px] border border-slate-100 overflow-hidden">
                {(status === 'analyzing' || status === 'generating') && <LoadingOverlay message={loadingMessage} />}
                {generatedImage ? (
                  <ImageComparator originalImage={image} generatedImage={generatedImage} activeColor={selectedColor || (customColor ? {name: customColor, hex: '#cccccc'} : null)} />
                ) : (
                  <div className="relative w-full bg-slate-100 rounded-2xl overflow-hidden min-h-[500px] flex items-center justify-center group">
                    <img src={`data:image/jpeg;base64,${image}`} alt="Kitchen" className="w-full h-auto block max-h-[75vh] object-contain" />
                    {status === 'idle' && (
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white/95 text-slate-900 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl">Original Photo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {analysisReasoning && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-4 text-left">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                    <h3 className="font-black text-indigo-900 uppercase tracking-tight text-lg">AI Designer Notes</h3>
                  </div>
                  <p className="text-slate-700 text-base text-left leading-relaxed font-medium">{analysisReasoning}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Styling Station
                </h3>
                <div className="space-y-6">
                  <div className="text-left">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Custom Paint Color</label>
                    <input type="text" value={customColor} onChange={(e) => {setCustomColor(e.target.value); if(e.target.value) setSelectedColor(null);}} placeholder="e.g. Navy Blue" className="w-full text-sm p-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 font-bold" />
                  </div>
                  <div className="text-left">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-indigo-400" /> Sheen
                    </label>
                    <select value={selectedSheen} onChange={(e) => setSelectedSheen(e.target.value)} className="w-full text-sm p-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 font-black appearance-none cursor-pointer">
                      {SHEEN_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                  <button onClick={() => handleGenerate()} disabled={status !== 'idle' && status !== 'complete'} className="w-full bg-slate-900 hover:bg-black text-white text-sm font-black uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50">
                    <PaintBucket className="w-5 h-5" /> Update Preview
                  </button>
                </div>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                  <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> AI Suggestions
                  </h3>
                  <div className="space-y-4">
                    {aiSuggestions.map((color) => (
                      <button key={color.name} onClick={() => handleGenerate(color)} className={`w-full flex items-center gap-5 p-4 rounded-2xl border-2 transition-all ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                        <div className="w-14 h-14 rounded-2xl shadow-inner border border-black/5 shrink-0" style={{ backgroundColor: color.hex }} />
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-black text-slate-900 truncate tracking-tight">{color.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest truncate">{color.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
