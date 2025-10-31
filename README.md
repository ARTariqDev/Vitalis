# Vitalis, An All-In-One Space Biology Knowledge Engine

Built for the **Google Chrome Built-in AI Challenge 2025**

Vitalis is a knowledge platform designed to make NASA's space biology research accessible, organized, and interactive. It consolidates over 600 research papers from NASA into a single platform, allowing users to explore, understand, and connect scientific insights efficiently. Users can register as students, researchers, or investors, and Vitalis tailors summaries and recommendations to their background. The platform goes beyond traditional search tools by offering contextual search, editable summaries, and a discussion system for collaboration. Each paper can be added to a personal "Knowledge Journal", a visual mind map that shows connections between research topics, findings, and emerging ideas. By turning dense scientific data into an intuitive, interactive experience, Vitalis helps learners, scientists, and innovators navigate NASA's space biology research and uncover new insights.

## Powered by Chrome's Built-in AI (Gemini Nano)

Vitalis is an intelligent research platform built to unify NASA's scattered space biology archives. It collects over 600 space biology papers provided by NASA and organizes them into a single, interactive hub. **Using Chrome's built-in AI APIs powered by Gemini Nano**, Vitalis automatically summarizes each paper and filters relevant research, tailoring the level of detail and tone according to the user's demographic: students and researchers receive technically rich yet digestible summaries, while investors get concise insights emphasizing relevance and potential applications.

### Chrome AI APIs Used:
- **Prompt API**: Filters and ranks articles based on user demographics and search queries
- **Summarizer API / Prompt API**: Generates personalized summaries of research papers tailored to user type (researcher/student vs investor)
- **Client-side Processing**: All AI processing happens locally on the user's device, ensuring privacy and eliminating API costs

Each paper page includes a discussion thread via Hyvor Talk, encouraging global collaboration and interdisciplinary dialogue. Users can also add papers to a personal, visual "Research Journal" powered by React Flow, allowing them to organize and connect studies through a mind-map interface.

Vitalis was built using **Next.js**, **Tailwind CSS**, **React Flow**, **Chrome's Built-in AI APIs (Gemini Nano)**, and **HyvorTalk** for engagement. Its creativity lies in merging summarization, personalization, and visualization—three distinct functions rarely unified in scientific research tools.

Our team designed Vitalis to make space biology more discoverable, reduce information overload, and help emerging scientists and investors navigate research with clarity. In a world where data grows faster than comprehension, Vitalis turns complexity into connection, bridging innovation and understanding in the final frontier.

## Features

- **AI-Powered Search**: Uses Chrome's Prompt API to intelligently filter 600+ NASA papers based on your interests
- **Personalized Summaries**: Leverages Chrome's Summarizer/Prompt API to generate summaries tailored to your role
- **Privacy-First**: All AI processing happens on your device—no data sent to servers
- **Visual Knowledge Journal**: Build mind maps of research connections with React Flow
- **Collaborative Discussions**: Engage with researchers worldwide via HyvorTalk
- **No API Costs**: Client-side AI means no quota limits or server costs

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **AI**: Chrome Built-in AI APIs (Prompt API, Summarizer API) with Gemini Nano
- **Visualization**: React Flow for mind mapping
- **Discussions**: HyvorTalk
- **Database**: MongoDB
- **Authentication**: JWT with Jose
- **Web Scraping**: Cheerio for paper extraction

## Requirements

To use Vitalis with full AI capabilities, you need:
1. **Google Chrome** with built-in AI features enabled
2. Sign up for the [Chrome Built-in AI Early Preview Program](https://developer.chrome.com/docs/ai/built-in)
3. Chrome version 127+ (Canary/Dev channel recommended for latest features)

## Chrome Built-in AI Challenge Submission

This project is submitted to the **Google Chrome Built-in AI Challenge 2025** and demonstrates:
- Creative use of Chrome's Prompt API for intelligent article filtering
- Practical application of the Summarizer API for research paper summarization
- Client-side AI processing for privacy and performance
- Real-world use case solving the problem of information overload in scientific research
- Hybrid approach with both Prompt and Summarizer APIs for different use cases
# Vitalis-gemini
