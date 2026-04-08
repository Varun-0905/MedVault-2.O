import fs from 'node:fs';
import path from 'node:path';

let cachedModel = null;
let cachedVocabIndex = null;
let cachedStopWords = null;

const DEFAULT_INFERENCE_POLICY = {
  topic: {
    enabled: true,
    confidenceThreshold: 0.45,
    fallbackLabel: 'general_wellness',
  },
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text, stopWordsSet) {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWordsSet.has(token));
}

function dot(a, b) {
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out += a[i] * b[i];
  return out;
}

function magnitude(a) {
  return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a, b) {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

function sigmoid(value) {
  if (value >= 0) {
    const z = Math.exp(-value);
    return 1 / (1 + z);
  }
  const z = Math.exp(value);
  return z / (1 + z);
}

function softmaxFromScores(scoresByClass) {
  const entries = Object.entries(scoresByClass);
  const maxScore = Math.max(...entries.map(([, score]) => score));
  const exps = entries.map(([label, score]) => [label, Math.exp(score - maxScore)]);
  const sum = exps.reduce((acc, [, value]) => acc + value, 0) || 1;
  return Object.fromEntries(exps.map(([label, value]) => [label, value / sum]));
}

function argmax(probabilities) {
  let bestLabel = null;
  let bestScore = -Infinity;
  for (const [label, score] of Object.entries(probabilities)) {
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }
  return { label: bestLabel, confidence: bestScore };
}

function loadModel() {
  if (cachedModel) return cachedModel;

  const modelPath = path.join(process.cwd(), 'src', 'lib', 'traditional-ml', 'mira-model.json');
  const raw = fs.readFileSync(modelPath, 'utf8');
  cachedModel = JSON.parse(raw);

  cachedVocabIndex = Object.fromEntries(
    cachedModel.preprocessing.vocabulary.map((token, idx) => [token, idx])
  );
  cachedStopWords = new Set(cachedModel.preprocessing.stopWords || []);

  return cachedModel;
}

function createFeatureRow(text, model) {
  const vocabLength = model.preprocessing.vocabulary.length;
  const countVector = new Array(vocabLength).fill(0);

  for (const token of tokenize(text, cachedStopWords)) {
    if (token in cachedVocabIndex) {
      countVector[cachedVocabIndex[token]] += 1;
    }
  }

  const totalTerms = countVector.reduce((sum, value) => sum + value, 0) || 1;
  const tfidfVector = countVector.map(
    (count, idx) => (count / totalTerms) * (model.preprocessing.idf[idx] || 0)
  );

  return { countVector, tfidfVector };
}

function predictNaiveBayes(model, countVector) {
  const { alpha, classes, priors, tokenCountsByClass, tokenTotalsByClass, vocabSize } = model;
  const scores = {};

  for (const label of classes) {
    let logScore = Math.log(priors[label] || Number.EPSILON);
    const denom = tokenTotalsByClass[label] + alpha * vocabSize;
    const tokenCounts = tokenCountsByClass[label];

    for (let i = 0; i < countVector.length; i += 1) {
      const count = countVector[i];
      if (count === 0) continue;
      const likelihood = (tokenCounts[i] + alpha) / denom;
      logScore += count * Math.log(likelihood);
    }

    scores[label] = logScore;
  }

  const probabilities = softmaxFromScores(scores);
  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function predictLogisticRegression(model, tfidfVector) {
  const raw = {};
  for (const label of model.classes) {
    raw[label] = sigmoid(dot(model.weightsByClass[label], tfidfVector) + model.biasByClass[label]);
  }

  const sum = Object.values(raw).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(
    Object.entries(raw).map(([label, value]) => [label, value / sum])
  );

  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function predictRocchio(model, tfidfVector) {
  const shifted = {};
  for (const label of model.classes) {
    const similarity = cosineSimilarity(tfidfVector, model.centroidsByClass[label]);
    shifted[label] = Math.max(0, similarity + 1e-9);
  }

  const sum = Object.values(shifted).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(
    Object.entries(shifted).map(([label, value]) => [label, value / sum])
  );

  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function predictKnn(model, tfidfVector) {
  const ranked = model.vectors
    .map((candidateVector, idx) => ({
      label: model.labels[idx],
      similarity: cosineSimilarity(tfidfVector, candidateVector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, model.k);

  const votes = Object.fromEntries(model.classes.map((label) => [label, 0]));

  for (const row of ranked) {
    votes[row.label] += Math.max(row.similarity, 0) + 1e-6;
  }

  const total = Object.values(votes).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(
    Object.entries(votes).map(([label, value]) => [label, value / total])
  );

  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function ensembleVote(predictions, classes, voteWeights) {
  const defaultWeights = {
    naiveBayes: 1.0,
    logisticRegression: 1.1,
    rocchio: 0.9,
    knn: 1.0,
  };

  const weights = { ...defaultWeights, ...(voteWeights || {}) };
  const tally = Object.fromEntries(classes.map((label) => [label, 0]));

  for (const [algorithmName, prediction] of Object.entries(predictions)) {
    const algorithmWeight = weights[algorithmName] || 1;
    tally[prediction.label] += algorithmWeight * (0.5 + prediction.confidence);
  }

  const total = Object.values(tally).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(
    Object.entries(tally).map(([label, value]) => [label, value / total])
  );

  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function blendProbabilities(classes, predictions, voteWeights) {
  const defaultWeights = {
    naiveBayes: 1.0,
    logisticRegression: 1.1,
    rocchio: 0.9,
    knn: 1.0,
  };

  const weights = { ...defaultWeights, ...(voteWeights || {}) };
  const totals = Object.fromEntries(classes.map((label) => [label, 0]));

  let weightDenominator = 0;
  for (const [algorithmName, prediction] of Object.entries(predictions)) {
    const algorithmWeight = weights[algorithmName] || 1;
    weightDenominator += algorithmWeight;

    for (const label of classes) {
      totals[label] += algorithmWeight * (prediction.probabilities[label] || 0);
    }
  }

  const denom = weightDenominator || 1;
  for (const label of classes) {
    totals[label] /= denom;
  }

  return totals;
}

function round(value) {
  return Number(value.toFixed(4));
}

function getInferencePolicy(model) {
  const topicPolicy = {
    ...DEFAULT_INFERENCE_POLICY.topic,
    ...(model?.inferencePolicy?.topic || {}),
  };

  return {
    topic: topicPolicy,
  };
}

function applyTopicConfidenceFallback(topicPrediction, inferencePolicy) {
  const threshold = Number(inferencePolicy.topic.confidenceThreshold);
  const fallbackLabel = inferencePolicy.topic.fallbackLabel || 'general_wellness';
  const isEnabled = Boolean(inferencePolicy.topic.enabled);
  const fallbackApplied = isEnabled && topicPrediction.confidence < threshold;

  return {
    ...topicPrediction,
    rawLabel: topicPrediction.label,
    label: fallbackApplied ? fallbackLabel : topicPrediction.label,
    fallbackApplied,
    fallbackLabel,
    confidenceThreshold: round(threshold),
    guidanceMode: fallbackApplied ? 'generic' : 'personalized',
  };
}

function predictTarget(targetModel, featureRow) {
  const naiveBayes = predictNaiveBayes(targetModel.naiveBayes, featureRow.countVector);
  const logisticRegression = predictLogisticRegression(targetModel.logisticRegression, featureRow.tfidfVector);
  const rocchio = predictRocchio(targetModel.rocchio, featureRow.tfidfVector);
  const knn = predictKnn(targetModel.knn, featureRow.tfidfVector);

  const predictionSet = { naiveBayes, logisticRegression, rocchio, knn };

  const ensemble = ensembleVote(
    predictionSet,
    targetModel.classes,
    targetModel.ensemble?.voteWeights
  );

  const blendedProbabilities = blendProbabilities(
    targetModel.classes,
    predictionSet,
    targetModel.ensemble?.voteWeights
  );

  const blendedConfidence = blendedProbabilities[ensemble.label] ?? ensemble.confidence;

  return {
    label: ensemble.label,
    confidence: round(blendedConfidence),
    perAlgorithm: {
      naiveBayes: { label: naiveBayes.label, confidence: round(naiveBayes.confidence) },
      logisticRegression: { label: logisticRegression.label, confidence: round(logisticRegression.confidence) },
      rocchio: { label: rocchio.label, confidence: round(rocchio.confidence) },
      knn: { label: knn.label, confidence: round(knn.confidence) },
    },
    probabilities: Object.fromEntries(
      Object.entries(blendedProbabilities).map(([label, value]) => [label, round(value)])
    ),
  };
}

export function hasTraditionalMlModel() {
  try {
    loadModel();
    return true;
  } catch {
    return false;
  }
}

export function predictTraditionalMlSignals(text) {
  const model = loadModel();
  const featureRow = createFeatureRow(text, model);
  const inferencePolicy = getInferencePolicy(model);

  const rawTopic = predictTarget(model.targets.topic, featureRow);
  const topic = applyTopicConfidenceFallback(rawTopic, inferencePolicy);
  const risk = predictTarget(model.targets.risk, featureRow);

  return {
    modelVersion: model.version,
    modelDomain: model.domain,
    algorithms: model.algorithms,
    inferencePolicy,
    topic,
    risk,
  };
}
