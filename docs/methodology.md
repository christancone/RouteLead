
---

# 1. Introduction

## 1.1 Project Background

Short-form video platforms have become primary media channels for young audiences, increasing exposure to content that may negatively affect mental and emotional well-being. Prior moderation pipelines often rely on coarse, video-level signals and predominantly visual cues, which struggle with **fine-grained** harmful events that appear briefly or are embedded sparsely across a clip. Recent research indicates that **audio** provides complementary context (e.g., suggestive language, alarming effects) and that **audio–visual alignment** with transformer-based fusion can improve fine-grained detection. Building on these insights, this project targets a practical, resource-constrained implementation of an audio–visual detector for short clips (< 60 s), using open-source backbones and a modern cross-attention fusion design consistent with established practice.

## 1.2 Problem Definition

We address **fine-grained harmful content detection** in short video clips with synchronized audio and video streams. Given an input clip (x) (duration < 60 s), the system predicts a **multi-label** vector (y \in {0,1}^{4}) over the categories **Safe**, **Sexual**, **Violent**, and **Suicide**. The task is challenging because harmful events may be temporally sparse, visually subtle, or primarily conveyed by audio, leading to false negatives in visual-only or coarse fusion approaches. Formally, we seek a function (f_\theta: x \mapsto y) that maximizes per-label discrimination under class imbalance and brief event durations, while remaining trainable on modest hardware. To this end, we adopt open-source audio and video encoders that yield compact clip-level embeddings (typically 768-D), followed by **intra-modality refinement** and **two-stage cascaded cross-attention** for audio–visual alignment.

## 1.3 Project Aims/Objectives

**Aim.** Develop and evaluate a compute-efficient, open-source **audio–visual** model for fine-grained harmful content detection in clips under 60 s, supporting the label set {Safe, Sexual, Violent, Suicide}.

**Objectives.**

1. **Design & Implementation:**

   * Extract modality-specific embeddings using open-source encoders (audio: AST; video: VideoMAE) and cache features for efficient training on constrained GPUs.
   * Implement lightweight intra-modality refinement (transformer encoders or residual MLPs) and a **two-stage cascaded cross-attention** module for audio–visual alignment, consistent with established fusion patterns.
2. **Learning & Inference:**

   * Train a multi-label classifier on fused representations using appropriate objectives (e.g., BCE with logits) and regularization under class imbalance; adopt five-fold cross-validation for robust estimation.
   * For < 60 s clips, evaluate uniform frame sampling and optional segment-level inference with conservative aggregation to capture brief events.
3. **Evaluation & Baselines:**

   * Report per-label AUROC/AP, macro-F1, and accuracy; compare against unimodal (audio-only, video-only) and standard fusion baselines (early/late concatenation; element-wise fusion) to quantify the contribution of cascaded cross-attention.
4. **Resource & Ethics:**

   * Ensure feasibility on a 4 GB-VRAM GPU via feature caching, mixed precision, and small effective batch sizes; document limitations and trade-offs.
   * Follow responsible-use practices for sensitive content and include human-in-the-loop considerations for deployment.


---

# 2. Project Description

## 2.1 System Overview

We propose an audio–visual classifier for fine-grained harmful-content detection in short clips (< 60 s). The system comprises: (i) open-source encoders to obtain clip-level audio and video embeddings; (ii) lightweight intra-modality refinement; (iii) a two-stage cascaded cross-attention module for audio–visual alignment; and (iv) a multi-label classifier producing scores for **Safe**, **Sexual**, **Violent**, and **Suicide**. The backbone choices (AST for audio; VideoMAE for video), the use of transformer encoders per modality, and cross-attention for alignment follow established practice in recent work on fine-grained child-harmful content detection.

## 2.2 Data and Annotation

The dataset consists of thousands of user-provided video clips (duration < 60 s) with synchronized audio. Each clip is annotated for the presence/absence of **Sexual**, **Violent**, and **Suicide** cues; **Safe** denotes the absence of harmful categories. We adopt a **multi-label** formulation to accommodate co-occurrence. To obtain robust estimates under potential imbalance, we employ **five-fold cross-validation** (4 folds train, 1 fold test), mirroring common evaluation protocols.

## 2.3 Preprocessing

