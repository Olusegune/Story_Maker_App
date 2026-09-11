# Storymaker Story Generator GPT – Complete Knowledge Base

This directory contains all instruction and reference files needed to configure a GPT that converts any narrative input into Storymaker-optimized screenplay format.

---

## Files in This Package

### 1. **storymaker-gpt-instructions.md** (PRIMARY SYSTEM PROMPT)
The complete system prompt for the GPT. Copy this entire document into the GPT's System Instructions field.

**Contains:**
- Core mission statement
- Input handling (accepts any narrative format)
- Complete output format specification with examples
- Detailed guidelines for each screenplay element
- Output quality checklist
- Refinement request handling

**Use:** This is the main instruction set. The GPT should follow these patterns precisely.

---

### 2. **storymaker-example-screenplay.md** (KNOWLEDGE FILE)
A complete example screenplay demonstrating best-practice Storymaker formatting across 3 full scenes.

**Contains:**
- Story metadata example (title, logline, genre, themes, tone)
- 3 detailed character profiles (MAYA, RICHARD, ELENA)
- 3 complete scene breakdowns with:
  - Scene header and logline
  - Setting and atmosphere description
  - Full character list
  - Action prose
  - Dialogue examples
  - Complete production notes (camera, lighting, performance, audio, VFX, continuity)
  - Shot-by-shot breakdown (7-10 shots per scene)
- Explanation of how Storymaker processes the screenplay
- Quality checklist for why this example succeeds

**Use:** Upload this as a knowledge file to the GPT. Instruct it: "When formatting a screenplay, match the level of detail and structure shown in the example screenplay. Specifically, ensure every scene includes production notes for camera, lighting, performance, audio, VFX, and continuity. Break each scene into 7-10 specific shots."

---

### 3. **production-notes-reference.md** (REFERENCE GUIDE)
Extensive library of examples for each production-note category.

**Contains:**
- CAMERA: 50+ examples of specific shot types, movements, lenses, framing, depth-of-field
- LIGHTING: 40+ examples of time-of-day, light source, color temperature, mood, specific scenarios
- PERFORMANCE: 50+ examples of emotional states, voice/speech, facial expressions, physical tics, relationship dynamics
- AUDIO: 40+ examples of ambient sound, silence, music, diegetic sound, dialogue, sound effects
- VFX/EFFECTS: 30+ examples of natural elements, practical effects, optical effects, symbolic elements
- CONTINUITY: 30+ examples of costume, emotional carry-forward, props, setting, dialogue call-backs
- Writing guidelines (DO's and DON'Ts)
- Completeness checklist

**Use:** Upload this as a knowledge file. Instruct the GPT: "Consult the production-notes-reference.md file when writing production notes. Use specific language from the examples rather than generic descriptions like 'dramatic' or 'emotional.' Each category (camera, lighting, performance, audio, VFX, continuity) must include at least one concrete example from the reference guide."

---

### 4. **formatting-guide-do-not.md** (ERROR PREVENTION GUIDE)
Detailed guide showing common mistakes and their corrections across all screenplay elements.

**Contains:**
- ❌ Logline mistakes with ✓ correct versions (6 examples)
- ❌ Character mistakes with ✓ corrections (6 examples)
- ❌ Scene structure mistakes with ✓ fixes (4 examples)
- ❌ Tone & consistency errors (2 examples)
- ❌ Production notes mistakes with ✓ corrections (6 examples)
- Best practices checklist (40 items across structure, notes, dialogue, tone, visual clarity, length)
- Common AI generation failures + how to avoid them
- Refinement process

**Use:** Upload this as a knowledge file. Instruct the GPT: "Before outputting any screenplay, verify against the Best Practices Checklist in formatting-guide-do-not.md. If your logline matches any ❌ examples, revise it to match the ✓ pattern. If a character description is too generic, expand it using the examples. Flag any mistakes that would degrade Storymaker import quality and correct them proactively."

---

## How to Set Up the GPT

### Option 1: Direct Setup (Recommended)

1. **Create a new GPT at openai.com/gpts**
   
2. **Copy the complete text from `storymaker-gpt-instructions.md` into the "System Instructions" field**

