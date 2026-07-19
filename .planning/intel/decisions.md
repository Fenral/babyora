# Decisions

## 2026-07-19: Planlegg locked to Dagslinjen
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Planlegg is one calm, continuous planning instrument rather than a card dashboard. It has one vertical main scroll, a visible title and compact child/place context, one I dag/Uke/Snart control, one dominant answer, and a semantic timeline containing only real recommendation changes. Only the selected marker expands, with one verb-led action, up to three garments, and Se hele antrekket when needed; complete weather detail is secondary. Coverage claims require supporting hourly data, add/remove actions remain distinct, future rows open their exact context, controls must perform real actions, and accessibility includes one main landmark, focus-visible, 44-point targets, verified contrast, restrained haptics, and immediate reduced-motion behavior.
- scope: Planlegg, Dagslinjen, planning truth, navigation, accessibility

## 2026-07-19: Antrekkskart replaces the partial Outfit orbit
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Outfit detail uses a scalable Antrekkskart with the child centered. Every recommended garment remains visible as a numbered inner-to-outer node connected to its body area; five to ten garments use two compact rows without +N or hidden garments. Node and list selection cross-highlight, meaning does not rely on color, the avatar shows only verified visible outer garments and accessories, hidden layers remain in the map and ordered list, and alternative actions appear only when a real alternative exists.
- scope: Outfit detail, Antrekkskart, garment order, avatar truth

## 2026-07-15: Risk-based plan-to-code governance
- source: docs/DECISION-LOG.md
- status: proposed
- decision: docs/PROSESS-PLAN-TIL-KODE.md is the governing process. Controls scale through light, standard, and high-risk lanes; high-risk safety, RLS/auth, payment, migration, PII, and production activation keep independent two-key verification. Every PASS binds to an immutable candidate SHA, post-failure reverification scales with impact, automatic escalation applies, and the older uniform verification protocol is subordinate.
- scope: delivery process, risk lanes, independent verification

## 2026-07-15: Retain provisioned 39/99/299 pricing
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Retain the provisioned no.klemeg.app.monthly, no.klemeg.app.quarterly, and no.klemeg.app.yearly products at 39/99/299. Remove the babyora_* 49/299/499 proposal and the Barnetiden lifetime purchase. Quarterly remains defined at 99 per three months but is not shown in the paywall; the displayed order is annual plus monthly and the savings badge is 36 percent.
- scope: App Store products, RevenueCat, pricing, paywall

## 2026-07-15: Babyora is the final public name
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Babyora is the final public name and the naming gate is closed. Vaerni, Klarune, and Uteklar are rejected. Formal trademark, domain, App Store name, and handle checks remain recommended before submission but do not block current work.
- scope: product naming, submission readiness

## 2026-07-15: Launch v1 on the contained legacy engine with guidance disclaimer
- source: docs/DECISION-LOG.md
- status: proposed
- decision: v1 launches on the contained legacy engine with an advisory disclaimer and does not wait for external professional sign-off. Professional sign-off remains mandatory for Motor V2 activation and the R8 avatar manifest; the disclaimer cannot activate V2. Disclaimer copy has one source in src/lib/copy/disclaimer.ts, appears briefly on Home and fully in onboarding/settings/legal, frames the output as guidance, and preserves the documented residual-risk position.
- scope: v1 release, recommendation engine, safety, disclaimer

## 2026-07-15: Verified avatar composites completed
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Twenty-four verified composites exist in public/avatars/verified, split into twelve standing and twelve sitting assets. They use the locked f79-poc identity, garment-clay references, Gemini gemini-3-pro-image, and rembg alpha extraction. Shell variants show only outer garments and the actual blue rain/wind shell colors. Mapping APPROVED_COMPOSITES to AvatarStateKey remains for Motor V2 activation; Home retains its neutral silhouette until then.
- scope: avatar production, verified assets, Motor V2 integration

## 2026-07-15: Paywall promises only deliverable Plus capabilities
- source: docs/DECISION-LOG.md
- status: proposed
- decision: PlusExpansionPreview shows one 500-700 ms Free-to-Plus expansion and resolves instantly under reduced motion. PLUS_FEATURE_AVAILABILITY is the claim source: future_plan, automatic_location, and extra_children are enabled; family_sharing and personal_calibration are disabled and cannot appear until implemented and explicitly enabled. A test guards the mapping.
- scope: paywall, Plus capability truth, feature flags

## 2026-07-15: Care Circle is a development-only preview
- source: docs/DECISION-LOG.md
- status: proposed
- decision: CareCircle is available only behind import.meta.env.DEV with static example data, is absent from production, and is captioned as inactive and forthcoming. Solid and dashed links mean sharing and pending invitation; language must not imply presence, location, or tracking. The SVG cluster is decorative and an accessible role list carries the information.
- scope: Family, Care Circle, development preview, accessibility

## 2026-07-15: First recommendation precedes any paywall
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Remove the onboarding paywall teaser. Welcome enters the app so the first real Home recommendation is shown before any paywall; Plus is introduced contextually through in-app triggers rather than before value is delivered.
- scope: onboarding, first value, contextual paywall