**Video.** We uniformly sample **16 frames** per clip across its full duration, resize frames to **224×224**, and normalize according to the video encoder’s requirements.
**Audio.** We extract mono audio at **16 kHz** and compute log-mel spectrograms suitable for the AST feature extractor.
**Augmentation (optional).** Mild spatial transforms (random resized crop, horizontal flip) and conservative audio perturbations (time-shift, small gain/noise) are used to improve generalization without altering labels.

## 2.4 Feature Extraction (Open-Source)

**Audio encoder (AST).** We obtain a **768-dimensional** clip-level audio embedding using the Audio Spectrogram Transformer pre-trained on AudioSet; token/time outputs are aggregated (e.g., mean pooling) to 768-d.
**Video encoder (VideoMAE-Base).** We obtain a **768-dimensional** clip-level video embedding from 16 sampled frames via VideoMAE (e.g., [CLS] token or mean over tokens).
**Efficiency.** To operate on a 4 GB VRAM GPU, we **pre-compute and cache** all AST/VideoMAE embeddings and **freeze** the backbones during training, following the features-then-model pattern reported in prior work.

## 2.5 Model Architecture

**Intra-modality refinement.** For each modality, a lightweight **vanilla transformer encoder** (1–2 layers; hidden size 768) models intra-modal dependencies before fusion. With a single clip-level vector, the block functions as a residual MLP; if short temporal tokens are retained, self-attention is applied directly.
**Audio–visual alignment.** We employ a **two-stage cascaded cross-transformer**: in **Cascade 1**, audio queries attend to video keys/values and vice-versa, each followed by FFN, residual, and layer normalization; **Cascade 2** repeats the bi-directional cross-attention on updated representations to strengthen inter-modal dependencies. The final audio and video representations are **concatenated** to form (Z_{\text{fused}}\in\mathbb{R}^{1536}), which is passed to the classifier. Evidence in prior work indicates this cascaded design outperforms early/late concatenation, element-wise fusion, and single cross-attention stages on fine-grained tasks.

## 2.6 Learning Objective and Optimization

The classifier is a two-layer head ( \text{Linear}(1536!\to!120)\rightarrow\text{GELU}\rightarrow\text{Dropout}\rightarrow\text{Linear}(120!\to!4) ). Given the multi-label setting, we optimize **Binary Cross-Entropy with Logits**. Training uses **AdamW** (initial **lr = 1e-4**, **weight decay = 1e-5**) with **early stopping** on validation folds. We target **~25 epochs**; when constrained by memory, we employ **small batches with gradient accumulation**, consistent with reported practice.

## 2.7 Inference on < 60 s Clips

At inference, we apply the same 16-frame uniform sampling. For clips with brief harmful events, we optionally partition each clip into a small number of uniformly spaced segments, apply the model per segment, and aggregate with an **any-positive** rule per label to increase sensitivity to short events.

## 2.8 Evaluation Plan

We report **per-label AUROC** and **Average Precision (AP)** with **mAP**, as well as **macro-F1** and **accuracy** for completeness. We include **unimodal** (audio-only, video-only) and **standard fusion** baselines (early/late concatenation; element-wise average/product) to quantify the contribution of the cascaded cross-transformer. Five-fold cross-validation provides mean±std estimates across folds.

## 2.9 Compute and Engineering Considerations

To ensure feasibility on a laptop GPU (GTX 1650 Ti, 4 GB VRAM), we: (i) **freeze** AST/VideoMAE and train only refinement, fusion, and classifier layers; (ii) use **mixed precision**; (iii) keep **16 frames** per clip; and (iv) rely on **feature caching** and **tiny batches** with accumulation. If necessary, lighter encoders (e.g., per-frame ResNet18 + temporal pooling; YAMNet/VGGish for audio) can be substituted while retaining the same fusion module. These practices align with efficient training configurations documented in prior work.

## 2.10 Risks and Mitigations

* **GPU memory & throughput.** Mitigated via freezing/caching, FP16, small batches, and gradient accumulation.
* **Class imbalance.** Addressed by class-balanced sampling or loss reweighting; we monitor per-label metrics.
* **Temporal sparsity.** Segment-level inference with conservative aggregation reduces false negatives for brief events.
* **Domain shift.** If necessary and feasible, lightly fine-tune upper layers or insert small adapters for AST/VideoMAE.

