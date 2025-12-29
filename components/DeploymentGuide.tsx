
import React, { useState } from 'react';
import { X, Cloud, Code, Shield, Copy, Check, ExternalLink, HelpCircle, FolderUp, Download, Loader2 } from 'lucide-react';

interface DeploymentGuideProps {
  onClose: () => void;
}

export const DeploymentGuide: React.FC<DeploymentGuideProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const currentVersion = "1.3.0";

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
        "version": currentVersion,
        "type": "module",
        "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
        "dependencies": { 
            "react": "^18.2.0", 
            "react-dom": "^18.2.0", 
            "lucide-react": "^0.263.1", 
            "@google/genai": "^1.31.0" 
        },
        "devDependencies": { 
            "@types/react": "^18.2.15", 
            "@types/react-dom": "^18.2.7", 
            "@vitejs/plugin-react": "^4.2.1", 
            "vite": "^5.2.0", 
            "typescript": "^5.2.2" 
        }
      }, null, 2));

      // 2. vite.config.js
      root.file("vite.config.js", `import { defineConfig, loadEnv } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); return { plugins: [react()] } })`);
      // 3. vercel.json
      root.file("vercel.json", JSON.stringify({ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist" }, null, 2));
      // 4. index.html
      root.file("index.html", `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CabCoat AI (beta)</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style> body { font-family: 'Inter', sans-serif; } </style></head><body class="bg-slate-50 text-slate-900"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);

      const src = root.folder("src");
      src.file("main.tsx", `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>,)`);

      const components = src.folder("components");

      // Bundle core App.tsx with current logic and correct version
      src.file("App.tsx", `import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, Key, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap, ShoppingBag, ExternalLink } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';

const APP_VERSION = 'v${currentVersion}';

const App: React.FC = () => {
  const [image, setImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [status, setStatus] = useState('idle');
  const [selectedColor, setSelectedColor] = useState(null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('cabcoat_user_email'));

  useEffect(() => {
    const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
    if (!envKey) console.warn("API Key Missing");
  }, []);

  const getSamplizeLink = (color) => {
    const query = encodeURIComponent(\`\${color.name} \${color.manufacturer || ''}\`);
    return \`https://www.samplize.com/pages/search/?query=\${query}\`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b h-16 flex items-center px-4 justify-between">
        <h1 className="font-bold flex items-center gap-2"><PaintBucket /> CabCoat AI</h1>
      </header>
      <main className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-900">
        <h2 className="text-8xl font-black text-white mb-8 tracking-tighter text-center">Visualize Your Dream Kitchen</h2>
        <p className="text-2xl text-slate-400 mb-12 text-center">Try the interactive visualizer. (v${currentVersion})</p>
        <div className="flex justify-center gap-6">
            <button className="bg-indigo-600 text-white px-10 py-6 rounded-2xl font-bold text-2xl shadow-xl">Upload Photo</button>
        </div>
      </main>
      <footer className="fixed bottom-4 left-4 opacity-50 text-[10px] uppercase tracking-widest">{APP_VERSION}</footer>
      <footer className="fixed bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest"><a href="https://cabcoat.com">cabcoat.com</a></footer>
    </div>
  );
};
export default App;`);

      // Finalize ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cabcoat-ai-v${currentVersion}.zip`;
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
            <p className="text-slate-500">Get this app live on Vercel (v{currentVersion})</p>
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
                <button onClick={handleDownload} disabled={isZipping} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
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
                  <li>Import the folder from your GitHub (push it first).</li>
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
                  <button onClick={handleCopy} className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-md transition-colors backdrop-blur" title="Copy to clipboard">
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
           <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
