// ============================================================
//  ZENSUTRA — AI Controller (Zen AI)
//  File: Backend/Controllers/aiController.js
//  ────────────────────────────────────────────────────────────
//  Powers the "Zen AI" chat feature.
//
//  REQUEST PIPELINE (generateChatResponse):
//    1. Validate message (non-empty, not too long)
//    2. Scan for EMERGENCY keywords → immediate crisis response
//    3. Build AI context string (system prompt + mood + history)
//    4. Call Google Gemini 1.5 Flash
//    5. Run safety filters (strip medical diagnoses, harmful content)
//    6. Save turn to Conversation collection
//    7. Return response JSON
//
//  FALLBACK CHAIN:  Gemini → rule-based fallback → crisis hotline
// ============================================================

const { Conversation } = require('./models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Crisis keywords (checked BEFORE calling AI) ───────────────
const EMERGENCY_KEYWORDS = [
  'suicide','kill myself','end my life','want to die','self harm',
  'hurt myself','cut myself','overdose','jump off','hang myself',
  'not worth living','better off dead','end it all',"can't go on",
  'taking my life',
];

// ── Safety filters (applied AFTER AI response) ───────────────
const HARMFUL_CONTENT  = ['violence','self-medication','illegal drugs','alcohol abuse'];
const MEDICAL_TERMS    = ['diagnose','diagnosis','disorder','medication','prescription','cure','treatment'];

// ── Gemini client ─────────────────────────────────────────────
let genAI = null;

function initAI () {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key || key.length < 30) {
    console.warn('⚠️  Gemini API key missing — falling back to rule-based responses.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(key);
    console.log('✅  Zen AI (Gemini) initialized.');
    return true;
  } catch (e) {
    console.error('❌  Gemini init failed:', e.message);
    return false;
  }
}
initAI();

// ── POST /api/ai/chat ─────────────────────────────────────────
// Body: { message, mood?, context? }
// Auth: Required (JWT)
exports.generateChatResponse = async (req, res) => {
  const start = Date.now();
  try {
    const { message, mood, context } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required.' });

    if (message.length > 1000)
      return res.status(400).json({ success: false, message: 'Message too long (max 1000 chars).' });

    // ── Step 1: Crisis detection (highest priority) ──────────
    if (EMERGENCY_KEYWORDS.some(kw => message.toLowerCase().includes(kw))) {
      const crisisReply = getCrisisResponse();
      await saveConversation(userId, message, crisisReply, 'emergency', mood);
      return res.status(200).json({ success: true, response: crisisReply, type: 'emergency' });
    }

    // ── Step 2: Build prompt ─────────────────────────────────
    const prompt = buildPrompt(message, mood, context);

    // ── Step 3: Call Gemini ──────────────────────────────────
    let reply;
    try {
      reply = await callGemini(prompt);
    } catch (aiErr) {
      console.warn('Gemini error, using fallback:', aiErr.message);
      reply = buildFallbackResponse(message, mood);
    }

    // ── Step 4: Safety filter ────────────────────────────────
    reply = applySafetyFilter(reply);

    // ── Step 5: Persist ──────────────────────────────────────
    await saveConversation(userId, message, reply, 'normal', mood, Date.now() - start);

    res.status(200).json({ success: true, response: reply, type: 'normal' });

  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate response.' });
  }
};

// ── GET /api/ai/conversation ──────────────────────────────────
// Query: ?limit=50
exports.getConversationHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const convs = await Conversation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('userMessage aiResponse type createdAt');
    res.status(200).json({ success: true, conversations: convs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve history.' });
  }
};

// ── DELETE /api/ai/conversation ───────────────────────────────
exports.clearConversationHistory = async (req, res) => {
  try {
    await Conversation.deleteMany({ user: req.user.id });
    res.status(200).json({ success: true, message: 'Conversation history cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not clear history.' });
  }
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function getCrisisResponse () {
  return `I'm very concerned about what you've shared. Your life has immense value and there are people who care.

**Reach out right now:**
• **iCall: 9152987821** (Mon–Sat, 8am–10pm)
• **AASRA: 022-27546669** (24×7)
• **Vandrevala Foundation: 1860-2662-345** (24×7)
• **Emergency: 112**

Please talk to someone you trust or use one of the lines above immediately. You are not alone. 💚`;
}

function buildPrompt (message, mood, context) {
  let p = `You are Zen, the AI wellness companion of Zensutra — a smart mental health platform for students in India. Your role is to provide warm, empathetic, non-judgmental support.

CORE GUIDELINES:
- Be warm, caring, conversational — like a trusted friend, not a clinician
- Keep responses 80–150 words for readability
- Acknowledge feelings first, then offer 1–2 practical suggestions
- End with encouragement or a follow-up question
- Never diagnose conditions or prescribe medication
- If someone is in distress, gently suggest professional support

LANGUAGE: Respond in the same language the user writes in (Hindi or English or a mix).
`;

  if (mood?.label) {
    const moodGuides = {
      Happy:   'User is happy — help sustain positive momentum.',
      Sad:     'User is sad — be especially gentle; offer comfort first.',
      Angry:   'User is angry — validate feelings, suggest healthy outlets.',
      Anxious: 'User is anxious — grounding techniques, reassurance.',
      Fear:    'User feels fear — focus on safety and grounding.',
      Calm:    'User is calm — engage thoughtfully.',
      Neutral: 'User is neutral — provide supportive guidance.',
    };
    p += `\nCURRENT MOOD: ${mood.label}\n${moodGuides[mood.label] || ''}\n`;
  }

  if (context) p += `\nCONTEXT FROM PREVIOUS TURNS: ${context.slice(0, 500)}\n`;

  p += `\nUSER: "${message}"\n\nZEN:`;
  return p;
}

async function callGemini (prompt) {
  if (!genAI) throw new Error('Gemini not initialized.');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.75, topK: 40, topP: 0.9, maxOutputTokens: 250 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  });

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  if (!text) throw new Error('Empty Gemini response.');
  return text;
}

