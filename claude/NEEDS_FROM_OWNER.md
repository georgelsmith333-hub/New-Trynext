# What Claude needs from the owner (one list, answer once)

How to answer: write your answer after each `ANSWER:` line, or write the same
numbers in a new file `claude/reports.md`. Short answers are fine ("yes", "no",
"approve"). Push it to GitHub and Claude will pick it up and work from it.

**Never paste passwords, tokens, API keys, payment numbers or customer
personal details.** Names of services only.

## A. Decisions only you can make

1. **Water bottle print area.** The code now uses the measured zones (front
   x382 y313 w233 h576, back x391 y313 w218 h576). Customers still cannot order
   bottles (the safety block is on). Do you approve these zones after looking at
   the bottle in the Design Studio?
   - approve / change (say what to move) / not yet
   - ANSWER:

2. **Side views of the products (94 surfaces): left sleeve, right sleeve, neck
   label, mug wrap.** They are marked `candidate` because the Photopea proof for
   them is not saved in the repo. Pick one:
   - (a) I paste the validator report (hash list) from Admin > Mockups here, or
   - (b) I tell Claude in writing "the operator-reported 188/188 Photopea pass
     is accepted as the proof; mark the 94 as accepted" (Claude will record it as
     owner-accepted, operator-reported, not as an independent re-test), or
   - (c) leave them as candidate for now.
   - ANSWER:

3. **Order of work for the rest of the backlog.** Put your top 3, most
   important first: catalog data, Design Studio, checkout and orders, admin
   panel, speed, security, mobile app.
   - ANSWER:

4. **Permission to keep merging.** May Claude keep merging its own pull
   requests to `main` after all checks are green (this deploys the site)?
   - yes / no, ask me each time
   - ANSWER:

5. **Permission for data repairs.** May Claude ever change live product data
   or settings? Default is NO (code changes only).
   - no / yes, only with a dry run and my OK each time
   - ANSWER:

## B. Information Claude cannot see

6. **Real errors.** Paste the last 7 days of errors from Admin > Activity Log
   and the error lines from the Render logs, with names, phones, addresses and
   tokens removed. Or write "no errors seen".
   - ANSWER:

7. **Live site access.** This workspace cannot open `trynext.shop` or
   `*.pages.dev` (blocked by network settings). Either allow those two hosts in
   the environment network settings (then start a new session), or say that you
   will run `node scripts/verify-critical-flows.mjs` yourself and paste the result.
   - ANSWER:

8. **What is for sale today.** How many products are live, which families
   (T-shirt, long sleeve, hoodie, mug, cap, water bottle) are on sale, and
   anything that must be hidden or removed.
   - ANSWER:

9. **Rules to keep.** Confirm: COD advance is still 25%, and payment and
   contact numbers stay in Admin settings (do not write the numbers here).
   - ANSWER:

10. **Services in use.** Names only: which of these are on in production: AI
    provider, email/SMS/WhatsApp notifications, Redis cache, courier.
    - ANSWER:

## C. Housekeeping

11. **Old branch.** `claude/nice-carson-nxjq7q` still holds old commits that are
    already merged. May Claude delete that remote branch and use fresh branch
    names from `main`? yes / no
    - ANSWER:

12. **Hourly checker.** A timer checks every hour for `claude/reports.md`. Keep
    it, or stop it after you push your answers? keep / stop
    - ANSWER:

## What Claude will do as soon as you answer

- Item 1 approved: regenerate the bottle files with proof images, run all checks,
  merge, leave the order block until you say release.
- Item 2 (a) or (b): record it, mark the 94 surfaces accepted, run the full
  release check, merge.
- Items 3 and 4: start the first backlog section as small, tested pull requests.
- Item 6: fix every error that can be reproduced, with tests.
