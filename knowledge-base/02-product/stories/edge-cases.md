# Edge Cases — Product Handling Guide

These are known scenarios that fall outside the happy path. Each entry describes the situation, the expected system behavior, and its priority tier.

**Priority tiers:**
- **P0** — Must handle at MVP launch. Failure is a showstopper (data loss, broken UX, stranded users).
- **P1** — Handle in the first post-MVP iteration. Noticeable friction but not blocking.
- **P2** — Handle before scaling. Low frequency but matters for trust at scale.

---

## EC-01 — Last-minute cancellation (same morning)

**Scenario**: Marie is scheduled as a passenger on Monday. At 7h15 (15 minutes before pickup), she cancels because she is sick.

**Expected behavior**:
- All members of her group receive an immediate push notification: "Marie ne peut pas être là ce matin. Mise à jour de votre trajet."
- The revised plan is shown in the app within 2 minutes: remaining stops, adjusted times.
- If Marie was the driver, the system checks if another group member with a car can take over. If yes, they are notified and asked to confirm within 5 minutes. If no, the day is cancelled and all members are notified.
- Marie's cancellation is logged. Repeated same-morning cancellations (≥3 in a month) trigger a gentle in-app reminder about group etiquette.

**Priority**: P0 — This will happen every week. Failing to handle it gracefully destroys trust on day one.

---

## EC-02 — No match found for a commuter

**Scenario**: Léa declares her Tuesday departure at 13h00 ±15 min. No other commuter in her corridor has declared a compatible window.

**Expected behavior**:
- The group view for that day shows: "Aucune correspondance — trajet solo."
- Léa is added to a "waiting pool" for 13h00 Tuesday slots. When a new user joins with a compatible schedule, she is notified: "Un nouveau voisin avec votre horaire du mardi vient de s'inscrire — vous serez mis en relation dimanche."
- Léa is not penalized or downgraded. Her other matched days are unaffected.
- If she has been unmatched for 3+ consecutive weeks, suggest widening her tolerance window: "Élargir votre fenêtre à ±30 min triplerait vos chances de correspondance."

**Priority**: P0 — A core promise is "we find you a match." The fallback experience must be honest and actionable, not just a blank state.

---

## EC-03 — Driver's car breaks down mid-week

**Scenario**: Thomas is the designated driver for Tuesday through Thursday. On Tuesday evening, his car breaks down. He cannot drive Wednesday or Thursday.

**Expected behavior**:
- Thomas taps "Signaler un problème" → "Ma voiture est indisponible" in the app.
- The system checks if another group member with a car can cover Wednesday and Thursday. If yes, they receive a request notification and can confirm or decline.
- If no backup driver exists in the group, the system broadcasts to nearby solo commuters with compatible schedules: "Un trajet se libère mercredi — intéressé ?" (P1 feature: dynamic re-matching pool).
- At MVP: if no solution found, the affected passengers are notified that those days are solo, with apologies.
- Thomas's breakdown is not counted against him for future driver rotation calculations.

**Priority**: P0 for the notification and graceful degradation. P1 for dynamic re-matching from solo pool.

---

## EC-04 — User changes schedule after matching is done

**Scenario**: Pierre confirms his schedule Friday. The matching runs Sunday at 20h00. Monday at 07h00, Pierre realizes he actually needs to work at 11h00, not 07h30 as declared.

**Expected behavior**:
- Pierre cannot change Sunday's matching run retroactively.
- He can tap "Je ne serai pas disponible ce matin" on the day view — this triggers EC-01 (last-minute cancellation) handling.
- For future weeks: the app prompts him on Friday to update his schedule if this was unexpected.
- The system does not automatically assume next week is the same as the modified week.

**Priority**: P0 for the cancellation path. P1 for the "learn from this and pre-fill better" logic.

---

## EC-05 — New user joins mid-week

**Scenario**: Sophie signs up on Wednesday and completes onboarding. She wants to carpool starting Thursday.

**Expected behavior**:
- Sophie is informed: "Le planning de cette semaine est déjà établi. Vous serez intégré(e) dans les groupes à partir de la semaine prochaine."
- Sophie can still declare her schedule for next week immediately.
- She is added to the matching pool for next Sunday's run.
- She is NOT retroactively inserted into an existing group mid-week (this would break the established pickup plan).

