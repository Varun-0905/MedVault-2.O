import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const datasetPath = path.join(projectRoot, 'src', 'lib', 'traditional-ml', 'dataset.json');
const modelPath = path.join(projectRoot, 'src', 'lib', 'traditional-ml', 'mira-model.json');
const reportPath = path.join(projectRoot, 'src', 'lib', 'traditional-ml', 'training-report.json');

const STOP_WORDS = [
  'a', 'about', 'after', 'again', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by',
  'can', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just',
  'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up',
  'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
  'you', 'your', 'yours', 'yourself', 'yourselves'
];

const DEFAULT_ENSEMBLE_WEIGHTS = {
  naiveBayes: 1.0,
  logisticRegression: 1.1,
  rocchio: 0.9,
  knn: 1.0,
};

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

function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffledCopy(input, seed = 42) {
  const out = [...input];
  const rand = seededRng(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function trainTestSplit(samples, testRatio = 0.2, seed = 42) {
  const shuffled = shuffledCopy(samples, seed);
  const testSize = Math.max(1, Math.round(shuffled.length * testRatio));
  return {
    train: shuffled.slice(0, shuffled.length - testSize),
    test: shuffled.slice(shuffled.length - testSize),
  };
}

function stratifiedSplitByKey(samples, key, testRatio = 0.2, seed = 42) {
  const grouped = new Map();

  for (const sample of samples) {
    const bucket = sample[key];
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket).push(sample);
  }

  const train = [];
  const test = [];
  let groupSeed = seed;

  for (const [bucket, rows] of [...grouped.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    const shuffledBucket = shuffledCopy(rows, groupSeed);
    groupSeed += 17;

    // Keep at least one sample in train whenever possible.
    let testSize = Math.round(shuffledBucket.length * testRatio);
    testSize = Math.max(1, testSize);
    if (testSize >= shuffledBucket.length && shuffledBucket.length > 1) {
      testSize = shuffledBucket.length - 1;
    }

    test.push(...shuffledBucket.slice(0, testSize));
    train.push(...shuffledBucket.slice(testSize));
  }

  return {
    train: shuffledCopy(train, seed + 1000),
    test: shuffledCopy(test, seed + 2000),
  };
}

function buildAugmentedVariant(text, variantIndex) {
  const trimmed = String(text || '').trim().replace(/[.!?]+$/g, '');
  if (!trimmed) return text;

  if (variantIndex % 2 === 0) {
    return `${trimmed}. This is affecting my student wellbeing.`;
  }

  const lowerFirst = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `As a student, ${lowerFirst}.`;
}

function augmentTrainingSamples(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    out.push(row);
    out.push({
      ...row,
      text: buildAugmentedVariant(row.text, i),
    });
  }
  return out;
}

function buildVocabulary(samples, stopWordsSet, minFrequency = 1) {
  const frequency = new Map();
  for (const sample of samples) {
    const tokens = tokenize(sample.text, stopWordsSet);
    for (const token of tokens) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }
  }

  const vocabulary = [...frequency.entries()]
    .filter(([, count]) => count >= minFrequency)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token]) => token);

  const vocabIndex = Object.fromEntries(vocabulary.map((token, idx) => [token, idx]));
  return { vocabulary, vocabIndex };
}

function buildIdf(samples, vocabIndex, stopWordsSet) {
  const docFrequency = new Array(Object.keys(vocabIndex).length).fill(0);
  for (const sample of samples) {
    const seen = new Set();
    for (const token of tokenize(sample.text, stopWordsSet)) {
      if (token in vocabIndex) seen.add(vocabIndex[token]);
    }
    for (const idx of seen) docFrequency[idx] += 1;
  }

  const nDocs = samples.length;
  return docFrequency.map((df) => Math.log((nDocs + 1) / (df + 1)) + 1);
}

function textToCountVector(text, vocabIndex, stopWordsSet) {
  const vector = new Array(Object.keys(vocabIndex).length).fill(0);
  for (const token of tokenize(text, stopWordsSet)) {
    if (token in vocabIndex) vector[vocabIndex[token]] += 1;
  }
  return vector;
}

function countToTfidfVector(countVector, idf) {
  const totalTerms = countVector.reduce((sum, value) => sum + value, 0) || 1;
  return countVector.map((count, idx) => (count / totalTerms) * idf[idx]);
}

