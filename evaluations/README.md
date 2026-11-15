# Real-label evaluation

**Pending real inputs and results.** The example manifest contains illustrative numbers and nonexistent image paths; it is not a completed evaluation set. Automated mocked tests verify backend behavior but do not measure actual Gemini accuracy.

1. Collect 5–10 owned/permitted images: clear label, rotated label, small text, sodium absent, sodium printed in grams, unreadable label, and a non-label photo. Avoid personal information.
2. Copy [cases.example.json](cases.example.json) to `cases.json`. Add the actual images relative to that manifest. Manually transcribe per-serving expected values, converting sodium grams to milligrams; sodium absent is null. Have a teammate verify the transcription.
3. Use `expected_status=200` and a complete expected object for readable labels; use 422 for unreadable/non-label photos. Provider quota/network errors never count as correct rejections. Define numeric absolute tolerance before running; the default is 0.5 in each field's own units. Add `accepted_names` only for reviewed acceptable aliases.
4. Record the deployed full SHA from `/health`, actual Gemini model setting, date, source/permission for images, expected values, acceptance rules, and reviewer.
5. In a private terminal, set `EVAL_CLERK_TOKEN` to a short-lived Clerk session token from your signed-in **staging** account. Do not put it in a file, command argument, screenshot, or commit. Use a staging backend configured for that frontend origin.
6. With backend dependencies installed, explicitly opt into live calls:

```powershell
python scripts/evaluate_labels.py --manifest evaluations/cases.json --base-url https://YOUR-STAGING-BACKEND --live
```

The runner checks that all paths exist before contacting the endpoint, makes one scan per case, spaces calls by 13 seconds, and never saves a cart. Calls consume provider quota and application allowances. Set staging limits high enough for the planned set without disabling production guards. If the token expires or a provider limit interrupts a run, retain the failure report and rerun only after resolving it.

7. Review the generated `release-evidence/evaluation.json`. Record all failures and decide whether to fix, document, or reject the candidate. Do not loosen tolerances after seeing results merely to pass.
8. Store a reviewed, sanitized manifest/images/results in your chosen evidence location and link them from the release. The generated evidence folder is ignored by Git by default; intentionally publish only permitted, credential-free evidence. Remove the token from the terminal environment when finished.
