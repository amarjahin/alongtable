---
name: publish-pr
description: Publish the current work as a GitHub pull request with a concise title and a short, high-level description. Use when the user asks to open, create, publish, or submit a PR.
---

# Publish a pull request

## Steps

1. Run `git status`, `git log origin/main..HEAD`, and `git diff origin/main...HEAD` to see what the PR will contain. If there are uncommitted changes, ask whether to commit them first.
2. If on `main`, create a feature branch with a short descriptive name (e.g. `supabase-connection`) before pushing.
3. Push the branch: `git push -u origin <branch>`.
4. Open the PR with `gh pr create --base main --title "<title>" --body "<body>"`.
5. Report the PR URL to the user.

## Title

- Concise: one line, ideally under 60 characters.
- Imperative mood, describing the change: "Connect restaurant pages to Supabase", not "Supabase stuff" or "Updated files".
- No trailing period, no prefixes like `feat:` unless the user asks.

## Description

Explain **what is being added** at a high level: what changes for the product, the user, or the team, and why. Keep it short.

- Open with one to three sentences that describe the change in plain language.
- Optionally follow with a few bullets for the main pieces of the change.
- Do not walk through code details: no file-by-file lists, function names, or implementation notes unless a reviewer needs one to understand the change.
- Mention anything a reviewer or teammate must do or decide (e.g. "run `npm install`", "needs a new env var", an open question). Leave this out if there is nothing.

Example:

```
Restaurant owners' published spaces are now saved to Supabase instead of
an in-memory mock, so they persist across restarts and are visible to
everyone.

- Restaurants are matched or created by name and location
- The publish form shows an error if saving fails

After pulling: run `npm install` and copy `.env.example` to `.env.local`.
```
