import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut, Maximize, Download, RotateCcw } from 'lucide-react';

interface ImageComparatorProps {
  originalImage: string;
  generatedImage: string;
  activeColor?: { name: string; hex?: string; manufacturer?: string; code?: string } | null;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImage, generatedImage, activeColor }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset view when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [generatedImage]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download with Footer Swatch
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Use the generated image source
    img.src = `data:image/png;base64,${generatedImage}`;
    
    img.onload = () => {
      // Set canvas size (Image + 160px Footer)
      canvas.width = img.width;
      canvas.height = img.height + 160;

      if (ctx) {
        // Draw Image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Draw Footer Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, img.height, canvas.width, 160);
        
        // Draw Divider
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(0, img.height, canvas.width, 2);

        // Footer Config
        const padding = 40;
        const footerCenterY = img.height + 60;
        
        // Draw Swatch Circle (if hex exists)
        let textStartX = padding;
        
        if (activeColor?.hex) {
            const swatchRadius = 24;
            const swatchX = padding + swatchRadius;
            
            ctx.beginPath();
            ctx.arc(swatchX, footerCenterY, swatchRadius, 0, 2 * Math.PI);
            ctx.fillStyle = activeColor.hex;
            ctx.fill();
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            textStartX = swatchX + swatchRadius + 24;
        }

        // Draw Manufacturer / Code / Name
        if (activeColor?.manufacturer && activeColor?.code) {
             // Subtitle (Manufacturer | Code)
             ctx.fillStyle = '#64748B'; // Slate-500
             ctx.font = 'bold 20px Inter, sans-serif';
             ctx.textAlign = 'left';
             ctx.fillText(`${activeColor.manufacturer} | ${activeColor.code}`, textStartX, footerCenterY - 10);
             
             // Main Title (Color Name)
             ctx.fillStyle = '#0F172A'; // Slate-900
             ctx.font = 'bold 32px Inter, sans-serif';
             ctx.textAlign = 'left';
             ctx.fillText(activeColor?.name || "Custom Finish", textStartX, footerCenterY + 28);
        } else {
             // Single Line Title
             ctx.fillStyle = '#0F172A'; // Slate-900
             ctx.font = 'bold 36px Inter, sans-serif';
             ctx.textAlign = 'left';
             ctx.fillText(activeColor?.name || "Custom Finish", textStartX, footerCenterY + 12);
        }
        
        // Draw Branding / Credit (Aligned Right)
        ctx.fillStyle = '#64748B'; // Slate-500
        ctx.font = '24px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText("Designed by CabCoat AI, a CabCoat.com product", canvas.width - 40, img.height + 140);
      }

      // Save
      const link = document.createElement('a');
      link.download = `kitchen-design-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-slate-100 rounded-xl overflow-hidden shadow-lg group h-[500px] md:h-[600px] flex items-center justify-center cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        ref={imgRef}
        src={showOriginal ? `data:image/jpeg;base64,${originalImage}` : `data:image/png;base64,${generatedImage}`}
        alt="Kitchen Preview"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        className="max-w-full max-h-full object-contain pointer-events-none select-none"
      />
      
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
         <button onClick={handleZoomIn} className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700">
           <ZoomIn className="w-5 h-5" />
         </button>
         <button onClick={handleZoomOut} className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700">
           <ZoomOut className="w-5 h-5" />
         </button>
         <button onClick={handleReset} className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700">
           <RotateCcw className="w-5 h-5" />
         </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-between items-end z-20 pointer-events-none">
         
         <div className="pointer-events-auto">
             <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur block mb-2 w-max">
                {showOriginal ? 'Original' : 'AI Preview'}
             </span>
             {activeColor && !showOriginal && (
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg flex items-center gap-3 border border-white/50">
                    {activeColor.hex && (
                        <div className="w-8 h-8 rounded-full shadow-inner border border-slate-200" style={{ backgroundColor: activeColor.hex }} />
                    )}
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Finish</p>
                        <p className="text-sm font-bold text-slate-900">{activeColor.name}</p>
                    </div>
                </div>
             )}
         </div>

         <div className="flex gap-2 pointer-events-auto">
            <button
                onClick={handleDownload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
                <Download className="w-4 h-4" /> Save
            </button>
            <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 backdrop-blur transition-all active:scale-95 select-none"
            >
                {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showOriginal ? "Showing" : "Original"}
            </button>
         </div>

      </div>
    </div>
  );
};