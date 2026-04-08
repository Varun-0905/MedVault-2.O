import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RESOURCE_CATALOG = [
    { title: '5-Minute Meditation', type: 'Video', tags: ['stress', 'mindfulness', 'sleep'] },
    { title: 'Breathing Exercises', type: 'Audio', tags: ['anxiety', 'stress', 'panic'] },
    { title: 'Time Management Workbook', type: 'Interactive', tags: ['stress', 'academic', 'productivity'] },
    { title: 'Mindfulness for Students', type: 'Article', tags: ['mindfulness', 'stress', 'sleep'] },
    { title: 'Understanding Anxiety Disorders', type: 'Article', tags: ['anxiety', 'psychoeducation'] },
    { title: 'CBT Techniques', type: 'Video', tags: ['anxiety', 'depression', 'reframing'] },
    { title: 'Depression Workbook', type: 'Interactive', tags: ['depression', 'motivation'] },
    { title: 'Healing Frequencies', type: 'Audio', tags: ['depression', 'sleep', 'stress'] },
    { title: 'Study-Life Balance Planner', type: 'Interactive', tags: ['academic', 'stress', 'productivity'] },
    { title: 'Dealing with Academic Pressure', type: 'Video', tags: ['academic', 'anxiety', 'stress'] },
    { title: 'Focus & Flow State', type: 'Audio', tags: ['academic', 'focus', 'stress'] },
    { title: 'Motivation & Procrastination', type: 'Article', tags: ['academic', 'motivation', 'depression'] },
];

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizePayload(payload) {
    const phq9Score = clamp(toNumber(payload?.phq9Score, 0), 0, 27);
    const gad7Score = clamp(toNumber(payload?.gad7Score, 0), 0, 21);
    const pssScore = clamp(toNumber(payload?.pssScore, 0), 0, 16);

    const computedTotal = phq9Score + gad7Score + pssScore;
    const incomingTotal = toNumber(payload?.totalScore, computedTotal);
    const totalScore = clamp(incomingTotal, 0, 64);

    return {
        phq9Score,
        gad7Score,
        pssScore,
        totalScore,
        answers: payload?.answers || null,
    };
}

function getSeverityLabel(score, maxScore) {
    const pct = (score / maxScore) * 100;
    if (pct < 25) return 'Minimal';
    if (pct < 50) return 'Mild';
    if (pct < 75) return 'Moderate';
    return 'Severe';
}

function getRiskLevel(totalScore) {
    if (totalScore >= 55) return 'critical';
    if (totalScore >= 40) return 'high';
    if (totalScore >= 20) return 'moderate';
    return 'low';
}

function buildNeedSignals({ phq9Score, gad7Score, pssScore, riskLevel }) {
    const depression = phq9Score / 27;
    const anxiety = gad7Score / 21;
    const stress = pssScore / 16;

    const riskBonus = {
        low: 0,
        moderate: 0.08,
        high: 0.16,
        critical: 0.24,
    }[riskLevel] || 0;

    const academic = clamp(stress * 0.6 + anxiety * 0.3 + riskBonus * 0.4, 0, 1);
    const sleep = clamp(stress * 0.45 + anxiety * 0.25 + depression * 0.3, 0, 1);
    const motivation = clamp(depression * 0.65 + stress * 0.35, 0, 1);
    const mindfulness = clamp(stress * 0.5 + anxiety * 0.35 + depression * 0.15, 0, 1);
    const panic = clamp(anxiety * 0.7 + stress * 0.3, 0, 1);
    const psychoeducation = clamp(anxiety * 0.5 + depression * 0.3 + stress * 0.2, 0, 1);
    const productivity = clamp(academic * 0.6 + stress * 0.4, 0, 1);
    const focus = clamp(academic * 0.7 + stress * 0.3, 0, 1);
    const reframing = clamp(anxiety * 0.55 + depression * 0.45, 0, 1);

    return {
        depression,
        anxiety,
        stress,
        academic,
        sleep,
        motivation,
        mindfulness,
        panic,
        psychoeducation,
        productivity,
        focus,
        reframing,
    };
}

