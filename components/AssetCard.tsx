
import React, { useState } from 'react';
import { GeneratedAsset } from '../types';
import { generateMarketingImage } from '../services/geminiService';

interface AssetCardProps {
  asset: GeneratedAsset;
  onUpdate: (id: string, updates: Partial<GeneratedAsset>) => void;
  sourceImages: string[];
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onUpdate, sourceImages }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [includePersonLocal, setIncludePersonLocal] = useState(false);
  const [customRefinement, setCustomRefinement] = useState('');

  const handleRegenerate = async (includePerson: boolean) => {
    onUpdate(asset.id, { status: 'generating_image' });
    
    try {
      // Combine original prompt with custom refinement if provided
      const finalPrompt = customRefinement.trim() 
        ? `${asset.prompt}. Additional instructions: ${customRefinement}`
        : asset.prompt;

      const generatedImg = await generateMarketingImage(sourceImages, finalPrompt, includePerson);
      onUpdate(asset.id, { imageUrl: generatedImg, status: 'complete' });
    } catch (err) {
      console.error(err);
      onUpdate(asset.id, { status: 'error', error: "Image regeneration failed" });
    }
  };

  const handleTogglePerson = async (enabled: boolean) => {
    setIncludePersonLocal(enabled);
    await handleRegenerate(enabled);
  };

  const downloadAsset = (url: string | undefined, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isProcessing = asset.status === 'generating_image';

  return (
    <div 
      className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all hover:border-indigo-500/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-start pointer-events-none">
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-slate-800/80 backdrop-blur text-indigo-300 border border-slate-700 shadow-sm">
          {asset.variantType}
        </span>
        
        {asset.imageUrl && (
          <button 
            onClick={(e) => { e.stopPropagation(); downloadAsset(asset.imageUrl, `neha-chappal-${asset.variantType}-img.png`); }}
            className={`pointer-events-auto p-2 bg-slate-900/80 hover:bg-indigo-600 text-white rounded-lg backdrop-blur transition-all duration-300 border border-slate-700 hover:border-indigo-500 shadow-lg ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            title="Download Image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
        {asset.status === 'pending' && (
          <div className="text-slate-500 text-sm">Waiting to generate...</div>
        )}
        
        {isProcessing && (
          <div className="flex flex-col items-center gap-2 z-20 absolute inset-0 bg-slate-950/40 backdrop-blur-sm">
            <div className="mt-auto mb-2">
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-xs text-indigo-400 animate-pulse mb-auto font-medium">
              Designing Scene...
            </span>
          </div>
        )}

        {asset.imageUrl && (
          <img 
            src={asset.imageUrl} 
            alt={asset.variantType} 
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isProcessing ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          />
        )}
      </div>

      <div className="p-4 space-y-4 bg-slate-900">
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5rem]" title={asset.prompt}>
          {asset.prompt}
        </p>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          
          {asset.imageUrl && asset.status === 'complete' && (
            <>
              {/* Show on Model Control & Custom Prompt Group */}
              <div className="space-y-3">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Show on Model</span>
                    <span className="text-[10px] text-slate-500">Regenerate with person</span>
                  </div>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleTogglePerson(!includePersonLocal)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${includePersonLocal ? 'bg-indigo-600' : 'bg-slate-700'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includePersonLocal ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {/* Optional Custom Refinement Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom Refinement (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g. Add morning sunlight..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      value={customRefinement}
                      onChange={(e) => setCustomRefinement(e.target.value)}
                    />
                    <button 
                      onClick={() => handleRegenerate(includePersonLocal)}
                      disabled={isProcessing}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Apply Refinement"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 bg-slate-950/40 px-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <div className={`w-1.5 h-1.5 bg-indigo-500 rounded-full ${isProcessing ? 'animate-ping' : ''}`} />
                  {isProcessing ? 'Processing...' : 'Image Ready'}
                </div>
                <button 
                  onClick={() => downloadAsset(asset.imageUrl, `neha-chappal-${asset.variantType}-img.png`)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 active:scale-95 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PNG
                </button>
              </div>
            </>
          )}

          {asset.status === 'error' && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-[10px] text-red-300 font-medium">Error: {asset.error || 'Failed to generate'}</p>
              <button 
                onClick={() => handleRegenerate(includePersonLocal)}
                className="mt-2 text-[10px] text-red-400 underline hover:text-red-300"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
