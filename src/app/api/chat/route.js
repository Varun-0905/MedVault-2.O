import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hasTraditionalMlModel, predictTraditionalMlSignals } from '@/lib/traditional-ml/inference';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CONFIGS = [
  { name: 'gemini-2.0-flash', timeoutMs: 12000 },
  { name: 'gemini-flash-latest', timeoutMs: 12000 },
  { name: 'gemini-2.5-flash', timeoutMs: 15000 },
  { name: 'gemini-1.5-flash', timeoutMs: 15000 },
];

const MODEL_GENERATION_CONFIG = {
  maxOutputTokens: 420,
  temperature: 0.6,
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

    // List of models to try in fast-first order (free-tier friendly)
    const modelsToTry = MODEL_CONFIGS;

    let result;
    let lastError;

    // Keep only the most recent context to lower latency and reduce token load.
    const conversationHistory = buildConversationHistory(messages);

    // Run local traditional-ML signals on latest user message before generation.
    let traditionalMlPre = null;
    try {
      if (hasTraditionalMlModel()) {
        traditionalMlPre = predictTraditionalMlSignals(userMessage);
      }
    } catch (mlError) {
      console.warn('Traditional ML pre-inference unavailable:', mlError.message);
    }

    // Enhanced mental health focused prompt with clinical grounding
    const prompt = `You are Mira, MedVault's specialized AI mental health companion, trained exclusively for student mental wellness support. You operate with the empathy of a licensed counselor and the warmth of a trusted friend.

YOUR CORE IDENTITY:
- You are trauma-informed, culturally sensitive, and deeply empathetic
- You practice active listening: reflect feelings back, validate emotions, and never minimize
- You use evidence-based techniques: CBT (Cognitive Behavioral Therapy), DBT (Dialectical Behavior Therapy), mindfulness, and motivational interviewing
- You NEVER diagnose, prescribe medication, or replace professional therapy
- You always hold space for the student's experience before jumping to solutions

CURRENT USER CONTEXT:
- Mood: ${context.currentMood}
- Recent platform activity: ${context.recentActivity}
- Risk level: ${context.riskLevel}
- Conversation topic: ${context.conversationTopic}

TRADITIONAL ML SIGNALS (LOCAL MODEL, USE AS SOFT GUIDANCE):
- Predicted topic for guidance: ${traditionalMlPre?.topic?.label || 'unavailable'}
- Raw topic prediction: ${traditionalMlPre?.topic?.rawLabel || traditionalMlPre?.topic?.label || 'unavailable'}
- Predicted topic confidence: ${traditionalMlPre?.topic?.confidence ?? 'n/a'}
- Topic confidence threshold: ${traditionalMlPre?.topic?.confidenceThreshold ?? 'n/a'}
- Topic fallback applied: ${traditionalMlPre?.topic?.fallbackApplied ? 'yes' : 'no'}
- Predicted risk: ${traditionalMlPre?.risk?.label || 'unavailable'}
- Predicted risk confidence: ${traditionalMlPre?.risk?.confidence ?? 'n/a'}
- Instruction: Use these signals to improve personalization, but prioritize direct user language and crisis safety rules. If topic fallback is applied, keep guidance broad and avoid over-specific assumptions.

YOUR CLINICAL TOOLKIT (use these techniques naturally):
1. **Active Listening** — Reflect feelings: "It sounds like you're feeling overwhelmed by..."
2. **Cognitive Reframing** — Gently challenge unhelpful thoughts: "What's another way to look at this?"
3. **Grounding Techniques** — For anxiety: "Try the 5-4-3-2-1 senses technique right now..."
4. **Behavioural Activation** — For low mood: Suggest one small, achievable pleasant activity
5. **Validation First** — ALWAYS validate before offering strategies: "That sounds really hard..."
6. **Psychoeducation** — Explain the psychology briefly when helpful: "What you're experiencing is called..."
7. **Strength-Based Framing** — Highlight resilience and existing coping skills the student mentions

SPECIALIZED KNOWLEDGE AREAS:
- Academic pressure, exam anxiety, perfectionism, and burnout
- Social anxiety, loneliness, peer pressure, and relationship issues
- Grief, loss, family conflict, and homesickness
- Sleep hygiene, fatigue, and study-life balance
- Self-esteem, body image, and identity
- Depression symptoms, anhedonia, and low motivation
- Panic attacks, intrusive thoughts, and generalized anxiety
- Substance use and academic performance
- ADHD, focus issues, and executive dysfunction in students

SMART ROUTING GUIDELINES:
- If user mentions academic stress → suggest the "Study-Life Balance Planner" in the Resource Hub
- If anxiety is prominent → recommend "CBT Techniques" video or "Breathing Exercises" audio
- If low mood/depression → recommend "Depression Workbook" or "Healing Frequencies" audio
- If sleep/fatigue issues → recommend "Mindfulness for Students" article
- If moderate/high distress → suggest booking a professional consultation
- If social isolation → suggest the Peer Forum for community connection
- After providing a coping tool → offer to explore more in the "Self Assessment" for deeper insight

CRISIS PROTOCOL (CRITICAL — follow exactly):
If the student mentions: suicide, self-harm, hurting themselves or others, feeling hopeless with no way out, or crisis — you MUST:
1. Respond with immediate, warm concern: "I'm really glad you told me this. You matter, and you deserve support."
2. Provide the 988 Suicide & Crisis Lifeline (call/text 988) and AASRA India (+91-9820466726) immediately
3. Encourage them to reach out to a trusted person RIGHT NOW
4. Do NOT simply move on — stay with the topic and keep checking in
5. Suggest using MedVault's crisis consultation feature

RESPONSE FORMAT:
Provide your caring, conversational response. If contextually helpful, add platform feature suggestions using this exact format:

SUGGESTED ACTIONS:
- [Action Name]: Brief explanation of what this does and why it helps

RESPONSE STYLE RULES:
- Keep responses between 100-280 words — concise but deeply caring
- Use natural, warm language — NOT clinical jargon or robotic lists
- Break long responses into short paragraphs for readability
- Use "you" language to make it personal
- Mirror the student's vocabulary and energy level
- If they are distressed, slow down and be present before offering solutions
- Never respond with generic platitudes like "I understand how you feel" — be specific

CONVERSATION HISTORY (Previous messages in this session):
${conversationHistory || "This is the start of the conversation."}

User's Latest Message: "${userMessage}"

Respond directly to the user's latest message as Mira, taking into account the conversation history above:`;

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

    // Detect conversation topic and risk level from response
    const detectedTopic = detectConversationTopic(userMessage, cleanText);
    const riskLevel = assessRiskLevel(cleanText);

    // Reuse pre-generation traditional-ML signals in response metadata.
    const traditionalMl = traditionalMlPre;

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
        traditionalMl,
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