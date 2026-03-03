# Design — UI/UX & Branding

## Brand Identity

### Name: Covoiturage (working title)
Consider: **Trajet**, **Voiturons**, **Covoit'**, **Roulez** — final name TBD

### Brand Personality
- **Warm** — this is neighbors helping neighbors, not a cold tech platform
- **Reliable** — you can trust your weekly plan
- **Smart** — AI does the hard work, you just declare your schedule
- **Green** — environmental impact is real, not greenwashing

### Color Palette Direction
- Primary: Warm green (nature, countryside, ecology)
- Secondary: Warm amber/gold (morning light, community warmth)
- Neutral: Warm grays (not cold tech blues)
- Accent: Soft coral (notifications, CTAs)
- Dark mode: Deep forest greens

### Typography Direction
- Headlines: Rounded, friendly sans-serif (e.g., Nunito, Plus Jakarta Sans)
- Body: Clean, readable (e.g., Inter, DM Sans)
- Numbers/times: Monospace feel for schedules (e.g., JetBrains Mono for time displays)

## Key Screens (MVP)

### 1. Landing Page
- Hero: animated map showing cars merging into carpools along the corridor
- Value props: save money, reduce traffic, meet neighbors
- CTA: "Déclarez votre trajet" (Declare your commute)
- Social proof: simulation stats ("620 voitures en moins chaque matin")

### 2. Onboarding — Location
- Full-screen map centered on the corridor
- "Où habitez-vous ?" → tap on map or search address
- "Où travaillez-vous ?" → tap on map or search address
- Show the corridor line, confirm they're on/near it

### 3. Schedule Input
- Visual weekly calendar (Mon-Fri grid)
- For each day: toggle ON/OFF, set departure time, set return time
- Slider or ±buttons for tolerance window
- "Mon planning varie" toggle → enables per-day editing
- Preview: "Vous partez 4 jours par semaine, principalement vers 7h30"

### 4. Matching Results
- Card-based: "Votre groupe de la semaine"
- Group member avatars + names + villages
- Daily plan as a timeline:
  ```
  LUNDI 7h30
  🚗 Marie conduit
  📍 Pierre (Ligné) → 7h32
  📍 Thomas (Saint-Mars) → 7h40
  📍 Arrivée Nantes → 8h10
  ```
- Weekly summary: "Vous économisez 4 trajets cette semaine"

### 5. Simulation Dashboard (Separate App / Public Page)
- Interactive corridor map with traffic flow
- Before/after toggle
- Animated time scrubber (5h → 22h)
- Stats panel: vehicles, CO2, cost savings
- "What if" slider: adjust adoption rate → see impact change

### 6. Map View (In-App)
- Your position on the corridor
- Your group members' positions
- Pickup points marked
- Route highlighted
- Estimated times annotated

## Interaction Patterns

### Schedule Input — Make it Fast
- Default to "same time every day" → one time picker covers Mon-Fri
- Only show per-day editing if user toggles "variable schedule"
- Remember last week's schedule → "Même planning que la semaine dernière ?" → one tap

### Results — Make them Trustworthy
- Show each group member with photo, first name, village
- Show the driving rotation clearly — who drives when
- Show estimated times at each pickup — precision builds trust
- "Something wrong? Modify your planning" always accessible

### Notifications — Minimal but Timely
- Sunday 18h: "Votre plan covoiturage pour la semaine est prêt"
- Daily, 15min before departure: "Marie vous prend à 7h32 à [pickup point]"
- If plan changes: "Changement: Thomas conduit lundi au lieu de Marie"

## Responsive Design

- **Primary**: Mobile web (phone at 7am)
- **Secondary**: Desktop web (schedule input at home)
- Mobile-first design, responsive up to desktop
- No native app for MVP — PWA potential for push notifications

## Accessibility

- WCAG 2.1 AA compliance
- Large touch targets (48px minimum)
- High contrast text
- Screen reader friendly schedule display
- Time inputs compatible with system accessibility settings

## Map Design Specifics

- Use MapLibre GL JS with Protomaps PMTiles
- Muted, warm-toned basemap (not default OSM blue)
- Custom markers: small, friendly, not cluttered
- Corridor route: highlighted line, subtle animation
- Traffic visualization: color gradient on route (green → red)
- Carpool groups: connected dots with subtle lines between members