**Priority**: P0 — This will happen constantly. The onboarding flow must set correct expectations from the start.

---

## EC-06 — Only one car owner in a group of 4

**Scenario**: A group of 4 is matched: Marie (has car), Léa (no car), Sophie (no car), Paul (no car). Marie is the sole driver every day.

**Expected behavior**:
- The plan clearly shows Marie drives all days.
- A fuel cost-sharing indicator is displayed: "Marie conduit tous les jours — les passagers contribuent aux frais." (Actual payment is P1, but the note is P0 for transparency).
- A warning is shown to Marie at match time: "Vous êtes la seule conductrice de ce groupe. Êtes-vous d'accord pour conduire tous les jours cette semaine ?"
- Marie can decline, which marks those days as unmatched for the group.

**Priority**: P0 for consent/transparency. P1 for automated payment split.

---

## EC-07 — Group member moves or changes home address

**Scenario**: Thomas moves from Saint-Mars-du-Désert to Treillières, which is on a different corridor.

**Expected behavior**:
- Thomas updates his home location in the app (US-001, AC-001-4).
- The change is flagged as a corridor change. The system informs him: "Votre nouveau domicile est sur le corridor Treillières → Nantes. Vous quitterez votre groupe actuel et rejoindrez un nouveau groupe à partir de la semaine prochaine."
- His current group is notified that Thomas will leave after this week.
- His schedule is preserved; only his corridor assignment changes.

**Priority**: P1 — Rare during MVP, but important to handle gracefully to avoid data inconsistency.

---

## EC-08 — Two group members arrive at work at different destinations

**Scenario**: Marie works at CHU (Hôtel-Dieu) and Thomas works at Euronantes (La Beaujoire). Both are in Nantes but 4 km apart.

**Expected behavior**:
- The algorithm checks if drop-off at two destinations stays within the max detour constraint (10 minutes total added).
- If within constraint: the driver drops off the closer person first, then continues to the second destination. The pickup timeline shows both drop-off points.
- If the detour exceeds the constraint: the two people are not grouped. Each may be matched with people who share their specific destination zone.

**Priority**: P0 — Multi-destination groups are common in a city. The algorithm must handle this explicitly.

---

## EC-09 — User declares a schedule but never confirms it for the actual week

**Scenario**: Marie sets a default schedule during onboarding. She never interacts with the Friday/Sunday confirmation flow. Three weeks pass.

**Expected behavior**:
- Week 1: Her default schedule is used as-is (no confirmation required for the first week).
- Week 2+: If she has the "variable schedule" flag, the system attempts to auto-confirm her last confirmed schedule with a notification. If she has the "fixed schedule" flag, it auto-confirms without prompting.
- After 4 weeks of no interaction: a stronger nudge is sent: "Nous n'avons pas eu de vos nouvelles — votre compte est toujours actif mais vos voisins comptent sur vous. Confirmez votre présence."
- After 8 weeks: her account is soft-deactivated from matching (not deleted) until she logs back in.

**Priority**: P1 — Keeping inactive users in the matching pool wastes matching capacity and may strand their group.

---

## EC-10 — Pickup point is inaccessible (road works, flooding)

**Scenario**: The usual pickup point for Léa's house is on a flooded road on Monday morning. The driver cannot reach it.

**Expected behavior**:
- At MVP: users must coordinate via phone/message (phone numbers shared within the group for exactly this reason). The app does not have real-time road condition data.
- P1: Allow the driver to report a pickup point as temporarily unavailable and suggest an alternate meeting point via in-app message.
- P2: Integrate with Waze/Here Maps alerts to proactively suggest alternate pickup points when disruptions are detected on the corridor.

**Priority**: P0 for contact-info transparency. P1 for in-app alternate point reporting. P2 for automated detection.

---

## EC-11 — Matching produces a group of 2 where both members are passengers (no driver)

**Scenario**: The algorithm clusters Marie and Léa geographically and by schedule. Neither has a car.

**Expected behavior**:
- This group is invalid and must not be created.
- The algorithm must enforce the constraint: `driverCount ≥ 1` per group.
- Both Marie and Léa are added to the unmatched pool and may be combined with other geographic clusters that contain at least one driver.
- If no driver exists in the extended cluster, both are notified they will commute solo that day with a suggestion to invite car-owning neighbors.

