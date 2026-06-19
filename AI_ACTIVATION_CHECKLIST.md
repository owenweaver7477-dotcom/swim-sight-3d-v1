# Swim Sight 3D AI Activation Checklist

Use this checklist before changing AI infrastructure or production flags.

## Before Enabling AI Quality Flags

- [ ] Collect permissioned real swim clips.
- [ ] Keep clips local and out of git.
- [ ] Run `scripts/compare_upgrade_flags.py` in the AI worker repository.
- [ ] Review pose detection rate and visible keypoint coverage.
- [ ] Review manual-review fallback rate.
- [ ] Review every generated finding against the video.
- [ ] Record false positives and missed coach-observed faults.
- [ ] Confirm callbacks and logs contain no private URLs, paths, or profile data.
- [ ] Enable only one flag at a time in staging.
- [ ] Keep a flag only when labelled evidence improves.

## Before Enabling Redis Durability

- [ ] A private, access-controlled Redis instance exists.
- [ ] Encrypted Redis connectivity is available to the staging worker.
- [ ] `REDIS_URL` is configured in staging only.
- [ ] A worker restart during a real job successfully reclaims the pending job.
- [ ] Duplicate job processing is prevented or safely idempotent.
- [ ] Failed-job recovery and expired-link behavior are verified.
- [ ] No signed URL, Redis URL, or credential appears in logs.
- [ ] Production remains on direct processing until all staging checks pass.

## Before a Custom Underwater Model

- [ ] Permissioned labelled frames exist.
- [ ] Annotation rules are documented.
- [ ] Training, validation, and holdout splits exist.
- [ ] Swimmers do not leak between evaluation splits.
- [ ] The model beats the MediaPipe baseline on unseen clips.
- [ ] Processing cost and fallback rate remain acceptable.
- [ ] Manual Coach Studio review remains available.

## Before Calibration or Refraction Correction

- [ ] The camera, lens, housing, and mounting position are known.
- [ ] A calibration board or known pool geometry is measured.
- [ ] A repeatable camera profile is created.
- [ ] Validation footage with known reference points is captured.
- [ ] Reprojection error is measured before athlete analysis.
- [ ] No generic correction is applied using guessed housing values.

## Before Multi-Camera Reconstruction

- [ ] Video feeds are synchronized and drift is measured.
- [ ] Every camera has a calibration profile.
- [ ] Cross-view keypoint correspondence is tested.
- [ ] Triangulation confidence is recorded.
- [ ] Reprojection error is reviewed and low-quality points are rejected.
- [ ] Outputs remain internal until coach and technical validation are complete.

## Before GPU Workers or Autoscaling

- [ ] Queue depth and concurrent-job demand justify added infrastructure.
- [ ] Processing time demonstrates a material GPU benefit.
- [ ] Cost per review and monthly budget are known.
- [ ] Spend alerts and scaling limits are configured.
- [ ] A CPU/manual-review fallback path exists.
- [ ] Rollback has been tested.

## Production Safety Defaults

Keep these values until their checklist is complete:

```text
ENABLE_DURABLE_QUEUE=false
ENABLE_CLAHE=false
ENABLE_POSE_SMOOTHING=false
ROBUST_FINDINGS=false
SEQUENTIAL_FRAME_READ=false
ENABLE_ESTIMATED_DRAG=false
POSE_MODEL_COMPLEXITY=0
```
