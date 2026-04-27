# FactCheck AI

FactCheck AI is a lightweight, AI-powered web application that instantly verifies claims and tells you whether they are **TRUE** or **FALSE**. 

## Features

- **Instant Verification:** Type any claim and get an immediate "TRUE" or "FALSE" verdict.
- **AI-Powered:** Uses Groq's high-speed inference API with the `llama-3.3-70b-versatile` model.
- **Beautiful UI:** A modern, sleek, and responsive user interface built with HTML, CSS, and Vanilla JavaScript.
- **Verdict Log:** Keeps track of your checked claims and displays a live count of true vs. false statements.
- **Serverless Backend:** Securely handles API requests using serverless functions to protect API keys.

## Tech Stack

- **Frontend:** HTML, CSS (Custom styling), Vanilla JavaScript
- **Backend:** Node.js (Serverless function in `api/check.js`)
- **AI Model:** Llama-3.3-70b-versatile via Groq API

## Setup Instructions

1. Clone this repository.
2. Ensure you have a valid Groq API key.
3. Create an environment variable named `GROQ_API_KEY` with your key.
4. Deploy to a platform that supports serverless functions (like Vercel). The application relies on the `/api/check` endpoint routing to `api/check.js`.

## Usage

1. Open the application in your browser.
2. Enter a claim in the input field (e.g., "The Great Wall of China is visible from space").
3. Press Enter or click the send button.
4. The AI will process the claim and return a definitive TRUE or FALSE verdict.
