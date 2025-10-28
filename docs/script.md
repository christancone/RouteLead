Here’s a tight **~1.5-minute** script keeping the same flow.

**[00:00–00:10 | MOTIVATION]**
“We’re building a resource-efficient audio–visual safety detector for short videos. Visual-only systems miss brief or audio-driven harm, so we combine sound + vision with an open-source stack that runs on consumer hardware.”

**[00:10–00:20 | BACKGROUND]**
“Short-form video is booming, moderation is hard, and our constraint is a **4 GB GPU** with privacy-friendly, reproducible tools.”

**[00:20–00:35 | LITERATURE]**
“Prior work shows audio complements vision and cross-modal transformers help alignment. We therefore use **AST** for audio and **VideoMAE** for video—both open models that yield compact, informative embeddings.”

**[00:35–00:50 | APPROACH]**
“Our strategy is two-phase: first, **precompute and cache** embeddings; second, train only a **small head**—light refiners, cross-attention fusion, and a compact classifier—so training fits 4 GB.”

**[00:50–01:00 | DATA & SAMPLING]**
“We collect clips **<60 s**, label them **Safe, Sexual, Violent, Suicide** (multi-label), and use **5-fold cross-validation** with class-aware batching.”

**[01:00–01:15 | PREPROCESS & FEATURES]**
“We sample **16 frames** per clip; convert audio to **16 kHz log-mel**; then extract **768-d** embeddings from VideoMAE and AST. Backbones are **frozen** to save memory and time.”

**[01:15–01:30 | MODELING & TRAINING]**
“We apply **intra-modality refinement** with tiny MLP adapters, then **two-stage bi-directional cross-attention** so audio and video inform each other. We concatenate and classify with `1536→120→4` using **BCEWithLogits**, training with **mixed precision**, **gradient accumulation**, and **early stopping**.”

**[01:30–01:40 | EVALUATION]**
“We report per-label **AP/AUROC**, **mAP**, and **macro-F1**, compare to audio-only, video-only, and simple fusion baselines, and ablate single vs cascaded cross-attention. Optional **early-exit** speeds inference.”

**[01:40–01:45 | CLOSE]**
“Result: a practical, reproducible AV detector that’s accurate and **4 GB-friendly**.”
