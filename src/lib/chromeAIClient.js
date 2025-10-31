/**
 * Client-side Chrome AI Service
 * 
 * This module handles client-side AI processing using Chrome's built-in AI APIs
 * including Prompt API (LanguageModel) and Summarizer API powered by Gemini Nano.
 * 
 * UPDATED: Uses new Chrome 138+ API (LanguageModel and Summarizer globals)
 * Note: window.ai.* is obsolete as of Chrome 138
 */

/**
 * Filter articles using Chrome's Prompt API
 * @param {string} demographic - User demographic
 * @param {string} prompt - Search prompt
 * @param {Array} data - Articles data
 * @returns {Promise<Array>} Filtered articles
 */
export async function filterArticlesWithChromeAI(demographic, prompt, data) {
  console.log('🤖 [Chrome AI] filterArticlesWithChromeAI CALLED');
  console.log('📊 [Chrome AI] Input:', { demographic, prompt, dataLength: data?.length });
  
  try {
    // Check if Chrome AI is available (NEW API)
    if (typeof LanguageModel === 'undefined') {
      console.error('❌ [Chrome AI] LanguageModel API not available');
      throw new Error('LanguageModel API not available. Please ensure you have Chrome 138+ with AI features enabled.');
    }

    console.log('✅ [Chrome AI] LanguageModel API is available');
    
    // Check availability before creating session
    const availability = await LanguageModel.availability();
    console.log('📊 [Chrome AI] Model availability:', availability);
    
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable on this device');
    }
    
    console.log('🔧 [Chrome AI] Creating session with temperature: 0.1, topK: 3');
    
    // Create a session with appropriate settings (NEW API)
    const session = await LanguageModel.create({
      temperature: 0.1,
      topK: 3,
      expectedInputs: [
        { type: 'text', languages: ['en'] }
      ],
      expectedOutputs: [
        { type: 'text', languages: ['en'] }
      ],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`⬇️ [Chrome AI] Model download progress: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });
    
    console.log('✅ [Chrome AI] Session created successfully');

    const systemPrompt = "You are a helpful assistant that filters article titles.";
    const taskPrompt = `
### TASK
From the list of articles in the json data, select only those that are most relevant to the given demographic and the given prompt.

### INPUTS
Demographic: ${demographic}
Prompt: ${prompt}
Data: ${JSON.stringify(data)}

### INSTRUCTIONS
1. Read the data provided (it contains an array of objects where each object represents an article. The object contains title, category tag and a unique number).
2. Choose only the article object whose title would most likely appeal to the demographic and the prompt which is provided by the user.
3. You must return atleast 2 items no matter what.
4. Respond **only** with a valid JSON array of objects of the articles — no commentary, no explanations, and no markdown formatting.
5. The prompt can be of the user asking for any type of article. focus on the prompt and then return the articles based on demographic.

### OUTPUT FORMAT
[
{
  "Title": "Title 1",
  "Code": "Code 1",
  "Tags": "tags"
},
{
  "Title": "Title 2",
  "Code": "Code 2",
  "Tags": "tags"
}
]

Note: DO NOT CHANGE THE VALUES OF ANY OBJECT
`;

    const fullPrompt = `${systemPrompt}\n\n${taskPrompt}`;
    
    console.log('📤 [Chrome AI] Sending prompt to AI (length:', fullPrompt.length, 'chars)');
    
    // Check if input is too large and truncate data if needed
    if (fullPrompt.length > 15000) {
      console.warn('⚠️ [Chrome AI] Input too large, reducing dataset size...');
      const reducedData = data.slice(0, Math.floor(data.length / 2));
      console.log('📊 [Chrome AI] Reduced from', data.length, 'to', reducedData.length, 'articles');
      
      const reducedPrompt = `${systemPrompt}\n\n### TASK
From the list of articles in the json data, select only those that are most relevant to the given demographic and the given prompt.

### INPUTS
Demographic: ${demographic}
Prompt: ${prompt}
Data: ${JSON.stringify(reducedData)}

### INSTRUCTIONS
1. Read the data provided (it contains an array of objects where each object represents an article. The object contains title, category tag and a unique number).
2. Choose only the article object whose title would most likely appeal to the demographic and the prompt which is provided by the user.
3. You must return atleast 2 items no matter what.
4. Respond **only** with a valid JSON array of objects of the articles — no commentary, no explanations, and no markdown formatting.

### OUTPUT FORMAT
[{"Title": "Title 1", "Code": "Code 1", "Tags": "tags"}]

Note: DO NOT CHANGE THE VALUES OF ANY OBJECT`;

      const result = await session.prompt(reducedPrompt);
      console.log('📥 [Chrome AI] Received response from AI');
      console.log('📝 [Chrome AI] Raw response:', result.substring(0, 200) + '...');
      
      // Clean up session
      session.destroy();
      console.log('🧹 [Chrome AI] Session destroyed');
      
      // Parse the JSON response
      try {
        const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const articles = JSON.parse(cleanResult);
        console.log('✅ [Chrome AI] Successfully parsed response - Found', articles.length, 'articles');
        return articles;
      } catch (parseError) {
        console.error('❌ [Chrome AI] Error parsing AI response:', parseError);
        console.log('📄 [Chrome AI] Raw result:', result);
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    // Generate response with full dataset
    const result = await session.prompt(fullPrompt);
    
    console.log('📥 [Chrome AI] Received response from AI');
    console.log('📝 [Chrome AI] Raw response:', result.substring(0, 200) + '...');
    
    // Clean up session
    session.destroy();
    console.log('🧹 [Chrome AI] Session destroyed');
    
    // Parse the JSON response
    try {
      // Remove any markdown code block formatting if present
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const articles = JSON.parse(cleanResult);
      console.log('✅ [Chrome AI] Successfully parsed response - Found', articles.length, 'articles');
      return articles;
    } catch (parseError) {
      console.error('❌ [Chrome AI] Error parsing AI response:', parseError);
      console.log('📄 [Chrome AI] Raw result:', result);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('❌ [Chrome AI] Error filtering articles:', error);
    throw error;
  }
}

/**
 * Summarize a paper using Chrome's Summarizer API
 * @param {string} title - Paper title
 * @param {string} content - Paper content
 * @param {string} demographic - User demographic (investor or researcher)
 * @returns {Promise<string>} Summary
 */
export async function summarizePaperWithChromeAI(title, content, demographic) {
  console.log('📄 [Summarizer API] summarizePaperWithChromeAI CALLED');
  console.log('📊 [Summarizer API] Input:', { 
    title: title?.substring(0, 50) + '...', 
    contentLength: content?.length, 
    demographic 
  });
  
  try {
    // Check if Chrome AI is available (NEW API)
    if (typeof Summarizer === 'undefined') {
      console.error('❌ [Summarizer API] Summarizer API not available');
      throw new Error('Summarizer API not available. Please ensure you have Chrome 138+ with AI features enabled.');
    }

    console.log('✅ [Summarizer API] Summarizer API is available');
    
    // Check availability before creating session
    const availability = await Summarizer.availability();
    console.log('📊 [Summarizer API] Model availability:', availability);
    
    if (availability === 'unavailable') {
      throw new Error('Summarizer is unavailable on this device');
    }

    // Prepare the context based on demographic
    let context = '';
    if (demographic === 'investor') {
      context = 'Summarize this space biology paper for a potential investor, focusing on commercial applications, market potential, and key findings that would interest investors. Keep it concise and highlight practical implications.';
    } else {
      context = 'Summarize this space biology paper for a researcher or student in the field. Include key findings, methodology, and implications for future research. Be technical but accessible.';
    }

    console.log('🎯 [Summarizer API] Context set for:', demographic);
    console.log('🔧 [Summarizer API] Creating session with: type=tldr, format=plain-text, length=medium');

    // Create summarizer session (NEW API)
    const session = await Summarizer.create({
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
      expectedInputLanguages: ['en'],
      outputLanguage: 'en',
    });
    
    console.log('✅ [Summarizer API] Session created successfully');

    // Prepare text to summarize
    const textToSummarize = `${context}\n\nTitle: ${title}\n\nContent:\n${content}`;
    
    console.log('📤 [Summarizer API] Sending text to summarize (length:', textToSummarize.length, 'chars)');

    // Generate summary
    const summary = await session.summarize(textToSummarize);
    
    console.log('📥 [Summarizer API] Received summary');
    console.log('📝 [Summarizer API] Summary preview:', summary.substring(0, 100) + '...');
    
    // Clean up session
    session.destroy();
    console.log('🧹 [Summarizer API] Session destroyed');
    
    console.log('✅ [Summarizer API] Successfully completed');
    return summary;
  } catch (error) {
    console.error('❌ [Summarizer API] Error summarizing paper:', error);
    throw error;
  }
}

/**
 * Summarize a paper using Chrome's Prompt API (alternative to Summarizer API)
 * This provides more control over the summarization process
 * @param {string} title - Paper title
 * @param {string} content - Paper content
 * @param {string} demographic - User demographic
 * @returns {Promise<string>} Summary
 */
export async function summarizePaperWithPromptAPI(title, content, demographic) {
  console.log('🤖 [Prompt API Summary] summarizePaperWithPromptAPI CALLED');
  console.log('📊 [Prompt API Summary] Input:', { 
    title: title?.substring(0, 50) + '...', 
    contentLength: content?.length, 
    demographic 
  });
  
  try {
    // Check if Chrome AI is available (NEW API)
    if (typeof LanguageModel === 'undefined') {
      console.error('❌ [Prompt API Summary] LanguageModel API not available');
      throw new Error('LanguageModel API not available. Please ensure you have Chrome 138+ with AI features enabled.');
    }

    console.log('✅ [Prompt API Summary] LanguageModel API is available');
    
    // Check availability before creating session
    const availability = await LanguageModel.availability();
    console.log('📊 [Prompt API Summary] Model availability:', availability);
    
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable on this device');
    }
    
    console.log('🔧 [Prompt API Summary] Creating session with temperature: 0.2, topK: 3');

    // Create a session (NEW API)
    const session = await LanguageModel.create({
      temperature: 0.2,
      topK: 3,
      expectedInputs: [
        { type: 'text', languages: ['en'] }
      ],
      expectedOutputs: [
        { type: 'text', languages: ['en'] }
      ],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`⬇️ [Prompt API Summary] Model download progress: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });
    
    console.log('✅ [Prompt API Summary] Session created successfully');

    // Truncate content to fit within model's context window
    // Gemini Nano has a limited context window (~4000 tokens, roughly 16000 characters)
    const MAX_CONTENT_LENGTH = 12000; // Leave room for prompt and title
    const truncatedContent = content.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to length...]'
      : content;
    
    console.log('📏 [Prompt API Summary] Content length:', content.length, 'chars');
    if (content.length > MAX_CONTENT_LENGTH) {
      console.log('✂️ [Prompt API Summary] Content truncated to:', MAX_CONTENT_LENGTH, 'chars');
    }

    let promptText = '';
    if (demographic === 'investor') {
      promptText = `Read the following space biology paper excerpt and summarize details relevant for a potential investor. Focus on:
- Commercial applications and market potential
- Key findings that could lead to products or services
- Competitive advantages or unique discoveries
- Potential ROI indicators

Write it as if preparing a short investor briefing rather than an academic abstract.`;
    } else {
      promptText = `Read the following space biology paper excerpt and summarize it for a researcher or student in the field. Include:
- Main research question and hypothesis
- Key methodologies used
- Significant findings and results
- Implications for future research
- Connections to broader space biology research or terrestrial biomedical sciences

Be technical but accessible for someone in the field.`;
    }

    const fullPrompt = `${promptText}

---

Title: ${title}

Content:
${truncatedContent}

IMPORTANT: 
- Only return plain text in your response
- Do NOT use any markdown formatting (no **, __, ##, -, *, etc.)
- Do NOT use asterisks for emphasis or lists
- Do NOT use any HTML tags
- Write in plain sentences and paragraphs only
- Use simple text formatting with line breaks for readability`;

    console.log('📤 [Prompt API Summary] Sending prompt to AI (length:', fullPrompt.length, 'chars)');
    
    // Check input quota before sending
    try {
      const tokenCount = session.measureInputUsage(fullPrompt);
      console.log('📊 [Prompt API Summary] Estimated tokens:', tokenCount);
      console.log('📊 [Prompt API Summary] Session quota:', session.inputQuota, 'tokens');
      
      if (tokenCount > session.inputQuota) {
        throw new Error(`Input too large: ${tokenCount} tokens exceeds quota of ${session.inputQuota}`);
      }
    } catch (measureError) {
      console.warn('⚠️ [Prompt API Summary] Could not measure input usage:', measureError.message);
      // Continue anyway - the actual prompt might still work
    }

    // Generate summary
    let summary = await session.prompt(fullPrompt);
    
    console.log('📥 [Prompt API Summary] Received summary');
    console.log('📝 [Prompt API Summary] Summary preview:', summary.substring(0, 100) + '...');
    
    // Clean up any remaining markdown formatting
    summary = summary
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
      .replace(/__(.*?)__/g, '$1')      // Remove __underline__
      .replace(/_(.*?)_/g, '$1')        // Remove _italic_
      .replace(/^#{1,6}\s+/gm, '')      // Remove headers
      .replace(/^\s*[-*+]\s+/gm, '')    // Remove bullet points
      .replace(/^\s*\d+\.\s+/gm, '')    // Remove numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links [text](url)
      .replace(/`([^`]+)`/g, '$1')      // Remove inline code
      .replace(/```[\s\S]*?```/g, '')   // Remove code blocks
      .trim();
    
    console.log('🧹 [Prompt API Summary] Cleaned markdown formatting');
    
    // Clean up session
    session.destroy();
    console.log('🧹 [Prompt API Summary] Session destroyed');
    
    console.log('✅ [Prompt API Summary] Successfully completed');
    return summary;
  } catch (error) {
    console.error('❌ [Prompt API Summary] Error summarizing paper:', error);
    throw error;
  }
}

/**
 * Recommend related papers based on current paper content
 * @param {string} currentTitle - Current paper title
 * @param {string} currentContent - Current paper content (can be abstract or summary)
 * @param {string} currentTags - Current paper tags
 * @param {Array} allPapers - All available papers to recommend from
 * @param {string} demographic - User demographic for personalization
 * @returns {Promise<Array>} Array of 3 recommended papers
 */
export async function recommendRelatedPapers(currentTitle, currentContent, currentTags, allPapers, demographic) {
  console.log('🎯 [Recommendation] recommendRelatedPapers CALLED');
  console.log('📊 [Recommendation] Input:', { 
    currentTitle: currentTitle?.substring(0, 50) + '...', 
    contentLength: currentContent?.length,
    currentTags,
    availablePapers: allPapers?.length,
    demographic
  });
  
  try {
    // Check if Chrome AI is available
    if (typeof LanguageModel === 'undefined') {
      console.error('❌ [Recommendation] LanguageModel API not available');
      throw new Error('LanguageModel API not available. Please ensure you have Chrome 138+ with AI features enabled.');
    }

    console.log('✅ [Recommendation] LanguageModel API is available');
    
    // Check availability
    const availability = await LanguageModel.availability();
    console.log('📊 [Recommendation] Model availability:', availability);
    
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable on this device');
    }
    
    console.log('🔧 [Recommendation] Creating session...');

    // Create a session
    const session = await LanguageModel.create({
      temperature: 0.3,
      topK: 5,
      expectedInputs: [
        { type: 'text', languages: ['en'] }
      ],
      expectedOutputs: [
        { type: 'text', languages: ['en'] }
      ],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`⬇️ [Recommendation] Model download progress: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });
    
    console.log('✅ [Recommendation] Session created successfully');

    // Prepare a simplified dataset (only titles, codes, and tags to reduce token count)
    const simplifiedPapers = allPapers
      .filter(paper => paper.Title !== currentTitle) // Exclude current paper
      .map(paper => ({
        Title: paper.Title,
        Code: paper.Code,
        Tags: paper.Tags || 'Unknown'
      }));

    console.log('📊 [Recommendation] Simplified dataset:', simplifiedPapers.length, 'papers');

    // Truncate content if too long
    const MAX_CONTENT_LENGTH = 3000;
    const truncatedContent = currentContent?.length > MAX_CONTENT_LENGTH 
      ? currentContent.substring(0, MAX_CONTENT_LENGTH) + '...'
      : currentContent;

    const demographicContext = demographic === 'investor' 
      ? 'Focus on papers with commercial potential, practical applications, and related market opportunities.'
      : 'Focus on papers with similar methodologies, related research questions, and complementary scientific findings.';

    const promptText = `You are a research recommendation system. Analyze the current paper and recommend EXACTLY 3 related papers from the dataset.

### CURRENT PAPER
Title: ${currentTitle}
Tags: ${currentTags}
Content Summary: ${truncatedContent}

### USER CONTEXT
User Type: ${demographic}
${demographicContext}

### AVAILABLE PAPERS
${JSON.stringify(simplifiedPapers.slice(0, 100))}

### TASK
1. Analyze the current paper's topic, keywords, and themes
2. Find the 3 MOST RELEVANT papers from the available papers list
3. Consider: topical similarity, complementary research, methodological overlap
4. Return EXACTLY 3 papers that would interest someone reading the current paper

### OUTPUT FORMAT
Respond with ONLY a valid JSON array of exactly 3 paper objects. No commentary, no markdown, just the JSON:

[
  {
    "Title": "exact title from dataset",
    "Code": "exact code from dataset",
    "Tags": "exact tags from dataset",
    "RelevanceReason": "brief 1-sentence explanation why this is relevant"
  }
]

CRITICAL: Use exact Title, Code, and Tags from the dataset. Return EXACTLY 3 papers.`;

    console.log('📤 [Recommendation] Sending prompt to AI (length:', promptText.length, 'chars)');

    // Generate recommendations
    const result = await session.prompt(promptText);
    
    console.log('📥 [Recommendation] Received response from AI');
    console.log('📝 [Recommendation] Raw response:', result.substring(0, 200) + '...');
    
    // Clean up session
    session.destroy();
    console.log('🧹 [Recommendation] Session destroyed');
    
    // Parse the JSON response
    try {
      // Remove any markdown code block formatting if present
      const cleanResult = result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[{]*/, '') // Remove any text before JSON array/object
        .replace(/[^}\]]*$/, '') // Remove any text after JSON array/object
        .trim();
      
      const recommendations = JSON.parse(cleanResult);
      
      // Validate we got exactly 3 recommendations
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        console.error('❌ [Recommendation] Invalid response format - not an array or empty');
        throw new Error('Invalid recommendation format');
      }
      
      // Take only first 3 if more were returned
      const finalRecommendations = recommendations.slice(0, 3);
      
      console.log('✅ [Recommendation] Successfully parsed response - Found', finalRecommendations.length, 'recommendations');
      console.log('🎯 [Recommendation] Recommendations:', finalRecommendations.map(r => r.Title));
      
      return finalRecommendations;
    } catch (parseError) {
      console.error('❌ [Recommendation] Error parsing AI response:', parseError);
      console.log('📄 [Recommendation] Raw result:', result);
      throw new Error('Failed to parse recommendation response as JSON');
    }
  } catch (error) {
    console.error('❌ [Recommendation] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * AI-powered journal features using Chrome's Prompt API
 */

/**
 * Suggest categories for a paper based on its content
 * @param {string} title - Paper title
 * @param {string} summary - Paper summary
 * @param {string} tags - Paper tags
 * @param {Array} existingCategories - User's existing categories
 * @returns {Promise<Array>} Suggested categories
 */
export async function suggestCategories(title, summary, tags, existingCategories = []) {
  console.log('🏷️ [AI Categories] suggestCategories CALLED');
  
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API not available');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable');
    }

    const session = await LanguageModel.create({
      temperature: 0.4,
      topK: 5,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    const existingCatsText = existingCategories.length > 0 
      ? `\nExisting categories: ${existingCategories.join(', ')}`
      : '';

    const prompt = `Analyze this research paper and suggest 3 relevant categories for organizing it in a knowledge journal.

Paper: "${title}"
Tags: ${tags}
Summary: ${summary?.substring(0, 500)}${existingCatsText}

Return EXACTLY 3 category names that:
1. Are concise (1-3 words each)
2. Represent the main research domain
3. Can be used to group similar papers
4. If existing categories match, reuse them

Return ONLY a JSON array of category names:
["Category 1", "Category 2", "Category 3"]`;

    const result = await session.prompt(prompt);
    session.destroy();

    const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const categories = JSON.parse(cleanResult);

    console.log('✅ [AI Categories] Suggested:', categories);
    return categories;
  } catch (error) {
    console.error('❌ [AI Categories] Error:', error);
    return ['Uncategorized'];
  }
}

/**
 * Generate smart connections between journal entries
 * @param {Object} currentEntry - Current journal entry
 * @param {Array} allEntries - All journal entries
 * @returns {Promise<Array>} Suggested connections
 */
export async function findSmartConnections(currentEntry, allEntries) {
  console.log('🔗 [AI Connections] findSmartConnections CALLED');
  
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API not available');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable');
    }

    const session = await LanguageModel.create({
      temperature: 0.3,
      topK: 5,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    // Prepare simplified entries
    const otherPapers = allEntries
      .filter(e => e._id !== currentEntry._id)
      .slice(0, 20) // Limit to prevent token overflow
      .map(e => ({
        id: e._id,
        title: e.paper.title,
        category: e.category.name,
        tags: e.paper.tags
      }));

    const prompt = `Analyze this paper and find up to 3 related papers from the list.

Current Paper:
Title: "${currentEntry.paper.title}"
Category: ${currentEntry.category.name}
Tags: ${currentEntry.paper.tags}

Available Papers:
${JSON.stringify(otherPapers)}

Find papers that:
- Share similar research topics
- Use complementary methods
- Could build upon each other
- Address related questions

Return ONLY a JSON array (up to 3 papers):
[
  {
    "id": "paper_id",
    "relationship": "similar-topic" | "complementary" | "builds-on"
  }
]`;

    const result = await session.prompt(prompt);
    session.destroy();

    const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const connections = JSON.parse(cleanResult);

    console.log('✅ [AI Connections] Found:', connections.length);
    return connections;
  } catch (error) {
    console.error('❌ [AI Connections] Error:', error);
    return [];
  }
}

