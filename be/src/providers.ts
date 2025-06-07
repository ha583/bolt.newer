import { anthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { deepseek } from '@ai-sdk/deepseek';
import { createFireworks, fireworks } from '@ai-sdk/fireworks';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import {
  createProviderRegistry,
  extractReasoningMiddleware,
  wrapLanguageModel
} from 'ai';
import { createOllama } from 'ollama-ai-provider';

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
  groq,
  ollama: createOllama({
    baseURL: `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api`
  }),
  azure: createAzure({
    apiKey: process.env.AZURE_API_KEY,
    resourceName: process.env.AZURE_RESOURCE_NAME,
    apiVersion: '2025-03-01-preview'
  }),
  deepseek,
  fireworks: {
    ...createFireworks({
      apiKey: process.env.FIREWORKS_API_KEY
    }),
    languageModel: fireworks
  },
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  }),
  xai
});

export function getModel(model: string) {
  const [provider, ...modelNameParts] = model.split(':') ?? [];
  const modelName = modelNameParts.join(':');
  
  if (model.includes('ollama')) {
    const ollama = createOllama({
      baseURL: `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api`
    });

    // if model is deepseek-r1, add reasoning middleware
    if (model.includes('deepseek-r1')) {
      return wrapLanguageModel({
        model: ollama(modelName),
        middleware: extractReasoningMiddleware({
          tagName: 'think'
        })
      });
    }

    // if ollama provider, set simulateStreaming to true
    return ollama(modelName, {
      simulateStreaming: true
    });
  }

  // if model is groq and includes deepseek-r1, add reasoning middleware
  if (model.includes('groq') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: groq(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    });
  }

  // if model is fireworks and includes deepseek-r1, add reasoning middleware
  if (model.includes('fireworks') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: fireworks(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    });
  }

  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  );
}

export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL;
    case 'azure':
      return !!process.env.AZURE_API_KEY && !!process.env.AZURE_RESOURCE_NAME;
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY;
    case 'fireworks':
      return !!process.env.FIREWORKS_API_KEY;
    case 'xai':
      return !!process.env.XAI_API_KEY;
    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      );
    default:
      return false;
  }
}

export function getToolCallModel(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? [];
  const modelName = modelNameParts.join(':');
  switch (provider) {
    case 'deepseek':
      return getModel('deepseek:deepseek-chat');
    case 'fireworks':
      return getModel(
        'fireworks:accounts/fireworks/models/llama-v3p1-8b-instruct'
      );
    case 'groq':
      return getModel('groq:llama-3.1-8b-instant');
    case 'ollama':
      const ollamaModel =
        process.env.OLLAMA_TOOL_CALL_MODEL || modelName;
      return getModel(`ollama:${ollamaModel}`);
    case 'google':
      return getModel('google:gemini-2.0-flash');
    default:
      return getModel('openai:gpt-4o-mini');
  }
}

export function isToolCallSupported(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? [];
  const modelName = modelNameParts.join(':');

  if (provider === 'ollama') {
    return false;
  }

  if (provider === 'google') {
    return false;
  }

  // Deepseek R1 is not supported
  // Deepseek v3's tool call is unstable, so we include it in the list
  return !modelName?.includes('deepseek');
}

export function isReasoningModel(model: string): boolean {
  if (typeof model !== 'string') {
    return false;
  }
  return (
    model.includes('deepseek-r1') ||
    model.includes('deepseek-reasoner') ||
    model.includes('o3-mini')
  );
}

export const availableModels = [
  // OpenAI
  { id: 'openai:gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'openai:gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'openai:gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'openai:o1-preview', name: 'o1 Preview', provider: 'openai' },
  { id: 'openai:o1-mini', name: 'o1 Mini', provider: 'openai' },
  
  // Anthropic
  { id: 'anthropic:claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'anthropic:claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
  { id: 'anthropic:claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
  
  // Google
  { id: 'google:gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
  { id: 'google:gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
  { id: 'google:gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
  
  // Groq
  { id: 'groq:llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq' },
  { id: 'groq:llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq' },
  { id: 'groq:mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq' },
  
  // DeepSeek
  { id: 'deepseek:deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
  { id: 'deepseek:deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek' },
  
  // xAI
  { id: 'xai:grok-beta', name: 'Grok Beta', provider: 'xai' },
  { id: 'xai:grok-vision-beta', name: 'Grok Vision Beta', provider: 'xai' },
  
  // Fireworks
  { id: 'fireworks:accounts/fireworks/models/llama-v3p1-405b-instruct', name: 'Llama 3.1 405B', provider: 'fireworks' },
  { id: 'fireworks:accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B', provider: 'fireworks' },
];

export function getEnabledModels() {
  return availableModels.filter(model => isProviderEnabled(model.provider));
}