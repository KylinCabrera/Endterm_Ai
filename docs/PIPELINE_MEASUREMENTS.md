# Pipeline measurement record

Status: **external measurements pending**. Instrumentation exists; no remote speedup is claimed.

1. After the workflow is available on the default branch, open GitHub Actions → CI Pipeline → Run workflow. Select the same commit/ref for every comparison.
2. Run three times with `cache_mode=uncached`. These disable setup-python/setup-node dependency-cache restore/save on fresh hosted runners.
3. Run once with `cache_mode=cached` to warm caches; exclude this warm-up run. Run three more cached comparisons on the same ref.
4. Download `backend-timings` and `frontend-timings` JSON artifacts. Record run URLs and cache hit/miss from setup-action logs. Record job and whole-workflow durations from Actions as well; timing artifacts measure commands, not checkout/cache-restore/upload overhead.
5. Compare medians. Improvement % = `(uncached_median - cached_median) / uncached_median * 100`. Report regressions too. Hosted-runner and network variance can be substantial.

| Metric | Uncached median (s), 3 runs | Warm cached median (s), 3 runs | Change % |
| --- | --- | --- | --- |
| Backend dependency install | pending | pending | pending |
| Backend tests | pending | pending | pending |
| Frontend dependency install | pending | pending | pending |
| Frontend tests | pending | pending | pending |
| Frontend lint | pending | pending | pending |
| Frontend build | pending | pending | pending |
| Whole workflow excluding deploy | pending | pending | pending |

Record commit, runner image, Python/Node versions, dependency-file hashes, cache hit status, sample run URLs, and dates beside the completed table. Backend and frontend run in parallel, so do not sum their times and call that wall-clock duration. Manual workflow runs never deploy.

This controlled comparison isolates caching in the new workflow. To claim a gain over the original pipeline, separately retain old workflow run timings at the prior revision and explain the different workload: the new workflow also checks the frontend and scans history. Never describe reduced coverage as an optimization.
