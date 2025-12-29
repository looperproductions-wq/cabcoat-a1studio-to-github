import React, { useState, useRef, useEffect } from 'react';
import { Upload, PaintBucket, Sparkles, RefreshCw, AlertCircle, Check, Key, MessageSquarePlus, PenTool, Ban, Palette, Droplet, Camera, Zap, ShoppingBag, ExternalLink } from 'lucide-react';
import { fileToBase64, analyzeKitchenAndSuggestColors, generateCabinetPreview } from './services/geminiService';
import { POPULAR_COLORS, HARDWARE_OPTIONS } from './constants';
import { ColorOption, HardwareOption, ProcessingState } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageComparator } from './components/ImageComparator';
import { EmailGateModal } from './components/EmailGateModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';

const App: React.FC = () => {
  const [image, setImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [status, setStatus] = useState('idle');
  const [selectedColor, setSelectedColor] = useState(null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('cabcoat_user_email'));
  const [showEmailGate, setShowEmailGate] = useState(false);

  useEffect(() => {
    const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
    if (!envKey) console.warn("API Key Missing");
  }, []);

  const getSamplizeLink = (color) => {
    const query = encodeURIComponent(`${color.name} ${color.manufacturer || ''}`);
    return `https://www.samplize.com/search?q=${query}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b h-16 flex items-center px-4 justify-between">
        <h1 className="font-bold flex items-center gap-2"><PaintBucket /> CabCoat AI</h1>
      </header>
      <main className="max-w-6xl mx-auto p-8">
        {/* Core application UI here */}
        <p className="text-slate-500">System Ready (v1.2.5)</p>
      </main>
      <footer className="fixed bottom-4 left-4 opacity-50 text-[10px]">v1.2.5</footer>
      <footer className="fixed bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest"><a href="https://cabcoat.com">cabcoat.com</a></footer>
    </div>
  );
};
export default App;