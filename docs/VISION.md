# Vision — Snudly

> Captured by the Product Planner skill. This file is the product-planning input
> for generating product-vision.md, prd.md, and product-roadmap.md; repository
> precedence in `docs/CLAUDE-START-HERE.md` still governs conflicts. Edit it
> directly and re-run the Product Planner to regenerate downstream documents.

**Created:** 2026-08-19
**Updated:** 2026-08-19

## Founder

- **Name:** Sivert
- **Expertise:** Golf professional and hobbyist vibe coder with limited traditional coding experience
- **Background:** As a parent, I have experienced the recurring debate over whether the baby needs headwear or more warmth around the torso. I am using AI-assisted development to turn that everyday uncertainty into a practical product for other parents.

## Purpose

- **Who you help:** Scandinavian parents of children aged 0–24 months, with dads as the primary audience, who want a clear answer before dressing their baby for the weather and activity. The initial launch focuses on first-time Norwegian dads before localized expansion to Sweden and Denmark.
- **Problem you solve:** Parents receive different opinions about what the baby should wear, turning a frequent everyday decision into uncertainty and debate. Temperature alone does not account for wind, precipitation, age, activity, stroller use, baby carrier use, indoor sleep, or car-seat safety.
- **Desired transformation:** Parents move from debating and second-guessing every layer to receiving one clear, weather-aware and safety-bounded recommendation that makes the decision easy.
- **Why you:** I face this decision with my own children, so I understand the uncertainty and what useful guidance should feel like.

## Product

- **Name:** Snudly
- **One-liner:** Snudly tells parents what their baby should wear today.
- **How it works:** A parent opens the app, which uses their location and live weather from met.no. They choose the child's age and activity, such as stroller, baby carrier, outdoor play, or indoor sleep. Snudly applies its clothing rules and non-overridable safety guardrails, then presents a numbered outfit in dressing order with short explanations and suitable substitutions.
- **Key capabilities:**
  - Weather-, age-, and activity-aware outfit recommendations
  - Non-overridable safety rules with credible sources
  - Today, tomorrow, and weekly planning focused on meaningful weather changes
  - Multiple child profiles and shared recommendations for caregivers
  - Wardrobe substitutions and child-specific calibration within safety limits
- **Platform:** mobile
- **Market differentiation:** Unlike generic weather tools and baby-outfit apps, Snudly combines Nordic met.no data, the child's age and activity, explicit country-reviewed safety overrides, and a single outfit shown in dressing order. Its dad-first positioning and calm Scandinavian localization are designed to end the debate rather than expose more data.
- **Magic moment:** A dad taps “Finn dagens antrekk” and, within seconds, receives one numbered list of layers for the exact child, activity, and weather. The discussion stops because the family now has a concrete answer and a short explanation they can trust.

## Audience

- **Primary user:** Martin is a first-time Norwegian dad entering his baby's first cold or wet season. He is often getting the child ready for daycare, a stroller walk, or errands and wants a quick, credible answer instead of debating individual layers with his partner. Equivalent Swedish and Danish personas follow after Norway validates the core behavior.
- **Secondary users:**
  - Mothers and co-parents who want the same clear recommendation
  - Grandparents and other family members who occasionally care for the child
  - Daycare staff, nannies, and other caregivers coordinating what the child should wear
- **Current alternatives:** Parents ask their partner, grandparents, or daycare staff, debate the answer, and then feel the baby's neck or chest afterward to learn whether the choice was right.
- **Frustrations:** Different people give different answers. Parents want one clear answer that reduces doubt and makes the clothing decision easier to take.

## Business

- **Revenue model:** subscription
- **90-day goal:** Validate Norway first, then reach 500 active families, 100 paying subscribers, and a 20% trial-to-paid conversion rate after launching with a seven-day free trial and monthly or annual plans.
- **6-month vision:** Reach 10,000 monthly active families and 2,000 paying subscribers, expand from Norway into localized Swedish and Danish releases, ship both iOS and Android versions, and establish partnerships with relevant parenting or childcare organizations.
- **Constraints:** Safety and trust govern the product. Recommendations need country-specific credible sources, external review in Norway, Sweden, and Denmark, careful testing with real families, explicit boundaries around medical advice, and safety rules that user preferences cannot override. Technical implementation is agent-led because the founder is a hobbyist vibe coder rather than a traditional software engineer.
- **Go-to-market:** Launch with first-time Norwegian dads, combining dad-first organic content built around familiar clothing debates, trusted partnerships with parenting and childcare organizations, and a TestFlight ambassador program with referrals. Validate Sweden and Denmark separately before scaling; begin targeted App Store and social advertising only after trial conversion is proven.

## Brand Voice

- **Personality:** A calm, warm, practical companion who understands tired parents. Reassuring and quietly confident, never clinical, alarmist, or patronizing.
- **Tone of voice:** Concrete, sensory, and concise Norwegian language. Say “Det biter litt i ørene — votter er en god idé” instead of presenting raw wind-chill data. Example success: “Dagens antrekk er klart — fire lag, innerst først.” Example error: “Vi fikk ikke hentet været akkurat nå. Prøv igjen om et øyeblikk.”

> Visual identity (mood, anti-patterns, design tokens) is deliberately not
> captured here — it lives in docs/design.md, generated by the Design System
> skill from image references.

## Tech Stack

- **App type:** mobile
- **Frontend:** React, TypeScript, Vite, and Capacitor — preserves the existing shared web codebase while producing native iOS and Android apps
- **Backend:** Vercel Edge Functions with Supabase for planned shared features — the existing weather proxy satisfies met.no requirements, while Supabase can support family sync and scheduled services
- **Database:** On-device storage for the launch experience, with Supabase PostgreSQL planned for shared child profiles, device tokens, and subscription state
- **Auth:** Supabase Auth, planned for family sharing — the core single-device recommendation works without sign-in, while shared caregiver access will require Apple or Google authentication
- **Payments:** RevenueCat — provides one subscription entitlement layer across Apple and Google billing
- **Analytics:** PostHog — already integrated for privacy-controlled product analytics and launch conversion measurement
- **Email:** None — the launch product has no email flow; add a service only when authentication or lifecycle messaging requires it
- **Error tracking:** Sentry — capture production crashes and failures before users report them

## Tooling

- **Coding agent:** other: Codex
