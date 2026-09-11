# Style Library Implementation Guide for Story Maker

**Status**: Phase 1 specification (Section 1: Style DNA)

This guide adapts the Style Library spec (STYLE-LIBRARY-SPEC.md) to Story Maker's Electron + JavaScript architecture.

## Architecture Overview

Story Maker uses:
- Single `project` object in memory (updated via `setDirty()`)
- Project persisted as `.storymaker` file (JSON)
- Provider gateways (OpenAI, Google, Fal, Kie, WaveSpeed, OpenRouter)
- Scene-based workflow: scenes → shots → generation + review
- Electron IPC for file I/O and media handling

## Section 1: Style DNA — Data Model & Storage

### Where Style DNAs live in the project

Add to the project object:

```javascript
project.styleDnas = [
  {
    id: "dna-uuid-1",
    name: "Premium Product – Spring '26",
    createdAt: "2026-07-20T10:30:00Z",
    description: "Luxury cosmetics campaign — warm gold tones, soft diffused light, glossy materials.",
    visualLanguage: "minimalist luxury, editorial photography",
    colorPalette: ["#D4AF37", "#F5F5DC", "#8B7355"],
    typography: "geometric sans-serif, light weight, tall x-height",
    materials: "glossy porcelain, glass, brushed gold",
    mood: "serene, aspirational, timeless",
    atmosphere: "soft diffused light, luxury studio, warm color cast"
  }
];
```

### Style DNA operations

#### 1. Capture (after scene approval)

