"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [prompt, setPrompt] = useState("");
  const [userLoaded, setUserLoaded] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load user info and data

  const loadData = async () => {
    try {
      if (prompt) {
        setIsLoading(true);
        const res = await fetch(
          `/searchArticles?prompt=${encodeURIComponent(prompt)}`
        );
        const result = await res.json();
        console.log("result", result);
        let filteredTitles = [];
        try {
          filteredTitles = JSON.parse(result.result);
        } catch (e) {
          filteredTitles = [];
        }
        const response = await fetch("/data.json");
        const allData = await response.json();
        console.log("response from /data.json \n", allData);

        // setData(allData.filter((item) => filteredTitles.includes(item.Title)));
      } else {
        const response = await fetch("/data.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log("response from /data.json \n", jsonData);
        setData(jsonData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      //TODO: change this to smth
      setData("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userLoaded]);

  // Filter data based on search term and selected tags
  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        item.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Tags &&
          item.Tags.toLowerCase().includes(searchTerm.toLowerCase()));

      // Tag filter - item matches if it contains ANY of the selected tags
      const itemTags = item.Tags
        ? item.Tags.split(";").map((tag) => tag.trim())
        : [];

      let matchesTags;
      if (selectedTags.length === 0) {
        // When no specific tags selected, show all items
        matchesTags = true;
      } else {
        // When specific tags are selected, only show items that match those tags
        matchesTags = selectedTags.some((selectedTag) =>
          itemTags.includes(selectedTag)
        );
      }

      return matchesSearch && matchesTags;
    });

    console.log("Filtering:", {
      searchTerm,
      selectedTags,
      totalData: data.length,
      filteredResults: filtered.length,
    });

    return filtered;
  }, [data, searchTerm, selectedTags]);

  // Extract unique tags from search results only (before tag filtering)
  // This shows what tags are available to filter by
  const availableTags = useMemo(() => {
    // First apply only search filter to get base results
    const searchFilteredData = data.filter((item) => {
      return (
        searchTerm === "" ||
        item.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Tags &&
          item.Tags.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    const tagSet = new Set();
    searchFilteredData.forEach((item) => {
      if (item.Tags) {
        item.Tags.split(";").forEach((tag) => {
          const trimmedTag = tag.trim();
          // Exclude "General Space Biology" from available filter tags
          if (trimmedTag !== "General Space Biology") {
            tagSet.add(trimmedTag);
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [data, searchTerm]);

  // Clear selected tags that are no longer available when search changes
  useEffect(() => {
    setSelectedTags((prev) =>
      prev.filter((tag) => availableTags.includes(tag))
    );
  }, [availableTags]);

  const handleTagToggle = (tag) => {
    console.log("Tag clicked:", tag);
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      console.log("Selected tags updated:", newTags);
      return newTags;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  const handleLogout = () => {
    router.push("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading research data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Vitalis
                </span>
              </h1>
              <span className="text-slate-500 text-sm">Research Dashboard</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <div className="mb-8">
          {/* Search Bar + Prompt Input (no demographic input) */}
          <form className="mb-6" onSubmit={handleSubmit}>
            <div className="relative max-w-2xl mx-auto flex flex-col gap-4">
              <input
                type="text"
                placeholder="Prompt (e.g. 'space medicine')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-slate-700 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-300"
                disabled={isLoading || !prompt}
              >
                {isLoading ? "Searching..." : "Search with Prompt"}
              </button>
            </div>
          </form>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 flex items-center justify-between"
            >
              <span>Filters ({selectedTags.length})</span>
              <svg
                className={`h-5 w-5 transform transition-transform ${
                  showMobileFilters ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Category Tags */}
          <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-slate-700 mr-2">
                Categories:
              </span>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-300"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-teal-300 hover:bg-teal-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredData.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">{data.length}</span>{" "}
            research entries
          </p>
          {(searchTerm || selectedTags.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Research Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item, index) => (
            <div
              key={`${item.Code}-${index}`}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-teal-300"
            >
              {/* Code Badge */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 text-sm font-mono rounded-full">
                  #{item.Code}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-800 mb-3 line-clamp-3 leading-tight">
                {item.Title}
              </h3>

              {/* Tags */}
              {item.Tags && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.Tags.split(";").map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 active:scale-95">
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.515-.952-6.071-2.5L3.515 9.978A11.964 11.964 0 0112 4c2.34 0 4.515.952 6.071 2.5L20.485 9.978A11.964 11.964 0 0112 20c-2.34 0-4.515-.952-6.071-2.5"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No results found
            </h3>
            <p className="text-slate-500 mb-4">
              Try adjusting your search terms or selected categories
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
