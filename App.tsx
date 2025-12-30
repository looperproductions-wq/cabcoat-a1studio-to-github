
import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap, Wrench, Layout, Video, Share2, ExternalLink, ShoppingBag, Key, ChevronRight } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { DeploymentGuide } from './components/DeploymentGuide';
import { ProcessInfographic } from './components/ProcessInfographic';
import { PromotionalVideoGuide } from './components/PromotionalVideoGuide';

// The window.aistudio property is pre-configured and injected by the environment as AIStudio type.
// We remove the conflicting 'any' declaration and use casting for robust access.

const SHEEN_OPTIONS = ['Default', 'Matte', 'Satin', 'Semi-Gloss', 'High-Gloss'];
const GENERATION_LIMIT = 2;
const APP_VERSION = 'v1.7.5';

const HERO_BG = "https://images.unsplash.com/photo-1556912178-0810795c3702?q=80&w=2070&auto=format&fit=crop";

const App: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [showToolkit, setShowToolkit] = useState<boolean>(false);
  const [showDeployment, setShowDeployment] = useState<boolean>(false);
  const [showInfographic, setShowInfographic] = useState<boolean>(false);
  const [showVideoGuide, setShowVideoGuide] = useState<boolean>(false);

  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  
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
    const checkApiKeyStatus = async () => {
      setCheckingKey(true);
      const envKey = process.env.API_KEY;
      
      // Fallback to window.aistudio if environment key is not present
      if (!envKey || envKey === "") {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          const selected = await aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          setHasApiKey(false);
        }
      } else {
        setHasApiKey(true);
      }
      setCheckingKey(false);
    };
    checkApiKeyStatus();

    const storedCount = localStorage.getItem('cabcoat_gen_count');
    const storedEmail = localStorage.getItem('cabcoat_user_email');
    if (storedCount) setGenerationCount(parseInt(storedCount, 10));
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Assume success as per guidelines to mitigate race condition between key selection and availability
      setHasApiKey(true);
    }
  };

  const handleUnlock = (email: string) => {
    localStorage.setItem('cabcoat_user_email', email);
    setUserEmail(email);
    setShowEmailGate(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasApiKey) {
      setError("Please connect your API key first using the blue 'Connect' button.");
      return;
    }

    try {
      setStatus('analyzing');
      setLoadingMessage("Scanning kitchen elements...");
      setError(null);
      setGeneratedImage(null);
      
      const base64 = await fileToBase64(file);
      const analysis = await analyzeKitchenAndSuggestColors(base64);
      
      if (!analysis.isKitchen) {
        setError("Wait, that doesn't look like a kitchen! Please upload a clear photo of your kitchen cabinets.");
        setStatus('idle');
        return;
      }

      setImage(base64);
      setAiSuggestions(analysis.suggestedColors.map(c => ({ ...c, isAI: true })));
      setAnalysisReasoning(analysis.reasoning);
      
      setSelectedColor(null);
      setCustomColor('');
      setSelectedHardware(HARDWARE_OPTIONS[0]);
      setSelectedSheen('Default');
      setCustomInstruction('');
      
      setStatus('idle');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes("not found")) {
        setHasApiKey(false);
        setError("API Key session expired or not found. Please reconnect.");
      } else {
        setError(`Analysis Failed: ${err.message}`);
      }
      setStatus('idle');
    }
  };

  const handleGenerate = async (newColor?: ColorOption | null, newHardware?: HardwareOption, specificMessage?: string) => {
    if (!image) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    if (!userEmail && generationCount >= GENERATION_LIMIT) {
      setShowEmailGate(true);
      return;
    }

    const hardwareToUse = newHardware || selectedHardware;
    let effectiveColorName: string | null = null;
    let effectiveColorHex: string | null = null;

    if (newColor) {
      effectiveColorName = newColor.name;
      effectiveColorHex = newColor.hex;
      setSelectedColor(newColor);
      setCustomColor('');
    } else if (newColor === null) {
      effectiveColorName = null;
      effectiveColorHex = null;
      setSelectedColor(null);
      setCustomColor('');
    } else {
      if (customColor.trim()) {
        effectiveColorName = customColor;
      } else if (selectedColor) {
        effectiveColorName = selectedColor.name;
        effectiveColorHex = selectedColor.hex;
      }
    }

    if (!effectiveColorName && hardwareToUse.id === 'none' && !customInstruction.trim() && selectedSheen === 'Default' && newColor !== null) {
      setError("Please select a paint color or hardware style.");
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

      if (!userEmail) {
        const newCount = generationCount + 1;
        setGenerationCount(newCount);
        localStorage.setItem('cabcoat_gen_count', newCount.toString());
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes("not found")) {
        setHasApiKey(false);
        setError("API Key session expired or not found. Please reconnect.");
      } else {
        setError(`Generation Failed: ${err.message}`);
      }
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
  };

  const getActiveColorForDisplay = () => {
    if (customColor) return { name: customColor, hex: undefined };
    if (selectedColor) return selectedColor;
    return null;
  };

  const getSamplizeLink = (color: ColorOption) => {
    const query = encodeURIComponent(`${color.name} ${color.manufacturer || ''}`);
    return `https://www.samplize.com/pages/search/?query=${query}`;
  };

  if (maintenanceMode) return <MaintenanceScreen />;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {showEmailGate && <EmailGateModal onUnlock={handleUnlock} />}
      {showDeployment && <DeploymentGuide onClose={() => setShowDeployment(false)} />}
      {showInfographic && <ProcessInfographic onClose={() => setShowInfographic(false)} />}
      {showVideoGuide && <PromotionalVideoGuide onClose={() => setShowVideoGuide(false)} />}
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cabcoat<span className="text-indigo-600">.com</span> AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!hasApiKey && !checkingKey && (
              <button 
                onClick={handleConnectKey}
                className="flex items-center gap-2 text-white bg-indigo-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Key className="w-3.5 h-3.5" /> Connect API
              </button>
            )}
            <button 
              onClick={() => setShowToolkit(!showToolkit)}
              className={`p-2 rounded-lg transition-all ${showToolkit ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title="Pro Toolkit"
            >
              <Wrench className="w-5 h-5" />
            </button>
            {image && (
              <button 
                onClick={resetApp}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-slate-100 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" /> Start Over
              </button>
            )}
          </div>
        </div>

        {showToolkit && (
          <div className="absolute right-4 top-16 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Owner Tools</h3>
            </div>
            <div className="py-2 space-y-1">
              <button onClick={() => { setShowDeployment(true); setShowToolkit(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors">
                <Share2 className="w-4 h-4" /> Deployment Guide
              </button>
              <button onClick={() => { setShowInfographic(true); setShowToolkit(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors">
                <Layout className="w-4 h-4" /> System Architecture
              </button>
              <button onClick={() => { setShowVideoGuide(true); setShowToolkit(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors">
                <Video className="w-4 h-4" /> Promotional Script
              </button>
              <div className="h-px bg-slate-100 my-2 mx-3" />
              <button onClick={() => { setMaintenanceMode(true); setShowToolkit(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-3 transition-colors">
                <Ban className="w-4 h-4" /> Toggle Maintenance Mode
              </button>
            </div>
          </div>
        )}
      </header>

      {!image ? (
        <main className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={HERO_BG} alt="Modern Kitchen" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center animate-fade-in flex flex-col items-center">
            {!hasApiKey && !checkingKey && (
              <div className="mb-12 bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-indigo-100 max-w-lg animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">One Last Step...</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  To use high-quality 4K AI generation, you need to connect your Gemini API project.
                </p>
                <button 
                  onClick={handleConnectKey}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Connect API to Begin <ChevronRight className="w-5 h-5" />
                </button>
                <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Requires Paid Billing Project (ai.google.dev/docs/billing)
                </p>
              </div>
            )}

            {hasApiKey && (
              <>
                {error && (
                  <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake max-w-xl mx-auto">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-700 text-sm flex-1 break-words font-medium">{error}</p>
                  </div>
                )}

                <h2 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9] drop-shadow-2xl">
                  Preview Your Kitchen <br/><span className="text-indigo-400">Before You Paint.</span>
                </h2>
                <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mb-12 leading-relaxed font-light drop-shadow-md">
                  The professional visualization tool for homeowners. Upload a photo and see your cabinets transformed in seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center w-full max-w-2xl mx-auto mb-16">
                    <div className="relative group flex-1">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={status === 'analyzing'} 
                        className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl font-bold text-xl md:text-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {status === 'analyzing' ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                        <span>{status === 'analyzing' ? "Analyzing..." : "Upload Photo"}</span>
                      </button>
                    </div>
                    <div className="relative group flex-1">
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                      <button 
                        onClick={() => cameraInputRef.current?.click()} 
                        disabled={status === 'analyzing'} 
                        className="w-full h-20 bg-white hover:bg-slate-50 text-slate-900 px-8 rounded-2xl font-bold text-xl md:text-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <Camera className="w-7 h-7 text-indigo-600" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl border border-white/20">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Advanced AI: Professional Wood Finish Simulation
                </div>
              </>
            )}
            
            <p className="mt-8 text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] drop-shadow-md">DEVELOPED BY RICK LYNCH</p>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-8 relative">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm flex-1 break-words font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <div className="lg:col-span-8 space-y-6">
              <div ref={resultsRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 relative scroll-mt-24">
                {status === 'generating' && <LoadingOverlay message={loadingMessage} />}
                {generatedImage ? (
                  <ImageComparator originalImage={image} generatedImage={generatedImage} activeColor={getActiveColorForDisplay()} />
                ) : (
                   <div className="relative w-full bg-slate-100 rounded-xl overflow-hidden min-h-[300px]">
                     <img src={`data:image/jpeg;base64,${image}`} alt="Original Kitchen" className="w-full h-auto block" />
                     {status === 'idle' && !generatedImage && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur">Original Photo</span>
                        </div>
                     )}
                   </div>
                )}
              </div>
              {analysisReasoning && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">AI Design Analysis</h3>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{analysisReasoning}</p>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-slate-400" /> Details & Tweaks
                </h3>
                <div className="relative">
                  <textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="E.g., Keep the island white..." className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none min-h-[80px] bg-slate-50 placeholder:text-slate-400 text-slate-700" />
                  <div className="mt-2 text-right">
                    <button onClick={() => handleGenerate(undefined, undefined, "Applying custom tweaks...")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Apply Tweak</button>
                  </div>
                </div>
              </div>
              
              {aiSuggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Suggested Palettes
                  </h3>
                  <div className="space-y-3">
                    {aiSuggestions.map((color) => (
                      <div key={color.name} className="flex flex-col gap-1">
                        <button onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} disabled={status !== 'idle' && status !== 'complete'} className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all hover:shadow-md ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                          <div className="w-10 h-10 rounded-full shadow-inner border border-black/5 shrink-0" style={{ backgroundColor: color.hex }} />
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate flex items-baseline gap-1.5">
                              {color.name}
                              {color.manufacturer && <span className="text-[10px] text-slate-400 font-normal uppercase tracking-tight">by {color.manufacturer}</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{color.description}</p>
                          </div>
                          {selectedColor?.name === color.name && (<Check className="w-5 h-5 text-indigo-600" />)}
                        </button>
                        <a href={getSamplizeLink(color)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 self-end px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors">
                          <ShoppingBag className="w-3 h-3" /> Get Sample on Samplize
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top Benjamin Moore Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleGenerate(null, undefined, "Restoring original finish...")} disabled={status !== 'idle' && status !== 'complete'} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${selectedColor === null && !customColor ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden flex items-center justify-center">
                       <Ban className="w-5 h-5 text-slate-400/70" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-tight leading-none">Original<br/>Finish</span>
                  </button>
                  {POPULAR_COLORS.slice(0, 9).map((color) => (
                    <div key={color.name} className="flex flex-col">
                      <button onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} disabled={status !== 'idle' && status !== 'complete'} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-full ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                        <div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5" style={{ backgroundColor: color.hex }} />
                        <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-tight leading-none">{color.name}<br/><span className="text-[9px] font-normal text-slate-400">{color.code}</span></span>
                      </button>
                      <a href={getSamplizeLink(color)} target="_blank" rel="noopener noreferrer" title="Order Sample" className="mt-1 flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-tighter transition-colors">
                        <ExternalLink className="w-2.5 h-2.5" /> Sample
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-400" /> Custom Style
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Color Name</label>
                      <input type="text" value={customColor} onChange={(e) => { setCustomColor(e.target.value); if (e.target.value.trim().length > 0) setSelectedColor(null); }} placeholder="e.g. Hale Navy" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Droplet className="w-3 h-3" /> Sheen / Finish
                      </label>
                      <select value={selectedSheen} onChange={(e) => setSelectedSheen(e.target.value)} className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50">
                        {SHEEN_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    </div>
                    <button onClick={() => handleGenerate(undefined, undefined, "Applying custom look...")} disabled={status !== 'idle' && status !== 'complete'} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <PaintBucket className="w-4 h-4" /> Apply Custom Look
                    </button>
                  </div>
              </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-slate-400" /> Hardware Style
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {HARDWARE_OPTIONS.map((hw) => (
                    <button key={hw.id} onClick={() => handleGenerate(undefined, hw, `Installing ${hw.name}...`)} disabled={status !== 'idle' && status !== 'complete'} className={`p-2 rounded-lg border text-xs font-medium transition-all text-center ${selectedHardware.id === hw.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{hw.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className="fixed bottom-4 left-4 z-30 pointer-events-none">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400/60 select-none">
          {APP_VERSION}
        </span>
      </footer>

      <footer className="fixed bottom-4 right-4 z-30 pointer-events-none">
        <a href="https://cabcoat.com" target="_blank" rel="noopener noreferrer" className="pointer-events-auto text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-white/50">
          cabcoat.com
        </a>
      </footer>
    </div>
  );
};

export default App;
