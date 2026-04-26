export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim } = req.body;
  if (!claim) {
    return res.status(400).json({ error: 'Claim is required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: Missing API key' });
  }

  const prompt = `You are a fact-checking AI with one single job: determine if a claim is TRUE or FALSE.

STRICT RULES (non-negotiable):
1. You must respond with ONLY one word — either TRUE or FALSE.
2. No explanations. No punctuation. No extra words. Nothing else.
3. If the claim is factually correct → TRUE
4. If the claim is factually incorrect or a myth → FALSE

Claim to verify: "${claim}"

Your single-word response:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();

    // Extract TRUE or FALSE
    const verdict = raw.startsWith('TRUE') ? 'TRUE'
                  : raw.startsWith('FALSE') ? 'FALSE'
                  : null;

    if (!verdict) {
      throw new Error('Unexpected response format from AI');
    }

    res.status(200).json({ verdict });

  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: 'Failed to verify claim. Try again later.' });
  }
}