## 2.11 Deliverables and Milestones

1. Data pipeline and annotation guidelines; 2) Preprocessing + feature cache (AST/VideoMAE); 3) Model code (intra-modality encoders; cascaded cross-attention; classifier); 4) Training with baselines and ablations; 5) Evaluation report (mAP, AUROC, F1, accuracy); 6) Inference script/API for batch scoring of clips.

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

# 3.1 Research Design

## 3.1.1 Research Approach and Strategy

We adopt a **quantitative, experimental** approach to develop and evaluate an audio–visual model for fine-grained harmful-content detection in short video clips (< 60 s). The approach combines: (i) **open-source backbone encoders** to obtain modality-specific embeddings (AST for audio; VideoMAE for video), (ii) **intra-modality refinement** via lightweight transformer encoders, and (iii) **two-stage cascaded cross-attention** for audio–visual alignment, followed by a multi-label classifier. The choice of AST/VideoMAE backbones, transformer encoders per modality, and cross-attention fusion follows established practice in recent audio–visual safety detection research. Model development proceeds in two phases for efficiency on constrained hardware: (a) **feature precomputation** with frozen backbones; (b) **fusion-head training** (refinement + alignment + classifier) using cross-validation for robust estimation.

## 3.1.2 Data Collection Methods

The study uses an in-house corpus of short clips, each with synchronized audio and video. For **standardized inputs**, we extract:

* **Video:** uniformly sampled **16 frames** per clip across its full duration; frames are resized to **224×224** and normalized for the video backbone.
* **Audio:** mono waveform resampled to **16 kHz**; we compute log-mel spectrograms compatible with the AST feature extractor.
  Backbone encoders produce clip-level **768-dimensional** embeddings for each modality (temporal/token outputs aggregated), consistent with prior work. Optional, label-preserving augmentation (mild spatial transforms; conservative audio perturbations) is applied to improve generalization.

## 3.1.3 Sampling Strategy

We formulate the task as **multi-label classification** over {Safe, Sexual, Violent, Suicide}, allowing co-occurrence. To obtain reliable estimates under potential class imbalance, we employ **five-fold cross-validation** (4 folds for training, 1 for evaluation), mirroring established evaluation protocols. Within each fold, we use **stratified sampling** at the clip level (by label set) where feasible; when exact stratification is infeasible due to co-occurrence, we approximate balance via class-aware sampling in minibatches. For clips with brief harmful events, we optionally partition into a small number of uniform **segments** at inference time and aggregate predictions with an “any-positive” rule per label to improve sensitivity without retraining.

## 3.1.4 Data Analysis Techniques

**Feature learning and fusion.** We precompute AST/VideoMAE features and **freeze** backbones. Each modality passes through a **vanilla transformer encoder** (1–2 layers; hidden size 768) for intra-modality refinement. We then perform audio–visual alignment using a **two-stage cascaded cross-transformer**: bi-directional cross-attention in **Cascade 1**, followed by a second bi-directional cross-attention in **Cascade 2**; each sublayer includes FFN, residual connections, and layer normalization. Final audio/video representations are **concatenated** and fed to the classifier. This cascaded design has been shown to outperform early/late concatenation, element-wise fusion, and single cross-attention alternatives on fine-grained tasks.

**Optimization and validation.** We train the fusion head with **AdamW** (initial **lr = 1e-4**, **weight decay = 1e-5**), **dropout**, and **early stopping**; training for ~**25 epochs** with an effective batch size ≈ 16 (or smaller with gradient accumulation) follows established settings. Given the multi-label objective, we optimize **Binary Cross-Entropy with Logits**; for ablations directly comparable to single-label setups, we also report cross-entropy where appropriate.

**Baselines and ablations.** We include **unimodal** baselines (audio-only; video-only) and **standard fusion** baselines—early/late concatenation and element-wise average/product—to quantify the contribution of the cascaded cross-transformer. We also evaluate a **single cross-transformer** variant to isolate the benefit of the cascaded design.

**Metrics and reporting.** We report **per-label AUROC** and **Average Precision (AP)** with **mAP**, along with **macro-F1** and **accuracy** (for completeness and comparability). Prior work emphasizes Accuracy, Macro-F1, and AUC (class-wise and macro-averaged); we extend these to the multi-label setting while preserving direct comparability where possible.

---