```javascript
function captureStyleDna(name, description, scene) {
  const dna = {
    id: `dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim() || "Untitled Style",
    description: description.trim() || "",
    createdAt: new Date().toISOString(),
    visualLanguage: scene.generationPrompt?.split(",")[0] || "",
    colorPalette: extractColorPaletteFromUI(), // from the color-picker state
    typography: scene.generationPrompt?.match(/typography|font|text/i)?.[0] || "",
    materials: scene.generationPrompt?.match(/material|surface|texture|glossy|matte/i)?.[0] || "",
    mood: scene.generationPrompt?.match(/mood|feel|tone|emotion/i)?.[0] || "",
    atmosphere: scene.generationPrompt?.match(/light|atmosphere|depth|space/i)?.[0] || ""
  };
  project.styleDnas = Array.isArray(project.styleDnas) ? project.styleDnas : [];
  project.styleDnas.unshift(dna);
  setDirty();
  notify(`Saved Style DNA: "${dna.name}"`);
  return dna;
}
```

#### 2. Apply (start of new scene)

```javascript
function applyStyleDna(dnaId) {
  const dna = project.styleDnas.find(d => d.id === dnaId);
  if (!dna) return;
  
  // Update the current scene's generation prompt to include the DNA as a prefix
  const currentScene = currentScene();
  const prompt = [
    `Visual style: ${dna.visualLanguage}`,
    `Colors: ${dna.colorPalette.join(", ")}`,
    `Typography: ${dna.typography}`,
    `Materials: ${dna.materials}`,
    `Mood: ${dna.mood}`,
    `Atmosphere: ${dna.atmosphere}`,
    "",
    currentScene.generationPrompt
  ].filter(Boolean).join("\n");
  
  currentScene.generationPrompt = prompt;
  currentScene.appliedStyleDnaId = dnaId;
  setDirty();
  notify(`Applied "${dna.name}" to scene`);
}
```

#### 3. Delete

```javascript
function deleteStyleDna(dnaId) {
  project.styleDnas = (project.styleDnas || []).filter(d => d.id !== dnaId);
  setDirty();
}
```

#### 4. List (UI)

```javascript
function savedStyleDnas() {
  return Array.isArray(project.styleDnas) ? project.styleDnas : [];
}
```

---

## Section 2: Style-Consistency / Drift Detection — Implementation Plan

### 2.1 Data Model: DriftReport

Add to project when drift check is performed:

```javascript
// Stored in scene.driftHistory as a ring buffer (keep last 5 checks)
scene.driftHistory = [
  {
    id: "drift-check-uuid",
    checkedAt: "2026-07-20T10:35:00Z",
    styleDnaId: "dna-uuid-1",
    styleDnaName: "Premium Product – Spring '26",
    assetId: "asset-uuid", // the image/video checked
    
    // Per-dimension drift (0 = perfect, 100 = maximum drift)
    colorDrift: 32,
    typographyDrift: 18,
    materialDrift: 25,
    moodDrift: 22,
    atmosphereDrift: 41,
    
    // Weighted average (user can customize later)
    compositeDrift: 28,
    
    // Human findings from the provider
    findings: {
      color: "Palette uses cool silvers and whites; DNA expects warm golds and creams.",
      typography: "Clean sans-serif, matches DNA.",
      materials: "Glossy finishes match; slightly less saturated than reference.",
      mood: "Aspirational and calm, close to DNA intent.",
      atmosphere: "Lighting is softer than DNA specifies; add more contrast."
    },
    
    // Suggestions for steering back (if drift > 30)
    suggestions: [
      "Add warm gold accents to the midtones",
      "Increase lighting drama with shadow depth",
      "Boost material saturation to match glossy reference"
    ],
    
    // User action
    status: "pending" | "accepted" | "rejected"
  }
];
```

### 2.2 API Call: Drift Check

When user clicks "Check Drift" button:

```javascript
async function checkStyleDrift(assetId, styleDnaId) {
  const asset = assetById(assetId);
  const dna = project.styleDnas.find(d => d.id === styleDnaId);
  const scene = currentScene();
  
  if (!asset?.url || !dna) return;
  
  // Show loading state
  notifyLoading("Checking style consistency...");
  
  try {
    // Route to a structured-text provider (Gemini, Claude if available)
    const provider = selectDriftCheckProvider();
    if (!provider) {
      notify("No provider configured for style checks. Add one in Model Hub.");
      return;
    }
    
    const response = await provider.checkDrift({
      styleDnaProfile: dna,
      assetUrl: asset.url,
      generationPrompt: scene.generationPrompt,
      assetKind: asset.kind // "image" or "video"
    });
    
    // Validate response schema
    const report = validateDriftReport(response);
    
    // Store in scene history
    scene.driftHistory = scene.driftHistory || [];
    scene.driftHistory.unshift(report);
    if (scene.driftHistory.length > 5) scene.driftHistory.pop(); // Keep last 5
    
    setDirty();
    return report;
  } catch (error) {
    notify(`Drift check failed: ${error.message}`);
    return null;
  }
}
```

### 2.3 UI Placements

#### A. Scene generation result → Check Drift button

**Location**: After a scene image or video completes generation

```html
<div class="generation-result">
  <img src="asset-url" alt="Generated scene" />
  
  <div class="action-bar">
    <button onclick="approveScene()">✓ Approve</button>
    <button onclick="regenerateScene()">↻ Regenerate</button>
    
    <!-- NEW: Check Drift Button (appears only if a Style DNA is loaded) -->
    <button 
      onclick="checkStyleDrift(...)" 
      title="Compare this generation against the saved style (1 API check)"
      class="check-drift-button"
    >
      🎨 Check Style
    </button>
  </div>