function scoreResource(resource, signals, riskLevel) {
    const baseScore = resource.tags.reduce((sum, tag) => sum + (signals[tag] || 0), 0);

    let crisisPriorityBonus = 0;
    if (riskLevel === 'high' || riskLevel === 'critical') {
        if (resource.tags.includes('anxiety') || resource.tags.includes('depression')) {
            crisisPriorityBonus += 0.2;
        }
        if (resource.title === 'Breathing Exercises' || resource.title === 'CBT Techniques') {
            crisisPriorityBonus += 0.15;
        }
    }

    return baseScore + crisisPriorityBonus;
}

function buildResourceReason(resource, signals) {
    const dominantTag = [...resource.tags].sort((a, b) => (signals[b] || 0) - (signals[a] || 0))[0] || 'stress';
    const reasonByTag = {
        anxiety: 'Targets anxious thinking patterns and helps reduce immediate nervous-system overload.',
        depression: 'Supports low mood recovery through structured coping and behavioral activation.',
        stress: 'Helps regulate stress response and lower day-to-day emotional load.',
        academic: 'Directly addresses study pressure, deadlines, and student-life imbalance.',
        sleep: 'Supports calmer evenings and better sleep quality to improve emotional stability.',
        mindfulness: 'Builds present-moment grounding and emotional regulation habits.',
        panic: 'Useful for immediate down-regulation during spikes of panic or intense anxiety.',
        psychoeducation: 'Explains what is happening psychologically so coping feels more manageable.',
        productivity: 'Converts overwhelm into manageable steps and actionable planning.',
        focus: 'Improves sustained attention and reduces cognitive overload.',
        motivation: 'Helps restart momentum when energy and motivation feel low.',
        reframing: 'Teaches practical cognitive reframing for unhelpful thought loops.',
    };

    return reasonByTag[dominantTag] || reasonByTag.stress;
}

function selectSuggestedResources(signals, riskLevel, limit = 3) {
    const ranked = RESOURCE_CATALOG
        .map((resource) => ({
            ...resource,
            rankScore: scoreResource(resource, signals, riskLevel),
        }))
        .sort((a, b) => b.rankScore - a.rankScore);

    const selected = ranked.slice(0, limit).map((resource) => ({
        title: resource.title,
        type: resource.type,
        reason: buildResourceReason(resource, signals),
    }));

    // Safety override for high-risk users: ensure at least one immediate-regulation option exists.
    if ((riskLevel === 'high' || riskLevel === 'critical') && !selected.some((r) => r.title === 'Breathing Exercises')) {
        selected[selected.length - 1] = {
            title: 'Breathing Exercises',
            type: 'Audio',
            reason: 'Provides immediate physiological calming during acute distress or escalating anxiety.',
        };
    }

    return selected;
}

function buildDeterministicFallbackText({ phq9Severity, gad7Severity, pssSeverity, riskLevel, suggestedResources }) {
    const escalation =
        riskLevel === 'high' || riskLevel === 'critical'
            ? '\n\nBecause your current risk level is elevated, please consider speaking with a professional counselor as soon as possible. If you feel unsafe, call or text 988 immediately.'
            : '';

    const resourcesText = suggestedResources
        .map((r) => `- ${r.title} (${r.type}): ${r.reason}`)
        .join('\n');

    return `Thank you for completing your assessment. Based on your profile, your current levels are: Depression ${phq9Severity}, Anxiety ${gad7Severity}, and Stress ${pssSeverity}.\n\nStart with these targeted resources:\n${resourcesText}${escalation}`;
}

