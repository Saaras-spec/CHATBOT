# AI-Based Fact Checker Chatbot

**Enterprise Misinformation Detection System**

This project is a web-based AI chatbot designed to verify factual claims and detect misinformation. It uses a Generative AI API (via Groq/OpenRouter) to analyze user input and provide structured, reliable responses. The system is optimized for zero-cost deployment using free APIs and browser-based storage.

## Core Functionalities

1. **Claim Detection & Processing:** Identifies and simplifies claims for clear, verifiable analysis.
2. **AI-Based Fact Verification:** Sends processed claims to a Generative AI model (llama-3.3-70b-versatile via Groq) for evaluation.
3. **Structured Verdict System:** Each response includes the Claim, Verdict (True/False/Partially True), Confidence Score, and an Explanation.
4. **Confidence Breakdown:** Detailed breakdown of Evidence availability, Claim clarity, and Reliability level.
5. **Risk Level Indicator:** Categorizes claims as Low Risk, Medium Risk, or High Risk based on potential harm.
6. **Evidence-Based Explanation:** Provides reasoning behind the verdict and compares the claim with known facts.
7. **Claim Correction Suggestion:** Suggests a corrected and accurate version if a claim is false or misleading.
8. **Session-Based Memory:** Uses browser LocalStorage to view past claims, re-check results, and track history.
9. **Dual Explanation Mode:** Users can toggle between Standard (detailed) and Simplified explanations.
10. **Misinformation Category Detection:** Classifies claims into categories like Health, Science, Social Media, and General.
11. **Basic Dashboard Interface:** Features a history sidebar, claim input section, and a top bar with real-time analytics.
12. **Fallback Handling (Zero-Cost Optimization):** Uses predefined offline knowledge responses if the API fails or limits are reached.

## Technology Stack

- **Frontend:** HTML, CSS (Custom Premium Dark Theme), Vanilla JavaScript
- **Backend:** Node.js, Vercel Serverless Functions (`api/check.js`)
- **API:** Groq API (llama-3.3-70b-versatile)
- **Storage:** Browser LocalStorage

## Setup Instructions

1. Clone this repository.
2. Ensure you have a valid Groq API key.
3. Create an environment variable named `GROQ_API_KEY` with your key.
4. Deploy to Vercel (or any platform supporting serverless functions). The application relies on the `/api/check` endpoint.

## Key Advantages

- Fully functional on a zero budget using free-tier API limits.
- Structured and explainable AI responses rather than vague text.
- Focuses on a real-world problem: misinformation detection.
- Lightweight, fast, and deployable entirely as a web application.
