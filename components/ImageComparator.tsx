
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
  // Initializing dragStart with a static object { x: 0, y: 0 } instead of trying to access 'e' which is undefined here
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

  // Download with Color Info Swatch
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Use the generated image source
    img.src = `data:image/png;base64,${generatedImage}`;
    
    img.onload = () => {
      // Set canvas size (Image + 120px Footer)
      const footerHeight = 120;
      canvas.width = img.width;
      canvas.height = img.height + footerHeight;

      if (ctx) {
        // Draw Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Main Image
        ctx.drawImage(img, 0, 0);

        // Draw Footer Area
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, img.height, canvas.width, footerHeight);
        
        // Draw Divider Line
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(0, img.height, canvas.width, 2);

        // Footer Content Layout
        const padding = 40;
        const footerCenterY = img.height + (footerHeight / 2);
        let textStartX = padding;
        
        // Draw Swatch Circle (if hex exists)
        if (activeColor?.hex) {
            const swatchRadius = 28;
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
             ctx.fillText(`${activeColor.manufacturer} | ${activeColor.code}`, textStartX, footerCenterY - 8);
             
             // Main Title (Color Name)
             ctx.fillStyle = '#0F172A'; // Slate-900
             ctx.font = 'bold 34px Inter, sans-serif';
             ctx.textAlign = 'left';
             ctx.fillText(activeColor?.name || "Custom Finish", textStartX, footerCenterY + 30);
        } else {
             // Single Line Title (centered vertically in footer)
             ctx.fillStyle = '#0F172A'; // Slate-900
             ctx.font = 'bold 38px Inter, sans-serif';
             ctx.textAlign = 'left';
             ctx.fillText(activeColor?.name || "Custom Finish", textStartX, footerCenterY + 14);
        }

        // Add brand watermark to bottom right
        ctx.fillStyle = '#94A3B8'; // Slate-400
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText("cabcoat.com", canvas.width - padding, footerCenterY + 14);
      }

      // Save as JPEG
      const link = document.createElement('a');
      link.download = `cabcoat-design-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
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
         <button onClick={handleZoomIn} title="Zoom In" className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 transition-colors">
           <ZoomIn className="w-5 h-5" />
         </button>
         <button onClick={handleZoomOut} title="Zoom Out" className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 transition-colors">
           <ZoomOut className="w-5 h-5" />
         </button>
         <button onClick={handleReset} title="Reset View" className="bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 transition-colors">
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
                <Download className="w-4 h-4" /> Save Design
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
                {showOriginal ? "Showing Original" : "Compare"}
            </button>
         </div>

      </div>
    </div>
  );
};
