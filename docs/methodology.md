
---

# Methodology

## Overview

We develop an audio–visual classifier for fine-grained harmful-content detection. The approach comprises: (i) open-source backbone encoders to obtain modality-specific embeddings; (ii) lightweight intra-modality refinement; (iii) a two-stage cascaded cross-attention module for audio–visual alignment; and (iv) a multi-label classifier. The use of AST for audio representations, VideoMAE for video representations, intra-modality transformer encoders, and cascaded cross-attention for fusion follows established practice in recent audio–visual safety detection research.

## 1. Data and Label Space

We use an in-house dataset of short video clips (duration < 60 s), each containing synchronized audio and video. The task is formulated as **multi-label classification** over four labels: **Safe**, **Sexual**, **Violent**, and **Suicide**. Multiple harmful categories may co-occur within a clip. To ensure robust estimates under potential class imbalance, we adopt five-fold cross-validation (4 folds for training, 1 for evaluation), mirroring common evaluation protocols in prior work.

## 2. Preprocessing

**Video.** We uniformly sample **16 frames** per clip across the full duration to preserve temporal coverage while controlling computational cost; frames are resized to **224×224** and normalized according to the video backbone’s requirements.
**Audio.** We extract mono audio at **16 kHz** and compute log-mel spectrograms compatible with the audio backbone’s feature extractor.
**Augmentation (optional).** We employ mild spatial transforms (e.g., random resized crop, horizontal flip) and conservative audio perturbations (e.g., time shift, small gain or noise) that preserve labels.

## 3. Backbone Feature Extraction (Open-Source)

**Audio encoder.** We obtain a **768-dimensional** audio embedding using the **Audio Spectrogram Transformer (AST)** pre-trained on AudioSet; time/token outputs are aggregated to a clip-level representation.
**Video encoder.** We obtain a **768-dimensional** video embedding using **VideoMAE-Base**; frame tokens are aggregated (e.g., via [CLS] token or mean pooling) to a clip-level representation.
To enable efficient training under limited GPU memory, we **pre-compute and cache** all AST/VideoMAE embeddings and keep these backbones **frozen** during subsequent training, a features-then-model strategy consistent with prior work.

## 4. Intra-Modality Refinement

For each modality, we apply a lightweight **transformer encoder** (1–2 layers; hidden size 768) to refine modality-specific information prior to fusion, following the practice of modeling intra-modality dependencies with vanilla transformer encoders. When only a single clip-level vector is available, this block functions as a residual MLP; when short token sequences are retained (e.g., sub-segment descriptors), self-attention can be leveraged directly.

## 5. Audio–Visual Alignment via Cascaded Cross-Attention

We employ a **two-stage cascaded cross-transformer** to progressively align modalities. In **Cascade 1**, audio queries attend to video keys/values, and video queries attend to audio keys/values; each direction is followed by a position-wise feed-forward network, residual connections, and layer normalization. **Cascade 2** repeats the bi-directional cross-attention on the updated representations to further strengthen inter-modal dependencies. The final audio and video representations are **concatenated** to yield a fused vector (Z_{\text{fused}}\in\mathbb{R}^{1536}), which is passed to the classifier. Prior studies indicate that this cascaded formulation yields more effective alignment than early/late concatenation, element-wise fusion, or a single cross-attention stage.

## 6. Classifier and Learning Objective

We use a two-layer classifier ( \text{Linear}(1536!\to!120)\rightarrow\text{GELU}\rightarrow\text{Dropout}\rightarrow\text{Linear}(120!\to!4) ). The four outputs correspond to the labels (Safe, Sexual, Violent, Suicide). Given the multi-label setting, we optimize **Binary Cross-Entropy with Logits**. The classifier width (120 units) follows common practice for compact heads in related work.

## 7. Training Protocol

Optimization uses **AdamW** with initial learning rate **1e-4**, **weight decay 1e-5**, and **early stopping** on a validation fold. We target **25 epochs** with an effective batch size of ~16; when constrained by memory, we reduce per-device batch size and apply **gradient accumulation**. Regularization includes dropout in the classifier and, if needed, class-balanced sampling or loss reweighting to mitigate label imbalance.

## 8. Inference on < 60 s Clips

For clips where harmful events may be brief, we optionally partition the clip into a small number of uniformly spaced segments, apply the model per segment, and combine segment-level outputs using an “any-positive” rule per label. This enhances sensitivity to short events while preserving efficiency.

## 9. Evaluation

We report **per-label AUROC** and **Average Precision (AP)** with **mean AP (mAP)**, as well as **macro-averaged F1** and **per-label F1**. For completeness and comparability with prior work, we also report **accuracy** and macro-**AUC**. Ablations include unimodal audio-only and video-only baselines and standard fusion strategies (early/late concatenation; element-wise average/product) to quantify the contribution of the cascaded cross-transformer.

## 10. Engineering Considerations (Resource-Constrained Setting)

Given a 4 GB-VRAM GPU, we (i) **freeze** AST/VideoMAE and train only the refinement, fusion, and classifier layers; (ii) train in **mixed precision**; and (iii) use **small batches with gradient accumulation**. If necessary, we reduce frame count or substitute lighter encoders while retaining the same fusion design. These practices are consistent with efficient training setups reported in related work.

---
