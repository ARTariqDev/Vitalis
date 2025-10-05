"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InfographicsCarousel from "../components/InfographicsCarousel";
import Comments from "../components/comments";

export default function PaperClient() {
  const router = useRouter();
  const [paperData, setPaperData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const comments = [
    { username: "Farjad123", comment: "Such an interesting study!" },
    { username: "AbuBakr45", comment: "Such an interesting study!" },
    { username: "ART13", comment: "Such an interesting study!" },
    { username: "Wasiq1", comment: "Such an interesting study!" },
    { username: "Aura43", comment: "Such an interesting study!" },
  ];

  // Extract paper title from query string using Next.js useSearchParams
  const searchParams = useSearchParams();
  const paperTitle = searchParams.get("title") || "";

  useEffect(() => {
    console.log("Mounting");
    console.log("about to fetch data");
    if (!paperTitle) {
      console.log("no paper title");
      router.push("/dashboard");
    }
    setIsLoading(true);
    // Fetch paper data from API
    fetch(
      `/api/data?title=${encodeURIComponent(paperTitle)}&demographic=researcher`
    )
      .then(async (res) => {
        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = { error: "Invalid JSON response from server." };
        }
        if (!res.ok || data.error) {
          setPaperData({ error: data.error || "Failed to load paper." });
        } else {
          setPaperData(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setPaperData({ error: err.message || "Network error." });
        setIsLoading(false);
      });
  }, [paperTitle]);

  const handleSaveToJournal = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/save-paper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paperData }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveMessage({
          type: "success",
          text: "Paper saved to journal successfully!",
        });
      } else {
        setSaveMessage({
          type: "error",
          text: result.message || result.error || "Failed to save paper",
        });
      }
    } catch (error) {
      console.error("Error saving paper:", error);
      setSaveMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setIsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading paper...</p>
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
            <pre className="whitespace-pre-wrap text-slate-800 text-base">
              {paperData.summary}
            </pre>
            <button
              style={{ alignSelf: "center" }}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors duration-300 mt-4 text-lg ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-600"
              }`}
              onClick={handleSaveToJournal}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save to Journal"}
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
      <div className="w-full bg-white max-w-4xl px-4 py-8 mx-2 rounded-sm">
        <h3>Comments: </h3>
        {comments.map((comment, idx) => (
          <li key={idx} className="list-none my-3 p-3 border border-teal-300">
            <div className="bold text-lg">{comment.username}</div>
            <div>{comment.comment}</div>
          </li>
        ))}
      </div>
    </div>
  );
}
