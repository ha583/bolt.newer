require("dotenv").config();
import express from "express";
import { generateText } from "ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { getModel, getEnabledModels, isProviderEnabled } from "./providers";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Get available models endpoint
app.get("/models", async (req, res) => {
  try {
    const enabledModels = getEnabledModels();
    res.json({
      models: enabledModels,
      defaultModel: process.env.DEFAULT_MODEL || 'anthropic:claude-3-5-sonnet-20241022'
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

app.post("/template", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const selectedModel = model || process.env.DEFAULT_MODEL || 'anthropic:claude-3-5-sonnet-20241022';
    
    const aiModel = getModel(selectedModel);
    
    const response = await generateText({
      model: aiModel,
      messages: [{
        role: 'user', 
        content: prompt
      }],
      maxTokens: 200,
      system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    });

    const answer = response.text.trim().toLowerCase();
    
    if (answer === "react") {
      res.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [nodeBasePrompt]
      });
      return;
    }

    res.status(400).json({ message: "Could not determine project type" });
  } catch (error) {
    console.error('Error in template endpoint:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;
    const selectedModel = model || process.env.DEFAULT_MODEL || 'anthropic:claude-3-5-sonnet-20241022';
    
    const aiModel = getModel(selectedModel);
    
    const response = await generateText({
      model: aiModel,
      messages: messages,
      maxTokens: 8000,
      system: getSystemPrompt()
    });

    console.log('AI Response:', response);

    res.json({
      response: response.text
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  const enabledProviders = ['openai', 'anthropic', 'google', 'groq', 'ollama', 'azure', 'deepseek', 'fireworks', 'xai', 'openai-compatible']
    .filter(provider => isProviderEnabled(provider));
  
  res.json({
    status: 'healthy',
    enabledProviders,
    modelsAvailable: getEnabledModels().length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Enabled providers:', ['openai', 'anthropic', 'google', 'groq', 'ollama', 'azure', 'deepseek', 'fireworks', 'xai', 'openai-compatible']
    .filter(provider => isProviderEnabled(provider)));
});