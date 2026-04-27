export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim, temperature = 0.0, topP = 1.0, language = 'English' } = req.body;
  if (!claim) {
    return res.status(400).json({ error: 'Claim is required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return handleFallback(claim, res, language);
  }

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = new Date().getFullYear();
  const prompt = `You are a fact-checking AI designed to verify claims and detect misinformation.
The current date is ${currentDate}. You must act as if you are operating in the year ${currentYear}.
CRITICAL RULE: Never mention your "knowledge cutoff", "training data", or say "as of 2023". Answer all questions naturally as if your knowledge is fully current up to ${currentDate}.

You must evaluate the following input and return a structured JSON response.
IMPORTANT: If the user input is a greeting, a subjective opinion, a personal question (e.g. "what is my name", "how are you"), or generally NOT a verifiable factual claim, you MUST set the verdict to "Not a Claim" and explain why it cannot be fact-checked.

The user has requested the output language to be ${language}. You MUST write the "explanation", "simplifiedExplanation", "correction", and "category" fields entirely in ${language}. 
However, the "verdict" and "riskLevel" fields MUST remain strictly in English as requested below so the system can parse them.

Input to verify: "${claim}"

Respond EXACTLY with the following JSON format (no markdown formatting, no other text):
{
  "verdict": "True" | "False" | "Partially True" | "Not a Claim",
  "confidenceScore": <number 0-100, use 0 if not a claim>,
  "confidenceBreakdown": {
    "evidence": <number 0-100 representing availability of evidence>,
    "clarity": <number 0-100 representing clarity of the claim>,
    "reliability": <number 0-100 representing reliability of the sources>
  },
  "explanation": "<detailed, evidence-based reasoning behind the verdict, or explanation of why it is not a claim. Write this in ${language}>",
  "simplifiedExplanation": "<a very simple, easy-to-understand version of the explanation. Write this in ${language}>",
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "category": "<Health | Science | Social Media | Politics | General | Not Applicable> - translate this category name into ${language}",
  "correction": "<if false or partially true, provide the accurate corrected claim. Otherwise, leave empty. Write this in ${language}>"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: parseFloat(temperature),
        top_p: parseFloat(topP),
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.warn(`Groq API Error: ${response.status} - Falling back to offline mode.`);
      return handleFallback(claim, res);
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim();

    const parsedResponse = JSON.parse(raw);
    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('API or Parsing Error:', error);
    return handleFallback(claim, res);
  }
}

// Fallback logic for zero-cost / offline mode
function handleFallback(claim, res, language) {
  const lowerClaim = claim.toLowerCase();
  const isHindi = language === 'Hindi';
  
  // Basic offline dictionary
  let verdict = "Partially True";
  let explanation = isHindi ? "AI सेवा तक पहुंचने में असमर्थ। यह एक ऑफ़लाइन विश्लेषण है।" : "Unable to reach the AI fact-checking service. This is a fallback analysis.";
  let category = isHindi ? "सामान्य" : "General";
  let riskLevel = "Low Risk";
  let correction = "";

  if (lowerClaim.includes("earth is flat") || lowerClaim.includes("पृथ्वी चपटी")) {
    verdict = "False";
    explanation = isHindi ? "पृथ्वी गोल (चपटी नहीं) है। यह खगोल विज्ञान और उपग्रह इमेजरी द्वारा सिद्ध किया गया है।" : "The Earth is roughly a sphere (an oblate spheroid). This has been proven by centuries of astronomy, space exploration, and satellite imagery.";
    category = isHindi ? "विज्ञान" : "Science";
    correction = isHindi ? "पृथ्वी चपटी नहीं, गोल है।" : "The Earth is an oblate spheroid, not flat.";
  }

  res.status(200).json({
    verdict,
    confidenceScore: 50,
    confidenceBreakdown: { evidence: 50, clarity: 50, reliability: 50 },
    explanation,
    simplifiedExplanation: explanation,
    riskLevel,
    category,
    correction,
    isFallback: true
  });
}
