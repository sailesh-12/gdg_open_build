### 🏦 AnchorRisk  
### Household-Aware Financial Risk & Loan Decision Support System

---

<img width="1903" height="875" alt="image" src="https://github.com/user-attachments/assets/55dfcaae-2e1e-4e72-8ff1-2236a8ce44c4" />
###📌 Overview

**AnchorRisk** is a fintech decision-support platform that evaluates **loan risk by analyzing household financial structures**, not just individual income.

Traditional credit systems assess applicants in isolation.  
AnchorRisk models **how financial stress propagates through a household**, revealing hidden fragility that often causes loan defaults.

This project was built as a **hackathon MVP** with a focus on:
- Explainability
- Real-world banking logic
- Privacy-first design
- Practical risk insights

---

## Video Link
https://drive.google.com/file/d/1HfjbZiAJZR1ore9xxCwhljQ9F02IUzu5/view
## 🎯 Problem Statement

> *Loans are issued to individuals, but defaults occur due to household obligations.*

Existing systems fail to capture:
- Dependency chains
- Income concentration risk
- Cascading financial stress

AnchorRisk addresses this gap using **graph modeling + ML-based fragility analysis**.

---

## 🧠 Core Features

### 1️⃣ Household Graph Modeling
- Individuals represented as graph nodes
- Financial responsibilities represented as edges
- Captures dependencies, redundancy, and cascades

### 2️⃣ ML-Based Fragility Scoring
- Predicts household-level financial fragility
- Identifies single points of failure
- Outputs explainable risk bands (LOW / MEDIUM / HIGH)

### 3️⃣ Stress Simulation
- Simulates income loss **without removing people**
- Preserves household obligations
- Shows how risk propagates across the graph

### 4️⃣ Loan Affordability Check
- Uses applicant’s monthly income
- Applies EMI ≤ 40% income rule
- Determines if a requested loan is affordable

### 5️⃣ Decision Support Output
- APPROVE / CONDITIONAL APPROVE / REJECT
- Clear recommendations and safeguards
- Human-readable explanations

---


