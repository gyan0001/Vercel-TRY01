// server.js — Clean, robust Express server for static site + AI chat
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIG: choose where your static files live ===
// Recommended: create a 'public' folder and put index.html, style.css, script.js there.
// If you prefer files at repo root, set STATIC_DIR = path.join(__dirname, '/')
const STATIC_DIR = path.join(__dirname, "public");

// Serve static files (must be before wildcard routes)
app.use(express.static(STATIC_DIR));

// Use built-in JSON parser
app.use(express.json({ limit: "100kb" }));

// Simple in-memory conversation memory (map by IP or session id)
const conversationHistory = new Map();

// Example AI configuration (you can modify)
const AI_BRAIN = {
  name: "Aria",
  role: "Air New Zealand AI Travel Specialist"
};

// Build system prompt (keeps last few messages for context)
function createSystemPrompt(userMessage, conversationId) {
  const history = conversationHistory.get(conversationId) || [];
  const isFirst = history.length === 0;

  const prompt = [
    `You are ${AI_BRAIN.name}, an expert travel assistant.`,
    isFirst ? 'Start with "Kia ora!" for first message only.' : '',
    "Be helpful, concise, and Kiwi-friendly.",
    "Use realistic flight/pricing examples when asked.",
    "",
    "Conversation context (last messages):",
    JSON.stringify(history.slice(-6).map(h => ({ role: h.role, content: h.content })), null, 2),
    "",
    "User message:",
    userMessage
  ].join("\n");

  return prompt;
}

// === Chat endpoint ===
app.post("/chat", async (req, res) => {
  const userMessage = (req.body?.message || "").toString();
  const conversationId = req.ip || (req.body?.sessionId || "anon");

  if (!userMessage) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  // ensure conversation history exists
  if (!conversationHistory.has(conversationId)) conversationHistory.set(conversationId, []);
  const history = conversationHistory.get(conversationId);

  // push user message to history
  history.push({ role: "user", content: userMessage, timestamp: new Date().toISOString() });

  // build system prompt + messages for OpenAI
  const systemPrompt = createSystemPrompt(userMessage, conversationId);
  const messages = [
    { role: "system", content: systemPrompt },
    // include last up to 6 messages from history (user + assistant)
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content }))
  ];

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing in environment");
    return res.status(500).json({ reply: "Server is not configured with an OpenAI API key." });
  }

  try {
    const aiResp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
        max_tokens: 800,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const botReply = aiResp.data?.choices?.[0]?.message?.content || "Sorry, I couldn't compose a reply.";

    // store assistant message in history, trim history to last 20 items
    history.push({ role: "assistant", content: botReply, timestamp: new Date().toISOString() });
    conversationHistory.set(conversationId, history.slice(-20));

    res.json({ reply: botReply });
  } catch (err) {
    console.error("OpenAI request failed:", err.response?.data || err.message || err);
    // graceful fallback
    const fallback = "I'm having trouble connecting to our AI systems right now. Try again in a moment or visit the official site for bookings.";
    res.status(500).json({ reply: fallback });
  }
});

// === Health endpoint ===
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0",
    conversations: conversationHistory.size,
    staticDir: STATIC_DIR
  });
});

// === Fallback: serve index.html for SPA routing ===
// Important: this must come AFTER express.static so asset requests are still served.
app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"), err => {
    if (err) {
      // If public/index.html doesn't exist, try root index.html
      const fallbackRoot = path.join(__dirname, "index.html");
      return res.sendFile(fallbackRoot, err2 => {
        // final fallback: 404 JSON
        if (err2) return res.status(404).json({ error: "Not found" });
      });
    }
  });
});

// === Periodic cleanup of old conversations (24 hours) ===
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, hist] of conversationHistory.entries()) {
    const last = hist[hist.length - 1];
    if (!last || new Date(last.timestamp).getTime() < cutoff) conversationHistory.delete(id);
  }
}, 60 * 60 * 1000); // every hour

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Serving static files from: ${STATIC_DIR}`);
});