3. **Add Knowledge Files:**
   - Click "Upload files"
   - Upload: `storymaker-example-screenplay.md`
   - Upload: `production-notes-reference.md`
   - Upload: `formatting-guide-do-not.md`

4. **Configure Settings:**
   - Model: GPT-4 or newer
   - Name: "Storymaker Story Generator"
   - Description: "Converts any story into Storymaker-optimized screenplay format with production intelligence"
   - Enable Web Browsing: No
   - Enable Code Interpreter: No
   - Enable File Upload: Yes (users may upload PDF/text stories)

5. **Test:**
   - Ask: "Convert this synopsis into Storymaker format: [provide a 1-paragraph story idea]"
   - Verify it includes: metadata, 3+ characters, logline, 2-3 scenes, full production notes, shot breakdown
   - If output lacks production notes, ask: "Can you expand the production notes for Scene 1, consulting the production-notes-reference file?"

---

### Option 2: Integration with Claude (Storymaker's AI Engine)

If integrating this into Storymaker's own AI workflows:

1. Embed `storymaker-gpt-instructions.md` into electron-main.js as a system prompt template
2. Load `production-notes-reference.md` and `formatting-guide-do-not.md` as context injected when users request "Generate a screenplay"
3. Use the example screenplay as a few-shot prompt example when calling Claude/OpenAI API

---

## Workflow: User Story → Storymaker Screenplay

1. **User inputs story** (any format: synopsis, book excerpt, tweet, idea):
   - "Write a screenplay for this concept: A detective realizes the victim is her estranged daughter"
   - Or uploads PDF of short story
   - Or pastes existing screenplay for enhancement

2. **GPT processes with knowledge files:**
   - Consults example screenplay for structure
   - References production-notes-reference for specific visual language
   - Checks formatting-guide against errors
   - Generates screenplay following storymaker-gpt-instructions

3. **GPT outputs Storymaker-formatted screenplay:**
   - Story metadata (title, logline, genre, themes, tone)
   - 3-5 characters with appearance, motivation, acting notes
   - 5-10 scenes (INT/EXT, timecode)
   - Each scene includes: setting, atmosphere, action, dialogue, full production notes, shot breakdown
   - ~10-20 pages total (importable directly into Storymaker)

4. **User copies screenplay** and imports into Storymaker via Story Engine:
   - Storymaker parses metadata, characters, scenes
   - Extracts production notes to inform image/video generation
   - Breaks scenes into shots
   - Generates storyboard with AI-crafted visuals matched to director's notes

5. **User refines in Storymaker** (edit shots, regenerate variations, adjust style, add visual effects)

---

## Quality Expectations

### Screenplay Quality
- **Logline:** Emotionally clear, specific to story, 1-2 sentences, includes conflict + stakes
- **Characters:** 3+ with filmable appearance, distinct motivation, and acting direction
- **Scenes:** 5-10 scenes total, each 300-500 words (exportable in 10-20 pages)
- **Dialogue:** Natural speech, reveals character, advances plot, not exposition-heavy
- **Production Notes:** Specific camera movement, exact lighting mood, physicalized emotion, audio choice, VFX detail, continuity carry-forward

### Storymaker Import Success
- ✓ All 28 style presets available for matching
- ✓ Production notes guide high-quality image generation
- ✓ Shot breakdown enables efficient storyboard auto-generation
- ✓ Character descriptions enable AI-consistent casting visualization
- ✓ Dialogue and action populate caption layers

### AI Generation Quality
- High-quality prompts (from detailed production notes) → better generated visuals
- Specific camera language → correctly framed shots
- Detailed lighting → mood-accurate images
- Physicalized emotion → expressive character generation
- Continuity notes → consistent characters across shots

---

## Customization Options

### If user wants shorter screenplay:
Instruct GPT: "Generate only 3 scenes (not 5-10). Each scene 200 words max."

### If user wants longer, more complex screenplay:
Instruct GPT: "Generate 10-12 scenes. Develop 5-6 distinct characters. Expand action to 400-600 words per scene."

### If user wants specific genre emphasis:
Instruct GPT: "This is a [thriller/romance/sci-fi/horror]. Emphasize [genre-specific] production notes. Match tone throughout."

