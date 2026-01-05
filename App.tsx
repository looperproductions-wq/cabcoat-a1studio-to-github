
import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Palette, Droplet, Camera, Zap, ChevronRight, Check, MessageSquarePlus, PenTool, Ban } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';

const APP_VERSION = "v1.4.2";
const SHEEN_OPTIONS = ['Satin', 'Matte', 'Semi-Gloss', 'High-Gloss'];

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing...');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [customColor, setCustomColor] = useState<string>('');
  const [selectedHardware, setSelectedHardware] = useState<HardwareOption>(HARDWARE_OPTIONS[0]);
  const [selectedSheen, setSelectedSheen] = useState<string>('Satin');
  const [aiSuggestions, setAiSuggestions] = useState<ColorOption[]>([]);
  const [analysisReasoning, setAnalysisReasoning] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = async (newColor?: ColorOption | null, newHardware?: HardwareOption, specificMessage?: string) => {
    if (!image) return;

    const hardwareToUse = newHardware || selectedHardware;
    let effectiveColorName = null; 
    let effectiveColorHex = null;
    
    if (newColor !== undefined) { 
      if (newColor === null) {
        effectiveColorName = null;
        effectiveColorHex = null;
        setSelectedColor(null);
        setCustomColor('');
      } else {
        effectiveColorName = newColor.name; 
        effectiveColorHex = newColor.hex; 
        setSelectedColor(newColor); 
        setCustomColor(''); 
      }
    } else { 
      effectiveColorName = customColor || selectedColor?.name || null;
      effectiveColorHex = selectedColor?.hex || null;
    }

    if (newHardware) setSelectedHardware(newHardware);

    setLoadingMessage(specificMessage || "Painting Cabinets...");
    if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
      setStatus('generating'); 
      setError(null);
      const newImageBase64 = await generateCabinetPreview(
        image, 
        effectiveColorName, 
        effectiveColorHex, 
        hardwareToUse.name, 
        customInstruction, 
        selectedSheen
      );
      setGeneratedImage(newImageBase64); 
      setStatus('complete');
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
    setAiSuggestions([]);
    setAnalysisReasoning('');
    setCustomInstruction('');
    setSelectedHardware(HARDWARE_OPTIONS[0]);
    setSelectedSheen('Satin');
    if (fileInputRef.current) fileInputRef.current.value = ''; 
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getActiveColorForDisplay = () => {
    if (customColor) return { name: customColor };
    if (selectedColor) return selectedColor;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <PaintBucket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">CabCoat AI</h1>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{APP_VERSION}</span>
              </div>
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
            <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter max-w-3xl leading-tight text-balance">Visualize Your New Kitchen</h2>
            <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium text-pretty">
              Take the guesswork out of cabinet painting. Upload a photo and see your dream color in photorealistic 4K.
            </p>
            <div className="flex items-center gap-3 bg-white shadow-xl border border-indigo-50 text-indigo-700 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest mb-16">
              <Zap className="w-5 h-5 fill-indigo-500 animate-pulse" /> 
              <span>Powered by Gemini 2.5 AI</span>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-md mx-auto">
              <div className="relative flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                  <Upload className="w-6 h-6" /> Upload Photo
                </button>
              </div>
              <div className="relative flex-1">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-100 hover:border-indigo-200 px-6 py-4 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                  <Camera className="w-6 h-6" /> Take Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Visualizer & Analysis */}
            <div className="lg:col-span-8 space-y-8 text-left">
              <div ref={resultsRef} className="bg-white rounded-3xl shadow-2xl p-3 relative min-h-[500px] border border-slate-100 overflow-hidden">
                {(status === 'analyzing' || status === 'generating') && <LoadingOverlay message={loadingMessage} />}
                {generatedImage ? (
                  <ImageComparator originalImage={image} generatedImage={generatedImage} activeColor={getActiveColorForDisplay()} />
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
                <div className="bg-indigo-900 text-white rounded-[2rem] p-10 animate-in fade-in slide-in-from-bottom-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6 text-left">
                      <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-xl border border-white/20">
                        <Sparkles className="w-6 h-6 text-indigo-200" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-0.5">Professional Palette</p>
                         <h3 className="font-black uppercase tracking-tight text-2xl">Color Consultation</h3>
                      </div>
                    </div>
                    <p className="text-indigo-100 text-xl text-left leading-relaxed font-medium italic">"{analysisReasoning}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* AI Suggestions Section */}
              {aiSuggestions.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                  <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Benjamin Moore AI
                  </h3>
                  <div className="space-y-4">
                    {aiSuggestions.map((color) => (
                      <button 
                        key={color.name} 
                        onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} 
                        className={`w-full flex items-center gap-5 p-4 rounded-2xl border-2 transition-all ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                      >
                        <div className="w-14 h-14 rounded-2xl shadow-inner border border-black/5 shrink-0" style={{ backgroundColor: color.hex }} />
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-black text-slate-900 truncate tracking-tight">{color.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest truncate">{color.description}</p>
                        </div>
                        {selectedColor?.name === color.name && <Check className="w-5 h-5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Classics Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-400" /> Benjamin Moore Classics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleGenerate(null)} 
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedColor === null && !customColor ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                  >
                    <div className="w-12 h-12 rounded-full mb-2 border border-slate-100 bg-slate-50 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Original</span>
                  </button>
                  {POPULAR_COLORS.map((color) => (
                    <button 
                      key={color.name} 
                      onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} 
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                    >
                      <div className="w-12 h-12 rounded-full mb-2 border border-black/5" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 truncate w-full text-center">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Styling Station */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Styling Station
                </h3>
                <div className="space-y-6">
                  <div className="text-left">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MessageSquarePlus className="w-3 h-3" /> Special Instructions
                    </label>
                    <textarea 
                      value={customInstruction} 
                      onChange={(e) => setCustomInstruction(e.target.value)} 
                      placeholder="e.g. Keep the island white wood..." 
                      className="w-full text-sm p-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 font-medium min-h-[80px] resize-none"
                    />
                  </div>

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

                  <button 
                    onClick={() => handleGenerate()} 
                    disabled={status !== 'idle' && status !== 'complete'} 
                    className="w-full bg-slate-900 hover:bg-black text-white text-sm font-black uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    <PaintBucket className="w-5 h-5" /> Update Preview
                  </button>
                </div>
              </div>

              {/* Hardware Selection */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <h3 className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <PenTool className="w-4 h-4" /> Hardware Style
                </h3>
                <div className="grid grid-cols-1 gap-2 text-left">
                  {HARDWARE_OPTIONS.map((hw) => (
                    <button 
                      key={hw.id} 
                      onClick={() => handleGenerate(undefined, hw, `Installing ${hw.name}...`)} 
                      className={`p-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${selectedHardware.id === hw.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-50 hover:border-slate-200 text-slate-500'}`}
                    >
                      {hw.name}
                      {selectedHardware.id === hw.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      <footer className="py-12 px-6 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{APP_VERSION}</div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">© {new Date().getFullYear()} CabCoat.com</p>
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Design Studio</div>
      </footer>
    </div>
  );
};

export default App;
