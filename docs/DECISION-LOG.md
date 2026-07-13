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

**Decision:** Plan outdoor recommendations for ages 0-71 months. Treat synthetic materials and blends as valid functional choices, not exceptions. Keep the current engine available while V2 is validated in parallel.

**Reason:** Material performance, activity, weather protection, age, and situation matter more than a wool-versus-cotton binary. Expanding age support safely requires explicit contracts, scenario testing, shadow comparison, and controlled activation.

### Design system

**Decision:** Keep and refine the existing visual system. Use temperature-reactive backgrounds as a signature on relevant surfaces. Preserve the semantic direction of night/plum foundations, mint actions, peach warmth/editorial emphasis, and restrained motion and haptics.

**Reason:** The app already has a distinctive foundation. Consistency, hierarchy, feedback, and content accuracy create more value than replacing it with a generic system.

### Navigation and premium story

**Decision:** Organize the product around Home, Plan, Guide, and Family as the target information architecture. The final implementation sequence remains governed by the master plan.

**Reason:** This structure maps to now, future preparation, learning/tools, and shared care better than a top-level Settings destination.

### Name

**Decision:** Remove Klarune from the final shortlist. Use **Vaerni** as the current working finalist, not as a legally cleared public name.

**Reason:** Vaerni better combines subtle weather/protection associations, Nordic character, international expansion, and product breadth. Risks remain around pronunciation, spelling, and an existing Swedish performing-arts use; those risks require validation.

### Logo

**Decision:** Continue with concept A, `Beskyttet kjerne / Protected core`, while keeping it independent of the final name.

**Reason:** The protected center and surrounding arcs communicate the child, care, clothing, weather adaptation, and a broader family assistant without becoming a literal baby illustration.

### Marketing

**Decision:** Prioritize a cost-free, image-first Instagram rollout. Video is optional rather than mandatory. Paid acquisition is not part of the initial plan.

**Reason:** The initial budget is approximately NOK 0-1,000, and the product's clothing/weather advice can be communicated with reusable visual formats before investing in paid media.

### Repository continuity

**Decision:** Store code, plans, decisions, handoffs, and relevant assets in a private GitHub repository. Push at meaningful milestones.

**Reason:** The project must remain recoverable and usable from a laptop or mobile device even if access to a desktop session or chat is lost.