/**
 * Generate annotation suggestions for a paper
 * @param {string} title - Paper title
 * @param {string} summary - Paper summary
 * @param {string} userRole - User's role (researcher/investor)
 * @returns {Promise<Array>} Annotation suggestions
 */
export async function suggestAnnotations(title, summary, userRole = 'researcher') {
  console.log('📝 [AI Annotations] suggestAnnotations CALLED');
  
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API not available');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable');
    }

    const session = await LanguageModel.create({
      temperature: 0.5,
      topK: 5,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    const roleContext = userRole === 'investor'
      ? 'Focus on commercial applications, market potential, and investment opportunities.'
      : 'Focus on research implications, methodology insights, and future research directions.';

    const prompt = `You are a JSON generator. Generate 3 insightful annotations for this research paper.

Title: "${title}"
Summary: ${summary?.substring(0, 800)}
User Role: ${userRole}

${roleContext}

Each annotation should:
- Highlight a key insight
- Ask a thought-provoking question, OR
- Suggest a connection to real-world applications

CRITICAL: Return ONLY valid JSON array, nothing else. No markdown, no explanations.
Format: ["Annotation 1", "Annotation 2", "Annotation 3"]`;

    const result = await session.prompt(prompt);
    session.destroy();

    // More robust JSON extraction
    let cleanResult = result.trim();
    
    // Remove markdown code blocks
    cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON array if there's extra text
    const arrayMatch = cleanResult.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      cleanResult = arrayMatch[0];
    }
    
    const annotations = JSON.parse(cleanResult);

    console.log('✅ [AI Annotations] Generated:', annotations.length);
    return annotations;
  } catch (error) {
    console.error('❌ [AI Annotations] Error:', error);
    return [];
  }
}

