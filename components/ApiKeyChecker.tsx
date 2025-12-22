
import React, { useEffect, useState } from 'react';
import { checkApiKey, openApiKeySelection } from '../services/geminiService';

interface ApiKeyCheckerProps {
  onReady: () => void;
}

export const ApiKeyChecker: React.FC<ApiKeyCheckerProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const verifyKey = async () => {
      const selected = await checkApiKey();
      setHasKey(selected);
      if (selected) {
        onReady();
      }
    };
    verifyKey();
  }, [onReady]);

  const handleSelectKey = async () => {
    await openApiKeySelection();
    setHasKey(true); // Optimistic update as per guidelines
    onReady();
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Welcome to Neha Chappal Creative Suite
        </h2>
        <p className="text-slate-300 mb-6">
          To generate high-end marketing assets with Gemini Flash, please select an API key.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
        >
          Select API Key
        </button>
        <p className="mt-4 text-xs text-slate-500">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-indigo-400">
            Learn more about Gemini API
          </a>
        </p>
      </div>
    </div>
  );
};