function buildFallbackResponse (message, mood) {
  const msg = message.toLowerCase();

  if (mood?.label === 'Sad' || msg.includes('sad') || msg.includes('cry'))
    return "I hear you — feeling sad is completely valid. It's okay to let yourself feel this. One small thing that might help: write down three things you felt today, no matter how small. And if this sadness lingers, talking to someone you trust can make a real difference. I'm here for you. 💚";

  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic'))
    return "Anxiety can feel really overwhelming. Try this right now: breathe in for 4 counts, hold for 4, breathe out for 4. Repeat 4 times. Ground yourself by noticing 5 things you can see around you. You're safe. What's been triggering the anxiety lately?";

  if (msg.includes('stress') || msg.includes('overwhelm') || msg.includes('pressure'))
    return "Academic and life pressure can pile up fast. When everything feels too much, try breaking it into the one next tiny step — not the whole mountain. Give yourself permission to rest. You're doing better than you think. What's the biggest thing weighing on you right now?";

  if (msg.includes('sleep') || msg.includes('insomnia'))
    return "Poor sleep makes everything harder. Try a consistent wind-down: no screens 30 minutes before bed, dim lights, and try a simple breathing exercise. Your brain needs a signal that it's time to rest. What time do you usually try to sleep?";

  return "Thank you for sharing with me. Your feelings matter and it makes sense you're feeling this way. Sometimes just putting words to what we're experiencing is the first step. I'm here and listening — would you like to tell me more about what's going on?";
}

function applySafetyFilter (response) {
  const lower = response.toLowerCase();

  if (MEDICAL_TERMS.some(t => lower.includes(t)))
    return "I understand you're looking for support. While I can't provide medical advice, I can offer emotional support and suggest speaking with a mental health professional or counselor. I'm here to listen — what would help you most right now?";

  if (HARMFUL_CONTENT.some(t => lower.includes(t)))
    return "I want to make sure I'm supporting you safely. I'd gently encourage you to speak with a trained counselor. I'm here in the meantime — what's on your mind?";

  return response;
}

async function saveConversation (userId, userMsg, aiReply, type, mood, processingMs) {
  try {
    await Conversation.create({
      user:        userId,
      userMessage: userMsg,
      aiResponse:  aiReply,
      type,
      mood:        mood ? { label: mood.label, confidence: mood.confidence, detectedAt: mood.createdAt } : undefined,
      metadata:    { responseLength: aiReply.length, processingTime: processingMs, aiModel: 'gemini-1.5-flash' },
    });
  } catch (e) {
    console.error('Conversation save error:', e.message);
  }
}