/**
 * Regenerate summary with different focus
 * @param {string} title - Paper title
 * @param {string} content - Paper content
 * @param {string} focus - Focus area (e.g., "methodology", "applications", "findings")
 * @returns {Promise<string>} Regenerated summary
 */
export async function regenerateSummaryWithFocus(title, content, focus) {
  console.log('🔄 [AI Regenerate] regenerateSummaryWithFocus CALLED');
  
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API not available');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is unavailable');
    }

    const session = await LanguageModel.create({
      temperature: 0.3,
      topK: 3,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    const MAX_CONTENT_LENGTH = 8000;
    const truncatedContent = content?.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + '...'
      : content;

    let focusInstructions = '';
    switch(focus) {
      case 'methodology':
        focusInstructions = 'Focus heavily on research methods, experimental design, and technical approaches used.';
        break;
      case 'applications':
        focusInstructions = 'Emphasize practical applications, real-world implications, and potential use cases.';
        break;
      case 'findings':
        focusInstructions = 'Concentrate on key results, discoveries, and significant outcomes.';
        break;
      default:
        focusInstructions = 'Provide a balanced overview of the research.';
    }

    const prompt = `Regenerate the summary for this paper with a specific focus.

Title: "${title}"
Content: ${truncatedContent}

Instructions:
${focusInstructions}

Write in plain text (no markdown). Keep it concise but informative (200-300 words).`;

    const result = await session.prompt(prompt);
    session.destroy();

    console.log('✅ [AI Regenerate] Summary regenerated');
    return result.trim();
  } catch (error) {
    console.error('❌ [AI Regenerate] Error:', error);
    throw error;
  }
}

