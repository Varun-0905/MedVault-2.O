import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CONFIGS = [
  { name: 'gemini-flash-lite-latest', timeoutMs: 10000 },
  { name: 'gemini-2.5-flash-lite', timeoutMs: 12000 },
  { name: 'gemini-flash-latest', timeoutMs: 12000 },
  { name: 'gemini-2.5-flash', timeoutMs: 15000 },
  { name: 'gemini-2.0-flash-lite', timeoutMs: 10000 },
];

const MODEL_GENERATION_CONFIG = {
  maxOutputTokens: 560,
  temperature: 0.3,
  topP: 0.9,
};

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 3500;

function toCompactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildConversationHistory(messages) {
  const historyMessages = (messages || [])
    .slice(0, -1)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => `${message.role === 'assistant' ? 'Mira' : 'Student'}: ${toCompactText(message.content)}`)
    .join('\n');

  if (historyMessages.length <= MAX_HISTORY_CHARS) {
    return historyMessages;
  }

  return historyMessages.slice(-MAX_HISTORY_CHARS);
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function containsCrisisLanguage(text) {
  const lowerText = String(text || '').toLowerCase();

  const crisisPatterns = [
    /\bi\s*(want|wanna|need|plan|planned)?\s*to\s*die\b/,
    /\bi\s*(am|m|feel|feel like)\s*dying\b/,
    /\bfeel\s*like\s*dying\b/,
    /\bkill\s*myself\b/,
    /\bend\s*(my\s*life|it\s*all)\b/,
    /\b(don't|do not)\s*want\s*to\s*live\b/,
    /\b(can't|cannot)\s*go\s*on\b/,
  ];

  if (crisisPatterns.some((pattern) => pattern.test(lowerText))) {
    return true;
  }

  return (
    lowerText.includes('suicide') ||
    lowerText.includes('self-harm') ||
    lowerText.includes('hurt myself') ||
    lowerText.includes('kill myself') ||
    lowerText.includes('end my life') ||
    lowerText.includes('i want to die') ||
    lowerText.includes('crisis') ||
    lowerText.includes('emergency')
  );
}

function buildSafeFallbackResponse(userMessage) {
  if (containsCrisisLanguage(userMessage)) {
    return "I'm really glad you reached out right now. You matter, and you deserve immediate support. Please call or text 988 (Suicide & Crisis Lifeline) right now, or contact AASRA India at +91-9820466726. If possible, reach out to a trusted person near you immediately and stay with them while you get support.";
  }

  return "I'm here with you. I had a temporary connection issue, but we can still continue right now. If you're feeling overwhelmed, try this quick reset: breathe in for 4 seconds, hold for 4, exhale for 6, and repeat 4 times. If you want, share what feels hardest in this moment and we'll break it down into one manageable next step together.";
}

function buildCrisisImmediateResponse(userMessage) {
  const normalized = toCompactText(userMessage);

  return `Thank you for telling me this. I am really glad you reached out, and you do not have to hold this alone.

When you say "${normalized}", I want to prioritize your safety right now. Please call or text 988 (Suicide & Crisis Lifeline) immediately, or contact AASRA India at +91-9820466726. If there is someone you trust nearby, message or call them now and ask them to stay with you.

If you are in immediate danger, call emergency services right now. You matter, and support is available this moment.`;
}

function buildGuidedFallbackResponse(userMessage, topic) {
  const opening = "Thank you for sharing this with me. Your response makes clinical sense in the context of what you are carrying right now.";

  const topicPlans = {
    academic_stress: {
      reflection: "It sounds like academic pressure is draining your energy and making it hard to think clearly.",
      action: "For the next 15 minutes, pick just one subject and do a tiny start: read one page or solve one question. Small movement reduces overwhelm faster than waiting for motivation.",
      next: "If you want, I can help you make a 3-step plan for today based on what is most urgent.",
    },
    relationships: {
      reflection: "It sounds like relationship stress is taking a real emotional toll on you.",
      action: "Try writing two short notes: what hurt you, and what you need right now. This helps separate emotion from action before any difficult conversation.",
      next: "If helpful, I can help you draft calm words for a conversation or boundary message.",
    },
    anxiety: {
      reflection: "I can hear the anxiety and mental overthinking in what you shared.",
      action: "Try one grounding cycle now: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste. Then take 4 slow breaths with a longer exhale.",
      next: "If you want, we can identify the exact thought loop and reframe it together step by step.",
    },
    depression: {
      reflection: "It sounds like your emotional energy is very low right now, and that can make everything feel harder.",
      action: "Choose one low-effort action in the next 10 minutes: drink water, wash your face, step into daylight, or text one safe person. Tiny actions can restart momentum.",
      next: "If you want, I can stay with you and build a gentle plan for the next hour.",
    },
    sleep_issues: {
      reflection: "It sounds like poor sleep is amplifying stress and making your days harder.",
      action: "Tonight, try a short wind-down: no heavy screens for 30 minutes, dim lights, and slow breathing for 5 minutes before bed.",
      next: "If helpful, I can create a realistic sleep reset plan around your schedule.",
    },
    general_wellness: {
      reflection: "I hear that things feel difficult right now, and you are doing the right thing by talking about it.",
      action: "Start with one small stabilizing step: a glass of water, 4 slow breaths, and writing one sentence about what feels hardest right now.",
      next: "If you want, we can break this into one manageable next step together.",
    },
  };

  const plan = topicPlans[topic] || topicPlans.general_wellness;

  return `${opening}\n\n${plan.reflection}\n\n${plan.action}\n\n${plan.next}`;
}

function normalizeCounselorTone(text) {
  if (!text) return '';

  let normalized = String(text).trim();

  normalized = normalized.replace(/^\s*oh\s+wow[\s,!-]*/i, 'Thank you for sharing this. ');
  normalized = normalized.replace(/^\s*wow[\s,!-]*/i, 'Thank you for sharing this. ');
  normalized = normalized.replace(/^\s*oh[\s,!-]*/i, 'Thank you for sharing this. ');
  normalized = normalized.replace(/\bkind of\b/gi, 'somewhat');
  normalized = normalized.replace(/\bsuper\b/gi, 'very');
  normalized = normalized.replace(/\s{2,}/g, ' ');

  return normalized.trim();
}

function hasNonClinicalTone(text) {
  const compact = toCompactText(text).toLowerCase();
  if (!compact) return true;

  const nonClinicalPatterns = [
    /^oh\s+wow\b/,
    /^wow\b/,
    /^oh\b/,
    /\bthat'?s\s+awesome\b/,
    /\byou'?re\s+awesome\b/,
    /\bno\s+worries\b/,
  ];

  return nonClinicalPatterns.some((pattern) => pattern.test(compact));
}

function isLowQualityAiResponse(text) {
  const compact = toCompactText(text);
  if (!compact) return true;

  const words = compact.split(' ').filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 22 || compact.length < 110) {
    return true;
  }

  const hasTerminalPunctuation = /[.!?]$/.test(compact);
  if (!hasTerminalPunctuation && wordCount < 60) {
    return true;
  }

  const trailingFragments = ['and i am so', 'and i', 'when you say', 'i hear how much pain'];
  const tail = compact.toLowerCase();
  if (trailingFragments.some((fragment) => tail.endsWith(fragment))) {
    return true;
  }

  return false;
}

// Helper function to detect conversation topic
function detectConversationTopic(userMessage, aiResponse) {
  const text = (userMessage + ' ' + aiResponse).toLowerCase();
  
  if (text.includes('academic') || text.includes('study') || text.includes('exam') || text.includes('grade')) {
    return 'academic_stress';
  } else if (text.includes('relationship') || text.includes('friend') || text.includes('family') || text.includes('partner')) {
    return 'relationships';
  } else if (text.includes('anxiety') || text.includes('worry') || text.includes('nervous')) {
    return 'anxiety';
  } else if (text.includes('depression') || text.includes('sad') || text.includes('lonely') || text.includes('hopeless')) {
    return 'depression';
  } else if (text.includes('sleep') || text.includes('tired') || text.includes('exhausted')) {
    return 'sleep_issues';
  } else if (text.includes('eating') || text.includes('appetite') || text.includes('food')) {
    return 'eating_concerns';
  } else if (text.includes('crisis') || text.includes('help') || text.includes('emergency')) {
    return 'crisis';
  }
  return 'general_wellness';
}

// Helper function to assess risk level
function assessRiskLevel(text) {
  const lowerText = text.toLowerCase();

  if (containsCrisisLanguage(lowerText)) {
    return 'high';
  }
  
  // High risk indicators
  if (lowerText.includes('suicide') || lowerText.includes('self-harm') || 
      lowerText.includes('crisis') || lowerText.includes('988') ||
      lowerText.includes('emergency')) {
    return 'high';
  }
  
  // Medium risk indicators  
  if (lowerText.includes('counselor') || lowerText.includes('therapy') || 
      lowerText.includes('professional help') || lowerText.includes('severe') ||
      lowerText.includes('overwhelming')) {
    return 'medium';
  }
  
  return 'low';
}

export async function POST(req) {
  let latestUserMessage = '';

  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, but my AI service is not properly configured. Please contact support."
      });
    }

    const { messages, userContext } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1].content;
    latestUserMessage = userMessage;

    // Default userContext if not provided
    const context = {
      currentMood: userContext?.currentMood || 'unknown',
      recentActivity: userContext?.recentActivity || 'none',
      riskLevel: userContext?.riskLevel || 'low',
      preferences: userContext?.preferences || 'none',
      sessionId: userContext?.sessionId || `session-${Date.now()}`,
      conversationTopic: userContext?.conversationTopic || 'general',
      lastInteraction: userContext?.lastInteraction || new Date().toISOString()
    };

    if (containsCrisisLanguage(userMessage)) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: buildCrisisImmediateResponse(userMessage),
        contextualRouting: true,
        suggestedActions: [
          {
            title: 'Call or Text 988 Now',
            description: 'Immediate 24/7 crisis support from trained counselors.',
            action: 'call_or_text_988_now',
          },
          {
            title: 'Contact AASRA India',
            description: 'Call +91-9820466726 for immediate emotional support.',
            action: 'contact_aasra_india',
          },
          {
            title: 'Reach a Trusted Person',
            description: 'Message or call someone you trust and ask them to stay with you.',
            action: 'reach_a_trusted_person',
          },
        ],
        metadata: {
          detectedTopic: 'crisis',
          riskLevel: 'high',
          sessionId: context.sessionId,
          deterministicSafetyPath: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // List of models to try in fast-first order (free-tier friendly)
    const modelsToTry = MODEL_CONFIGS;

    let result;
    let lastError;

    // Keep only the most recent context to lower latency and reduce token load.
    const conversationHistory = buildConversationHistory(messages);

    // Keep prompt compact to reduce token pressure and improve quota resilience.
    const prompt = `You are Mira, a calm, trauma-informed student mental wellness companion.

  Rules:
  - Use a calm clinical counselor tone: steady, grounded, supportive.
  - Validate first, then offer practical help.
  - Never diagnose or prescribe medication.
  - Use short paragraphs with plain language.
  - Avoid casual interjections such as "Oh wow", "Wow", or "Oh".
  - Avoid slang, hype language, or dramatic punctuation.
  - Give 120-240 words.
  - Include one immediate coping action and one practical next step.

  Context:
  - Mood: ${context.currentMood}
  - Activity: ${context.recentActivity}
  - Risk level hint: ${context.riskLevel}
  - Conversation topic hint: ${context.conversationTopic}

  Conversation so far:
  ${conversationHistory || "This is the start of the conversation."}

  Latest user message:
  "${userMessage}"

  If helpful, optionally append:
  SUGGESTED ACTIONS:
  - [Action Name]: Why this helps

  Start with either:
  - "Thank you for sharing this."
  - A direct reflective statement such as "It sounds like..."
  `;

    // Try different models until one works
    for (const modelConfig of modelsToTry) {
      const { name: modelName, timeoutMs } = modelConfig;

      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: MODEL_GENERATION_CONFIG,
        });

        result = await withTimeout(
          model.generateContent(prompt),
          timeoutMs,
          `Model ${modelName}`
        );
        
        // If we get here, the model worked
        break;
        
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If no model worked, throw the last error
    if (!result) {
      console.error('All models failed. Last error:', lastError);
      throw lastError || new Error('All models failed');
    }
    
    const response = await result.response;
    const text = response.text();

    // Parse AI response for suggested actions
    let suggestedActions = [];
    let cleanText = text;
    let contextualRouting = false;

    // Extract suggested actions if present
    if (text.includes('SUGGESTED ACTIONS:')) {
      const sections = text.split('SUGGESTED ACTIONS:');
      cleanText = sections[0].trim();
      const actionSection = sections[1];
      contextualRouting = true;
      
      // Parse suggested actions
      if (actionSection) {
        const actions = actionSection.split('\n').filter(line => line.trim().startsWith('-'));
        suggestedActions = actions.map(action => {
          const actionText = action.replace('- ', '').trim();
          const colonIndex = actionText.indexOf(': ');
          
          if (colonIndex > -1) {
            const title = actionText.substring(0, colonIndex).replace(/\[|\]/g, '').trim();
            const description = actionText.substring(colonIndex + 2).trim();
            return { 
              title, 
              description,
              action: title.toLowerCase().replace(/\s+/g, '_')
            };
          } else {
            return { 
              title: actionText.replace(/\[|\]/g, '').trim(), 
              description: '',
              action: actionText.toLowerCase().replace(/\s+/g, '_')
            };
          }
        }).filter(action => action.title.length > 0);
      }
    }

    const detectedTopicFromUser = detectConversationTopic(userMessage, '');
    const riskFromUser = assessRiskLevel(userMessage);

    cleanText = normalizeCounselorTone(cleanText);

    if (isLowQualityAiResponse(cleanText) || hasNonClinicalTone(cleanText)) {
      cleanText = buildGuidedFallbackResponse(userMessage, detectedTopicFromUser);
      contextualRouting = false;
      suggestedActions = [];
    }

    // Detect conversation topic and risk level from response
    const detectedTopic = detectConversationTopic(userMessage, cleanText);
    const riskLevel = riskFromUser === 'high' ? 'high' : assessRiskLevel(cleanText);

    // Return enhanced response structure
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: cleanText,
      suggestedActions: suggestedActions,
      contextualRouting: contextualRouting,
      metadata: {
        detectedTopic,
        riskLevel,
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Detailed error calling Gemini API:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let fallbackMessage = buildSafeFallbackResponse(latestUserMessage);

    if (!containsCrisisLanguage(latestUserMessage)) {
      const fallbackTopic = detectConversationTopic(latestUserMessage, '');
      fallbackMessage = buildGuidedFallbackResponse(latestUserMessage, fallbackTopic);
    }

    if (error.message?.includes('API_KEY')) {
      fallbackMessage = "I'm experiencing a configuration issue right now. Please try again in a moment or contact support if it keeps happening.";
    }
    
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      role: 'assistant', 
      content: fallbackMessage,
      metadata: {
        fallback: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}