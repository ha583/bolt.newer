import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt, model: selectedModel } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Website Builder AI
          </h1>
          <p className="text-lg text-gray-300">
            Describe your dream website, and we'll help you build it step by step
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Model
              </label>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the website you want to build..."
                className="w-full h-32 p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="w-full bg-blue-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Website Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}