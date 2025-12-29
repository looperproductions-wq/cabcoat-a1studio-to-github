
import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, Key, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap, Wrench, Layout, Video, Share2, ExternalLink, ShoppingBag } from 'lucide-react';
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

const SHEEN_OPTIONS = ['Default', 'Matte', 'Satin', 'Semi-Gloss', 'High-Gloss'];
const GENERATION_LIMIT = 2;
const APP_VERSION = 'v1.2.6';

const App: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [showToolkit, setShowToolkit] = useState<boolean>(false);
  const [showDeployment, setShowDeployment] = useState<boolean>(false);
  const [showInfographic, setShowInfographic] = useState<boolean>(false);
  const [showVideoGuide, setShowVideoGuide] = useState<boolean>(false);

  const [hasKey, setHasKey] = useState<boolean>(true);
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
    const checkApiKey = async () => {
      try {
        const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
        setHasKey(!!envKey);
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasKey(false);
      } finally {
        setCheckingKey(false);
      }
    };
    checkApiKey();

    const storedCount = localStorage.getItem('cabcoat_gen_count');
    const storedEmail = localStorage.getItem('cabcoat_user_email');
    if (storedCount) setGenerationCount(parseInt(storedCount, 10));
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  if (maintenanceMode) {
    return (
      <>
        <MaintenanceScreen />
        <button 
          onClick={() => setMaintenanceMode(false)}
          className="fixed bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white px-3 py-1 rounded-full text-xs transition-all z-[100] backdrop-blur-sm"
        >
          Exit Maintenance Mode
        </button>
      </>
    );
  }

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
      setLoadingMessage("Analyzing image...");
      setError(null);
      setGeneratedImage(null);
      
      const base64 = await fileToBase64(file);
      
      const analysis = await analyzeKitchenAndSuggestColors(base64);
      
      if (!analysis.isKitchen) {
        setError("Wait, that doesn't look like a kitchen! Our AI specializes in painting kitchen cabinets. Please upload a clear photo of your kitchen cabinets to continue.");
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
      setError(`Analysis Failed: ${err.message}`);
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

    const hasColor = !!effectiveColorName;
    const hasHardware = hardwareToUse.id !== 'none';
    const hasInstruction = customInstruction.trim().length > 0;
    const hasSheen = selectedSheen !== 'Default';

    if (!hasColor && !hasHardware && !hasInstruction && !hasSheen && newColor !== null) {
      setError("Please select a paint color, hardware style, sheen, or add instructions.");
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
      setError(`Generation Failed: ${err.message}`);
      setStatus('idle');
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    if (e.target.value.trim().length > 0) {
      setSelectedColor(null);
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

  const getActiveColorForDisplay = () => {
    if (customColor) return { name: customColor, hex: undefined };
    if (selectedColor) return selectedColor;
    return null;
  };

  const getSamplizeLink = (color: ColorOption) => {
    const query = encodeURIComponent(`${color.name} ${color.manufacturer || ''}`);
    return `https://www.samplize.com/search?q=${query}`;
  };

  if (checkingKey) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Setup Required</h2>
          <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
              <p className="mb-2 font-semibold text-slate-800">API Key Missing</p>
              <p className="mb-2">This application requires a Gemini API Key to function.</p>
              <p>Please configure the <code className="bg-slate-200 px-1 rounded">VITE_API_KEY</code> environment variable in Vercel.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {showEmailGate && <EmailGateModal onUnlock={handleUnlock} />}
      {showDeployment && <DeploymentGuide onClose={() => setShowDeployment(false)} />}
      {showInfographic && <ProcessInfographic onClose={() => setShowInfographic(false)} />}
      {showVideoGuide && <PromotionalVideoGuide onClose={() => setShowVideoGuide(false)} />}
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <PaintBucket className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CabCoat AI (beta)</h1>
          </div>
          <div className="flex items-center gap-3">
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
              <button 
                onClick={() => { setShowDeployment(true); setShowToolkit(false); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Deployment Guide
              </button>
              <button 
                onClick={() => { setShowInfographic(true); setShowToolkit(false); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Layout className="w-4 h-4" /> System Architecture
              </button>
              <button 
                onClick={() => { setShowVideoGuide(true); setShowToolkit(false); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Video className="w-4 h-4" /> Promotional Script
              </button>
              <div className="h-px bg-slate-100 my-2 mx-3" />
              <button 
                onClick={() => { setMaintenanceMode(true); setShowToolkit(false); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Ban className="w-4 h-4" /> Toggle Maintenance Mode
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm flex-1 break-words font-medium">{error}</p>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Visualize Your Dream Kitchen
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mb-6 leading-relaxed">
              Upload a photo of your kitchen and instantly see how different cabinet colors transform the space using advanced AI.
            </p>

            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-10 shadow-sm animate-pulse border border-indigo-100">
              <Zap className="w-4 h-4 fill-indigo-500" />
              Free trial: Get 2 instant AI previews before registration
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                <div className="relative group flex-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={status === 'analyzing'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100">
                    {status === 'analyzing' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {status === 'analyzing' ? "Checking..." : "Upload Photo"}
                  </button>
                </div>
                <div className="relative group flex-1">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => cameraInputRef.current?.click()} disabled={status === 'analyzing'} className="w-full bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-100 hover:border-indigo-200 px-6 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-slate-100 transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100">
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </button>
                </div>
            </div>
          </div>
        ) : (
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
                        <button 
                          onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} 
                          disabled={status !== 'idle' && status !== 'complete'} 
                          className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all hover:shadow-md ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                        >
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
                        <a 
                          href={getSamplizeLink(color)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 self-end px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
                        >
                          <ShoppingBag className="w-3 h-3" /> Get Sample on Samplize
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top 10 Benjamin Moore Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleGenerate(null, undefined, "Restoring original finish...")} disabled={status !== 'idle' && status !== 'complete'} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${selectedColor === null && !customColor ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden flex items-center justify-center">
                       <Ban className="w-5 h-5 text-slate-400/70" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-tight leading-none">Original<br/>Finish</span>
                  </button>
                  {POPULAR_COLORS.map((color) => (
                    <div key={color.name} className="flex flex-col">
                      <button 
                        onClick={() => handleGenerate(color, undefined, `Applying ${color.name}...`)} 
                        disabled={status !== 'idle' && status !== 'complete'} 
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-full ${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5" style={{ backgroundColor: color.hex }} />
                        <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-tight leading-none">{color.name}<br/><span className="text-[9px] font-normal text-slate-400">{color.code}</span></span>
                      </button>
                      <a 
                        href={getSamplizeLink(color)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Order Sample"
                        className="mt-1 flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-tighter transition-colors"
                      >
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
                      <input type="text" value={customColor} onChange={handleCustomColorChange} placeholder="e.g. Hale Navy" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" />
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
        )}
      </main>

      {/* Persistent Version Number bottom left */}
      <footer className="fixed bottom-4 left-4 z-30 pointer-events-none">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400/60 select-none">
          {APP_VERSION}
        </span>
      </footer>

      {/* Persistent Brand Link at the bottom right */}
      <footer className="fixed bottom-4 right-4 z-30 pointer-events-none">
        <a 
          href="https://cabcoat.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="pointer-events-auto text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-white/50"
        >
          cabcoat.com
        </a>
      </footer>
    </div>
  );
};

export default App;