</div>
```

#### B. Drift Report Panel

When drift check completes, show:

```html
<div class="drift-report">
  <h3>Style Consistency Check</h3>
  <p>vs. "<strong>Premium Product – Spring '26</strong>" 
     (checked just now)</p>
  
  <div class="drift-scores">
    <div class="score-bar">
      <label>Color Drift</label>
      <progress value="32" max="100"></progress>
      <span class="value">32%</span>
    </div>
    
    <div class="score-bar">
      <label>Typography Drift</label>
      <progress value="18" max="100"></progress>
      <span class="value">18%</span>
    </div>
    
    <!-- ... repeat for materials, mood, atmosphere ... -->
    
    <div class="score-bar overall">
      <label><strong>Overall Drift</strong></label>
      <progress value="28" max="100"></progress>
      <span class="value status-acceptable">28% (ACCEPTABLE)</span>
    </div>
  </div>
  
  <div class="findings">
    <h4>Findings</h4>
    <ul>
      <li><strong>Color:</strong> Palette uses cool silvers... (from findings.color)</li>
      <li><strong>Mood:</strong> Aspirational and calm... (from findings.mood)</li>
    </ul>
  </div>
  
  <div class="suggestions">
    <h4>To Reduce Drift</h4>
    <ul>
      <li>Add warm gold accents to the midtones</li>
      <li>Increase lighting drama with shadow depth</li>
    </ul>
  </div>
  
  <div class="actions">
    <button onclick="acceptDrift()">✓ Accept Variation</button>
    <button onclick="regenerateWithDnaEnforced()">Regenerate (Enforce DNA)</button>
    <button onclick="closeDriftReport()">Close</button>
  </div>
</div>
```

#### C. Design Bible → Save as Style DNA

After approving a scene reference image:

```html
<div class="scene-approved">
  <img src="reference-image" alt="Approved scene reference" />
  
  <button onclick="saveAsStyleDna()">
    💾 Save as Style DNA
  </button>
</div>
```

Clicking opens a modal:

```html
<dialog id="save-dna-dialog">
  <h3>Save Style DNA</h3>
  
  <input 
    type="text" 
    placeholder="Name (e.g. 'Premium Product – Spring')"
    id="dna-name"
  />
  
  <textarea 
    placeholder="Optional description"
    id="dna-description"
  ></textarea>
  
  <div class="button-group">
    <button onclick="confirmSaveStyleDna()">✓ Save</button>
    <button onclick="cancelSaveStyleDna()">Cancel</button>
  </div>
</dialog>
```

### 2.4 Provider Selection: Which service does drift checking?

Story Maker's drift check needs a **vision-capable LLM** that can:
1. Analyze an image URL visually
2. Return structured JSON (drift scores + findings)

**Preferred providers** (in order):
1. **Google Gemini** — already integrated, multimodal, fast
2. **OpenAI GPT-4V** — fallback, vision-capable
3. **Claude 3.5 Vision** (if added) — excellent at style analysis

**Not used**:
- Fal, Kie, WaveSpeed — designed for generation, not analysis
- OpenRouter — creative text only, no vision

```javascript
function selectDriftCheckProvider() {
  // Try Gemini first (already integrated for image generation)
  if (hasSavedKey("google")) return geminiDriftProvider;
  
  // Fallback to OpenAI (if it has a vision-capable key)
  if (hasSavedKey("openai")) return openaiDriftProvider;
  
  // None available
  return null;
}
```

### 2.5 Cost Transparency

```javascript
async function checkStyleDrift(...) {
  const cost = estimateDriftCheckCost(provider);
  notify(`Checking style (est. ${cost} credits)...`);
  
  // After check completes:
  notify(`Checked (used ${cost} credits)`);
}
```

Display cost on the button:

```html
<button 
  title="Compare against saved style — uses 1 API check (~0.005 credits)"
  class="check-drift-button"
>
  🎨 Check Style (1 check)
