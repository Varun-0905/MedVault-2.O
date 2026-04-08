# MIRA Traditional ML Seminar Brief

## 1. What We Built

MIRA is now a hybrid AI system:

- Generative counseling response engine: Gemini LLM (existing flow, unchanged)
- Traditional ML layer (new): local multi-model inference for topic and risk prediction
- Integration style: additive metadata only, so current chatbot behavior remains intact

## 2. Traditional ML Algorithms Used

The local model uses these traditional techniques:

1. Multinomial Naive Bayes
- Used for text classification from bag-of-words count vectors.
- Effective for sparse text and small datasets.

2. One-vs-Rest Logistic Regression
- Linear probabilistic classifier over TF-IDF features.
- Produces interpretable class probabilities.

3. Rocchio Centroid Classifier
- Prototype/centroid-based classifier using cosine similarity.
- Fast and robust baseline for document categorization.

4. K-Nearest Neighbors (Cosine)
- Instance-based classifier on TF-IDF vectors.
- Predicts class using nearest labeled examples.

5. Weighted Majority Ensemble
- Combines outputs of the above models.
- Improves stability over any single model.

## 3. What MIRA Is Trained To Predict Locally

The local ML layer predicts two outputs for each chat turn:

- Topic class:
  - academic_stress
  - relationships
  - anxiety
  - depression
  - sleep_issues
  - eating_concerns
  - crisis
  - general_wellness

- Risk class:
  - low
  - medium
  - high

This ML scope is explicitly restricted to MedVault website context only.

## 4. Data and Training Pipeline

- Dataset file: src/lib/traditional-ml/dataset.json
- Training script: scripts/train-mira-traditional-ml.mjs
- Model artifact: src/lib/traditional-ml/mira-model.json
- Metrics report: src/lib/traditional-ml/training-report.json

Pipeline steps:

1. Text normalization and tokenization
2. Stop-word filtering
3. Vocabulary construction
4. Count vectors and TF-IDF vectors
5. Train 4 classifiers
6. Ensemble vote composition
7. Persist model and report artifacts

## 5. Integration With Existing MIRA

Current MIRA generation is unchanged:

- Gemini still generates the assistant response.
- Prompt, safety, and crisis protocol remain the same.

Traditional ML is added as metadata:

- In chat route, traditional ML predictions are computed after the response text is generated.
- Predictions are returned under metadata.traditionalMl.
- Existing rule-based detectedTopic and riskLevel are preserved.

## 6. Why This Is Panel-Ready

You can confidently state:

- "We implemented a hybrid architecture: LLM for empathetic generation + traditional ML for deterministic local classification."
- "We used four classical ML algorithms and an ensemble, trained locally on a domain-specific dataset."
- "Traditional ML is integrated without changing user-facing counseling quality from the current MIRA flow."
- "The local model is scoped strictly to MedVault mental wellness use-cases."

## 7. Commands

Train or retrain locally:

npm run train:mira-ml

Validate app build:

npm run build
