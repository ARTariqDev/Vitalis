"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InfographicsCarousel from "../components/InfographicsCarousel";
import Comments from "../components/comments";
import { 
  summarizePaperWithPromptAPI, 
  checkChromeAIAvailability, 
  recommendRelatedPapers,
  suggestCategories,
  suggestAnnotations
} from "@/lib/chromeAIClient";
import { saveJournalEntry, getUserCategories, getJournalEntries } from "@/lib/journalStorage";

export default function PaperClient() {
  const router = useRouter();
  const [paperData, setPaperData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chromeAIAvailable, setChromeAIAvailable] = useState(null);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // Journal modal state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6366f1");
  const [userCategories, setUserCategories] = useState([]);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedAnnotations, setSuggestedAnnotations] = useState([]);
  const [userAnnotation, setUserAnnotation] = useState("");
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);

  // Extract paper title from query string using Next.js useSearchParams
  const searchParams = useSearchParams();
  const paperTitle = searchParams.get("title") || "";

  useEffect(() => {
    // Check Chrome AI availability
    const capabilities = checkChromeAIAvailability();
    setChromeAIAvailable(capabilities.promptAPI || capabilities.summarizerAPI);
  }, []);

  // Reset state when paper changes
  useEffect(() => {
    console.log("🔄 [Paper] Paper changed, resetting state");
    setSummaryGenerated(false);
    setRecommendations([]);
    setIsGeneratingSummary(false);
    setIsLoadingRecommendations(false);
    setPaperData(null);
  }, [paperTitle]);

  useEffect(() => {
    console.log("📄 [Paper] Component mounting");
    console.log("📋 [Paper] Paper title:", paperTitle);
    
    if (!paperTitle) {
      console.log("⚠️ [Paper] No paper title provided, redirecting to dashboard");
      router.push("/dashboard");
      return;
    }
    
    const loadPaper = async () => {
      console.log("🔄 [Paper] loadPaper CALLED");
      setIsLoading(true);
      
      try {
        // Fetch paper data from API (now returns content for Chrome AI processing)
        console.log("📡 [Paper] Fetching paper data from /api/data...");
        const res = await fetch(
          `/api/data?title=${encodeURIComponent(paperTitle)}&demographic=researcher`
        );
        
        let data;
        try {
          data = await res.json();
          console.log("✅ [Paper] Paper data received");
        } catch (e) {
          console.error("❌ [Paper] Invalid JSON response:", e);
          data = { error: "Invalid JSON response from server." };
        }
        
        if (!res.ok || data.error) {
          console.error("❌ [Paper] Error loading paper:", data.error);
          setPaperData({ error: data.error || "Failed to load paper." });
          setIsLoading(false);
          return;
        }
        
        // Set paper data (summary will be generated on button click)
        setPaperData(data);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ [Paper] Error in loadPaper:", err);
        setPaperData({ error: err.message || "Network error." });
      } finally {
        setIsLoading(false);
        console.log("🏁 [Paper] loadPaper COMPLETE");
      }
    };
    
    loadPaper();
  }, [paperTitle]);

  const handleGenerateSummary = useCallback(async () => {
    if (!paperData || !chromeAIAvailable) {
      console.log("⚠️ [Paper] Cannot generate summary - missing data or AI unavailable");
      return;
    }

    console.log("🤖 [Paper] Starting AI summary generation...");
    setIsGeneratingSummary(true);
    
    try {
      console.log("📤 [Paper] Calling summarizePaperWithPromptAPI...");
      const summary = await summarizePaperWithPromptAPI(
        paperData.title,
        paperData.content,
        paperData.demographic || 'researcher'
      );
      
      console.log("✅ [Paper] Summary generated successfully!");
      console.log("📝 [Paper] Summary preview:", summary.substring(0, 100) + '...');
      
      setPaperData({
        ...paperData,
        summary: summary
      });
      setSummaryGenerated(true);
    } catch (aiError) {
      console.error("❌ [Paper] Chrome AI error:", aiError);
      
      let errorMessage = `Failed to generate summary: ${aiError.message}`;
      
      // Provide helpful context based on error type
      if (aiError.message.includes('QuotaExceededError') || aiError.message.includes('too large')) {
        errorMessage += '\n\n⚠️ This paper is very long. The content has been automatically truncated to fit within the AI model limits. The summary is based on the first portion of the paper.';
      } else if (aiError.message.includes('downloading') || aiError.message.includes('downloadable')) {
        errorMessage += '\n\n⏳ The AI model may still be downloading. Please wait a moment and try again.';
      } else if (aiError.message.includes('user gesture')) {
        errorMessage += '\n\n🖱️ Please click the button again to trigger the AI generation.';
      }
      
      setPaperData({
        ...paperData,
        summary: errorMessage,
        aiError: true
      });
    } finally {
      setIsGeneratingSummary(false);
      console.log("🏁 [Paper] Summary generation process complete");
    }
  }, [paperData, chromeAIAvailable]);

  // Auto-trigger summary generation when Chrome AI becomes available
  useEffect(() => {
    if (chromeAIAvailable && paperData && !paperData.error && !summaryGenerated && !isGeneratingSummary) {
      console.log("🤖 [Paper] Auto-triggering AI summary generation on page load...");
      handleGenerateSummary();
    }
  }, [chromeAIAvailable, paperData, summaryGenerated, isGeneratingSummary, handleGenerateSummary]);

  // Load recommendations when paper data is available
  const loadRecommendations = useCallback(async () => {
    if (!paperData || !chromeAIAvailable || paperData.error) {
      console.log("⚠️ [Paper] Cannot load recommendations - missing data or AI unavailable");
      return;
    }

    console.log("🎯 [Paper] Loading recommendations...");
    setIsLoadingRecommendations(true);

    try {
      // Fetch all papers for recommendation
      const response = await fetch("/data.json");
      if (!response.ok) {
        throw new Error("Failed to fetch papers data");
      }
      const allPapers = await response.json();

      console.log("📊 [Paper] Fetched", allPapers.length, "papers for recommendation");

      // Generate recommendations
      const recommended = await recommendRelatedPapers(
        paperData.title,
        paperData.summary || paperData.content?.substring(0, 2000) || paperData.title,
        paperData.tags || "Unknown",
        allPapers,
        paperData.demographic || 'researcher'
      );

      console.log("✅ [Paper] Recommendations loaded:", recommended.length);
      setRecommendations(recommended);
    } catch (error) {
      console.error("❌ [Paper] Error loading recommendations:", error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [paperData, chromeAIAvailable]);

  // Auto-load recommendations after summary is generated
  useEffect(() => {
    if (summaryGenerated && recommendations.length === 0 && !isLoadingRecommendations) {
      console.log("🎯 [Paper] Auto-triggering recommendation loading...");
      loadRecommendations();
    }
  }, [summaryGenerated, recommendations.length, isLoadingRecommendations, loadRecommendations]);

  // Open journal modal and load AI suggestions
  const openJournalModal = async () => {
    setShowJournalModal(true);
    setIsLoadingAISuggestions(true);
    
    try {
      // Load user's existing categories
      const entries = await getJournalEntries();
      const categories = getUserCategories(entries);
      setUserCategories(categories);
      
      if (chromeAIAvailable && paperData.summary) {
        // Get AI suggestions
        const [catSuggestions, annotSuggestions] = await Promise.all([
          suggestCategories(
            paperData.title,
            paperData.summary,
            paperData.tags || '',
            categories.map(c => c.name)
          ),
          suggestAnnotations(
            paperData.title,
            paperData.summary,
            paperData.demographic || 'researcher'
          )
        ]);
        
        setSuggestedCategories(catSuggestions);
        setSuggestedAnnotations(annotSuggestions);
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setIsLoadingAISuggestions(false);
    }
  };

  const handleSaveToJournal = async () => {
    if (!selectedCategory && !newCategoryName) {
      setSaveMessage({ type: 'error', text: 'Please select or create a category' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const category = selectedCategory || {
        id: `cat_${Date.now()}`,
        name: newCategoryName,
        color: categoryColor
      };

      const annotations = [];
      if (userAnnotation.trim()) {
        annotations.push({
          text: userAnnotation.trim(),
          aiGenerated: false
        });
      }

      const entryData = {
        paper: {
          title: paperData.title,
          code: paperData.code,
          tags: paperData.tags,
          summary: paperData.summary,
          link: paperData.link,
          content: paperData.content
        },
        category,
        annotations
      };

      await saveJournalEntry(entryData);

      setSaveMessage({
        type: "success",
        text: "Paper saved to journal successfully!",
      });
      
      setShowJournalModal(false);
      setSelectedCategory(null);
      setNewCategoryName("");
      setUserAnnotation("");
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error saving paper:", error);
      setSaveMessage({
        type: "error",
        text: error.message || "Network error. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {isGeneratingSummary ? "Generating AI summary..." : "Loading paper..."}
          </p>
          {isGeneratingSummary && (
            <p className="text-slate-500 text-sm mt-2">Processing with Chrome AI (Gemini Nano)</p>
          )}
        </div>
      </div>
    );
  }

  if (!paperData || paperData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            {paperData?.error ? `Error: ${paperData.error}` : "Paper not found"}
          </h2>
          <p className="text-slate-500 mb-4">
            Try another paper or go back to the dashboard.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">
          {paperData.csvTitle}
        </h1>
        <div className="mb-4">
          <a
            href={paperData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:underline text-sm"
          >
            View Original Paper
          </a>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <div className="mb-8 flex gap-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === "summary"
                  ? "bg-teal-500 text-white"
                  : "bg-white text-teal-700 border border-teal-300"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              AI Summary
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === "images"
                  ? "bg-teal-500 text-white"
                  : "bg-white text-teal-700 border border-teal-300"
              }`}
              onClick={() => setActiveTab("images")}
            >
              Infographics
            </button>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-6 px-5 py-2 -translate-y-2 bg-teal-500 text-white rounded-lg hover:bg-teal-700 transition-colors duration-300"
          >
            ← Back to Dashboard
          </button>
        </div>
        {activeTab === "summary" && (
          <div className="bg-white/80 rounded-xl p-6 shadow mb-8 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              AI Summary
            </h2>
            
            {!summaryGenerated && !isGeneratingSummary && !chromeAIAvailable && (
              <div className="text-center py-8">
                <p className="text-amber-600 mb-4">
                  ⚠️ Chrome AI not available. AI summary generation requires Chrome 138+ with built-in AI features enabled.
                </p>
                <p className="text-slate-600 text-sm">
                  AI summaries are automatically generated using Chrome's Gemini Nano model when available.
                </p>
              </div>
            )}
            
            {isGeneratingSummary && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Generating AI summary...</p>
                <p className="text-slate-500 text-sm mt-2">Processing with Chrome AI (Gemini Nano)</p>
              </div>
            )}
            
            {(summaryGenerated || paperData.summary) && !isGeneratingSummary && (
              <pre className="whitespace-pre-wrap text-slate-800 text-base">
                {paperData.summary || "No summary available yet. AI summary will be generated automatically when Chrome AI is ready."}
              </pre>
            )}
            
            {!chromeAIAvailable && !summaryGenerated && (
              <div className="text-center py-8">
                <p className="text-amber-600 mb-2">
                  ⚠️ Chrome AI not available
                </p>
                <p className="text-slate-600 text-sm">
                  To use AI summaries, please:
                </p>
                <ul className="text-slate-600 text-sm text-left max-w-md mx-auto mt-2 space-y-1">
                  <li>• Use Chrome 138+ (Canary or Stable)</li>
                  <li>• Ensure Gemini Nano model is downloaded</li>
                  <li>• Check chrome://on-device-internals for status</li>
                </ul>
              </div>
            )}
            <button
              style={{ alignSelf: "center" }}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors duration-300 mt-4 text-lg bg-teal-500 hover:bg-teal-600"
              onClick={openJournalModal}
            >
              Save to Journal
            </button>

            {saveMessage && (
              <div
                className={`mt-4 p-3 rounded-lg text-center ${
                  saveMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {saveMessage.text}
              </div>
            )}
          </div>
        )}

        {/* Recommended Papers Section - Shows below summary, above comments */}
        {activeTab === "summary" && chromeAIAvailable && (
          <div className="bg-white/80 rounded-xl p-6 shadow mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              Recommended Papers
            </h2>
            
            {isLoadingRecommendations && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                <p className="text-slate-600 text-sm">Finding related papers with AI...</p>
              </div>
            )}

            {!isLoadingRecommendations && recommendations.length === 0 && summaryGenerated && (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">
                  No recommendations available yet. Recommendations are generated after the summary.
                </p>
              </div>
            )}

            {!isLoadingRecommendations && recommendations.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:border-cyan-400 cursor-pointer group"
                    onClick={() => router.push(`/paper?title=${encodeURIComponent(rec.Title)}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                        {rec.Code}
                      </span>
                      <span className="text-lg group-hover:scale-110 transition-transform">
                        →
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm line-clamp-2 group-hover:text-cyan-600 transition-colors">
                      {rec.Title}
                    </h3>
                    
                    {rec.Tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rec.Tags.split(';').slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {rec.RelevanceReason && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {rec.RelevanceReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div className="bg-white/80 rounded-xl p-6 shadow mb-8">
            <div
              id="disqus_thread"
              style={{ padding: "8px", borderRadius: "8px" }}
            ></div>
            <Comments
              article={{
                url: paperData.link,
                id: paperData.link,
                title: paperData.csvTitle,
              }}
            />
          </div>
        )}
        {activeTab === "images" && (
          <div className="bg-white/80 rounded-xl p-6 shadow mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              Infographics
            </h2>
            {paperData.imageLinks && paperData.imageLinks.length > 0 ? (
              <InfographicsCarousel images={paperData.imageLinks} />
            ) : (
              <p className="text-slate-500">
                No infographics found for this paper.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Journal Save Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Save to Journal</h2>
              <button
                onClick={() => setShowJournalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select or Create Category
              </label>
              
              {/* Existing Categories */}
              {userCategories.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Your Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {userCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setNewCategoryName("");
                        }}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedCategory?.name === cat.name
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                        style={{
                          borderColor: selectedCategory?.name === cat.name ? cat.color : undefined
                        }}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggested Categories */}
              {chromeAIAvailable && suggestedCategories.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">AI Suggested Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCategories.map((catName, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewCategoryName(catName);
                          setSelectedCategory(null);
                        }}
                        className="px-4 py-2 rounded-lg border-2 border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 transition-all"
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Category */}
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Or Create New:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setSelectedCategory(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                    title="Choose category color"
                  />
                </div>
              </div>
            </div>

            {/* Annotations */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Add Notes (Optional)
              </label>
              
              {/* AI Suggested Annotations */}
              {chromeAIAvailable && suggestedAnnotations.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-2">AI Suggestions:</p>
                  <div className="space-y-2">
                    {suggestedAnnotations.map((annotation, idx) => (
                      <div
                        key={idx}
                        onClick={() => setUserAnnotation(annotation)}
                        className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-slate-700 cursor-pointer hover:bg-amber-100 transition-all"
                      >
                        {annotation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                placeholder="Add your own notes or thoughts about this paper..."
                value={userAnnotation}
                onChange={(e) => setUserAnnotation(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Loading State */}
            {isLoadingAISuggestions && (
              <div className="text-center py-4 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading AI suggestions...</p>
              </div>
            )}

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-center ${
                  saveMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowJournalModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToJournal}
                disabled={isSaving || (!selectedCategory && !newCategoryName)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                  isSaving || (!selectedCategory && !newCategoryName)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-500 hover:bg-teal-600"
                }`}
              >
                {isSaving ? "Saving..." : "Save to Journal"}
              </button>
            </div>
          </div>
        </div>
      )}
         
    </div>
  );
}