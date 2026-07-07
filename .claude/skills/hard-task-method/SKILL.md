---
name: hard-task-method
description: Working method for hard, ambiguous, or multi-step tasks — how to decompose them, verify the work is actually correct, and choose the next action. Use at the start of any task that needs more than a couple of steps, when a request is vague, or when deciding whether to proceed, ask, or stop.
---

# Hard Task Method

Three loops, run continuously: decompose → verify → decide next. None of them is a phase you finish; each result feeds back into the others.

## 1. Decomposing hard tasks

**Ground in reality before designing.** Read the repo, the files, the actual state of things before proposing a plan. A design produced from the request alone will be confidently wrong about specifics (names, dates, what already exists). Ten minutes of exploration beats an hour of rework.

**Convert vague asks into a concrete deliverable.** "Set up X" or "make a team for Y" has no done-state. Decide what artifact would satisfy it — files, a doc, a working render — state that interpretation in one sentence, and build it. If the interpretation is genuinely risky, say which part is assumed and invite correction *in the deliverable itself*, rather than blocking on a question.

**Slice by dependency and risk, not by category.** Order steps so the first ones can invalidate the plan cheaply:
- Do the feasibility check before the dependent work (can I reach this API? does a Japanese font exist here?) — never build three steps on an unverified capability.
- Prefer the smallest unit that produces a *checkable artifact* over a "phase" that produces nothing inspectable.
- When a task has independent strands, run them in parallel; when one strand's output shapes another, force the sequence and don't guess the output in advance.

**Externalize state.** Track progress in files (status columns, checklists, drafts with a 状態/status header), not in memory. Anyone — including a future session with no context — should be able to see what's done, what's blocked, and why.

**Separate roles when quality matters.** Maker and checker should be different passes with different instructions (or different agents). The maker optimizes for output; the checker needs a mandate to find problems, a checklist, and no authority to silently rewrite.

## 2. Verifying your own work

**Verify against a source of truth, not against your intent.** "Matches what I meant to write" is not verification. Find the authoritative artifact — the spec, the existing page, the schema, the dates in the actual HTML — and diff against that. If no source of truth exists for a claim (a price, a count, a location), don't let the claim ship as fact: mark it as placeholder/assumption explicitly.

**Look at the actual output.** Render the image and read it. Run the command and read stderr. Open the file the tool said it wrote. Most defects are visible on one honest look at the artifact (text overflowing a footer, a label stretched full-width) and invisible in the code that produced it. "The script exited 0" is not looking.

**Check the boring invariants, every time.** Dates against a calendar, file counts against the plan, links against the tree, ordering when two lists must correspond (a sorted download list vs. an unsorted reference list is a classic silent corruption — catch it before writing, not after).

**When a check fails, fix the smallest true cause, then re-verify that specific thing.** Don't rebuild the world; don't assume the fix worked either. One failure often masks a second — after fixing slide 6, still look at slides 2–5.

**Report verification honestly.** "Done and verified" only when you looked. If a step was skipped or a check couldn't run, say so plainly — a caveat in the report is cheap; a false "it works" is expensive.

## 3. Deciding what to do next

After every result, ask: **did this change the plan?** Three answers:
- *No* → proceed to the next planned step without re-litigating.
- *Yes, locally* → adjust the step, keep the goal (e.g., a blocked fetch means "infer from names and label it as inference," not "abandon the task").
- *Yes, fundamentally* → surface it to the user; new information that changes scope is their decision, not yours.

**Distinguish decisions from questions.** When the user has decided ("change direction to X"), implement it. When they're asking ("what about X?" / "how would X work?"), the deliverable is your assessment — give it, and only implement if the surrounding context shows the decision is already made. When they endorse ("sounds good"), that converts the assessment into a decision.

**When blocked on information only the user has:** package the question with enough context to answer cold, park *only* the dependent piece (marked visibly as waiting, with what's needed to unblock), and keep moving on everything else. A missing salon price blocks one draft, not the week's work.

**Prefer acting to asking** for anything reversible that follows from the request. Reserve questions for destructive actions and genuine scope changes. Never end a turn on a promise ("I'll now...") — do the thing, or state the concrete blocker.

**Stop conditions.** A task is done when the deliverable exists *and* was verified, and the user knows the outcome, the assumptions, and their next move. It is legitimately paused only when the next step needs input that only the user can give — and the pause itself should say exactly what's needed.

**Lead with the outcome.** The first sentence of any report answers "what happened." Findings before process, conclusions before caveats, and next options as concrete offers ("I can do A or B next"), not open-ended questions.
