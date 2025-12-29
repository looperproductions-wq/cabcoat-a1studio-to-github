import React, { useState } from 'react';
import { X, Cloud, Code, Shield, Copy, Check, ExternalLink, HelpCircle, FolderUp, Download, Loader2 } from 'lucide-react';

interface DeploymentGuideProps {
  onClose: () => void;
}

export const DeploymentGuide: React.FC<DeploymentGuideProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Dynamically load JSZip if not present
  React.useEffect(() => {
    if (!(window as any).JSZip) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

  const embedCode = `<iframe 
  src="https://your-project.vercel.app" 
  width="100%" 
  height="900px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  title="CabCoat AI (beta)"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsZipping(true);
    try {
      const JSZip = (window as any).JSZip;
      if (!JSZip) {
        alert("JSZip library is initializing. Please try again in a moment.");
        setIsZipping(false);
        return;
      }
      const zip = new JSZip();
      const root = zip.folder("cabcoat-ai");

      // 1. package.json
      root.file("package.json", JSON.stringify({
        "name": "cabcoat-ai",
        "private": true,
        "version": "1.0.0",
        "type": "module",
        "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
        "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1", "@google/genai": "^1.31.0" },
        "devDependencies": { "@types/react": "^18.2.15", "@types/react-dom": "^18.2.7", "@vitejs/plugin-react": "^4.2.1", "vite": "^5.2.0", "typescript": "^5.2.2" }
      }, null, 2));

      // 2. vite.config.js
      root.file("vite.config.js", `import { defineConfig, loadEnv } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); return { plugins: [react()] } })`);
      // 3. vercel.json
      root.file("vercel.json", JSON.stringify({ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist" }, null, 2));
      // 4. index.html
      root.file("index.html", `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CabCoat AI (beta)</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style> body { font-family: 'Inter', sans-serif; } </style></head><body class="bg-slate-50 text-slate-900"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);

      const src = root.folder("src");
      src.file("main.tsx", `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>,)`);

      // Maintenance Screen
      src.file("components/MaintenanceScreen.tsx", `import React from 'react';
import { Construction, PaintBucket, Sparkles } from 'lucide-react';
export const MaintenanceScreen = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-700"></div>
      </div>
      <div className="relative z-10 text-center max-w-3xl mx-auto backdrop-blur-md bg-white/5 p-8 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-10 relative">
           <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl shadow-xl relative transform -rotate-6 transition-transform hover:rotate-0 duration-500"><PaintBucket className="w-16 h-16 text-white" /></div>
           <div className="absolute -top-4 -right-4 text-amber-300 animate-bounce delay-100"><Sparkles className="w-8 h-8" /></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-8 tracking-tighter leading-tight">Leveling Up.</h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed font-light">We are taking <span className="text-white font-semibold">CabCoat AI</span> offline while we mix new colors and polish the pixels.</p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-indigo-300 text-sm font-medium transition-colors"><Construction className="w-4 h-4" /><span>Under Construction</span></div>
          <div className="text-slate-500 text-sm">Check back soon for V2.0</div>
        </div>
      </div>
      <div className="absolute bottom-8 flex flex-col items-center gap-2 z-10 opacity-50 hover:opacity-100 transition-opacity"><span className="text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">A CabCoat.com Product</span></div>
    </div>
  );
};`);

      // Updated App.tsx
      src.file("App.tsx", `import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, Key, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';

const SHEEN_OPTIONS = ['Default', 'Matte', 'Satin', 'Semi-Gloss', 'High-Gloss'];
const GENERATION_LIMIT = 2;
const MAINTENANCE_MODE = false;

const App: React.FC = () => {
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

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
    const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
    setHasKey(!!envKey);
    setCheckingKey(false);
    const storedCount = localStorage.getItem('cabcoat_gen_count');
    const storedEmail = localStorage.getItem('cabcoat_user_email');
    if (storedCount) setGenerationCount(parseInt(storedCount, 10));
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const handleUnlock = (email: string) => { localStorage.setItem('cabcoat_user_email', email); setUserEmail(email); setShowEmailGate(false); };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file (JPEG or PNG).'); return; }
    try {
      setStatus('analyzing'); setLoadingMessage("Analyzing..."); setError(null); setGeneratedImage(null);
      setSelectedColor(null); setCustomColor(''); setSelectedHardware(HARDWARE_OPTIONS[0]); setSelectedSheen('Default'); setCustomInstruction('');
      const base64 = await fileToBase64(file);
      setImage(base64);
      const analysis = await analyzeKitchenAndSuggestColors(base64);
      setAiSuggestions(analysis.suggestedColors.map(c => ({ ...c, isAI: true })));
      setAnalysisReasoning(analysis.reasoning);
      setStatus('idle');
    } catch (err: any) { console.error(err); setError(\`Analysis Failed: \${err.message}\`); setStatus('idle'); }
  };

  const handleGenerate = async (newColor?: ColorOption | null, newHardware?: HardwareOption, specificMessage?: string) => {
    if (!image) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (!userEmail && generationCount >= GENERATION_LIMIT) { setShowEmailGate(true); return; }
    const hardwareToUse = newHardware || selectedHardware;
    let effectiveColorName = null; let effectiveColorHex = null;
    if (newColor) { effectiveColorName = newColor.name; effectiveColorHex = newColor.hex; setSelectedColor(newColor); setCustomColor(''); }
    else if (newColor === null) { effectiveColorName = null; effectiveColorHex = null; setSelectedColor(null); setCustomColor(''); }
    else { if (customColor.trim()) effectiveColorName = customColor; else if (selectedColor) { effectiveColorName = selectedColor.name; effectiveColorHex = selectedColor.hex; } }
    if (!effectiveColorName && hardwareToUse.id === 'none' && !customInstruction.trim() && selectedSheen === 'Default' && newColor !== null) { setError("Please select a paint color, hardware style, sheen, or add instructions."); return; }
    if (newHardware) setSelectedHardware(newHardware);
    let msg = specificMessage || "Processing...";
    if (!specificMessage) { if (newColor) msg = \`Applying \${newColor.name}...\`; else if (newHardware) msg = \`Installing \${newHardware.name}...\`; else if (customColor) msg = \`Applying \${customColor}...\`; else msg = "Updating design..."; }
    setLoadingMessage(msg);
    if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      setStatus('generating'); setError(null);
      const newImageBase64 = await generateCabinetPreview(image, effectiveColorName, effectiveColorHex, hardwareToUse.name, customInstruction, selectedSheen);
      setGeneratedImage(newImageBase64); setStatus('complete');
      if (!userEmail) { const newCount = generationCount + 1; setGenerationCount(newCount); localStorage.setItem('cabcoat_gen_count', newCount.toString()); }
    } catch (err: any) { console.error(err); setError(\`Generation Failed: \${err.message}\`); setStatus('idle'); }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => { setCustomColor(e.target.value); if (e.target.value.trim().length > 0) setSelectedColor(null); };
  const resetApp = () => { setImage(null); setGeneratedImage(null); setStatus('idle'); setSelectedColor(null); setCustomColor(''); setSelectedHardware(HARDWARE_OPTIONS[0]); setSelectedSheen('Default'); setAiSuggestions([]); setAnalysisReasoning(''); setCustomInstruction(''); setError(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (cameraInputRef.current) cameraInputRef.current.value = ''; };
  const getActiveColorForDisplay = () => { if (customColor) return { name: customColor }; if (selectedColor) return selectedColor; return null; };

  if (checkingKey) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading...</div>;
  if (!hasKey) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-200"><div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Key className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold text-slate-900 mb-3">Setup Required</h2><div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600"><p className="mb-2 font-semibold text-slate-800">API Key Missing</p><p>Please configure the <code className="bg-slate-200 px-1 rounded">VITE_API_KEY</code> environment variable in Vercel.</p></div></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {showEmailGate && <EmailGateModal onUnlock={handleUnlock} />}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40"><div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between"><div className="flex items-center gap-2"><div className="bg-indigo-600 p-2 rounded-lg"><PaintBucket className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold text-slate-900 tracking-tight">CabCoat AI (beta)</h1></div><div className="flex items-center gap-3">{image && (<button onClick={resetApp} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-slate-100 rounded-lg"><RefreshCw className="w-4 h-4" /> Start Over</button>)}</div></div></header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" /><p className="text-red-700 text-sm flex-1 break-words">{error}</p></div>)}
        {!image ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in"><div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner"><Upload className="w-10 h-10 text-indigo-600" /></div><h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Visualize Your Dream Kitchen</h2><p className="text-lg text-slate-600 max-w-2xl mb-6 leading-relaxed">Upload a photo of your kitchen and instantly see how different cabinet colors transform the space using advanced AI.</p><div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-10 border border-indigo-100"><Zap className="w-4 h-4 fill-indigo-500" /> Free trial: 2 instant AI previews</div><div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto"><div className="relative group flex-1"><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center justify-center gap-3"><Upload className="w-5 h-5" /> Upload Photo</button></div><div className="relative group flex-1"><input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" /><button onClick={() => cameraInputRef.current?.click()} className="w-full bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-100 hover:border-indigo-200 px-6 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-slate-100 transition-all hover:scale-105 flex items-center justify-center gap-3"><Camera className="w-5 h-5" /> Take Photo</button></div></div><p className="mt-4 text-xs text-slate-400 uppercase tracking-widest font-medium">Supported Formats: JPG, PNG</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div ref={resultsRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 relative scroll-mt-24">
                {status === 'analyzing' && <LoadingOverlay message={loadingMessage} />}
                {status === 'generating' && <LoadingOverlay message={loadingMessage} />}
                {generatedImage ? ( <ImageComparator originalImage={image} generatedImage={generatedImage} activeColor={getActiveColorForDisplay()} /> ) : ( <div className="relative w-full bg-slate-100 rounded-xl overflow-hidden min-h-[300px]"><img src={\`data:image/jpeg;base64,\${image}\`} alt="Original Kitchen" className="w-full h-auto block" />{status === 'idle' && !generatedImage && ( <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="bg-white/90 text-slate-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur">Original Photo</span></div> )}</div> )}
              </div>
              {analysisReasoning && (<div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5"><div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-indigo-900">AI Design Analysis</h3></div><p className="text-slate-700 text-sm leading-relaxed">{analysisReasoning}</p></div>)}
            </div>
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquarePlus className="w-4 h-4 text-slate-400" /> Details & Tweaks</h3><div className="relative"><textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="E.g., Keep the island white..." className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none min-h-[80px] bg-slate-50 placeholder:text-slate-400 text-slate-700" /><div className="mt-2 text-right"><button onClick={() => handleGenerate(undefined, undefined, "Applying custom tweaks...")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Apply Tweak</button></div></div></div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-slate-400" /> Custom Style</h3><div className="space-y-4"><div><label className="block text-xs font-semibold text-slate-700 mb-1">Custom Color Name</label><input type="text" value={customColor} onChange={handleCustomColorChange} placeholder="e.g. Hale Navy" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" /></div><div><label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"><Droplet className="w-3 h-3" /> Sheen / Finish</label><select value={selectedSheen} onChange={(e) => setSelectedSheen(e.target.value)} className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50">{SHEEN_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div><button onClick={() => handleGenerate(undefined, undefined, "Applying custom look...")} disabled={status !== 'idle' && status !== 'complete'} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><PaintBucket className="w-4 h-4" /> Apply Custom Look</button></div></div>
              {aiSuggestions.length > 0 && (<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Suggested Palettes</h3><div className="space-y-3">{aiSuggestions.map((color) => (<button key={color.name} onClick={() => handleGenerate(color, undefined, \`Applying \${color.name}...\`)} disabled={status !== 'idle' && status !== 'complete'} className={\`w-full flex items-center gap-3 p-2 rounded-lg border transition-all hover:shadow-md \${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 bg-white'}\`}><div className="w-10 h-10 rounded-full shadow-inner border border-black/5 shrink-0" style={{ backgroundColor: color.hex }} /><div className="text-left flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{color.name}</p><p className="text-xs text-slate-500 truncate">{color.description}</p></div>{selectedColor?.name === color.name && (<Check className="w-5 h-5 text-indigo-600" />)}</button>))}</div></div>)}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Trending Classics</h3><div className="grid grid-cols-2 gap-3"><button onClick={() => handleGenerate(null, undefined, "Restoring original finish...")} disabled={status !== 'idle' && status !== 'complete'} className={\`flex flex-col items-center justify-center p-3 rounded-lg border transition-all \${selectedColor === null && !customColor ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}\`}><div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden flex items-center justify-center"><Ban className="w-5 h-5 text-slate-400/70" /></div><span className="text-xs font-medium text-slate-700 text-center">Original Finish</span></button>{POPULAR_COLORS.map((color) => (<button key={color.name} onClick={() => handleGenerate(color, undefined, \`Applying \${color.name}...\`)} disabled={status !== 'idle' && status !== 'complete'} className={\`flex flex-col items-center justify-center p-3 rounded-lg border transition-all \${selectedColor?.name === color.name ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}\`}><div className="w-12 h-12 rounded-full shadow-sm mb-2 border border-black/5" style={{ backgroundColor: color.hex }} /><span className="text-xs font-medium text-slate-700 text-center">{color.name}</span></button>))}</div></div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><PenTool className="w-4 h-4 text-slate-400" /> Hardware Style</h3><div className="grid grid-cols-2 gap-2">{HARDWARE_OPTIONS.map((hw) => (<button key={hw.id} onClick={() => handleGenerate(undefined, hw, \`Installing \${hw.name}...\`)} disabled={status !== 'idle' && status !== 'complete'} className={\`p-2 rounded-lg border text-xs font-medium transition-all text-center \${selectedHardware.id === hw.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}\`}>{hw.name}</button>))}</div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;`);

      // Finalize ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cabcoat-ai.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (e) {
      console.error(e);
      alert("Failed to generate zip file.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Deploy Your App</h2>
            <p className="text-slate-500">Get this app live on Vercel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left: Download */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                  <FolderUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">1. Download Source Code</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Get the complete React source code for this application, pre-configured for Vercel.
                </p>
                <button 
                  onClick={handleDownload}
                  disabled={isZipping}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isZipping ? "Bundling..." : "Download ZIP"}
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 text-slate-600">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">2. Deploy to Vercel</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 mb-4">
                  <li>Unzip the downloaded file.</li>
                  <li>Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">vercel.com/new</a>.</li>
                  <li>Import the folder from your GitHub (push it first) or drag-and-drop via CLI.</li>
                  <li>Add your <code className="bg-slate-100 px-1 rounded">VITE_API_KEY</code> in Environment Variables.</li>
                </ol>
              </div>
            </div>

            {/* Right: Embed */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                      <Code className="w-6 h-6" />
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Step 3</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Embed on Your Site</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Once deployed, copy this code to your Wix, WordPress, or Squarespace site using an "Embed Code" or "HTML" block.
                </p>
                
                <div className="relative group">
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed border border-slate-700">
                    {embedCode}
                  </pre>
                  <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-md transition-colors backdrop-blur"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="mt-4 flex gap-2 items-start bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Replace <span className="font-mono bg-blue-100 px-1 rounded">your-project.vercel.app</span> with your actual deployed URL from Vercel.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
