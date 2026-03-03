# MVP User Stories

**Sprint**: MVP Phase 1
**All stories**: P0 — must ship for launch
**Personas**: Marie (52, Ligné, variable schedule, low tech-savvy), Thomas (34, Saint-Mars-du-Désert, regular schedule, family), Léa (28, Carquefou, flexible startup hours, no car, high tech-savvy)

---

## US-001 — Declare my home and work locations

**As** Marie, a rural commuter with a variable schedule,
**I want** to pin my home and work locations on a map,
**So that** the system knows where to pick me up and drop me off.

### Acceptance Criteria

**AC-001-1 — Home location selection**
Given I have opened the app for the first time,
When I reach the "Where do you live?" step,
Then I see a full-screen map centered on the Ligné/Nantes corridor with a search bar,
And I can type my village name or street address to move the map,
And I can drag a pin to confirm my exact home location.

**AC-001-2 — Work location selection**
Given I have confirmed my home location,
When I reach the "Where do you work?" step,
Then I see a map centered on Nantes with a search bar,
And I can type my employer's address or district,
And I can confirm by placing a pin on the correct building or zone.

**AC-001-3 — Corridor validation**
Given I have set both locations,
When the system computes the route,
Then it must confirm my commute falls within a recognized corridor (e.g. Ligné → Nantes),
And if no corridor is detected, it displays a friendly message: "Nous ne couvrons pas encore votre trajet, mais nous vous préviendrons dès que ce corridor sera disponible."

**AC-001-4 — Locations editable after onboarding**
Given I have completed onboarding,
When I navigate to Profile → My Locations,
Then I can edit my home or work location,
And the change takes effect for the next weekly matching cycle (not mid-week).

### Edge Cases

**EC-001-A — Home not on main corridor road**
Marie lives on a farm lane 2 km off the D49. The system must map her home to the nearest corridor pickup point and display: "Votre point de prise en charge sera: [street corner]". She can override this point manually.

**EC-001-B — Work location in an industrial zone with multiple buildings**
Thomas works on a campus with no exact street number. The system must accept a zone-level pin (parking area or main entrance) with a note field: "Any additional directions for your driver."

### Dependencies
- None (this is the entry-point story)

---

## US-002 — Set my weekly commute schedule

**As** Marie, whose departure time varies from 7h30 to 11h30 depending on the day,
**I want** to declare my schedule for each day of the week including my tolerance window,
**So that** the AI can find me matches who share compatible time windows.

### Acceptance Criteria

**AC-002-1 — Day-by-day schedule grid**
Given I am on the schedule declaration screen,
When I view the schedule grid,
Then I see 5 rows (Mon–Fri) each with:
- A toggle to mark the day as a work day
- A departure time picker (15-minute increments)
- A tolerance selector: ±0 / ±15 / ±30 minutes
- A return time picker (optional, used for return-trip matching)

**AC-002-2 — Driver/passenger preference**
Given I am completing my schedule,
When I reach the "How do you commute?" section,
Then I can select one of: "I drive (I have a car)", "I ride (no car)", or "Either works for me",
And if I select "I drive", I must specify the number of seats available (1–4).

**AC-002-3 — Variable schedule flag**
Given Marie ticks "My schedule changes week to week",
When Sunday arrives,
Then she receives a push notification: "Confirmez votre semaine — répondez avant 20h pour recevoir votre plan",
And she can edit each day's times before the matching runs.

**AC-002-4 — Schedule preview before submission**
Given I have filled in all active days,
When I tap "Voir mon résumé",
Then I see a summary card showing each work day, departure window, and role (driver/passenger),
And I can go back and edit before confirming.

### Edge Cases

**EC-002-A — No matching window found at declaration time**
Léa sets her departure at 13h00 ±15 min on Tuesdays. At declaration time, no one else in her corridor has declared a 13h00 slot. The system saves her schedule and informs her: "Aucune correspondance trouvée pour mardi 13h00 pour le moment. Nous vous préviendrons si quelqu'un avec un horaire compatible rejoint le service."

**EC-002-B — All 5 days marked as "OFF"**
Thomas accidentally marks every day as not a work day and tries to submit. The form must block submission and show: "Sélectionnez au moins un jour de travail pour continuer."

### Dependencies
- US-001 must be completed (home/work locations required for schedule to be meaningful)

---

## US-003 — View my matched carpool group for the week

**As** Thomas, who wants to know his carpool companions before Monday morning,
**I want** to see my matched group on Sunday evening,
**So that** I know who I'll be riding with and can plan my week accordingly.

### Acceptance Criteria

