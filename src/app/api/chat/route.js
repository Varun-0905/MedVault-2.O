import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CONFIGS = [
  { name: 'gemini-flash-lite-latest', timeoutMs: 4500 },
  { name: 'gemini-2.5-flash-lite', timeoutMs: 5500 },
  { name: 'gemini-flash-latest', timeoutMs: 5500 },
  { name: 'gemini-2.5-flash', timeoutMs: 6500 },
  { name: 'gemini-2.0-flash-lite', timeoutMs: 4500 },
  { name: 'gemini-pro-latest', timeoutMs: 5500 },
  { name: 'gemini-2.5-pro', timeoutMs: 5500 },
];

const AI_TOTAL_BUDGET_MS = 9000;

const MODEL_GENERATION_CONFIG = {
  maxOutputTokens: 720,
  temperature: 0.3,
  topP: 0.9,
};

const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CHARS = 5500;

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

function buildGuidedFallbackResponse(userMessage, topic, riskLevel = 'low') {
  const opening = "Thank you for sharing this with me. Your reaction is understandable in the context of what you are managing right now.";
  const concern = toCompactText(userMessage).slice(0, 220);

  const topicPlans = {
    academic_stress: {
      reflection: "It sounds like academic pressure is consuming mental bandwidth and reducing concentration.",
      formulation: "When workload and uncertainty stack together, the brain stays in threat mode and focus drops quickly.",
      immediate: "For the next 10 minutes, do one reset cycle: 4 slow breaths, drink water, and write the single most urgent academic task.",
      plan: [
        "Step 1 (today): Do one 20-minute study sprint on the most urgent topic only.",
        "Step 2 (today): Take a 5-minute break, then repeat one more 20-minute sprint.",
        "Step 3 (next 24h): Create a short priority list with only 3 tasks and deadlines.",
      ],
      question: "Would you like me to convert your current syllabus pressure into a simple 24-hour plan?",
    },
    relationships: {
      reflection: "It sounds like relationship strain is creating emotional overload and reducing your sense of stability.",
      formulation: "Interpersonal conflict often creates rumination, which can intensify stress and make decisions feel harder.",
      immediate: "Take 5 minutes to write two lines: what affected you most, and what boundary or support you need right now.",
      plan: [
        "Step 1 (today): Pause reactive messaging for one hour to reduce escalation.",
        "Step 2 (today): Draft one calm statement using 'I feel' and one clear request.",
        "Step 3 (next 24h): Choose one trusted person for support before a difficult conversation.",
      ],
      question: "Would you like help drafting a calm boundary message for this situation?",
    },
    anxiety: {
      reflection: "I can hear significant anxiety and persistent overthinking in what you shared.",
      formulation: "Anxiety can narrow attention toward threat and create repetitive thought loops that feel difficult to stop.",
      immediate: "Do one grounding cycle now: 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste, then 4 slow breaths with longer exhale.",
      plan: [
        "Step 1 (today): Label the main anxious thought in one sentence.",
        "Step 2 (today): Write one alternative, balanced thought.",
        "Step 3 (next 24h): Use a 10-minute worry window instead of all-day rumination.",
      ],
      question: "Would you like to work through your main anxious thought using a quick CBT-style reframe?",
    },
    depression: {
      reflection: "It sounds like your emotional energy is currently low, and routine tasks are feeling heavier than usual.",
      formulation: "Low mood can reduce motivation first, so waiting to feel ready usually increases delay and self-criticism.",
      immediate: "Choose one activation step in the next 10 minutes: water, face wash, sunlight, or a short check-in text to a safe person.",
      plan: [
        "Step 1 (today): Complete one 5-10 minute task only.",
        "Step 2 (today): Pair activity with support, such as music or a friend call.",
        "Step 3 (next 24h): Schedule two small activities at fixed times.",
      ],
      question: "Would you like me to build a low-energy plan for the next 6 hours?",
    },
    sleep_issues: {
      reflection: "It sounds like sleep disruption is amplifying stress, concentration problems, and emotional reactivity.",
      formulation: "Sleep loss can intensify anxiety and reduce executive function, creating a repeating stress cycle.",
      immediate: "Start a 20-minute wind-down tonight: dim lights, avoid stimulating content, and do paced breathing.",
      plan: [
        "Step 1 (today): Set a fixed wake time for tomorrow.",
        "Step 2 (today): Keep late-evening caffeine and heavy screen exposure low.",
        "Step 3 (next 24h): Use one 15-minute daytime reset walk for circadian support.",
      ],
      question: "Would you like a practical sleep-reset routine based on your class schedule?",
    },
    general_wellness: {
      reflection: "I hear that things feel difficult right now, and it is a healthy decision to talk about it directly.",
      formulation: "When stress signals accumulate, clarity usually improves after one stabilization step and one focused plan step.",
      immediate: "Do one stabilizing sequence now: water, 4 slow breaths, and one sentence naming the hardest part.",
      plan: [
        "Step 1 (today): Define one priority only.",
        "Step 2 (today): Spend 15 focused minutes on that priority.",
        "Step 3 (next 24h): Repeat with one additional small priority.",
      ],
      question: "Would you like me to help you choose the best first step from your current stressors?",
    },
  };

  const plan = topicPlans[topic] || topicPlans.general_wellness;

  const escalationNote =
    riskLevel === 'medium' || riskLevel === 'high'
      ? "If symptoms are escalating or feel unmanageable, connecting with a counselor promptly is a strong next clinical step."
      : '';

  return `${opening}\n\nIt sounds like this is the core concern right now: "${concern}"\n\n${plan.reflection}\n${plan.formulation}\n\nImmediate regulation step:\n${plan.immediate}\n\nConsultant Plan:\n1. ${plan.plan[0].replace(/^Step\s*1\s*\(.*?\):\s*/i, '')}\n2. ${plan.plan[1].replace(/^Step\s*2\s*\(.*?\):\s*/i, '')}\n3. ${plan.plan[2].replace(/^Step\s*3\s*\(.*?\):\s*/i, '')}\n\n${escalationNote}${escalationNote ? '\n\n' : ''}${plan.question}`;
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

function hasConsultantDepth(text) {
  const raw = String(text || '');
  const compact = toCompactText(raw).toLowerCase();
  if (!compact) return false;

  const paragraphCount = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;

  const hasReflection =
    /\bit sounds like\b/.test(compact) ||
    /\bi hear\b/.test(compact) ||
    /\bthank you for sharing\b/.test(compact);

  const hasPlan =
    /\bconsultant plan\b/.test(compact) ||
    /\baction plan\b/.test(compact) ||
    /\b1\./.test(raw);

  const hasQuestion = /\?/.test(raw);

  return paragraphCount >= 3 && hasReflection && hasPlan && hasQuestion;
}

function isLimitOrCapacityError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('quota exceeded') ||
    msg.includes('too many requests') ||
    msg.includes('[429') ||
    msg.includes('rate limit') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('[503')
  );
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
    let limitOrCapacityFailures = 0;
    const aiStartTime = Date.now();

    // Keep only the most recent context to lower latency and reduce token load.
    const conversationHistory = buildConversationHistory(messages);

    // Keep prompt compact to reduce token pressure and improve quota resilience.
    const prompt = `You are Mira, a trauma-informed student mental health consultant.

  Response contract (always follow this order):
  1) Reflection: Validate and mirror the user's emotional state in 2-3 sentences.
  2) Formulation: Explain the likely stress pattern in plain language (1-2 sentences).
  3) Consultant Plan: Provide 3 numbered, time-bound steps for today and next 24 hours.
  4) Check-in Question: Ask one focused follow-up question.

  Clinical style rules:
  - Calm, grounded, consultant tone; no slang or hype language.
  - Avoid casual interjections such as "Oh wow", "Wow", or "Oh".
  - Never diagnose or prescribe medication.
  - Use practical, specific actions (not generic motivation).
  - Keep to 170-280 words.
  - Prefer plain language, short paragraphs.

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

  Start with either "Thank you for sharing this." or a direct reflective statement such as "It sounds like..."
  `;

    // Try different models until one works
    for (const modelConfig of modelsToTry) {
      const { name: modelName, timeoutMs } = modelConfig;

      if (Date.now() - aiStartTime > AI_TOTAL_BUDGET_MS) {
        break;
      }

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

        if (isLimitOrCapacityError(error)) {
          limitOrCapacityFailures += 1;

          // Avoid long wait chains when the API key is currently throttled.
          if (limitOrCapacityFailures >= 3) {
            break;
          }
        }

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

    if (isLowQualityAiResponse(cleanText) || hasNonClinicalTone(cleanText) || !hasConsultantDepth(cleanText)) {
      cleanText = buildGuidedFallbackResponse(userMessage, detectedTopicFromUser, riskFromUser);
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
      const fallbackRisk = assessRiskLevel(latestUserMessage);
      fallbackMessage = buildGuidedFallbackResponse(latestUserMessage, fallbackTopic, fallbackRisk);
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