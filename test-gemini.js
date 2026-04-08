const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const key = match ? match[1].trim() : null;

if (!key) {
    console.error("No key found!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function test() {
    const userMessage = "hello";
    const context = {
        currentMood: 'unknown',
        recentActivity: 'none',
        riskLevel: 'low',
        conversationTopic: 'general',
    };
    const conversationHistory = "This is the start of the conversation.";

    const prompt = `You are Mira, MedVault's specialized AI mental health companion...
    
CONVERSATION HISTORY (Previous messages in this session):
${conversationHistory}

User's Latest Message: "${userMessage}"

Respond directly to the user's latest message as Mira, taking into account the conversation history above:`;

    try {
        console.log("Testing with key:", key.substring(0, 10) + "...");
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        console.log("SUCCESS:");
        console.log(result.response.text().substring(0, 200));
    } catch (error) {
        console.error("ERROR CAUGHT:");
        console.dir(error, {depth: null});
    }
}
test();