## 2026-07-14: North-Star direction B, Scenen
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Direction B, Scenen, is the North Star: the avatar sits in Home's temperature-reactive atmosphere, visible outer garments are quiet orbital anchors, one dominant serif answer leads, and precision appears as a small glass chip. Direction C contributes the outfit-list anatomy; direction A remains a fallback if avatar quality cannot support B.
- scope: visual direction, Home, avatar, Outfit

## 2026-07-14: Five-parent preproduction gate waived
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The five-parent comprehension test is not a prerequisite for R7 production UI. Direction B proceeds directly, while five-second comprehension remains internal R7 evidence and a simplified pre-release user check is recommended rather than mandatory. External professional sign-off for Motor V2 activation remains unchanged.
- scope: design verification, R7, release evidence

## 2026-07-14: Avatar hard spend cap removed
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The earlier hard NOK 1,000 image-generation cap is revoked. A concrete cost plan is presented before asset production or another cost-driving phase, and owner approval is required before large sums. Autonomous spend is at most NOK 100 and declared; higher spend needs explicit approval. The 24-image target and 16-image minimum remain.
- scope: avatar production, spending approval

## 2026-07-14: R8 avatar cost plan approved
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The approved plan uses Nano Banana Pro sequential edits, targets 24 composites with a minimum of 16, defaults to 2K mobile output, and uses 4K only for a documented surface need. Expected spend is NOK 150-500 with warning before unexpected escalation and tariff verification before the batch. Manual QA covers identity, anatomy, garment/material/accessory truth, alpha, shadow, crop, and recommendation fingerprint; when an asset is missing, the garment list is authoritative.
- scope: R8, avatar budget, asset QA

## 2026-07-13: Free and Plus product model
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Free solves today at one fixed home location. Plus expands to future planning, automatic or multiple locations, and family collaboration.
- scope: product boundary, Free, Plus

## 2026-07-13: Plagg is the user-facing term
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Use plagg as the primary user-facing concept. Recommendation order communicates dressing order; layer classifications remain internal where useful.
- scope: terminology, garment recommendations

## 2026-07-13: Wardrobe registration and clothing photos are not core
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Do not make wardrobe registration or photographs of owned clothes a core feature.
- scope: wardrobe, computer vision, product scope

## 2026-07-13: Engine 2.0 v1 covers ages 0-24 months
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The first release and Engine 2.0 v1 cover ages 0-24 months; ages 25-71 months are deferred. Synthetic materials and blends are normal functional choices, and the current engine remains available while V2 is validated in parallel.
- scope: recommendation engine, age scope, materials

## 2026-07-13: Retain and refine the design system
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Refine rather than replace the existing visual system. Use temperature-reactive backgrounds on relevant surfaces and preserve night/plum foundations, mint actions, peach warmth/editorial emphasis, and restrained motion and haptics.
- scope: design system, visual identity

## 2026-07-13: Target navigation is Home, Plan, Guide, and Family
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Organize the target information architecture around Home, Plan, Guide, and Family; the master plan governs implementation sequence.
- scope: navigation, information architecture

## 2026-07-13: Historical open-name decision, superseded
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The historical decision removed Klarune and Vaerni from the shortlist while leaving the public name open and Babyora internal-only. The same source explicitly supersedes this with the 2026-07-15 final Babyora decision.
- scope: product naming, historical decision

## 2026-07-13: Avatar identity and two-pose model
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Keep one central child identity with a sitting pose for ages 0-11 months and a standing pose for ages 12-24 months. Assets contain no weather, stroller, sleep, or activity scene and show only visible outer garments and accessories; hidden layers remain in the canonical list and explanation.
- scope: avatar, age poses, visual truth

## 2026-07-13: Avatar rendering workflow
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Use the existing Nano Banana Pro soft-3D/clay avatar and sequential edit-chain workflow; do not build a rigged or runtime-modular 2.5D avatar for v1.
- scope: avatar production method, v1

## 2026-07-13: Avatar visual matrix
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Plan 24 composites, twelve per pose, using six warmth states plus warm-weather headwear, rain/wind shells, and strong-wind accessories. Sixteen is the technical minimum and 24 the target. Footwear follows the under-9, 9-15, and 16-plus-month rules without a third pose.
- scope: avatar asset matrix, footwear, age poses

## 2026-07-13: Historical NOK 1,000 avatar cap, superseded
- source: docs/DECISION-LOG.md
- status: proposed
- decision: The historical decision capped direct image-generation spend at NOK 1,000 and assumed owner/AI art direction without an external studio. The same source explicitly supersedes the hard cap with its 2026-07-14 cost-approval rule.
- scope: avatar spending, historical decision

## 2026-07-13: Protected Core logo direction
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Continue concept A, Beskyttet kjerne / Protected Core, independently of the final name.
- scope: logo, brand

## 2026-07-13: Image-first organic marketing
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Prioritize a cost-free, image-first Instagram rollout. Video is optional and paid acquisition is outside the initial plan.
- scope: marketing, acquisition

## 2026-07-13: Private GitHub repository continuity
- source: docs/DECISION-LOG.md
- status: proposed
- decision: Store code, plans, decisions, handoffs, and relevant assets in a private GitHub repository and push at meaningful milestones.
- scope: repository, continuity, synchronization
