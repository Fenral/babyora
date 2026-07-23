# Deferred Items

## 01-06

- Fresh `npm ci` reported 14 dependency-audit findings (1 low, 3 moderate, 9 high, 1 critical). Package changes are prohibited by Plan 01-06 and the findings pre-date this plan, so dependency triage remains a separate package-maintenance task.

## 01-07

- The four-root shell check observed that the pre-existing Hjem screen can temporarily expose its own nested `<main>` inside App's `<main>`. Planlegg itself retains exactly one main/vertical-scroll owner; changing Hjem is outside Plan 01-07 and remains a separate shell-semantics task.