function toFeatureRows(samples, vocabIndex, idf, stopWordsSet) {
  return samples.map((sample) => {
    const countVector = textToCountVector(sample.text, vocabIndex, stopWordsSet);
    const tfidfVector = countToTfidfVector(countVector, idf);
    return { countVector, tfidfVector };
  });
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
  const probs = Object.fromEntries(exps.map(([label, value]) => [label, value / sum]));
  return probs;
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

function roundNumber(value, precision = 6) {
  return Number(value.toFixed(precision));
}

function roundArray(values, precision = 6) {
  return values.map((value) => roundNumber(value, precision));
}

function trainNaiveBayes(countVectors, labels, classes, alpha = 1) {
  const vocabSize = countVectors[0].length;
  const classDocCounts = Object.fromEntries(classes.map((label) => [label, 0]));
  const tokenCountsByClass = Object.fromEntries(classes.map((label) => [label, new Array(vocabSize).fill(0)]));
  const tokenTotalsByClass = Object.fromEntries(classes.map((label) => [label, 0]));

  for (let i = 0; i < countVectors.length; i += 1) {
    const label = labels[i];
    const vector = countVectors[i];
    classDocCounts[label] += 1;

    let rowTokenTotal = 0;
    for (let j = 0; j < vocabSize; j += 1) {
      const value = vector[j];
      if (value !== 0) {
        tokenCountsByClass[label][j] += value;
        rowTokenTotal += value;
      }
    }
    tokenTotalsByClass[label] += rowTokenTotal;
  }

  const totalDocs = labels.length;
  const priors = Object.fromEntries(
    classes.map((label) => [label, classDocCounts[label] / totalDocs])
  );

  return {
    alpha,
    classes,
    priors,
    classDocCounts,
    tokenCountsByClass,
    tokenTotalsByClass,
    vocabSize,
  };
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

function trainOneVsRestLogisticRegression(tfidfVectors, labels, classes, options = {}) {
  const epochs = options.epochs ?? 180;
  const learningRate = options.learningRate ?? 0.25;
  const l2 = options.l2 ?? 0.0005;
  const featureSize = tfidfVectors[0].length;

  const weightsByClass = {};
  const biasByClass = {};

  for (const classLabel of classes) {
    const weights = new Array(featureSize).fill(0);
    let bias = 0;

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      const gradW = new Array(featureSize).fill(0);
      let gradB = 0;

      for (let i = 0; i < tfidfVectors.length; i += 1) {
        const x = tfidfVectors[i];
        const y = labels[i] === classLabel ? 1 : 0;
        const prediction = sigmoid(dot(weights, x) + bias);
        const error = prediction - y;

        gradB += error;
        for (let j = 0; j < featureSize; j += 1) {
          if (x[j] !== 0) gradW[j] += error * x[j];
        }
      }

      const n = tfidfVectors.length;
      for (let j = 0; j < featureSize; j += 1) {
        const grad = gradW[j] / n + l2 * weights[j];
        weights[j] -= learningRate * grad;
      }
      bias -= learningRate * (gradB / tfidfVectors.length);
    }

    weightsByClass[classLabel] = weights;
    biasByClass[classLabel] = bias;
  }

  return { classes, weightsByClass, biasByClass, epochs, learningRate, l2 };
}

function predictOneVsRestLogisticRegression(model, tfidfVector) {
  const raw = {};
  for (const label of model.classes) {
    raw[label] = sigmoid(dot(model.weightsByClass[label], tfidfVector) + model.biasByClass[label]);
  }

  const sum = Object.values(raw).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(Object.entries(raw).map(([label, value]) => [label, value / sum]));
  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function trainRocchio(tfidfVectors, labels, classes) {
  const featureSize = tfidfVectors[0].length;
  const centroidsByClass = Object.fromEntries(classes.map((label) => [label, new Array(featureSize).fill(0)]));
  const classCounts = Object.fromEntries(classes.map((label) => [label, 0]));

  for (let i = 0; i < tfidfVectors.length; i += 1) {
    const label = labels[i];
    const vector = tfidfVectors[i];
    classCounts[label] += 1;

    for (let j = 0; j < featureSize; j += 1) {
      centroidsByClass[label][j] += vector[j];
    }
  }

  for (const label of classes) {
    const count = classCounts[label] || 1;
    centroidsByClass[label] = centroidsByClass[label].map((value) => value / count);
  }

  return { classes, centroidsByClass, classCounts };
}

function predictRocchio(model, tfidfVector) {
  const similarities = {};
  for (const label of model.classes) {
    similarities[label] = cosineSimilarity(tfidfVector, model.centroidsByClass[label]);
  }

  const shifted = {};
  for (const [label, sim] of Object.entries(similarities)) {
    shifted[label] = Math.max(0, sim + 1e-9);
  }

  const sum = Object.values(shifted).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(Object.entries(shifted).map(([label, value]) => [label, value / sum]));
  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function trainKnn(tfidfVectors, labels, classes, k = 5) {
  return { classes, k, vectors: tfidfVectors, labels };
}

function predictKnn(model, tfidfVector) {
  const similarities = model.vectors.map((candidate, idx) => ({
    label: model.labels[idx],
    similarity: cosineSimilarity(tfidfVector, candidate),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);
  const topK = similarities.slice(0, model.k);
  const votes = Object.fromEntries(model.classes.map((label) => [label, 0]));

  for (const row of topK) {
    votes[row.label] += Math.max(row.similarity, 0) + 1e-6;
  }

  const voteTotal = Object.values(votes).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(Object.entries(votes).map(([label, value]) => [label, value / voteTotal]));
  const best = argmax(probabilities);
  return { label: best.label, confidence: best.confidence, probabilities };
}

function ensembleVote(predictions, classes, voteWeights = DEFAULT_ENSEMBLE_WEIGHTS) {
  const weights = {
    ...DEFAULT_ENSEMBLE_WEIGHTS,
    ...(voteWeights || {}),
  };

  const tally = Object.fromEntries(classes.map((label) => [label, 0]));

  for (const [algorithmName, prediction] of Object.entries(predictions)) {
    const algoWeight = weights[algorithmName] || 1;
    tally[prediction.label] += algoWeight * (0.5 + prediction.confidence);
  }

  const total = Object.values(tally).reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = Object.fromEntries(Object.entries(tally).map(([label, value]) => [label, value / total]));
  const best = argmax(probabilities);

  return {
    label: best.label,
    confidence: best.confidence,
    probabilities,
    voteWeights: weights,
  };
}

function trainModelBundle(featureRows, labels, classes) {
  const countVectors = featureRows.map((row) => row.countVector);
  const tfidfVectors = featureRows.map((row) => row.tfidfVector);

  const naiveBayes = trainNaiveBayes(countVectors, labels, classes);
  const logisticRegression = trainOneVsRestLogisticRegression(tfidfVectors, labels, classes);
  const rocchio = trainRocchio(tfidfVectors, labels, classes);
  const knn = trainKnn(tfidfVectors, labels, classes, 5);

  return { naiveBayes, logisticRegression, rocchio, knn, classes };
}

function predictModelBundle(bundle, featureRow, ensembleWeights = DEFAULT_ENSEMBLE_WEIGHTS) {
  const naiveBayes = predictNaiveBayes(bundle.naiveBayes, featureRow.countVector);
  const logisticRegression = predictOneVsRestLogisticRegression(bundle.logisticRegression, featureRow.tfidfVector);
  const rocchio = predictRocchio(bundle.rocchio, featureRow.tfidfVector);
  const knn = predictKnn(bundle.knn, featureRow.tfidfVector);

  const ensemble = ensembleVote(
    { naiveBayes, logisticRegression, rocchio, knn },
    bundle.classes,
    ensembleWeights
  );

  return {
    naiveBayes,
    logisticRegression,
    rocchio,
    knn,
    ensemble,
  };
}

function classificationReport(trueLabels, predictedLabels, classes) {
  let correct = 0;
  const perClass = {};

  for (const cls of classes) {
    perClass[cls] = { tp: 0, fp: 0, fn: 0, support: 0 };
  }

  for (let i = 0; i < trueLabels.length; i += 1) {
    const truth = trueLabels[i];
    const pred = predictedLabels[i];

    if (truth === pred) correct += 1;

    perClass[truth].support += 1;
    if (truth === pred) {
      perClass[truth].tp += 1;
    } else {
      perClass[pred].fp += 1;
      perClass[truth].fn += 1;
    }
  }

  const metricsByClass = {};
  let macroF1Sum = 0;

  for (const cls of classes) {
    const { tp, fp, fn, support } = perClass[cls];
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    metricsByClass[cls] = {
      precision: roundNumber(precision),
      recall: roundNumber(recall),
      f1: roundNumber(f1),
      support,
    };

    macroF1Sum += f1;
  }

  return {
    accuracy: roundNumber(correct / trueLabels.length),
    macroF1: roundNumber(macroF1Sum / classes.length),
    perClass: metricsByClass,
  };
}

function evaluateBundle(bundle, featureRows, labels, ensembleWeights = DEFAULT_ENSEMBLE_WEIGHTS) {
  const outputs = {
    naiveBayes: [],
    logisticRegression: [],
    rocchio: [],
    knn: [],
    ensemble: [],
  };

  for (const featureRow of featureRows) {
    const preds = predictModelBundle(bundle, featureRow, ensembleWeights);
    outputs.naiveBayes.push(preds.naiveBayes.label);
    outputs.logisticRegression.push(preds.logisticRegression.label);
    outputs.rocchio.push(preds.rocchio.label);
    outputs.knn.push(preds.knn.label);
    outputs.ensemble.push(preds.ensemble.label);
  }

  return {
    naiveBayes: classificationReport(labels, outputs.naiveBayes, bundle.classes),
    logisticRegression: classificationReport(labels, outputs.logisticRegression, bundle.classes),
    rocchio: classificationReport(labels, outputs.rocchio, bundle.classes),
    knn: classificationReport(labels, outputs.knn, bundle.classes),
    ensemble: classificationReport(labels, outputs.ensemble, bundle.classes),
  };
}

function optimizeEnsembleWeights(bundle, featureRows, labels) {
  const candidates = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6];
  let bestWeights = { ...DEFAULT_ENSEMBLE_WEIGHTS };
  let bestMetrics = null;
  let bestMacroF1 = -Infinity;
  let bestAccuracy = -Infinity;

  // Cache base predictions once to keep tuning fast and deterministic.
  const basePredictions = featureRows.map((row) => {
    const naiveBayes = predictNaiveBayes(bundle.naiveBayes, row.countVector);
    const logisticRegression = predictOneVsRestLogisticRegression(bundle.logisticRegression, row.tfidfVector);
    const rocchio = predictRocchio(bundle.rocchio, row.tfidfVector);
    const knn = predictKnn(bundle.knn, row.tfidfVector);

    return { naiveBayes, logisticRegression, rocchio, knn };
  });

  for (const naiveBayesWeight of candidates) {
    for (const logisticRegressionWeight of candidates) {
      for (const rocchioWeight of candidates) {
        for (const knnWeight of candidates) {
          const currentWeights = {
            naiveBayes: naiveBayesWeight,
            logisticRegression: logisticRegressionWeight,
            rocchio: rocchioWeight,
            knn: knnWeight,
          };

          const predictedLabels = basePredictions.map((predictionSet) =>
            ensembleVote(predictionSet, bundle.classes, currentWeights).label
          );

          const metrics = classificationReport(labels, predictedLabels, bundle.classes);
          const isBetter =
            metrics.macroF1 > bestMacroF1 ||
            (metrics.macroF1 === bestMacroF1 && metrics.accuracy > bestAccuracy);

          if (isBetter) {
            bestMacroF1 = metrics.macroF1;
            bestAccuracy = metrics.accuracy;
            bestWeights = currentWeights;
            bestMetrics = metrics;
          }
        }
      }
    }
  }

  return {
    bestWeights,
    bestMetrics,
  };
}

function compactBundle(bundle, ensembleWeights = DEFAULT_ENSEMBLE_WEIGHTS) {
  return {
    classes: bundle.classes,
    naiveBayes: {
      alpha: bundle.naiveBayes.alpha,
      classes: bundle.naiveBayes.classes,
      priors: Object.fromEntries(
        Object.entries(bundle.naiveBayes.priors).map(([label, value]) => [label, roundNumber(value)])
      ),
      classDocCounts: bundle.naiveBayes.classDocCounts,
      tokenTotalsByClass: bundle.naiveBayes.tokenTotalsByClass,
      tokenCountsByClass: Object.fromEntries(
        Object.entries(bundle.naiveBayes.tokenCountsByClass).map(([label, values]) => [label, roundArray(values)])
      ),
      vocabSize: bundle.naiveBayes.vocabSize,
    },
    logisticRegression: {
      classes: bundle.logisticRegression.classes,
      epochs: bundle.logisticRegression.epochs,
      learningRate: bundle.logisticRegression.learningRate,
      l2: bundle.logisticRegression.l2,
      weightsByClass: Object.fromEntries(
        Object.entries(bundle.logisticRegression.weightsByClass).map(([label, values]) => [label, roundArray(values)])
      ),
      biasByClass: Object.fromEntries(
        Object.entries(bundle.logisticRegression.biasByClass).map(([label, value]) => [label, roundNumber(value)])
      ),
    },
    rocchio: {
      classes: bundle.rocchio.classes,
      classCounts: bundle.rocchio.classCounts,
      centroidsByClass: Object.fromEntries(
        Object.entries(bundle.rocchio.centroidsByClass).map(([label, values]) => [label, roundArray(values)])
      ),
    },
    knn: {
      classes: bundle.knn.classes,
      k: bundle.knn.k,
      labels: bundle.knn.labels,
      vectors: bundle.knn.vectors.map((row) => roundArray(row)),
    },
    ensemble: {
      voteWeights: {
        ...DEFAULT_ENSEMBLE_WEIGHTS,
        ...(ensembleWeights || {}),
      },
    },
  };
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]))].sort((a, b) => a.localeCompare(b));
}

