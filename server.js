require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Hardcoded model parameters for consistency and security
const MODEL_NAME = "llama-3.1-8b-instant";
const TEMPERATURE = 0.7;
const TOP_P = 0.9;
const MAX_TOKENS = 4096;

const SYSTEM_INSTRUCTION = `
You are the AI Science Experiment Advisor. Your goal is to help students design, execute, and understand science experiments safely and accurately. 
STRICT RULE: You must ONLY answer questions related to science, science experiments, the scientific method, or related academic concepts. 
If a user asks a question outside of these domains, you must:
1. Start your response with the exact prefix: [STRICT: NON-SCIENCE ALERT]
2. State clearly that the question is not related to science and is outside your knowledge base.
3. Remind them of your purpose as a science-only advisor.
Always emphasize safety precautions when discussing experiments.
`;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages are required and must be an array." });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                ...messages
            ],
            model: MODEL_NAME,
            temperature: TEMPERATURE,
            top_p: TOP_P,
            max_tokens: MAX_TOKENS,
        });

        const responseContent = chatCompletion.choices[0].message.content;
        res.json({ content: responseContent });

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ 
            error: "Failed to generate response. Check if the GROQ_API_KEY is correctly set in the .env file.",
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
