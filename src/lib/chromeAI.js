/**
 * Chrome Built-in AI API Utilities
 * 
 * This module provides helper functions to interact with Chrome's built-in AI APIs
 * including Prompt API, Summarizer API, Writer API, and others powered by Gemini Nano.
 * 
 * Note: These APIs are available in Chrome with the AI Early Preview Program enabled.
 * For production use, ensure users have the necessary Chrome version and features enabled.
 */

/**
 * Check if Chrome AI APIs are available
 * @returns {Promise<boolean>} Whether Chrome AI is available
 */
export async function isChromeAIAvailable() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check for the ai namespace
    return typeof window.ai !== 'undefined';
  } catch (error) {
    console.error('Error checking Chrome AI availability:', error);
    return false;
  }
}

/**
 * Create a Prompt API session
 * @param {Object} options - Configuration options for the session
 * @returns {Promise<Object>} AI session object
 */
export async function createPromptSession(options = {}) {
  try {
    if (!window.ai || !window.ai.languageModel) {
      throw new Error('Chrome Prompt API not available');
    }

    const defaultOptions = {
      temperature: 0.1,
      topK: 3,
      ...options
    };

    const session = await window.ai.languageModel.create(defaultOptions);
    return session;
  } catch (error) {
    console.error('Error creating Prompt API session:', error);
    throw error;
  }
}

/**
 * Use Chrome's Prompt API to generate text
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User query
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Generated response
 */
export async function generateWithPromptAPI(systemPrompt, userPrompt, options = {}) {
  try {
    const session = await createPromptSession(options);
    
    // Combine system and user prompts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await session.prompt(fullPrompt);
    
    // Clean up session
    session.destroy();
    
    return result;
  } catch (error) {
    console.error('Error generating with Prompt API:', error);
    throw error;
  }
}

/**
 * Create a Summarizer API session
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Summarizer session
 */
export async function createSummarizerSession(options = {}) {
  try {
    if (!window.ai || !window.ai.summarizer) {
      throw new Error('Chrome Summarizer API not available');
    }

    const defaultOptions = {
      type: 'tl;dr', // or 'key-points', 'teaser', 'headline'
      format: 'plain-text', // or 'markdown'
      length: 'medium', // or 'short', 'long'
      ...options
    };

    const session = await window.ai.summarizer.create(defaultOptions);
    return session;
  } catch (error) {
    console.error('Error creating Summarizer API session:', error);
    throw error;
  }
}

/**
 * Summarize text using Chrome's Summarizer API
 * @param {string} text - Text to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summary
 */
export async function summarizeText(text, options = {}) {
  try {
    const session = await createSummarizerSession(options);
    const summary = await session.summarize(text);
    
    // Clean up session
    session.destroy();
    
    return summary;
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw error;
  }
}

/**
 * Create a Writer API session
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Writer session
 */
export async function createWriterSession(options = {}) {
  try {
    if (!window.ai || !window.ai.writer) {
      throw new Error('Chrome Writer API not available');
    }

    const defaultOptions = {
      tone: 'neutral', // or 'formal', 'casual'
      format: 'plain-text', // or 'markdown'
      length: 'medium', // or 'short', 'long'
      ...options
    };

    const session = await window.ai.writer.create(defaultOptions);
    return session;
  } catch (error) {
    console.error('Error creating Writer API session:', error);
    throw error;
  }
}

/**
 * Generate text using Chrome's Writer API
 * @param {string} prompt - Writing prompt
 * @param {Object} options - Writing options
 * @returns {Promise<string>} Generated text
 */
export async function writeText(prompt, options = {}) {
  try {
    const session = await createWriterSession(options);
    const result = await session.write(prompt);
    
    // Clean up session
    session.destroy();
    
    return result;
  } catch (error) {
    console.error('Error writing text:', error);
    throw error;
  }
}

/**
 * Create a Rewriter API session
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Rewriter session
 */
export async function createRewriterSession(options = {}) {
  try {
    if (!window.ai || !window.ai.rewriter) {
      throw new Error('Chrome Rewriter API not available');
    }

    const defaultOptions = {
      tone: 'as-is', // or 'more-formal', 'more-casual'
      format: 'as-is', // or 'plain-text', 'markdown'
      length: 'as-is', // or 'shorter', 'longer'
      ...options
    };

    const session = await window.ai.rewriter.create(defaultOptions);
    return session;
  } catch (error) {
    console.error('Error creating Rewriter API session:', error);
    throw error;
  }
}

/**
 * Rewrite text using Chrome's Rewriter API
 * @param {string} text - Text to rewrite
 * @param {Object} options - Rewriting options
 * @returns {Promise<string>} Rewritten text
 */
export async function rewriteText(text, options = {}) {
  try {
    const session = await createRewriterSession(options);
    const result = await session.rewrite(text);
    
    // Clean up session
    session.destroy();
    
    return result;
  } catch (error) {
    console.error('Error rewriting text:', error);
    throw error;
  }
}

/**
 * Check capabilities of Chrome AI APIs
 * @returns {Promise<Object>} Object with availability status of each API
 */
export async function checkCapabilities() {
  if (typeof window === 'undefined') {
    return {
      available: false,
      promptAPI: false,
      summarizerAPI: false,
      writerAPI: false,
      rewriterAPI: false,
      translatorAPI: false,
      languageDetectorAPI: false,
    };
  }

  return {
    available: typeof window.ai !== 'undefined',
    promptAPI: typeof window.ai?.languageModel !== 'undefined',
    summarizerAPI: typeof window.ai?.summarizer !== 'undefined',
    writerAPI: typeof window.ai?.writer !== 'undefined',
    rewriterAPI: typeof window.ai?.rewriter !== 'undefined',
    translatorAPI: typeof window.ai?.translator !== 'undefined',
    languageDetectorAPI: typeof window.ai?.languageDetector !== 'undefined',
  };
}
