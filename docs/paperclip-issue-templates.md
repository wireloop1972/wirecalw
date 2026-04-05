# Paperclip Issue Templates

Standard issue templates for Paperclip automation. These templates ensure
consistent formatting when routines create or update issues.

See `docs/paperclip-routines.md` for the routines that use these templates.

---

## Template A — Daily Brief

```markdown
# Daily Brief — {{date}}

## Priorities
-

## Flags
-

## Staffing
-

## Guest / booking matters
-

## Finance / admin
-

## Recommended actions
-
```

**Used by:** Morning Briefing routine (daily, 07:30)
**Owner:** Portier Poe
**Model:** Mistral Small 4 (triage) + Mistral Large 3 (narrative)

---

## Template B — Weekly Review

```markdown
# Weekly Ops Review — Week {{week_number}}

## What happened
-

## Open concerns
-

## Staffing vs occupancy
-

## Financial / admin notes
-

## Next actions
-
```

**Used by:** Weekly Ops Review routine (Monday, 08:00)
**Owner:** Portier Poe
**Model:** Mistral Small 4 (first pass) + Mistral Large 3 (synthesis)

---

## Template C — Analytics Request

```markdown
# Analytics Task — {{title}}

## Question
-

## Data sources
- BookVisit
- Planday
- Tripletex
- Supabase

## Deliverable
- SQL / script / report / recommendation

## Owner
- Devstral
```

**Used by:** Data / Analytics Build Tasks routine (on-demand)
**Owner:** Devstral
**Model:** Devstral 2 (`mistral/devstral-2`)