**Priority**: P0 — A core algorithmic invariant. Must be enforced at the matching engine level, not just the UI.

---

## EC-12 — User submits two conflicting schedules for the same week

**Scenario**: Léa submits her schedule Friday, then edits it again Saturday, then edits it a third time Sunday before the 18h00 deadline.

**Expected behavior**:
- Each edit fully replaces the previous submission. There is no conflict; only the last save before 18h00 is used for matching.
- The UI clearly shows the current saved state and a timestamp: "Dernière modification : samedi 15h22."
- After the 18h00 Sunday deadline, the edit form is locked with a message: "Délai de modification dépassé — votre plan arrive ce soir."

**Priority**: P0 — Straightforward to implement but must be unambiguous to avoid user confusion.

---

## EC-13 — Matching produces an over-large group (5+ people)

**Scenario**: Six people live within 2 km of each other and all have identical 7h30 schedules. The algorithm naively groups all six together.

**Expected behavior**:
- Group size is capped at 5 (standard car capacity).
- The algorithm splits the six into two groups: e.g. 3+3 or 4+2, prioritizing that each group has at least one driver.
- The split is made to minimize total detour: people closest to each other are grouped.
- Edge case within this edge case: if all 6 declare "I have a car", the split is easy. If only 1 has a car, the algorithm must either find a second driver in an adjacent cluster or leave 1-2 people unmatched.

**Priority**: P0 — A hard constraint baked into the algorithm spec.

---

## EC-14 — User changes their "has a car" status

**Scenario**: Thomas's car is written off after an accident. He updates his profile from "I drive" to "I ride".

**Expected behavior**:
- The change takes effect the following week.
- His current group is notified: "Thomas ne sera plus conducteur la semaine prochaine. Votre groupe sera recomposé si nécessaire."
- If Thomas was the sole driver in his group, the system attempts to find an alternative driver from the extended cluster. If none found, the group may dissolve with appropriate notifications.
- Thomas retains his match history and group membership if a new driver can be found.

**Priority**: P1 — Infrequent, but consequences cascade to the whole group.

---

## EC-15 — Two users declare they do not want to ride together

**Scenario**: After a bad experience, Marie explicitly requests not to be grouped with a specific neighbor (a P1 feature: blocklist).

**Expected behavior**:
- At MVP (P0): no blocklist exists. The only recourse is to contact support or change pickup zone.
- P1: Users can block a specific person from their matching pool. The blocked user is never suggested as a match, and does not see that they have been blocked (they simply aren't matched with that person).
- Blocking is mutual: if Marie blocks Paul, Paul's matching is also unaffected by Marie's presence (no information leak).
- Edge case: if blocking a person makes it impossible for either to be matched (e.g. they are the only two people in a village), both are shown as unmatched with no explanation about the block.

**Priority**: P0 for the policy decision (document what MVP does/doesn't support). P1 for the actual feature.

---

## Summary Table

| ID    | Scenario                          | MVP Behavior           | Priority |
|-------|-----------------------------------|------------------------|----------|
| EC-01 | Last-minute cancellation          | Notify + revised plan  | P0       |
| EC-02 | No match found                    | Waiting pool + tip     | P0       |
| EC-03 | Driver's car breaks down          | Notify + fallback      | P0       |
| EC-04 | Schedule changed post-matching    | Cancel path + no retro | P0       |
| EC-05 | New user joins mid-week           | Next week queue        | P0       |
| EC-06 | Single driver in group            | Consent prompt         | P0       |
| EC-07 | User changes home address         | Corridor reassignment  | P1       |
| EC-08 | Multiple work destinations        | Detour constraint check| P0       |
| EC-09 | User never confirms schedule      | Auto-confirm + nudge   | P1       |
| EC-10 | Pickup point inaccessible         | Phone contact fallback | P0       |
| EC-11 | Group with no driver              | Block group creation   | P0       |
| EC-12 | Multiple schedule edits           | Last save wins         | P0       |
| EC-13 | Over-large group (6+)             | Cap at 5, split        | P0       |
| EC-14 | Driver loses their car            | Notify group, recompose| P1       |
| EC-15 | Users who refuse to share         | Blocklist P1, note P0  | P0/P1    |
