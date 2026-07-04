# Recommendation System – Runbook

## Overview

This runbook describes how to reproduce the complete recommendation system, generate all intermediate artifacts, and obtain final city recommendations.

---

# 1. Repository Structure

```
recommendation_system/

├── data/
│   ├── raw/
|   └── processed/
|       ├── models/
|       ├── w11/
│
│
├── notebooks/
│
├── reports/
│
├── requirements.txt
│
├── README.md
│
└── RUNBOOK.md
```

---
## Clone repository

```bash
git clone https://github.com/andreatpr/recommendation_system.git

cd recommendation_system
```

# 2. Requirements

- Python 3.11+
- Git
- Jupyter Notebook

Install dependencies

```bash
pip install -r requirements.txt
```

---

# 3. Dataset

Download the Yelp Academic Dataset.

Place the files in

```
data/raw/
```

Expected files

```
yelp_academic_dataset_business.json

yelp_academic_dataset_review.json

yelp_academic_dataset_user.json

yelp_academic_dataset_checkin.json
```

---

# 4. Execution Pipeline

Execute the notebooks in the following order.

---

## Step 1 – Data preprocessing

Notebook

```
pre.ipynb
```

Purpose

- Load Yelp JSON files
- Clean records
- Normalize attributes
- Generate processed datasets

Generated artifacts

```
business_clean.parquet

business_categories.parquet

review_interactions.parquet

user_clean.parquet

checkin_clean.parquet
```

---

## Step 2 – Feature Engineering

Notebook

```
week5_modified.ipynb
```

Purpose

- Generate city-level features
- Compute commercial descriptors
- Build city representation

Output

```
city_features_new.parquet
city_features_pca_new.parquet
```

---

## Step 3 – PCA

Notebook

```
week7.ipynb
```

Purpose

- Reduce dimensionality
- Interpret latent commercial dimensions
- Perform clustering analysis


---

## Step 4 – Hybrid Recommendation

Notebook

```
w10.ipynb
```

Purpose

- Train collaborative filtering
- Build content-based profiles
- Compute popularity scores
- Generate hybrid recommendations

Output
```
data/processed/w11/

w10_city_popularity.parquet

w10_cities_filtered.parquet

w10_user_city_f.parquet

w10_train_uc.parquet

w10_test_uc.parquet

w10_user_factors.npy

w10_item_factors.npy

w10_user_to_idx.parquet

w10_city_to_idx_cf.parquet

w10_X_content.npy

w10_content_city_list.parquet

w10_cf_bounds.parquet
```
```
Deployment artifact
data/processed/w11/models/

        hybrid_artifacts.pkl
```

This package contains

- collaborative filtering latent factors
- content-based representations
- popularity statistics
- metadata
- hybrid configuration

---

## Step 5 – Graph Analytics

Notebook

```
week12.ipynb
```

Purpose

- Build city similarity graph
- Compute PageRank
- Compute Betweenness
- Compute Closeness
- Identify hidden gems

---

# 5. Reproducing Recommendations

Load

```
models/hybrid_artifacts.pkl
```

The artifact includes all trained data required for inference.

Recommendation workflow

```
User ID

↓

Collaborative Filtering Score

↓

Content-Based Score

↓

Popularity Score

↓

Hybrid Score

↓

Top-K Recommended Cities
```

---

# 6. Outputs on notebooks

The pipeline generates

```
Processed datasets

City feature vectors

PCA representation

City clusters

Recommendation metrics

Top-K recommendations

Graph metrics

Network visualizations
```

---

# 7. Expected Running Time

Approximate execution

| Notebook | Time |
|-----------|------|
| pre | 60 min |
| week5 | 30 min |
| week7 | 30 min |
| w10 | 50 min |
| week12 | 30 min |

---

# 8. Troubleshooting

Dataset not found

Verify JSON files are located inside

```
data/raw/
```

Module not found

```
pip install -r requirements.txt
```

Notebook fails

Execute notebooks following the specified order.