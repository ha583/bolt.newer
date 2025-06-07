import React, { useState, useEffect } from 'react';
import { ChevronDown, Cpu } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/models`);
      setModels(response.data.models);
      if (!selectedModel && response.data.defaultModel) {
        onModelChange(response.data.defaultModel);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Cpu className="w-4 h-4" />
        <span>Loading models...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors min-w-[200px]"
      >
        <Cpu className="w-4 h-4" />
        <span className="flex-1 text-left truncate">
          {selectedModelData ? selectedModelData.name : 'Select Model'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                {provider}
              </div>
              {providerModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors ${
                    selectedModel === model.id ? 'bg-gray-700 text-blue-400' : 'text-gray-200'
                  }`}
                >
                  {model.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}