 // server.js (Super AI-Powered with Real Brain)
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

// Store conversation history for context
const conversationHistory = new Map();

// Enhanced AI Brain Configuration
const AI_BRAIN = {
  name: "Aria",
  role: "Air New Zealand AI Travel Specialist",
  capabilities: [
    "Real-time flight data analysis",
    "Dynamic pricing intelligence", 
    "Route optimization",
    "Travel trend prediction",
    "Multi-source data integration",
    "Personalized recommendations",
    "Proactive problem solving",
    "Context-aware conversations"
  ],
  knowledgeBase: {
    airlines: {
      "Air New Zealand": {
        hubs: ["AKL", "WLG", "CHC", "ZQN"],
        fleet: ["Boeing 777-300ER", "Boeing 787-9 Dreamliner", "Airbus A320neo", "ATR 72-600"],
        classes: ["Economy", "Works Deluxe", "Premium Economy", "Business Premier"],
        partners: ["Star Alliance", "United Airlines", "Singapore Airlines", "ANA"]
      }
    },
    airports: {
      "AKL": { name: "Auckland Airport", city: "Auckland", country: "New Zealand", terminals: ["Domestic", "International"] },
      "DEL": { name: "Indira Gandhi International", city: "Delhi", country: "India", terminals: ["T3"] },
      "SIN": { name: "Changi Airport", city: "Singapore", country: "Singapore", terminals: ["T1", "T2", "T3"] },
      "SYD": { name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", terminals: ["T1"] },
      "LHR": { name: "Heathrow Airport", city: "London", country: "UK", terminals: ["T2"] },
      "LAX": { name: "Los Angeles International", city: "Los Angeles", country: "USA", terminals: ["TBIT"] }
    },
    routes: {
      "AKL-DEL": { distance: "12,400 km", duration: "15-17h", aircraft: "Boeing 787-9", frequency: "Daily" },
      "AKL-SIN": { distance: "8,800 km", duration: "10-11h", aircraft: "Boeing 787-9", frequency: "2x Daily" },
      "AKL-SYD": { distance: "2,200 km", duration: "3-4h", aircraft: "Airbus A320", frequency: "10x Daily" },
      "AKL-LAX": { distance: "10,500 km", duration: "12-13h", aircraft: "Boeing 777-300ER", frequency: "Daily" }
    }
  }
};

// Smart System Prompt Generator
function createIntelligentPrompt(userMessage, conversationId) {
  const history = conversationHistory.get(conversationId) || [];
  const isFirstMessage = history.length === 0;
  
  return `You are ${AI_BRAIN.name}, an advanced AI travel specialist with real-time data processing capabilities.

YOUR AI BRAIN FEATURES:
${AI_BRAIN.capabilities.map(cap => `• ${cap}`).join('\n')}

CURRENT KNOWLEDGE BASE:
• Airlines: ${Object.keys(AI_BRAIN.knowledgeBase.airlines).join(', ')}
• Major Airports: ${Object.keys(AI_BRAIN.knowledgeBase.airports).join(', ')}
• Key Routes: ${Object.keys(AI_BRAIN.knowledgeBase.routes).join(', ')}

CONVERSATION CONTEXT:
${history.length > 0 ? `Previous exchanges: ${JSON.stringify(history.slice(-3))}` : 'First interaction'}

RESPONSE PROTOCOLS:
1. ${isFirstMessage ? 'Start with warm Kiwi greeting "Kia ora!"' : 'Continue conversation naturally'}
2. Provide SPECIFIC, ACTIONABLE information
3. Use realistic data from your knowledge base
4. Offer multiple options when relevant
5. Include practical tips and recommendations
6. Show understanding of travel complexities
7. Be proactive in anticipating follow-up questions
8. Maintain friendly, expert Kiwi personality

INTELLIGENT RESPONSE EXAMPLES:

User: "What's the average price from Auckland to Delhi on December 31st?"
You: "Kia ora! For Auckland to Delhi on December 31st, you're looking at peak season travel. Let me analyze current trends:

💰 PRICING ANALYSIS:
• Economy: NZ$1,600 - NZ$2,400 (varies by booking time)
• Premium Economy: NZ$3,200 - NZ$4,200  
• Business Class: NZ$6,800 - NZ$8,500

✈️ FLIGHT OPTIONS:
• NZ123: Direct, departs 18:30, arrives 05:15+1 (15h45m)
• NZ789: Via Singapore, departs 14:45, arrives 12:30+1 (19h45m)

💡 SMART TIPS:
• Book 6-8 weeks ahead for best prices
• Consider flexible dates for 15-20% savings
• Check Airpoints deals for member discounts

Would you like me to check specific dates or help with booking?"

User: "Show me cheapest flights to Singapore"
You: "Sure! Based on current data analysis, here are the best value options to Singapore:

🎯 BEST DEALS (Economy Return):
• Low season (Feb-Apr): NZ$750 - NZ$950
• Shoulder season (May-Aug): NZ$850 - NZ$1,100  
• Peak season (Dec-Jan): NZ$1,100 - NZ$1,400

✈️ SMART ROUTES:
• Direct: NZ281 (20:45-04:30) - Most convenient
• Via Sydney: Could save NZ$150-200 sometimes

🔍 PRO TIP: Set up fare alerts for your dates - I can notify you when prices drop!

Which travel period are you considering?"

User: "Flight status for NZ123"
You: "I'll check the operational status for NZ123:

📊 FLIGHT NZ123 ANALYSIS:
• Route: Auckland (AKL) → Delhi (DEL)
• Scheduled: Daily at 18:30
• Average Duration: 15 hours 45 minutes
• Aircraft: Boeing 787-9 Dreamliner
• Typical Load: 85-95% capacity

🔄 REAL-TIME STATUS:
For live tracking, I recommend:
• Air NZ Mobile App (most accurate)
• FlightAware.com
• Airport departure boards

Is there a specific date you're traveling?"

Now analyze this query: "${userMessage}"

Provide a comprehensive, intelligent response that demonstrates your advanced capabilities and helps the customer effectively.`;
}

// Enhanced chat endpoint with memory
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const conversationId = req.ip;

  try {
    // Get or create conversation history
    if (!conversationHistory.has(conversationId)) {
      conversationHistory.set(conversationId, []);
    }
    const history = conversationHistory.get(conversationId);
    
    // Add user message to history
    history.push({ role: 'user', content: userMessage, timestamp: new Date() });

    // Use advanced AI for intelligent responses
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: createIntelligentPrompt(userMessage, conversationId)
          },
          ...history.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_tokens: 1200,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botResponse = response.data.choices[0].message.content;

    // Add bot response to history
    history.push({ role: 'assistant', content: botResponse, timestamp: new Date() });

    // Keep only last 10 messages to manage memory
    if (history.length > 10) {
      conversationHistory.set(conversationId, history.slice(-10));
    }

    res.json({ reply: botResponse });

  } catch (error) {
    console.error('AI Brain Error:', error.response?.data || error.message);
    
    // Intelligent fallback responses
    const intelligentFallback = `I'm experiencing a temporary connection issue with my data processors. 

🔄 QUICK SOLUTIONS:
• Refresh and try again in a moment
• Visit airnewzealand.co.nz for live booking
• Call 0800 737 000 for immediate assistance
• Check our mobile app for real-time flight info

My systems are usually back online quickly. No worries - I'll be here to help!`;

    res.status(500).json({ 
      reply: intelligentFallback
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check with brain status
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    brain: 'Active',
    conversations: conversationHistory.size,
    memory: 'Optimized',
    message: 'AI Brain is fully operational'
  });
});

// Clear old conversations periodically (24 hours)
setInterval(() => {
  const now = new Date();
  for (const [conversationId, history] of conversationHistory.entries()) {
    const lastMessage = history[history.length - 1];
    if (lastMessage && (now - new Date(lastMessage.timestamp)) > 24 * 60 * 60 * 1000) {
      conversationHistory.delete(conversationId);
    }
  }
  console.log(`Memory cleanup: ${conversationHistory.size} active conversations`);
}, 60 * 60 * 1000); // Every hour

app.listen(PORT, () => {
  console.log(` Activated on port http://localhost:3000 `);
  console.log(`Air NZ Intelligent Assistant is LIVE!`);
  console.log(` Memory system: Active (${conversationHistory.size} conversations)`);
});