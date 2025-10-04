import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as cheerio from 'cheerio';
import OpenAI from "openai";


// In-memory cache for scraped papers (persists during warm starts)
const cache = new Map();

// Scrape a single PMC paper
async function scrapePaper(link) {
  // Try direct fetch first, then fallback to alternative methods
  const methods = [
    // Method 1: Direct fetch
    async () => {
      console.log('Method 1: Direct fetch');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    },
    
    // Method 2: Use CORS proxy (for development)
    async () => {
      console.log('Method 2: CORS proxy');
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(link)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy failed: ${res.status}`);
      return await res.text();
    }
  ];

  let lastError;
  for (const method of methods) {
    try {
      const html = await method();
      console.log('Successfully fetched HTML, length:', html.length);
      return parseHTML(html, link);
    } catch (error) {
      console.error('Method failed:', error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Separate HTML parsing logic
function parseHTML(html, link) {
  try {
    const $ = cheerio.load(html);

    // Extract title - PMC specific selectors
    let title = $('h1.content-title').first().text().trim();
    if (!title) title = $('.article-title').first().text().trim();
    if (!title) title = $('title').first().text().replace(' - PMC', '').trim();
    if (!title) title = $('h1').first().text().trim();

    // Extract content
    let content = '';
    
    // Get abstract
    const abstract = $('.abstract').text().trim();
    if (abstract) {
      content += '=== ABSTRACT ===\n\n' + abstract + '\n\n';
    }

    // Get main sections - PMC uses specific structure
    const sections = [];
    $('.tsec.sec, .sec').each((_, el) => {
      const sectionText = $(el).text().trim();
      if (sectionText && sectionText.length > 50) {
        sections.push(sectionText);
      }
    });

    if (sections.length > 0) {
      content += '=== CONTENT ===\n\n' + sections.join('\n\n');
    } else {
      // Fallback to article body
      const body = $('article, .article-body, #body').text().trim();
      if (body) content += '=== CONTENT ===\n\n' + body;
    }

    // Clean up content
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Extract image links - focus on figures
    const imageLinks = [];
    const seenUrls = new Set();

    // PMC stores images in specific containers
    $('figure img, .fig img, .image-container img, img[src*="/bin/"]').each((_, el) => {
      let src = $(el).attr('src');
      if (!src || src.startsWith('data:')) return;

      // Convert to absolute URL
      if (!src.startsWith('http')) {
        src = new URL(src, link).href;
      }

      // Get higher resolution version if available
      if (src.includes('.sml.') || src.includes('.thumb.')) {
        src = src.replace('.sml.', '.large.').replace('.thumb.', '.large.');
      }

      if (!seenUrls.has(src)) {
        seenUrls.add(src);
        imageLinks.push(src);
      }
    });

    // If no figures found, look for all meaningful images
    if (imageLinks.length === 0) {
      $('img').each((_, el) => {
        let src = $(el).attr('src');
        if (!src || src.startsWith('data:')) return;
        
        // Skip UI elements
        if (src.includes('icon') || src.includes('logo') || 
            src.includes('button') || src.includes('sprite')) return;

        if (!src.startsWith('http')) {
          src = new URL(src, link).href;
        }

        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          imageLinks.push(src);
        }
      });
    }

    return {
      title,
      content,
      imageLinks
    };

  } catch (error) {
    throw new Error(`Parsing failed: ${error.message}`);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const indexParam = searchParams.get('index');
  const titleParam = searchParams.get('title');
    const demographic = searchParams.get('demographic') || "researcher";

  // Read and parse data.json from public folder
  let records;
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    records = JSON.parse(jsonContent);
    if (!records || records.length === 0) {
      console.error('[ERROR] No records parsed from data.json.');
    } else {
      console.log('[DEBUG] First 5 parsed records:', records.slice(0, 5));
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to read or parse data.json', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Find the paper
  let paper, index = 0;
  if (titleParam) {
    // Normalize function: trim, lowercase, remove punctuation
    const normalize = str => str
      .replace(/[.,:;!?()\[\]{}"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const normalizedTitleParam = normalize(titleParam);
    // Debug: print normalized search title
    console.log("[DEBUG] Normalized search title:", normalizedTitleParam);
    // Debug: print all normalized JSON titles
    const allNormalizedTitles = records.map(r => r.Title ? normalize(r.Title) : "");
    console.log("[DEBUG] All normalized JSON titles:", allNormalizedTitles);

    index = records.findIndex(r => r.Title && normalize(r.Title) === normalizedTitleParam);
    if (index === -1) {
      return new Response(
        JSON.stringify({ error: 'Paper not found', tried: titleParam, normalizedTried: normalizedTitleParam, allNormalizedTitles }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    paper = records[index];
  } else if (indexParam) {
    index = parseInt(indexParam, 10);
    if (isNaN(index) || index < 0 || index >= records.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid index' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    paper = records[index];
  } else {
    paper = records[0];
  }

  // Construct link from Code field
  const link = paper.Code ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${paper.Code}/` : null;
  if (!link) {
    return new Response(
      JSON.stringify({ error: 'No Code found in data.json' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check cache first
  let scrapedData;
  if (cache.has(link)) {
    console.log('Using cached data for:', link);
    scrapedData = cache.get(link);
  } else {
    // Scrape the paper
    try {
      console.log('Scraping:', link);
      scrapedData = await scrapePaper(link);
      cache.set(link, scrapedData);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

    // Prepare prompt based on demographic
    let promptText = "";
    try {
      // Load prompts.md
      const promptsPath = path.join(process.cwd(), "src", "app", "api", "searchArticles", "prompts.md");
      const promptsContent = await fs.readFile(promptsPath, "utf-8");
      if (demographic === "investor") {
        // Extract investor prompt
        const investorMatch = promptsContent.match(/Read the following space biology paper and summarize details relevant for a potential investor[\s\S]+?Write it as if preparing a short investor briefing rather than an academic abstract\./);
        promptText = investorMatch ? investorMatch[0] : "Summarize for an investor.";
      } else {
        // Extract researcher prompt
        const researcherMatch = promptsContent.match(/Read the following space biology paper and summarize it for a researcher and or student in the field[\s\S]+?terrestrial biomedical\s*sciences\."\*/);
        promptText = researcherMatch ? researcherMatch[0].replace(/"\*$/, "") : "Summarize for a researcher.";
      }
    } catch (err) {
      promptText = demographic === "investor" ? "Summarize for an investor." : "Summarize for a researcher.";
    }

    // Compose the full prompt for GPT
    const gptPrompt = `${promptText}\n\n---\n\nTitle: ${scrapedData.title}\n\nContent:\n${scrapedData.content}`;

    // Call OpenAI API
    let summary = "";
    try {
      const openai = new OpenAI({ apiKey: process.env.GPT });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes space biology papers." },
          { role: "user", content: gptPrompt }
        ],
        temperature: 0.2
      });
      summary = completion.choices[0].message.content;
    } catch (err) {
      summary = "Error generating summary: " + err.message;
    }

    // Return the summary and metadata
    return new Response(
      JSON.stringify({
        summary,
        csvTitle: paper.Title,
        link,
        index,
        total: records.length,
        demographic,
        imageLinks: scrapedData.imageLinks
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      }
    );
}