async function generateLlmRecommendations({ phq9Score, gad7Score, pssScore, totalScore, phq9Severity, gad7Severity, pssSeverity, riskLevel, answers, suggestedResources }) {
    const selectedResourcesText = suggestedResources
        .map((resource, idx) => `${idx + 1}. ${resource.title} (${resource.type}) - ${resource.reason}`)
        .join('\n');

    const prompt = `You are MedVault's empathetic clinical AI counselor for students. A student completed a mental-wellness screening.

STUDENT RESULTS:
- PHQ-9: ${phq9Score}/27 (${phq9Severity})
- GAD-7: ${gad7Score}/21 (${gad7Severity})
- PSS-4: ${pssScore}/16 (${pssSeverity})
- Total: ${totalScore}/64
- Overall Risk: ${riskLevel.toUpperCase()}

${answers ? `DETAILED ANSWERS JSON:\n${JSON.stringify(answers)}` : ''}

PRE-SELECTED RESOURCES (DO NOT CHANGE TITLES):
${selectedResourcesText}

RESPONSE RULES:
1) Warm, validating opening (2-3 sentences) tied to score pattern.
2) Brief score interpretation with one practical daily action each for depression, anxiety, stress.
3) Include a short "Next Steps" section that references the 3 pre-selected resources exactly by title.
4) If risk is HIGH or CRITICAL, clearly recommend professional counseling and mention 988.
5) Max 320 words, concise, human, supportive, no robotic tone.`;

    const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
    ];

    let result;
    let lastError;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(prompt);
            break;
        } catch (error) {
            lastError = error;
            continue;
        }
    }

    if (!result) {
        throw lastError || new Error('All AI models failed');
    }

    const response = await result.response;
    return response.text().trim();
}

export async function POST(req) {
    try {
        const payload = await req.json();
        const { phq9Score, gad7Score, pssScore, totalScore, answers } = normalizePayload(payload);

        const phq9Severity = getSeverityLabel(phq9Score, 27);
        const gad7Severity = getSeverityLabel(gad7Score, 21);
        const pssSeverity = getSeverityLabel(pssScore, 16);
        const riskLevel = getRiskLevel(totalScore);
        const needSignals = buildNeedSignals({ phq9Score, gad7Score, pssScore, riskLevel });
        const suggestedResources = selectSuggestedResources(needSignals, riskLevel, 3);

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                recommendations: buildDeterministicFallbackText({
                    phq9Severity,
                    gad7Severity,
                    pssSeverity,
                    riskLevel,
                    suggestedResources,
                }),
                riskLevel,
                suggestedResources,
                scores: {
                    phq9: { score: phq9Score, severity: phq9Severity },
                    gad7: { score: gad7Score, severity: gad7Severity },
                    pss: { score: pssScore, severity: pssSeverity },
                    total: totalScore,
                },
                metadata: {
                    routing: 'deterministic-assignment',
                },
            });
        }
        const cleanText = await generateLlmRecommendations({
            phq9Score,
            gad7Score,
            pssScore,
            totalScore,
            phq9Severity,
            gad7Severity,
            pssSeverity,
            riskLevel,
            answers,
            suggestedResources,
        });

        return NextResponse.json({
            recommendations: cleanText,
            riskLevel,
            suggestedResources,
            scores: {
                phq9: { score: phq9Score, severity: phq9Severity },
                gad7: { score: gad7Score, severity: gad7Severity },
                pss: { score: pssScore, severity: pssSeverity },
                total: totalScore
            },
            metadata: {
                routing: 'deterministic-assignment',
                riskEscalation: riskLevel === 'high' || riskLevel === 'critical',
            },
        });

    } catch (error) {
        console.error('Assessment AI error:', error);

        return NextResponse.json({
            recommendations: "I wasn't able to generate personalized recommendations right now, but based on your scores, please explore our Resource Hub for helpful materials. If you're feeling overwhelmed, please reach out to the 988 Suicide & Crisis Lifeline.",
            riskLevel: 'unknown',
            suggestedResources: [
                { title: 'Breathing Exercises', type: 'Audio', reason: 'Immediate relief technique for emotional overload.' },
                { title: "Mindfulness for Students", type: "Article", reason: "Daily stress reduction" },
                { title: "CBT Techniques", type: "Video", reason: "Managing thought patterns" }
            ]
        });
    }
}
