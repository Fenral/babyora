# Decision log

This log records current product decisions that override older exploratory material.

## 2026-07-13

### Product model

**Decision:** Free solves today at one fixed home location. Plus expands the product to the future, automatic/multiple locations, and family collaboration.

**Reason:** The free product must fully solve the core daily problem. Plus should sell planning, automation, and coordination rather than a deliberately incomplete recommendation.

### User language

**Decision:** Use `plagg` as the primary user-facing concept. The recommendation list communicates dressing order. Layer classifications remain internal to the engine where useful.

**Reason:** `Plagg` is easier to understand than `lag`, while ordered presentation preserves the intuitive layering model.

### Wardrobe and computer vision

**Decision:** Do not make wardrobe registration or photographs of owned clothes a core feature.

**Reason:** High setup and maintenance effort for limited daily value. The product should perform more work than it asks the parent to perform.

### Engine 2.0 scope

**Decision:** Limit the first release and Engine 2.0 v1 to ages 0-24 months. Ages 25-71 are deferred to a later product phase. Treat synthetic materials and blends as valid functional choices, not exceptions. Keep the current engine available while V2 is validated in parallel.

**Reason:** The narrower age scope reduces recommendation, safety, footwear, activity, and avatar complexity while the core product is proven. Material performance, activity, weather protection, age, and situation still matter more than a wool-versus-cotton binary.

### Design system

**Decision:** Keep and refine the existing visual system. Use temperature-reactive backgrounds as a signature on relevant surfaces. Preserve the semantic direction of night/plum foundations, mint actions, peach warmth/editorial emphasis, and restrained motion and haptics.

**Reason:** The app already has a distinctive foundation. Consistency, hierarchy, feedback, and content accuracy create more value than replacing it with a generic system.

### Navigation and premium story

**Decision:** Organize the product around Home, Plan, Guide, and Family as the target information architecture. The final implementation sequence remains governed by the master plan.

**Reason:** This structure maps to now, future preparation, learning/tools, and shared care better than a top-level Settings destination.

### Name

**Decision:** Remove Klarune and Vaerni from the final shortlist. The public name remains open; Babyora is an internal working name only.

**Reason:** Vaerni did not create a natural enough association with clothing when spoken. A new name must pass pronunciation, association, trademark, domain, app-store, and handle gates before approval.

### Avatar scope and production model

**Decision:** Keep the baby as a central identity element. For the 0-24 month first release, use one child identity with two locked poses: sitting for 0-11 months and standing for 12-24 months. The image has no weather, stroller, sleep, or activity context. It shows only the outermost visible clothing and accessories; hidden underlayers remain in the canonical garment list and explanation.

**Decision:** Use the existing Nano Banana Pro soft-3D/clay avatar and sequential edit-chain workflow. Do not build a rigged or runtime-modular 2.5D avatar for v1.

**Decision:** Plan for 24 approved composite images: 12 per pose. Six base warmth states, warm-weather headwear variants, distinct rain/wind shells, and visible strong-wind accessories form the controlled visual matrix. Sixteen images is the technical minimum; 24 is the production target. Exact footwear remains governed by the engine's under-9, 9-15, and 16+ month rules without requiring a third body pose.

**Decision:** Direct image-generation spend is capped at NOK 1,000 for this asset phase. The owner and AI workflow provide art direction, prompting, selection, and QA; no external studio cost is assumed.

**Reason:** The existing avatar already establishes product identity. Restricting the system to two master poses, outermost visible garments, and canonical states avoids combinatorial asset growth while preserving visual truth and premium consistency.

### Logo

**Decision:** Continue with concept A, `Beskyttet kjerne / Protected core`, while keeping it independent of the final name.

**Reason:** The protected center and surrounding arcs communicate the child, care, clothing, weather adaptation, and a broader family assistant without becoming a literal baby illustration.

### Marketing

**Decision:** Prioritize a cost-free, image-first Instagram rollout. Video is optional rather than mandatory. Paid acquisition is not part of the initial plan.

**Reason:** The initial budget is approximately NOK 0-1,000, and the product's clothing/weather advice can be communicated with reusable visual formats before investing in paid media.

### Repository continuity

**Decision:** Store code, plans, decisions, handoffs, and relevant assets in a private GitHub repository. Push at meaningful milestones.

**Reason:** The project must remain recoverable and usable from a laptop or mobile device even if access to a desktop session or chat is lost.

