
import React, { useState, useCallback } from 'react';
import { AssetCard } from './components/AssetCard';
import { fileToBase64 } from './utils';
import { analyzeAndPlanAssets, generateMarketingImage } from './services/geminiService';
import { GeneratedAsset, VariantType } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeSourceImage = sourceImages[activeImageIndex] || null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newImages.push(base64);
      }
      
      setSourceImages(prev => {
        const updated = [...prev, ...newImages];
        return updated;
      });
      
      if (sourceImages.length === 0) {
        setAssets([]);
      }
    } catch (err) {
      setError("Failed to process images");
    }
  };

  const handleImageSelect = (index: number) => {
    setActiveImageIndex(index);
  };

  const clearAll = () => {
    setSourceImages([]);
    setAssets([]);
    setActiveImageIndex(0);
  };

  const startCreativeProcess = async () => {
    if (sourceImages.length === 0) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const plan = await analyzeAndPlanAssets(sourceImages);
      
      const newAssets: GeneratedAsset[] = Object.entries(plan).map(([variant, prompt]) => ({
        id: generateId(),
        variantType: variant as VariantType,
        prompt: prompt,
        status: 'pending'
      }));
      setAssets(newAssets);
      setIsAnalyzing(false);

      for (const asset of newAssets) {
        processAssetImage(asset.id, sourceImages, asset.prompt, false);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to analyze images. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const processAssetImage = async (id: string, referenceImages: string[], prompt: string, includePerson: boolean) => {
    updateAsset(id, { status: 'generating_image' });

    try {
      const generatedImg = await generateMarketingImage(referenceImages, prompt, includePerson);
      updateAsset(id, { imageUrl: generatedImg, status: 'complete' });
    } catch (err) {
      console.error(err);
      updateAsset(id, { status: 'error', error: "Image generation failed" });
    }
  };

  const updateAsset = useCallback((id: string, updates: Partial<GeneratedAsset>) => {
    setAssets(prev => prev.map(asset => asset.id === id ? { ...asset, ...updates } : asset));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white">
                N
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Neha Chappal <span className="font-light text-indigo-400">Creative Suite</span>
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Gemini Flash Active
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI-Powered <span className="text-indigo-400">Campaign Generator</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload your footwear product angles. We'll generate 5 distinct marketing campaigns based on your photos.
          </p>
        </div>

        {sourceImages.length === 0 ? (
          <div className="max-w-xl mx-auto border-2 border-dashed border-slate-700 rounded-2xl p-10 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all cursor-pointer group relative">
             <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-white">Upload Product Shots</p>
                <p className="text-sm text-slate-500 mt-1">Select one or multiple angles (PNG, JPG)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12 animate-fade-in">
             <div className="flex flex-col sm:flex-row gap-8 items-start">
               <div className="w-full sm:w-1/3 bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Source Angles</h3>
                    <div className="relative overflow-hidden">
                       <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Add more angles"
                      />
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                        + Add Angle
                      </button>
                    </div>
                  </div>
                  
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-950 relative border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                    <img src={activeSourceImage || ''} alt="Active Source" className="w-full h-full object-contain" />
                  </div>

                  {sourceImages.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                      {sourceImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleImageSelect(idx)}
                          className={`
                            relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all
                            ${activeImageIndex === idx ? 'border-indigo-500 opacity-100 ring-2 ring-indigo-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'}
                          `}
                        >
                          <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={clearAll}
                    className="mt-4 w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-slate-700 border-transparent rounded-lg transition-colors"
                  >
                    Reset All
                  </button>
               </div>

               <div className="flex-1 space-y-6">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 p-6 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-2">Generate Campaign Assets</h3>
                    <p className="text-slate-400 mb-6">
                      Gemini Flash will use <span className="text-indigo-300 font-semibold">all uploaded angles</span> to generate 5 unique marketing variants.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={startCreativeProcess}
                        disabled={isAnalyzing || assets.length > 0}
                        className={`
                          w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95
                          ${isAnalyzing || assets.length > 0
                            ? 'bg-slate-800 text-slate-400 cursor-default' 
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}
                        `}
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </span>
                        ) : assets.length > 0 ? 'Campaign Generated' : 'Start Creative Magic'}
                      </button>

                      {assets.length > 0 && !isAnalyzing && (
                        <button
                          onClick={startCreativeProcess}
                          className="w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/10 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate All Assets
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}
               </div>
             </div>
          </div>
        )}

        {assets.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">#</span> Generated Collections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onUpdate={updateAsset}
                  sourceImages={sourceImages}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
