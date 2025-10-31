"use client";

import { useEffect, useState } from "react";
import { checkChromeAIAvailability } from "@/lib/chromeAIClient";

export default function ChromeAIStatus() {
  const [capabilities, setCapabilities] = useState(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    console.log('🔍 [ChromeAIStatus] Checking Chrome AI availability...');
    const caps = checkChromeAIAvailability();
    console.log('📊 [ChromeAIStatus] Capabilities result:', caps);
    setCapabilities(caps);
    
    // Auto-hide after 5 seconds if AI is available
    if (caps.available && caps.promptAPI) {
      console.log('✅ [ChromeAIStatus] Chrome AI is available - will auto-hide in 5s');
      setTimeout(() => setShow(false), 5000);
    } else {
      console.warn('⚠️ [ChromeAIStatus] Chrome AI NOT available');
    }
  }, []);

  if (!show || !capabilities) return null;

  // If Chrome AI is available, show success message
  if (capabilities.available && capabilities.promptAPI) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg shadow-lg flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Chrome AI Active</h3>
            <p className="text-sm text-teal-50">
              Powered by Gemini Nano • Privacy-first AI processing
            </p>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="text-white hover:text-teal-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // If Chrome AI is NOT available, show warning
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Chrome AI Not Available</h3>
            <p className="text-sm text-amber-50 mb-2">
              Chrome built-in AI (Gemini Nano) is not detected. To enable:
            </p>
            <ol className="text-xs text-amber-50 mb-2 space-y-1 list-decimal list-inside">
              <li>Use Chrome Canary 127+</li>
              <li>Enable flags (see console for details)</li>
              <li>Download Gemini Nano model</li>
              <li>Restart browser</li>
            </ol>
            <a 
              href="https://developer.chrome.com/docs/ai/built-in" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline hover:text-amber-100 transition-colors"
            >
              Full setup guide →
            </a>
            <button
              onClick={() => window.location.reload()}
              className="ml-3 text-sm underline hover:text-amber-100 transition-colors"
            >
              Reload page
            </button>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="text-white hover:text-amber-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