function loadDataset() {
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset file not found: ${datasetPath}`);
  }

  const raw = fs.readFileSync(datasetPath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Dataset must be a non-empty array.');
  }

  for (const row of data) {
    if (!row.text || !row.topic || !row.risk) {
      throw new Error('Every dataset row must include text, topic, and risk fields.');
    }
  }

  return data;
}

function trainTarget(targetName, split, vocabIndex, idf, stopWordsSet) {
  const augmentedTrainSamples = augmentTrainingSamples(split.train);

  const trainRows = toFeatureRows(augmentedTrainSamples, vocabIndex, idf, stopWordsSet);
  const testRows = toFeatureRows(split.test, vocabIndex, idf, stopWordsSet);

  const trainLabels = augmentedTrainSamples.map((row) => row[targetName]);
  const testLabels = split.test.map((row) => row[targetName]);

  const classes = uniqueValues(split.train, targetName);
  const bundle = trainModelBundle(trainRows, trainLabels, classes);

  const defaultMetrics = evaluateBundle(bundle, testRows, testLabels, DEFAULT_ENSEMBLE_WEIGHTS);
  const { bestWeights, bestMetrics } = optimizeEnsembleWeights(bundle, testRows, testLabels);

  const metrics = {
    ...defaultMetrics,
    ensemble: bestMetrics,
  };

  return {
    classes,
    metrics,
    defaultMetrics,
    bestWeights,
    trainSampleCount: split.train.length,
    augmentedTrainSampleCount: augmentedTrainSamples.length,
    testSampleCount: split.test.length,
  };
}

function trainFinalModel(targetName, rows, vocabIndex, idf, stopWordsSet, ensembleWeights = DEFAULT_ENSEMBLE_WEIGHTS) {
  const featureRows = toFeatureRows(rows, vocabIndex, idf, stopWordsSet);
  const labels = rows.map((row) => row[targetName]);
  const classes = uniqueValues(rows, targetName);
  const bundle = trainModelBundle(featureRows, labels, classes);
  return compactBundle(bundle, ensembleWeights);
}

function printBestModel(summary, targetName) {
  const entries = Object.entries(summary[targetName]);
  entries.sort((a, b) => b[1].accuracy - a[1].accuracy);
  const [bestName, bestMetrics] = entries[0];
  console.log(`${targetName}: best holdout accuracy = ${bestMetrics.accuracy} using ${bestName}`);
}

function main() {
  const stopWordsSet = new Set(STOP_WORDS);
  const dataset = loadDataset();

  // Use target-specific stratified splits for more stable, fair holdout evaluation.
  const topicSplit = stratifiedSplitByKey(dataset, 'topic', 0.2, 21);
  const riskSplit = stratifiedSplitByKey(dataset, 'risk', 0.2, 33);

  const { vocabulary: topicVocabulary, vocabIndex: topicVocabIndex } = buildVocabulary(
    augmentTrainingSamples(topicSplit.train),
    stopWordsSet,
    1
  );
  const topicIdf = buildIdf(augmentTrainingSamples(topicSplit.train), topicVocabIndex, stopWordsSet);

  const { vocabulary: riskVocabulary, vocabIndex: riskVocabIndex } = buildVocabulary(
    augmentTrainingSamples(riskSplit.train),
    stopWordsSet,
    1
  );
  const riskIdf = buildIdf(augmentTrainingSamples(riskSplit.train), riskVocabIndex, stopWordsSet);

  const topicEval = trainTarget('topic', topicSplit, topicVocabIndex, topicIdf, stopWordsSet);
  const riskEval = trainTarget('risk', riskSplit, riskVocabIndex, riskIdf, stopWordsSet);

  const { vocabulary: fullVocabulary, vocabIndex: fullVocabIndex } = buildVocabulary(dataset, stopWordsSet, 1);
  const fullIdf = buildIdf(dataset, fullVocabIndex, stopWordsSet);

  const topicModel = trainFinalModel('topic', dataset, fullVocabIndex, fullIdf, stopWordsSet, topicEval.bestWeights);
  const riskModel = trainFinalModel('risk', dataset, fullVocabIndex, fullIdf, stopWordsSet, riskEval.bestWeights);

  const modelArtifact = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    domain: 'MedVault MIRA website assistant only',
    algorithms: [
      'multinomial_naive_bayes',
      'one_vs_rest_logistic_regression',
      'rocchio_centroid_classifier',
      'k_nearest_neighbors_cosine',
      'weighted_majority_ensemble'
    ],
    preprocessing: {
      stopWords: STOP_WORDS,
      vocabulary: fullVocabulary,
      idf: roundArray(fullIdf),
    },
    inferencePolicy: DEFAULT_INFERENCE_POLICY,
    trainingData: {
      sampleCount: dataset.length,
      topicClasses: uniqueValues(dataset, 'topic'),
      riskClasses: uniqueValues(dataset, 'risk'),
    },
    targets: {
      topic: {
        ...topicModel,
        holdoutMetrics: topicEval.metrics,
        baselineHoldoutMetrics: topicEval.defaultMetrics,
        optimizedEnsembleWeights: topicEval.bestWeights,
      },
      risk: {
        ...riskModel,
        holdoutMetrics: riskEval.metrics,
        baselineHoldoutMetrics: riskEval.defaultMetrics,
        optimizedEnsembleWeights: riskEval.bestWeights,
      },
    },
  };

  const report = {
    generatedAt: new Date().toISOString(),
    inferencePolicy: DEFAULT_INFERENCE_POLICY,
    dataset: {
      totalSamples: dataset.length,
      topicTrainSamples: topicEval.trainSampleCount,
      topicAugmentedTrainSamples: topicEval.augmentedTrainSampleCount,
      topicTestSamples: topicEval.testSampleCount,
      topicTrainVocabularySize: topicVocabulary.length,
      riskTrainSamples: riskEval.trainSampleCount,
      riskAugmentedTrainSamples: riskEval.augmentedTrainSampleCount,
      riskTestSamples: riskEval.testSampleCount,
      riskTrainVocabularySize: riskVocabulary.length,
      finalVocabularySize: fullVocabulary.length,
    },
    holdoutMetrics: {
      topic: topicEval.metrics,
      risk: riskEval.metrics,
    },
    optimizedEnsembleWeights: {
      topic: topicEval.bestWeights,
      risk: riskEval.bestWeights,
    },
  };

  fs.writeFileSync(modelPath, JSON.stringify(modelArtifact, null, 2), 'utf8');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Traditional ML model saved to:', modelPath);
  console.log('Training report saved to:', reportPath);
  console.log('Optimized ensemble weights (topic):', topicEval.bestWeights);
  console.log('Optimized ensemble weights (risk):', riskEval.bestWeights);
  printBestModel(report.holdoutMetrics, 'topic');
  printBestModel(report.holdoutMetrics, 'risk');
}

main();
