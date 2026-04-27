export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim, temperature = 0.2, topP = 0.9 } = req.body;
  if (!claim) {
    return res.status(400).json({ error: 'Claim is required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return handleFallback(claim, res);
  }

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are a fact-checking AI designed to verify claims and detect misinformation.
The current date is ${currentDate}. 

CRITICAL CONTEXT FOR RECENT EVENTS (Your training data ends in 2023):
- Donald Trump won the 2024 US Presidential Election and is the current President of the United States.

You must evaluate the following claim and return a structured JSON response.

Claim to verify: "${claim}"

Respond EXACTLY with the following JSON format (no markdown formatting, no other text):
{
  "verdict": "True" | "False" | "Partially True",
  "confidenceScore": <number 0-100>,
  "confidenceBreakdown": {
    "evidence": <number 0-100 representing availability of evidence>,
    "clarity": <number 0-100 representing clarity of the claim>,
    "reliability": <number 0-100 representing reliability of the sources>
  },
  "explanation": "<detailed, evidence-based reasoning behind the verdict>",
  "simplifiedExplanation": "<a very simple, easy-to-understand version of the explanation>",
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "category": "Health" | "Science" | "Social Media" | "Politics" | "General",
  "correction": "<if false or partially true, provide the accurate corrected claim. If true, leave empty>"
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
function handleFallback(claim, res) {
  const lowerClaim = claim.toLowerCase();
  
  // Basic offline dictionary
  let verdict = "Partially True";
  let explanation = "Unable to reach the AI fact-checking service. This is a fallback analysis.";
  let category = "General";
  let riskLevel = "Low Risk";
  let correction = "";

  if (lowerClaim.includes("earth is flat")) {
    verdict = "False";
    explanation = "The Earth is roughly a sphere (an oblate spheroid). This has been proven by centuries of astronomy, space exploration, and satellite imagery.";
    category = "Science";
    correction = "The Earth is an oblate spheroid, not flat.";
  } else if (lowerClaim.includes("water boils at 100")) {
    verdict = "True";
    explanation = "Water boils at 100°C (212°F) at sea level under standard atmospheric pressure.";
    category = "Science";
  } else if (lowerClaim.includes("bleach") && (lowerClaim.includes("drink") || lowerClaim.includes("cure"))) {
    verdict = "False";
    explanation = "Drinking bleach is extremely dangerous and does not cure any diseases. It can cause severe internal damage or death.";
    category = "Health";
    riskLevel = "High Risk";
    correction = "Never ingest bleach; consult medical professionals for health treatments.";
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