**AC-003-1 — Group card with member profiles**
Given the weekly matching has run (Sunday evening),
When I open the app or tap the notification,
Then I see a "Your Group — Week of [date]" card with:
- Group name (auto-generated, e.g. "Ligné Express")
- Each member's first name, profile photo, and home village
- Role this week: Driver or Passenger
- A summary of days I'm matched (e.g. "Matched: Mon, Tue, Thu, Fri")

**AC-003-2 — Weekly overview at a glance**
Given I am on the group view,
When I scroll down,
Then I see a 5-day calendar strip (Mon–Fri) showing each day:
- Green: I am matched (shows driver name and departure time)
- Grey: I am not commuting that day
- Orange: I commute solo that day (no match found)

**AC-003-3 — Member trust signals**
Given a group member is new (fewer than 3 previous trips),
When their profile is shown,
Then a "Nouveau membre" badge is displayed,
And a phone number is shown (with consent) so members can coordinate for the first week.

**AC-003-4 — Notification delivery**
Given the matching run completes before 20h Sunday,
When my plan is ready,
Then I receive a push notification: "Votre plan de covoiturage pour la semaine est prêt 🚗",
And the notification deep-links directly to this group view.

### Edge Cases

**EC-003-A — Not matched at all this week**
Marie submits her schedule but no compatible group exists (e.g. she is the only person declaring 11h00 on Thursday). The screen must show a clear, non-alarming message: "Pas de correspondance cette semaine. Vous conduirez seul(e). On cherche encore des voisins — partagez le lien pour agrandir votre réseau !" with a share button.

**EC-003-B — Group changes between Sunday notification and Monday morning**
A group member cancels their participation after the plan is published but before Monday. The remaining members must receive an updated push notification by 6h00 Monday with the revised plan.

### Dependencies
- US-001, US-002 (location and schedule required to run matching)

---

## US-004 — See the daily pickup plan

**As** Marie, who drives Monday mornings,
**I want** to see the exact pickup order, points, and estimated times for each day,
**So that** I know precisely where to be and when without any guesswork.

### Acceptance Criteria

**AC-004-1 — Day-level pickup timeline**
Given I tap on a specific day in the weekly view (e.g. Monday),
When the day detail screen opens,
Then I see a vertical timeline with:
- Driver name and car model/colour (if provided)
- Each pickup stop: name, pickup point address or landmark, estimated arrival time
- Expected arrival time in Nantes
All times adjusted for real corridor driving time, not straight-line distance.

**AC-004-2 — Map view of pickup route**
Given I am on the day detail screen,
When I tap "Voir sur la carte",
Then a MapLibre map opens showing:
- The full corridor route
- Driver's home as the starting pin
- Each passenger's pickup point as numbered stops
- Estimated duration segments between stops

**AC-004-3 — Driver-specific instructions**
Given I am the driver for the day,
When I view the day detail,
Then I see a "Rappel conducteur" section showing:
- "Départ de chez vous à [time] pour arriver à l'heure"
- Turn-by-turn address for first pickup point
- Total extra distance vs. driving solo: "+X km, +Y min"

**AC-004-4 — Return trip plan**
Given return times were declared,
When I view the return section of the day detail,
Then I see the same pickup/dropoff timeline in reverse (city → countryside),
With estimated departure time from Nantes and arrival times at each drop-off.

### Edge Cases

**EC-004-A — Pickup point is ambiguous (no house number)**
Thomas lives on a hameau with no street number. The pickup point must fall back to the nearest named road intersection, displayed as "Carrefour D49 / Route de Saint-Mars" with a map pin, not a street address.

**EC-004-B — Driver's home is not the furthest from the city**
The algorithm assigns Pierre as driver even though he lives closer to Nantes than Marie. The plan must still be valid: Pierre drives from his home, passes through Marie's pickup point on the way, then continues toward Nantes. The UI must clearly show the route is efficient and explain the driver selection rationale ("Pierre drives this week for fair rotation").

### Dependencies
- US-003 (group must be matched before a day plan can be shown)

---

## US-005 — Confirm or modify next week's schedule

**As** Léa, whose startup hours shift frequently,
**I want** to confirm or update my schedule each Friday for the following week,
**So that** the matching engine has accurate data and I'm not matched on days I won't work.

### Acceptance Criteria

**AC-005-1 — Weekly confirmation prompt**
Given it is Friday after 12h00,
When I open the app,
Then I see a persistent banner: "Confirmez votre semaine prochaine avant dimanche 18h",
And I can tap it to go directly to the schedule editor pre-filled with this week's schedule.