</button>
```

---

## Section 3: Implementation Checklist — Phase 1

### 3.1 Data Model

- [ ] Add `project.styleDnas` array to blank project template
- [ ] Add `scene.driftHistory` ring buffer (max 5 entries)
- [ ] Ensure Shape-validation functions (`ensureStyleDnaShape`, etc.)
- [ ] Persist in `.storymaker` save/load cycle

### 3.2 Core Functions (in storymaker.js)

- [ ] `captureStyleDna(name, description, scene)` — save current scene as DNA
- [ ] `applyStyleDna(dnaId)` — prepend DNA to generation prompt
- [ ] `deleteStyleDna(dnaId)` — remove from list
- [ ] `savedStyleDnas()` — return all DNAs
- [ ] `checkStyleDrift(assetId, styleDnaId)` — API call + store report
- [ ] `selectDriftCheckProvider()` — pick vision-capable LLM
- [ ] `validateDriftReport(response)` — JSON schema validation

### 3.3 CSS & Styling

Add to `src/production-polish.css`:

```css
.check-drift-button {
  /* Subtle, non-intrusive button style */
  /* positioned in the scene action bar */
  /* hover shows tooltip with "(1 API check)" */
}

.drift-report {
  /* Modal panel showing drift scores */
  /* progress bars with threshold colors: */
  /* 0-25% = green (✓ locked) */
  /* 26-50% = amber (⚠ acceptable) */
  /* 51-75% = orange (⚠ consider regenerating) */
  /* 76-100% = red (✗ significant drift) */
}

.score-bar.acceptable { /* color: green */ }
.score-bar.minor { /* color: amber */ }
.score-bar.major { /* color: orange */ }
.score-bar.critical { /* color: red */ }
```

### 3.4 UI Integration

- [ ] Add "Check Drift" button to scene generation result footer
- [ ] Render `<div class="drift-report">` modal when check completes
- [ ] Add "Save as Style DNA" button to approved scenes (Design Bible)
- [ ] Open save dialog with name + description fields
- [ ] Update Design Bible sidebar to show saved DNAs as cards
- [ ] Clicking a DNA card applies it to the current scene

### 3.5 Error Handling

- [ ] Provider not configured → honest disabled button
- [ ] Asset URL inaccessible → user-facing error message
- [ ] Provider response invalid JSON → fallback message, not crash
- [ ] API rate-limited → show quota status
- [ ] Network error → retry logic + clear messaging

### 3.6 Testing

- [ ] Manual: save a style DNA from an approved scene
- [ ] Manual: apply a saved DNA to a new scene (prompt is updated)
- [ ] Manual: check drift on a generated image (report renders)
- [ ] Manual: delete a DNA (removed from project)
- [ ] Coverage: `npm run test:release` includes style-library smoke

---

## Section 4: Rollout Timeline

### Phase 1: Core Style DNA (NOW)

**Deliverables**:
- Style DNA data model + operations (capture/apply/delete/list)
- Drift check API call (single-scene checking)
- UI: "Save as Style DNA" button in Design Bible
- UI: "Check Style Drift" button in scene result
- Drift report rendering with threshold colors
- Cost transparency (button tooltip)
- Error handling for missing provider

**Scope**: One scene at a time; apply to storyboard later

**Acceptance**: User can save a style, apply it, check drift, and see results

### Phase 2: Batch & Comparison (Future)

- "Check all scenes" button (parallel drift checks)
- Consistency dashboard (drift trend chart)
- Side-by-side variation comparison scoring
- Custom dimension weighting

### Phase 3: Advanced (Future)

- Enforced-DNA regeneration (style-steering prompt patch)
- Drift history timeline
- Multi-project style library export/import

---

## Notes for Implementation

1. **Keep the generation flow unchanged** — drift check is additive, not required
2. **No silent API calls** — every drift check is user-initiated (button click)
3. **Cost is visible** — show "(1 API check)" on hover, actual cost after completion
4. **Schema validation first** — validate provider JSON before touching the UI
5. **Non-blocking failures** — drift check can fail without losing the generation result
6. **Persist to `.storymaker`** — Style DNAs and drift history survive save/load

---

## Related Files

- `STYLE-LIBRARY-SPEC.md` — complete conceptual spec
- `GENERATION_PIPELINE_AUDIT.md` — how generation currently works
- `PROVIDER_OPERATIONS.md` — available provider operations
