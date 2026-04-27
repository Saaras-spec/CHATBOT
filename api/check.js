export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim, temperature = 0.0, language = 'English' } = req.body;
  if (!claim) {
    return res.status(400).json({ error: 'Claim is required' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCQvWxWQZ7Qf0ACVtNrqmiqke1j5eLITVI";

  if (!GEMINI_API_KEY) {
    return handleFallback(claim, res, language);
  }

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = new Date().getFullYear();
  
  const prompt = `You are a fact-checking AI designed to verify claims and detect misinformation.
The current date is ${currentDate}. You must act as if you are operating in the year ${currentYear}.
CRITICAL RULE: You have access to Google Search. You must use it to find the absolute latest information up to ${currentDate} before making your verdict.

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        tools: [{
          googleSearch: {}
        }],
        generationConfig: {
          temperature: parseFloat(temperature),
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      return handleFallback(claim, res, language);
    }

    const data = await response.json();
    
    // Extract text from Gemini response structure
    let resultText = '';
    try {
      resultText = data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error("Failed to parse Gemini response structure", data);
      return handleFallback(claim, res, language);
    }

    // Clean up potential markdown formatting (sometimes AI ignores the rule)
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(resultText);
    res.status(200).json(parsedData);

  } catch (error) {
    console.error('Fact check error:', error);
    return handleFallback(claim, res, language);
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