**AC-005-2 — "Same as this week" quick action**
Given my schedule is the same as the current week,
When I tap "Même chose la semaine prochaine",
Then my schedule is confirmed in one tap without editing,
And I see a confirmation toast: "Semaine confirmée — votre plan arrivera dimanche soir."

**AC-005-3 — Day-level modification**
Given I need to change one day (e.g. I won't work next Wednesday),
When I toggle Wednesday off in the editor,
Then only Wednesday is updated; other days remain unchanged,
And the system re-runs matching for the affected day only at the weekly batch.

**AC-005-4 — Deadline enforcement**
Given the confirmation deadline is Sunday 18h00,
When 18h00 passes without confirmation,
Then the system auto-confirms last week's schedule with a notification: "Planning reconduit automatiquement depuis la semaine dernière.",
And I can still edit until Sunday 20h00 (matching runs at 20h00).

### Edge Cases

**EC-005-A — User modifies schedule after matching has already run**
Marie submits a change on Sunday at 21h00, one hour after matching ran. The system must inform her: "Le planning de cette semaine est déjà établi. Votre modification sera prise en compte la semaine suivante." No partial re-match mid-week.

**EC-005-B — User marks every day as OFF for next week (holiday)**
Thomas is on holiday next week and marks all days as OFF. The system must confirm "Semaine OFF enregistrée — bon repos !" and notify his current group members: "Thomas sera absent la semaine prochaine. Votre groupe sera recomposé." before Sunday matching.

### Dependencies
- US-002 (schedule model must exist to be confirmed/modified)
- US-003 (current week's group is shown as context)

---

## US-006 — View the corridor simulation

**As** Léa, who wants to understand the platform's environmental impact,
**As** a local elected official visiting the demo,
**I want** to see a before/after visualization of car traffic on the Ligné → Nantes corridor,
**So that** I can understand and communicate the concrete impact of carpooling adoption.

### Acceptance Criteria

**AC-006-1 — Before/after map toggle**
Given I am on the Simulation page,
When I first load the page,
Then I see an animated map of the Ligné → Nantes corridor showing moving car icons representing the morning rush,
And a toggle switch labeled "Sans covoiturage / Avec covoiturage" is prominently displayed,
And toggling it smoothly transitions the number of cars visible on the road (e.g. 10,000 → 8,000).

**AC-006-2 — Impact metrics panel**
Given the simulation is running,
When I view the right-side panel,
Then I see live-updating counters:
- "Voitures retirées : X"
- "CO2 économisé : X kg/jour"
- "Coût moyen économisé : X €/semaine"
- "Groupes actifs : X"
All numbers derived from the simulation parameters (20% adoption, corridor population data).

**AC-006-3 — Adoption rate slider**
Given I am on the simulation page,
When I drag the adoption rate slider (5% → 50%),
Then the car count and metrics update in real time,
And the map visually reflects the new density of cars.

**AC-006-4 — Shareable simulation state**
Given I have configured the simulation (e.g. 30% adoption),
When I tap "Partager cette simulation",
Then a URL with the current parameters is copied to clipboard,
And loading that URL recreates the exact simulation state.

### Edge Cases

**EC-006-A — Simulation loaded on a slow mobile connection**
The map and car animations are data-heavy. On a 3G connection, the simulation must still load within 5 seconds by rendering a static heatmap fallback instead of animated cars, with a label: "Chargez la version animée sur WiFi."

**EC-006-B — Corridor data not yet loaded**
If OSM corridor data or synthetic population data fails to load, the simulation must display a graceful error state: "Données du corridor non disponibles. Réessayez dans quelques instants." with a retry button, rather than a blank map.

### Dependencies
- Simulation data pipeline must exist (synthetic population + corridor geometry)
- No dependency on US-001 through US-005 (this is a standalone public-facing page)

---

## Story Dependency Map

```
US-001 (Locations)
  └── US-002 (Schedule)
        ├── US-003 (Group view)
        │     └── US-004 (Day detail)
        └── US-005 (Confirm/modify schedule)

US-006 (Simulation) — independent, no user auth required
```

## Definition of Done (All Stories)

- [ ] Acceptance criteria all pass in Playwright e2e tests
- [ ] French locale strings in `i18n/fr.json`
- [ ] Mobile-first layout verified at 375px and 390px viewport widths
- [ ] No loading state lasts longer than 3 seconds on a 4G connection
- [ ] Accessibility: all interactive elements have ARIA labels, minimum contrast ratio 4.5:1
- [ ] Error states are handled gracefully (no blank screens, no raw error messages)