### If user wants to enhance existing screenplay:
Instruct GPT: "I'm providing a screenplay already. Please: (1) Enhance logline for clarity, (2) Expand character descriptions to include appearance + acting notes, (3) Add detailed production notes to every scene, (4) Break each scene into 7-10 shots. Maintain all existing dialogue and plot points."

### If user wants a specific style/reference:
Instruct GPT: "Write this screenplay in the visual style of [Wes Anderson / Denis Villeneuve / Greta Gerwig]. The production notes should reference the cinematography, color palette, and shot composition of this director."

---

## Troubleshooting

### Issue: Generated screenplay lacks production notes
**Solution:** Remind GPT: "Consult the production-notes-reference.md file. Every scene MUST include camera, lighting, performance, audio, VFX, and continuity notes. Use specific examples from the reference guide, not generic descriptions."

### Issue: Characters are generic or lack depth
**Solution:** Upload screenplay and ask: "Expand the character descriptions using the patterns in the example screenplay. Each character needs: specific age + appearance details, distinct motivation, and 2-3 acting notes showing how to physicalize their character."

### Issue: Dialogue is expository
**Solution:** Ask: "Rewrite all dialogue to sound natural. Use subtext. Characters should not explain the plot to each other. Review the dialogue examples in the formatted screenplay."

### Issue: Scene structure is unclear
**Solution:** Ask: "Format each scene with: SCENE [Number]: INT/EXT LOCATION - TIME. Then clearly separate: SETTING, ATMOSPHERE, CHARACTERS, ACTION, DIALOGUE, PRODUCTION NOTES, SHOTS. Match the structure in the example screenplay."

### Issue: Production notes are too vague ("dramatic," "emotional," "good")
**Solution:** Ask: "Rewrite production notes using specific language. For example, instead of 'dramatic lighting,' write 'harsh overhead fluorescent with shadows under eyes, creating institutional dread.' Consult the production-notes-reference.md for specific examples in each category."

---

## Success Criteria

A well-formatted Storymaker screenplay from this GPT should:

- [ ] Have a logline that is 1-2 sentences, specific, emotionally clear
- [ ] Include 3+ characters with visual appearance, motivation, and acting direction
- [ ] Contain 5-10 scenes, each formatted consistently
- [ ] Have production notes for every scene (camera, lighting, performance, audio, VFX, continuity)
- [ ] Break each scene into 7-10 specific shots
- [ ] Use natural, character-distinct dialogue
- [ ] Be 10-20 pages long (importable in ~15 minutes of screen time)
- [ ] Be immediately copy-paste-able into Storymaker's Story Engine
- [ ] Result in high-quality AI-generated storyboard visuals

---

## File Locations

Save all four files in your Storymaker installation docs folder:

```
C:\Users\[username]\Documents\Playground\wheelbarrow-studios-story-maker\docs\
  ├── storymaker-gpt-instructions.md
  ├── storymaker-example-screenplay.md
  ├── production-notes-reference.md
  ├── formatting-guide-do-not.md
  └── GPT-KNOWLEDGE-FILES-README.md (this file)
```

---

## Support & Iteration

This knowledge base is a living resource. If you use the GPT and notice:
- Common user confusion → update storymaker-gpt-instructions.md
- Persistent formatting errors → add examples to formatting-guide-do-not.md
- New production-note patterns worth documenting → expand production-notes-reference.md
- Better example screenplay → replace storymaker-example-screenplay.md

Iterate based on real usage. The better your knowledge files, the better the GPT's output.

---

## Quick Start

**TL;DR for setting up the GPT right now:**

1. Create GPT at openai.com/gpts
2. Paste `storymaker-gpt-instructions.md` into System Instructions
3. Upload knowledge files: example screenplay, production-notes-reference, formatting-guide
4. Test with: "Convert this story into Storymaker format: [1-paragraph story]"
5. Iterate based on output quality

You're done. Users can now say: "Convert my book into a Storymaker screenplay" and get a production-ready document.

---

**Created for:** Wheelbarrow Studios Storymaker Story Engine
**Version:** 1.0
**Last Updated:** 2026-08-17