/**
 * Check if Chrome AI APIs are available
 * @returns {Object} Object with availability status
 */
export function checkChromeAIAvailability() {
  console.log('🔍 [Chrome AI] checkChromeAIAvailability CALLED');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ [Chrome AI] Running in server-side environment');
    return {
      available: false,
      promptAPI: false,
      summarizerAPI: false,
      diagnostics: 'Server-side environment'
    };
  }

  // Detailed diagnostics (UPDATED FOR NEW API)
  console.log('🔬 [Chrome AI] Browser diagnostics:');
  console.log('  - User Agent:', navigator.userAgent);
  console.log('  - Chrome version:', navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown');
  console.log('  - LanguageModel exists:', typeof LanguageModel !== 'undefined');
  console.log('  - Summarizer exists:', typeof Summarizer !== 'undefined');
  
  // Note: window.ai.* is OBSOLETE as of Chrome 138+
  if (typeof window.ai !== 'undefined') {
    console.warn('⚠️ [Chrome AI] Found obsolete window.ai API');
    console.warn('💡 Your code may be using outdated API. Use LanguageModel and Summarizer directly.');
  }

  const capabilities = {
    available: typeof LanguageModel !== 'undefined' || typeof Summarizer !== 'undefined',
    promptAPI: typeof LanguageModel !== 'undefined',
    summarizerAPI: typeof Summarizer !== 'undefined',
    diagnostics: (typeof LanguageModel === 'undefined' && typeof Summarizer === 'undefined') 
      ? 'APIs not found - Chrome 138+ required' 
      : 'New APIs available'
  };
  
  console.log('📊 [Chrome AI] Capabilities:', capabilities);
  
  if (!capabilities.available) {
    console.error('❌ [Chrome AI] NOT AVAILABLE');
    console.log('📋 [Chrome AI] Setup instructions:');
    console.log('   1. Use Chrome Canary 138+ or Chrome Stable 138+');
    console.log('   2. APIs should be available by default');
    console.log('   3. Check chrome://on-device-internals for model status');
    console.log('   4. Ensure model is downloaded (visit chrome://components)');
    console.log('   5. Check hardware requirements: 4GB+ VRAM or 16GB+ RAM');
  }
  
  return capabilities;
}
