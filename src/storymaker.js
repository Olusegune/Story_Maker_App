import "./studio.css";
import "./shot-controls.css";
import "./launch-polish.css";
import "./preset-library.css";
import "./character-lab.css";
import "./character-lab-overrides.css";
import "./production-polish.css";
import "./timeline-polish.css";
import "./home-dashboard.css";
import "./accessibility-and-reference.css";
import "./ux-release-041.css";
import "./visual-direction.css";
import { defaultStyleDna, layeredPaperEditorial, twoDStyleDnas, legacyStyleToDna, migrateVisualDirection, resolveVisualDirection, stylePromptBlocks, styleVersion, blendStyles, STYLE_REFERENCE_ROLES, STYLE_STRENGTHS, styleHistoryFor, appendStyleHistory } from "./visual-direction.js";

const asset = (name) => new URL(`../assets/styles/${name}.png`, import.meta.url).href;
const splashArtwork = new URL("../assets/storymaker-splash.png", import.meta.url).href;
const styles = [
  { name: "Cinematic Documentary", image: asset("Documentary"), tone: "Grounded · Observational", promptFragment: "Handheld observational camera, natural available light, muted realistic color grading, imperfect framing that favors truth over polish, 35mm photojournalistic texture.", negativePrompt: "over-stylization, symmetrical composition, saturated color grading, staged lighting, glossy CGI sheen" },
  { name: "Cyberpunk", image: asset("Cyberpunk"), tone: "Neon · Atmospheric", promptFragment: "Rain-slicked streets, dense neon signage, teal-and-magenta contrast lighting, volumetric fog, towering dense urban architecture, reflective wet surfaces.", negativePrompt: "daylight, pastel colors, clean minimalist environments, rural or natural settings" },
  { name: "Hand-Painted Whimsy", image: asset("Ghibli Inspired"), tone: "Tender · Hand-painted", promptFragment: "Soft hand-painted watercolor textures, warm natural light, gentle rounded character design, lush detailed backgrounds, a sense of quiet wonder.", negativePrompt: "photorealism, hard-edged CGI, cold color grading, mechanical or industrial harshness" },
  { name: "Character-Forward 3D", image: asset("Pixar Inspired"), tone: "Warm · Character-led", promptFragment: "Warm stylized 3D rendering, expressive exaggerated character proportions, soft global illumination, rich saturated color palette, appealing rounded shapes.", negativePrompt: "photorealistic skin texture, flat lighting, muted desaturated colors, harsh shadows" },
  { name: "Commercial Ads", image: asset("Commercial Ads"), tone: "Luxury · Graphic", promptFragment: "Polished studio lighting, crisp product-grade clarity, confident graphic composition, premium color grading, immaculate surfaces.", negativePrompt: "clutter, dim lighting, amateur framing, visible imperfections or blemishes" },
  { name: "Motion Graphics Pop", image: asset("Motion Graphics Pop"), tone: "Bold · Kinetic", promptFragment: "Bold flat graphic shapes, saturated primary color blocking, dynamic kinetic composition, crisp vector-clean edges, high-energy layout.", negativePrompt: "photorealism, muted colors, static symmetrical composition, soft gradients" },
  { name: "Space Opera", image: asset("Space Opera"), tone: "Epic · Speculative", promptFragment: "Vast scale environments, dramatic rim lighting against deep space, intricate futuristic production design, sweeping epic composition, atmospheric haze.", negativePrompt: "small or intimate scale, contemporary settings, handheld camera shake, mundane lighting" },
  { name: "YouTube Explainer", image: asset("YouTube Explainer"), tone: "Clear · Energetic", promptFragment: "Bright even lighting, clean simple backgrounds, friendly approachable color palette, clear uncluttered composition that reads instantly.", negativePrompt: "dark moody lighting, visual clutter, complex layered backgrounds, low contrast" }
];
const optionalStyleAssets = import.meta.glob("../assets/styles/*.{png,jpg,jpeg,webp}", { eager: true, import: "default", query: "?url" });
const optionalStyleAsset = (name) => ["png", "jpg", "jpeg", "webp"].map((extension) => optionalStyleAssets[`../assets/styles/${name}.${extension}`]).find(Boolean) || "";
// Film Noir/Psychological Thriller/Folk Horror/Neo-Western/High Fantasy/
// Romantic Drama used to alias onto a sibling preset's image here (e.g.
// Film Noir reused Graphic Novel.png) because no dedicated art existed for
// them. Each now has its own assets/styles/{name}.png, so they were
// dropped from this map — leaving only the three that still intentionally
// share art with a close sibling.
const suppliedStyleAssetNames = {
  "Cinematic Documentary": "Documentary", "Hand-Painted Whimsy": "Ghibli Inspired", "Character-Forward 3D": "Pixar Inspired"
};
styles.forEach((style) => { style.assetFile = suppliedStyleAssetNames[style.name] || style.name; style.image = optionalStyleAsset(style.assetFile) || style.image; style.assetReady = Boolean(style.image); style.family = style.family || "Foundation"; });
[
  ["Anime Story Film", "Expressive · Kinetic", "Animation", "Bold expressive linework, dramatic speed and impact lines, large emotive eyes, saturated dynamic lighting, kinetic action staging.", "photorealism, muted colors, static rigid posing, Western cartoon proportions"],
  ["Dark Fantasy", "Mythic · Textured", "Genre", "Weathered ancient textures, low warm firelight against deep shadow, ominous overcast atmosphere, richly detailed period costuming and armor.", "bright cheerful lighting, clean modern surfaces, pastel colors"],
  ["Magical Realism", "Lyrical · Grounded", "Genre", "Naturalistic grounded settings touched by one impossible, quietly luminous detail; soft golden-hour light; unhurried lyrical composition.", "overt fantasy spectacle, garish special effects, harsh clinical lighting"],
  ["Film Noir", "Shadowed · Precise", "Genre", "High-contrast black-and-white or desaturated lighting, hard venetian-blind shadows, rain-streaked windows, smoke-filled interiors, precise geometric framing.", "bright even lighting, saturated color, cheerful open compositions"],
  ["Psychological Thriller", "Tense · Intimate", "Genre", "Claustrophobic tight framing, unsettling asymmetric composition, cold desaturated color grading, harsh single-source lighting, dread-inducing negative space.", "warm inviting lighting, wide open friendly compositions, saturated cheerful colors"],
  ["Folk Horror", "Ritual · Earthy", "Genre", "Earthy natural textures, ritualistic symmetrical staging, muted autumnal palette, hazy diffused daylight, unsettling pastoral stillness.", "urban settings, neon or artificial lighting, clean modern production design"],
  ["Romantic Drama", "Luminous · Intimate", "Drama", "Soft luminous backlight, warm intimate close framing, gentle shallow depth of field, tactile natural fabrics and textures, unhurried tender pacing.", "harsh flat lighting, cold color grading, wide impersonal framing"],
  ["Prestige Historical", "Tactile · Epic", "Drama", "Meticulous period-accurate costuming and production design, candlelight and window-light motivated sources, painterly composition, tactile aged materials.", "modern props or architecture, artificial neon lighting, contemporary clothing"],
  ["Neo-Western", "Sun-bleached · Raw", "Genre", "Sun-bleached wide-open landscapes, harsh directional daylight, dusty raw textures, weathered practical wardrobe, long horizon-driven composition.", "urban interiors, neon lighting, crowded compositions, soft diffused light"],
  ["Sci-Fi Realism", "Sober · Vast", "Future", "Plausible near-future technology, sober naturalistic lighting, vast sparse environments, functional utilitarian production design, restrained color palette.", "fantastical creatures, saturated neon color, implausible magic-like effects"],
  ["High Fantasy", "Mythic · Grand", "Genre", "Grand mythic scale, richly ornamented costuming and architecture, dramatic directional lighting, sweeping painterly vistas, saturated jewel-toned palette.", "contemporary settings, minimalist production design, muted desaturated color"],
  ["Graphic Novel", "Ink · Contrast", "Animation", "Bold inked linework, high-contrast cross-hatched shading, dramatic panel-like composition, limited punchy color palette.", "photorealistic rendering, soft gradients, muted low-contrast lighting"],
  ["Stop Motion", "Handmade · Tactile", "Animation", "Tactile handmade puppet textures, visible fingerprint imperfections in materials, warm practical set lighting, charmingly imperfect motion.", "smooth CGI rendering, photorealistic skin, perfectly symmetrical geometry"],
  ["Luxury Beauty", "Polished · Sensory", "Commercial", "Flawless soft studio lighting, glossy sensory surface detail, elegant minimal composition, refined desaturated luxury palette.", "clutter, harsh lighting, visible blemishes or imperfections, busy backgrounds"],
  ["Product Macro", "Precise · Premium", "Commercial", "Extreme macro precision, immaculate studio lighting with controlled reflections, premium material texture detail, clean isolated composition.", "dust, fingerprints, cluttered backgrounds, uneven amateur lighting"],
  ["Music Video", "Rhythmic · Expressive", "Music", "High-energy rhythmic staging, bold saturated color washes, dynamic unconventional camera angles, expressive performance-forward composition.", "static composition, muted colors, conservative symmetrical framing"],
  ["Vertical Social", "Immediate · Energetic", "Commercial", "Immediate eye-catching framing built for a vertical frame, bright punchy color, fast-read composition, energetic close-up staging.", "wide horizontal composition, slow contemplative pacing, muted colors"],
  ["Sports Anthem", "Kinetic · Heroic", "Commercial", "Heroic low-angle framing, high-contrast dramatic lighting, kinetic motion blur, bold saturated team colors, triumphant epic scale.", "static posed framing, muted colors, soft diffused lighting"],
  ["Fashion Editorial", "Sculptural · Modern", "Commercial", "Sculptural high-fashion posing, bold graphic studio lighting, minimalist modern composition, striking confident color contrast.", "cluttered backgrounds, soft casual posing, muted low-contrast lighting"],
  ["Kids Adventure", "Warm · Wonder", "Animation", "Warm inviting color palette, rounded friendly character design, bright optimistic lighting, playful sense of wonder and scale.", "dark ominous lighting, muted desaturated colors, threatening or grotesque design"]
].forEach(([name, tone, family, promptFragment, negativePrompt]) => { const image = optionalStyleAsset(name); styles.push({ name, assetFile: name, image, assetReady: Boolean(image), tone, family, promptFragment, negativePrompt }); });
styles.forEach((style) => { style.assetFile = suppliedStyleAssetNames[style.name] || style.assetFile || style.name; style.image = optionalStyleAsset(style.assetFile) || style.image; style.assetReady = Boolean(style.image); });
styles.push({ name: "Layered Paper Editorial", assetFile: "Stop Motion", image: optionalStyleAsset("Stop Motion") || splashArtwork, assetReady: true, tone: "Handcrafted · Editorial", family: "Handcrafted", promptFragment: "Physically believable layered cardstock, handmade paper fibers, recessed contour layers, deep shadow gaps, soft museum lighting, deliberate negative space, restrained stop-motion behavior.", negativePrompt: "morphing, teleportation, plastic, flat vectors, glossy CGI, random decorative objects, visual clutter" });
const styleImage = (style) => style?.image || splashArtwork;
const readyStyles = () => styles.filter((style) => style.assetReady);
const systemStyleDnas = () => [...styles.map(legacyStyleToDna).filter((style) => style.id !== "system-layered-paper-editorial"), layeredPaperEditorial(), ...twoDStyleDnas()];
// The production workflow (Story -> Style -> Characters -> Storyboard ->
// Continuity -> Shots -> Timeline -> Generate -> Audio -> Deliver) lives
// entirely in the top production-nav bar (bind()'s ".production-nav"
// button row) — it's a golden path, so it belongs in one linear place,
// not duplicated here. This sidebar is deliberately just the destinations
// that don't fit a single line: switching projects, reference material,
// and app-level utilities.
const navGroups = [
  { label: "PROJECT", items: [["Home", "⌂"], ["Projects", "▦"]] },
  { label: "LIBRARY", items: [["Media Library", "▧"], ["AI Director", "✧"]] },
  { label: "SYSTEM", items: [["Model Hub", "◌"], ["Help", "?"], ["Settings", "⚙"]] }
];
const providerCatalog = [
  { id: "openai", label: "OpenAI", mark: "O", capability: "GPT creative direction · image", note: "Live Director review and scene-image generation are active today." },
  { id: "google", label: "Google Gemini", mark: "G", capability: "Nano Banana · multimodal image", note: "The Nano Banana family is the priority Gemini image connector." },
  { id: "fal", label: "fal", mark: "F", capability: "Seedream · Kling · Seedance video", note: "One of Storymaker's three video gateways, alongside Kie and WaveSpeed." },
  { id: "kie", label: "Kie", mark: "K", capability: "GPT-4o Image · Veo 3.1 · Kling · Seedance 2.0", note: "One of Storymaker's three video gateways, alongside fal and WaveSpeed." }
];
providerCatalog.push(
  { id: "wavespeed", label: "WaveSpeed", mark: "W", capability: "Model gateway · image · video", note: "The broadest of Storymaker's three video gateways — WAN, Kling, Veo, Sora, Seedance and more." },
  { id: "openrouter", label: "OpenRouter", mark: "R", capability: "AI story analysis · Director review", note: "Runs story analysis and Director reviews when no OpenAI key is saved. It does not generate images or video." }
);
const modelCatalog = [
  { provider: "comfyui", model: "local-flux1-schnell-fp8", label: "FLUX.1 Schnell FP8 · Local", modes: ["text-to-image"], status: "live" },
  { provider: "comfyui", model: "local-wan21-fun-inp-1.3b", label: "WAN 2.1 Fun InP 1.3B · Local", modes: ["image-to-video"], status: "live" },
  { provider: "comfyui", model: "local-ltxv2b-0.9.8-distilled", label: "LTX-Video 2B 0.9.8 Distilled · Local", modes: ["image-to-video"], status: "live" },
  { provider: "openai", model: "gpt-5.1", label: "GPT-5.1", modes: ["director", "text"], status: "live" },
  { provider: "openai", model: "gpt-image-1", label: "GPT Image 1", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" },
  { provider: "google", model: "gemini-2.5-flash-image", label: "Nano Banana", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" },
  { provider: "google", model: "gemini-3.1-flash-image", label: "Nano Banana 2", modes: ["text-to-image", "image-edit", "multi-reference", "4K"], status: "live" },
  { provider: "google", model: "gemini-3-pro-image", label: "Nano Banana Pro", modes: ["text-to-image", "image-edit", "multi-reference", "4K"], status: "live" },
];
// Native ModelArk (Seedance) and Kling Open Platform access retired — both are
// covered through the fal / Kie / WaveSpeed gateways added further below.
/* modelCatalog.push.apply(modelCatalog, [
  { provider: "fal", model: "fal-seedream-v45", label: "Seedream 4.5 · fal", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" },
  { provider: "fal", model: "fal-seedream-v5-lite", label: "Seedream 5 Lite · fal", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" },
  { provider: "kie", model: "kie-model-gateway", label: "Kie Model Gateway", modes: ["image", "video", "multimodal routing"], status: "in-build" },
  { provider: "wavespeed", model: "wavespeed-gpt-image-2", label: "GPT Image 2 · WaveSpeed", modes: ["text-to-image", "image-edit"], status: "live" },
  { provider: "wavespeed", model: "wavespeed-seedream-v5-pro", label: "Seedream 5 Pro · WaveSpeed", modes: ["text-to-image", "image-edit"], status: "live" },
  { provider: "openrouter", model: "openrouter-creative-text", label: "OpenRouter Creative Text", modes: ["director", "prompt", "text"], status: "in-build" }
); */
/* modelCatalog.push.apply(modelCatalog, [
    ["wavespeed-ai/flux-dev", "FLUX Dev"], ["wavespeed-ai/flux-schnell", "FLUX Schnell"], ["wavespeed-ai/flux-2-max", "FLUX 2 Max"], ["wavespeed-ai/flux-kontext", "FLUX Kontext"], ["wavespeed-ai/seedream-v4.5", "Seedream 4.5"], ["wavespeed-ai/seedream-v5-lite", "Seedream 5 Lite"], ["wavespeed-ai/nano-banana-2", "Nano Banana 2"], ["wavespeed-ai/nano-banana-pro", "Nano Banana Pro"], ["wavespeed-ai/qwen-image", "Qwen Image"], ["wavespeed-ai/stable-diffusion-xl", "Stable Diffusion XL"], ["wavespeed-ai/sd-3.5-large", "Stable Diffusion 3.5 Large"], ["wavespeed-ai/ideogram-v3", "Ideogram 3"], ["wavespeed-ai/recraft-v3", "Recraft V3"], ["wavespeed-ai/imagen-4", "Imagen 4"], ["wavespeed-ai/gpt-image-2", "GPT Image 2"],
  ].map(([model, label]) => ({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: ["text-to-image", "image-edit", "reference-image"], status: "live" })),
  [
    ["wavespeed-ai/seedance-2.0", "Seedance 2.0"], ["wavespeed-ai/wan-2.1-i2v-720p", "WAN 2.1 I2V"], ["wavespeed-ai/wan-2.2-i2v-720p", "WAN 2.2 I2V"], ["wavespeed-ai/wan-2.7", "WAN 2.7"], ["wavespeed-ai/kling-v1", "Kling V1"], ["wavespeed-ai/kling-v3", "Kling 3"], ["wavespeed-ai/veo-3.1", "Veo 3.1"], ["wavespeed-ai/sora-2", "Sora 2"], ["wavespeed-ai/hunyuan-video/t2v", "Hunyuan Video"], ["wavespeed-ai/ltx-video", "LTX Video"], ["wavespeed-ai/hailuo-2.3", "Hailuo 2.3"], ["wavespeed-ai/viduq3/t2v", "Vidu Q3"], ["wavespeed-ai/viduone", "Vidu One"], ["wavespeed-ai/minimax-video", "MiniMax Video"], ["wavespeed-ai/runway-gen4", "Runway Gen-4"],
  ].map(([model, label]) => ({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: ["text-to-video", "image-to-video", "reference-to-video"], status: "live" }))
); */
modelCatalog.push({ provider: "fal", model: "fal-seedream-v45", label: "Seedream 4.5 · fal", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" }, { provider: "fal", model: "fal-seedream-v5-lite", label: "Seedream 5 Lite · fal", modes: ["text-to-image", "image-edit", "reference-image"], status: "live" }, { provider: "kie", model: "kie-gpt4o-image", label: "GPT-4o Image · Kie", modes: ["text-to-image", "image-edit"], status: "live" }, { provider: "kie", model: "kie-veo-3.1", label: "Veo 3.1 · Kie", modes: ["text-to-video", "image-to-video"], status: "live" }, { provider: "kie", model: "kie-kling-2.6-t2v", label: "Kling 2.6 · T2V · Kie", modes: ["text-to-video"], status: "live" }, { provider: "kie", model: "kie-kling-2.6-i2v", label: "Kling 2.6 · I2V · Kie", modes: ["image-to-video"], status: "live" }, { provider: "kie", model: "kie-seedance-2-video", label: "Seedance 2.0 · Kie", modes: ["text-to-video", "image-to-video"], status: "live" }, { provider: "wavespeed", model: "wavespeed-gpt-image-2", label: "GPT Image 2 · WaveSpeed", modes: ["text-to-image", "image-edit"], status: "live" }, { provider: "wavespeed", model: "wavespeed-seedream-v5-pro", label: "Seedream 5 Pro · WaveSpeed", modes: ["text-to-image", "image-edit"], status: "live" }, { provider: "openrouter", model: "openrouter-creative-text", label: "OpenRouter Creative Text", modes: ["director", "prompt", "text"], status: "live" });
// The original 30-id invented list is gone. Every id in it either (a) had a
// real equivalent under a DIFFERENT vendor prefix — kwaivgi/ for Kling,
// minimax/ for Hailuo, lightricks/ for LTX, vidu/ for Vidu, runwayml/ for
// Runway, alibaba/ for WAN — now added below under its correct id, or (b)
// genuinely does not exist on WaveSpeed at all. Keeping the old broken id
// alongside a working replacement with a near-identical name (e.g. two
// "Seedance 2.0 · WaveSpeed" entries, one dead) is what produced the "this
// doesn't work" report — so superseded ids are removed outright rather than
// left in-build. flux-dev and flux-schnell were the only two invented ids
// that happened to already be correct; they were promoted to `live` above.
// Confirmed genuinely absent from WaveSpeed's catalog on 2026-07-18 — no
// known vendor prefix carries these models there.
const waveSpeedUnavailableModels = ["stable-diffusion-xl", "sd-3.5-large"];
waveSpeedUnavailableModels.forEach((model) => modelCatalog.push({ provider: "wavespeed", model: `wavespeed-ai/${model}`, label: `${model} · WaveSpeed (not available)`, modes: ["text-to-image"], status: "in-build" }));
// Verified against WaveSpeed's published sitemap of model pages on 2026-07-18.
// Each entry is one slug = one operation, and `modes` names that single
// operation so the mode dropdown cannot offer a mismatch.
const waveSpeedVerifiedVideoModels = [
  ["bytedance/seedance-2.0/text-to-video", "Seedance 2.0 · T2V", "text-to-video"],
  ["bytedance/seedance-2.0/image-to-video", "Seedance 2.0 · I2V", "image-to-video"],
  ["bytedance/seedance-2.0-fast/image-to-video", "Seedance 2.0 Fast · I2V", "image-to-video"],
  ["alibaba/wan-2.7/text-to-video", "WAN 2.7 · T2V", "text-to-video"],
  ["alibaba/wan-2.7/image-to-video", "WAN 2.7 · I2V", "image-to-video"],
  ["alibaba/wan-2.7/reference-to-video", "WAN 2.7 · Ref2V", "reference-to-video"],
  ["kwaivgi/kling-v2.6-pro/text-to-video", "Kling 2.6 Pro · T2V", "text-to-video"],
  ["kwaivgi/kling-v2.6-pro/image-to-video", "Kling 2.6 Pro · I2V", "image-to-video"],
  ["google/veo3.1/text-to-video", "Veo 3.1 · T2V", "text-to-video"],
  ["google/veo3.1/image-to-video", "Veo 3.1 · I2V", "image-to-video"],
  ["google/veo3.1/reference-to-video", "Veo 3.1 · Ref2V", "reference-to-video"],
  ["google/veo3.1-fast/text-to-video", "Veo 3.1 Fast · T2V", "text-to-video"],
  ["openai/sora-2/text-to-video", "Sora 2 · T2V", "text-to-video"],
  ["openai/sora-2/image-to-video", "Sora 2 · I2V", "image-to-video"]
];
waveSpeedVerifiedVideoModels.forEach(([model, label, mode]) => modelCatalog.push({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: [mode], status: "live" }));
// Round 2: the remaining ids that had real equivalents under a corrected
// vendor prefix or operation suffix. Same sitemap verification as above.
const waveSpeedVerifiedVideoModelsRound2 = [
  ["wavespeed-ai/hunyuan-video/t2v", "Hunyuan Video", "text-to-video"],
  ["wavespeed-ai/wan-2.1/i2v-720p", "WAN 2.1 I2V", "image-to-video"],
  ["wavespeed-ai/wan-2.2/i2v-720p", "WAN 2.2 I2V", "image-to-video"],
  ["wavespeed-ai/wan-2.2/t2v-720p", "WAN 2.2 T2V", "text-to-video"],
  ["kwaivgi/kling-v1.6-i2v-pro", "Kling 1.6 I2V Pro", "image-to-video"],
  ["kwaivgi/kling-v3-turbo-pro/text-to-video", "Kling 3 Turbo Pro · T2V", "text-to-video"],
  ["kwaivgi/kling-v3-turbo-pro/image-to-video", "Kling 3 Turbo Pro · I2V", "image-to-video"],
  ["lightricks/ltx-2-pro/text-to-video", "LTX 2 Pro · T2V", "text-to-video"],
  ["lightricks/ltx-2-pro/image-to-video", "LTX 2 Pro · I2V", "image-to-video"],
  ["minimax/hailuo-02/t2v-pro", "Hailuo 02 Pro · T2V", "text-to-video"],
  ["minimax/hailuo-02/i2v-pro", "Hailuo 02 Pro · I2V", "image-to-video"],
  ["vidu/q3-pro/text-to-video", "Vidu Q3 Pro · T2V", "text-to-video"],
  ["vidu/q3-pro/image-to-video", "Vidu Q3 Pro · I2V", "image-to-video"],
  ["runwayml/gen4-turbo", "Runway Gen-4 Turbo", "image-to-video"]
];
waveSpeedVerifiedVideoModelsRound2.forEach(([model, label, mode]) => modelCatalog.push({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: [mode], status: "live" }));
// Same fix as the video slugs above, for the image side of the catalog.
// Verified against WaveSpeed's published sitemap of model pages on 2026-07-18.
const waveSpeedVerifiedImageModels = [
  ["google/nano-banana-2/text-to-image", "Nano Banana 2", "text-to-image"],
  ["google/nano-banana-2/edit", "Nano Banana 2 · Edit", "image-edit"],
  ["google/nano-banana-pro/text-to-image", "Nano Banana Pro", "text-to-image"],
  ["google/nano-banana-pro/edit", "Nano Banana Pro · Edit", "image-edit"],
  ["bytedance/seedream-v4.5", "Seedream 4.5", "text-to-image"],
  ["bytedance/seedream-v4.5/edit", "Seedream 4.5 · Edit", "image-edit"],
  ["wavespeed-ai/flux-2-dev/text-to-image", "FLUX 2 Dev", "text-to-image"],
  ["wavespeed-ai/flux-2-dev/edit", "FLUX 2 Dev · Edit", "image-edit"],
  ["wavespeed-ai/flux-dev", "FLUX Dev", "text-to-image"],
  ["wavespeed-ai/flux-schnell", "FLUX Schnell", "text-to-image"],
  ["google/imagen4", "Imagen 4", "text-to-image"],
  ["ideogram-ai/ideogram-v3-quality", "Ideogram 3", "text-to-image"],
  ["recraft-ai/recraft-v4-pro/text-to-image", "Recraft V4 Pro", "text-to-image"]
];
// flux-dev and flux-schnell also exist in the invented list above, marked
// in-build along with the 27 that don't resolve — but these two do resolve.
// Promote the existing entry instead of pushing a duplicate model id.
waveSpeedVerifiedImageModels.forEach(([model, label, mode]) => {
  const existing = modelCatalog.find((item) => item.provider === "wavespeed" && item.model === model);
  if (existing) { existing.status = "live"; existing.modes = [mode]; return; }
  modelCatalog.push({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: [mode], status: "live" });
});
// Round 2 for images — same corrected-vendor-prefix fixes as the video round 2.
const waveSpeedVerifiedImageModelsRound2 = [
  ["wavespeed-ai/flux-2-max/text-to-image", "FLUX 2 Max", "text-to-image"],
  ["wavespeed-ai/flux-2-max/edit", "FLUX 2 Max · Edit", "image-edit"],
  ["wavespeed-ai/flux-kontext-pro/text-to-image", "FLUX Kontext Pro", "text-to-image"],
  ["recraft-ai/recraft-v3", "Recraft V3", "text-to-image"],
  ["wavespeed-ai/qwen-image-2.0-pro/text-to-image", "Qwen Image 2.0 Pro", "text-to-image"],
  ["wavespeed-ai/qwen-image-2.0-pro/edit", "Qwen Image 2.0 Pro · Edit", "image-edit"],
  ["bytedance/seedream-v5.0-lite", "Seedream 5 Lite", "text-to-image"]
];
waveSpeedVerifiedImageModelsRound2.forEach(([model, label, mode]) => modelCatalog.push({ provider: "wavespeed", model, label: `${label} · WaveSpeed`, modes: [mode], status: "live" }));
// fal's own catalog — verified against fal.ai's real model pages (titles
// checked, not just a 200 status), not invented. fal's Seedance offering is
// v1 Pro, not 2.0 — label reflects the real model, not what WaveSpeed carries.
const falVerifiedVideoModels = [
  ["fal-ai/kling-video/v2.1/master/text-to-video", "Kling 2.1 Master · T2V", "text-to-video"],
  ["fal-ai/kling-video/v2.1/master/image-to-video", "Kling 2.1 Master · I2V", "image-to-video"],
  ["fal-ai/bytedance/seedance/v1/pro/text-to-video", "Seedance 1.0 Pro · T2V", "text-to-video"],
  ["fal-ai/bytedance/seedance/v1/pro/image-to-video", "Seedance 1.0 Pro · I2V", "image-to-video"]
];
falVerifiedVideoModels.forEach(([model, label, mode]) => modelCatalog.push({ provider: "fal", model, label: `${label} · fal`, modes: [mode], status: "live" }));
// Advanced video endpoints are deliberately listed separately because their
// reference contract is richer than a standard image-to-video model.
[
  ["bytedance/seedance-2.0/text-to-video", "Seedance 2.0 · T2V", "text-to-video"],
  ["bytedance/seedance-2.0/image-to-video", "Seedance 2.0 · I2V", "image-to-video"],
  ["bytedance/seedance-2.0/reference-to-video", "Seedance 2.0 · Reference-to-Video", "reference-to-video"],
  ["fal-ai/kling-video/v3/standard/text-to-video", "Kling 3 · Standard T2V", "text-to-video"],
  ["fal-ai/kling-video/v3/standard/image-to-video", "Kling 3 · Standard I2V", "image-to-video"],
  ["fal-ai/kling-video/o1/standard/reference-to-video", "Kling O1 · Omni Reference", "reference-to-video"]
].forEach(([model, label, mode]) => modelCatalog.push({ provider: "fal", model, label: `${label} · fal`, modes: [mode], status: "live" }));
const registeredModelCapability = (model) => ({
  "local-flux1-schnell-fp8": { ratios: ["16:9", "9:16", "1:1", "3:2", "2:3"], references: [], controls: ["prompt", "negative prompt", "seed"], output: "Image", inputLimits: { image: 0, video: 0, audio: 0 } },
  "local-wan21-fun-inp-1.3b": { ratios: ["16:9", "9:16", "1:1"], references: [], controls: ["prompt", "negative prompt", "duration", "seed", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, endFrame: true, duration: [2, 5], resolutions: ["480p"] },
  "local-ltxv2b-0.9.8-distilled": { ratios: ["16:9", "9:16", "1:1"], references: [], controls: ["prompt", "negative prompt", "duration", "seed"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, endFrame: false, duration: [2, 5], resolutions: ["480p"] },
  "gpt-5.1": { ratios: ["1:1", "3:2", "2:3"], references: [], controls: ["prompt", "negative prompt", "camera"], output: "Text" },
  "gpt-image-1": { ratios: ["16:9", "9:16", "1:1", "3:2", "2:3", "21:9"], references: ["image"], controls: ["prompt", "negative prompt", "quality", "reference fidelity"], output: "Image" },
  "gemini-2.5-flash-image": { ratios: ["1:1", "16:9", "9:16", "3:2", "4:5"], references: ["image"], controls: ["prompt", "negative prompt", "reference fidelity", "seed"], output: "Image" },
  "gemini-3.1-flash-image": { ratios: ["1:1", "16:9", "9:16", "3:2", "4:5"], references: ["image"], controls: ["prompt", "negative prompt", "reference fidelity", "seed", "quality"], output: "Image" },
  "gemini-3-pro-image": { ratios: ["1:1", "16:9", "9:16", "3:2", "4:5"], references: ["image"], controls: ["prompt", "negative prompt", "reference fidelity", "seed", "quality"], output: "Image" },
  "fal-seedream-v45": { ratios: ["1:1", "16:9", "9:16", "3:2"], references: ["image"], controls: ["prompt", "negative prompt", "quality", "reference fidelity"], output: "Image" },
  "fal-seedream-v5-lite": { ratios: ["1:1", "16:9", "9:16", "3:2"], references: ["image"], controls: ["prompt", "negative prompt", "quality", "reference fidelity"], output: "Image" },
  "wavespeed-gpt-image-2": { ratios: ["1:1", "16:9", "9:16"], references: ["image"], controls: ["prompt", "negative prompt", "quality", "reference fidelity"], output: "Image" },
  "wavespeed-seedream-v5-pro": { ratios: ["1:1", "16:9", "9:16"], references: [], controls: ["prompt", "negative prompt", "quality"], output: "Image" },
  "kie-gpt4o-image": { ratios: ["1:1", "16:9", "9:16"], references: ["image"], controls: ["prompt", "reference fidelity"], output: "Image" },
  "kie-veo-3.1": { ratios: ["16:9", "9:16"], references: ["image"], controls: ["prompt", "duration", "quality"], output: "Video", resolutions: ["720p", "1080p"] },
  "kie-kling-2.6-t2v": { ratios: ["1:1", "16:9", "9:16"], references: [], controls: ["prompt", "duration", "audio"], output: "Video", resolutions: ["720p", "1080p"] },
  // Kie's own docs don't list an aspect_ratio input for image-to-video — the
  // shot inherits the reference image's own aspect instead, so no ratio is
  // sent (see kieMarketInput in electron-main.js).
  "kie-kling-2.6-i2v": { ratios: ["16:9"], references: [], controls: ["prompt", "duration", "audio", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, resolutions: ["720p", "1080p"] },
  "kie-seedance-2-video": { ratios: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"], references: [], controls: ["prompt", "duration", "resolution", "audio", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, resolutions: ["480p", "720p", "1080p"] }
  ,"bytedance/seedance-2.0/text-to-video": { ratios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], references: [], controls: ["prompt", "negative prompt", "duration", "resolution", "audio", "seed"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, nativeAudio: true, resolutions: ["480p", "720p"] },
  "bytedance/seedance-2.0/image-to-video": { ratios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], references: [], controls: ["prompt", "negative prompt", "duration", "resolution", "audio", "seed", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, nativeAudio: true, resolutions: ["480p", "720p"] },
  "bytedance/seedance-2.0-fast/image-to-video": { ratios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], references: [], controls: ["prompt", "negative prompt", "duration", "resolution", "audio", "seed", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, nativeAudio: true, resolutions: ["480p", "720p"] },
  "kwaivgi/kling-v2.6-pro/image-to-video": { ratios: ["16:9", "9:16", "1:1"], references: [], controls: ["prompt", "negative prompt", "duration", "frame control"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, resolutions: ["720p", "1080p"] },
  "bytedance/seedance-2.0/reference-to-video": { ratios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], references: ["image", "video", "audio"], controls: ["prompt", "negative prompt", "duration", "resolution", "audio", "seed", "multi-reference"], output: "Video", inputLimits: { image: 9, video: 3, audio: 3 }, nativeAudio: true, resolutions: ["480p", "720p"] },
  "fal-ai/kling-video/v3/standard/text-to-video": { ratios: ["16:9", "9:16", "1:1"], references: [], controls: ["prompt", "negative prompt", "duration", "audio", "multi-shot"], output: "Video", inputLimits: { image: 0, video: 0, audio: 0 }, nativeAudio: true, resolutions: ["720p", "1080p"] },
  "fal-ai/kling-video/v3/standard/image-to-video": { ratios: ["16:9", "9:16", "1:1"], references: ["image", "video"], controls: ["prompt", "negative prompt", "duration", "audio", "frame control", "multi-shot", "multi-reference"], output: "Video", inputLimits: { image: 7, video: 7, audio: 0 }, startEndFrames: true, singleSourceImageToVideo: false, nativeAudio: true, resolutions: ["720p", "1080p"] },
  "fal-ai/kling-video/o1/standard/reference-to-video": { ratios: ["16:9", "9:16", "1:1"], references: ["image"], controls: ["prompt", "duration", "multi-reference"], output: "Video", inputLimits: { image: 7, video: 0, audio: 0 }, omniElements: true, resolutions: ["720p", "1080p"] }
}[model] || (String(model).includes("/") ? (/(video|i2v|t2v|veo|sora|kling|wan|vidu|hunyuan|ltx|hailuo|runway|minimax|seedance)/i.test(String(model)) ? { ratios: ["16:9", "9:16", "21:9", "4:3", "3:4", "1:1"], references: ["image"], controls: ["prompt", "negative prompt", "duration", "motion", "audio"], output: "Video", inputLimits: { image: 4, video: 0, audio: 0 } } : { ratios: ["1:1", "16:9", "9:16", "21:9", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4"], references: ["image"], controls: ["prompt", "negative prompt", "quality", "reference fidelity"], output: "Image", inputLimits: { image: 8, video: 0, audio: 0 } }) : { ratios: ["16:9", "9:16", "1:1"], references: ["image"], controls: ["prompt"], output: "Output", inputLimits: { image: 0, video: 0, audio: 0 } }));
const modelCapability = (model) => {
  const capability = registeredModelCapability(model);
  const singleSourceI2V = capability.singleSourceImageToVideo !== false && capability.output === "Video" && /(?:image-to-video|(?:^|[\/-])i2v(?:[\/-]|$))/i.test(String(model)) && !/reference-to-video/i.test(String(model));
  return singleSourceI2V ? { ...capability, references: [], inputLimits: { image: 0, video: 0, audio: 0 }, startEndFrames: true, singleSourceImageToVideo: true } : capability;
};
// Start/end frames are a specialized video transition control. Never expose
// them merely because a stale setting exists on the shot or an image model
// happens to share a capability object with a video endpoint.
const supportsStartEndFrames = (capability) => String(capability?.output || "").toLowerCase() === "video" && capability?.startEndFrames === true;

const blankProject = () => ({ id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "Untitled Film", logline: "", premise: "", world: "", themes: [], rules: "", relationships: "", source: { name: "", text: "", importedAt: "" }, ingestion: { status: "empty", analysis: null, importedAt: "", warnings: [] }, directorReview: null, scriptSuggestions: [], storyVersions: [], lockedFields: [], style: "", visualDirection: null, characters: [], locations: [], sets: [], props: [], scenes: [], assets: [], audioTracks: [], styleDnas: [], updatedAt: new Date().toISOString() });
function toggleFieldLock(scope) {
  project.lockedFields = Array.isArray(project.lockedFields) ? project.lockedFields : [];
  const index = project.lockedFields.indexOf(scope);
  if (index >= 0) { project.lockedFields.splice(index, 1); notify(`${scope === "logline" ? "Logline" : "Premise"} unlocked — AI suggestions may propose changes to it again.`); }
  else { project.lockedFields.push(scope); notify(`${scope === "logline" ? "Logline" : "Premise"} locked — AI suggestions will never propose changing it.`); }
  setDirty(); render();
}
let project = blankProject();
let filePath = "";
let active = "Home";
let dirty = false;
let launchVisible = true;
let navMode = localStorage.getItem("storymaker-navigation") || "full";
let theme = localStorage.getItem("storymaker-theme") || "dark";
let experienceMode = localStorage.getItem("storymaker-experience-mode") || "studio";
let providerState = { encryptionAvailable: false, providers: {}, health: {} };
let providerDiagnostics = null;
let localRuntimeState = {
  ollama: { state: "offline", models: [], message: "Ollama has not been checked yet." },
  comfyui: { state: "offline", devices: [], capabilities: { image: false, video: false }, message: "ComfyUI has not been checked yet." }
};
let deliveryState = { previewRender: false };
let mediaFilter = "all";
let designFilter = "all";
let selectedSceneIndex = 0;
let jobRecoveryRunning = false;
const recoveredGenerationJobIds = new Set();
const activeVideoMonitorIds = new Set();

const $ = (selector) => document.querySelector(selector);
const esc = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const providerReady = (id) => id === "comfyui"
  ? String(localRuntimeState.comfyui?.state || "") === "ready"
  : id === "ollama"
    ? ["ready", "available"].includes(String(localRuntimeState.ollama?.state || ""))
    : Boolean(providerState.providers?.[id]);
const modelReady = (item) => {
  if (!item || item.status !== "live") return false;
  if (item.provider !== "comfyui") return providerReady(item.provider);
  if (item.model === "local-flux1-schnell-fp8") return Boolean(localRuntimeState.comfyui?.capabilities?.image);
  if (item.model === "local-wan21-fun-inp-1.3b") return Boolean(localRuntimeState.comfyui?.capabilities?.video);
  if (item.model === "local-ltxv2b-0.9.8-distilled") return Boolean(localRuntimeState.comfyui?.capabilities?.videoLtx);
  return false;
};
const providerLabel = (id) => ({ google: "Google AI", fal: "fal", wavespeed: "WaveSpeed", kie: "Kie", openrouter: "OpenRouter", openai: "OpenAI", ollama: "Ollama", comfyui: "ComfyUI" }[id] || id);
const projectAssets = () => Array.isArray(project.assets) ? project.assets : [];
const mediaIcon = (kind) => ({ image: "▧", video: "▷", audio: "♫", file: "◇" }[kind] || "◇");
const fileUrl = (media) => media?.previewUrl || (media?.path ? `file:///${encodeURI(String(media.path).replace(/\\/g, "/"))}` : "");
const assetDisplayTitle = (asset) => String(asset?.displayName || asset?.name || "Generated take").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+\d{10,}[-_][a-z0-9]{4,}$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Generated take";
// One tile shared by both reference pickers (initial shot-director build and
// the capability-filtered refresh) so a checkbox-and-filename debug list reads
// as a real asset grid instead.
// `removable` is opt-in per call site rather than baked into every picker —
// Character Lab wants a delete affordance right on the tile (the gallery
// there pools every project image, not just this character's own), but a
// shot's reference tray shouldn't let a stray click delete a shared asset
// out from under other shots that are actively using it.
const referenceChoiceTile = (asset, checked, inputName = "shotReferences", removable = false, locked = false) => `<label class="reference-tile${checked ? " picked" : ""}${locked ? " continuity-locked" : ""}" title="${esc(locked ? `${asset.name} is automatically attached for scene continuity` : asset.name)}"><input type="checkbox" name="${inputName}" value="${esc(asset.id)}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""}/>${asset.kind === "image" ? `<span class="reference-tile-art" style="background-image:url('${esc(fileUrl(asset))}')"></span>` : `<span class="reference-tile-art reference-tile-icon">${mediaIcon(asset.kind)}</span>`}<small>${esc(asset.name)}</small>${locked ? `<em>CONTINUITY</em>` : ""}${asset.kind === "image" ? `<button type="button" class="reference-tile-zoom" data-lightbox-asset="${esc(asset.id)}" title="View ${esc(asset.name)} full size">⤢</button>` : ""}${removable ? `<button type="button" class="reference-tile-remove" data-remove-reference-asset="${esc(asset.id)}" title="Remove ${esc(asset.name)} from the project">×</button>` : ""}</label>`;
// Shared reference-library component: a hero preview + role-tagged thumbnail
// grid, used by every "make this consistent" profile (Character/Set/Prop)
// AND every generation Lab (Character/Set/Prop). Built once so a character's
// upgrade doesn't quietly leave sets and props on an older pattern — the
// exact drift this replaces (Character had gotten a hero+role picker; Set
// and Prop were still a bare <select>, and the Labs were still a flat grid
// of unlabeled checkboxes with no preview of what they'd just generated).
// Only one instance is ever open at a time (one modal at a time), so every
// caller shares one checkbox-group name and one hero element id rather than
// threading unique ones through five call sites for no real benefit.
const REFERENCE_LIBRARY_INPUT = "referenceLibraryAsset";
const REFERENCE_ROLE_OPTIONS = [["Primary", "Primary identity"], ["Secondary", "Secondary look"], ["Wardrobe", "Wardrobe"], ["Expression", "Expression"], ["Pose", "Pose"], ["Environment", "Environment"]];
// {assetId -> role}, folding in the legacy single referenceAssetId as an
// implied Primary when it isn't already explicitly tagged — older
// projects, and every fresh Lab generation, only ever set that one field.
function entityReferenceRoles(entity) {
  const roles = new Map((entity?.references || []).map((reference) => [reference.assetId, reference.role || "Secondary"]));
  if (entity?.referenceAssetId && !roles.has(entity.referenceAssetId)) roles.set(entity.referenceAssetId, "Primary");
  return roles;
}
// A reference library belongs to the entity being edited. Keeping this
// boundary explicit prevents a character's turnaround from quietly becoming
// a candidate reference for a prop or location just because both live in the
// same project media folder.
const entityOwnedReferenceIds = (entity, extraIds = []) => new Set([
  ...entityReferenceRoles(entity).keys(),
  ...extraIds,
].filter(Boolean));
function attachImportedReferences(entity, additions, extraIds = []) {
  const existing = entityOwnedReferenceIds(entity, extraIds);
  const newImageIds = additions.filter((asset) => asset?.kind === "image" && !existing.has(asset.id)).map((asset) => asset.id);
  if (!newImageIds.length) return;
  const current = Array.isArray(entity.references) ? entity.references : [];
  entity.references = [...current, ...newImageIds.map((assetId, index) => ({ assetId, role: !entity.referenceAssetId && index === 0 ? "Primary" : "Secondary" }))];
  if (!entity.referenceAssetId) entity.referenceAssetId = newImageIds[0];
  setDirty();
}
// Whichever reference is actually tagged Primary right now wins the hero
// slot — not just "whatever referenceAssetId happens to still say" — so the
// large preview never goes stale relative to what the role dropdowns show.
function referenceLibraryFocusedAsset(images, roles) {
  const primaryId = [...roles.entries()].find(([, role]) => role === "Primary")?.[0];
  return (primaryId && images.find((media) => media.id === primaryId))
    || [...roles.keys()].map((id) => images.find((media) => media.id === id)).find(Boolean)
    || images[0] || null;
}
function referenceLibraryHeroMarkup(asset, roleLabel) {
  return asset
    ? `<span class="reference-library-hero-image" style="background-image:url('${esc(fileUrl(asset))}')"></span><div class="reference-library-hero-caption"><strong>${esc(assetDisplayTitle(asset))}</strong><small>${esc(roleLabel || "Preview")}</small></div>`
    : `<div class="reference-library-hero-empty"><span>♙</span><p>Select or preview a reference below to see it here.</p></div>`;
}
function referenceLibraryCardMarkup(media, role) {
  // The "⤢" used to just swap the inline hero above the grid — but that hero
  // is capped to this sidebar's width, so in the Lab modals (a narrow aside
  // next to the design brief) it ended up barely bigger than the thumbnail
  // being zoomed. Wired to the same full-screen lightbox the Shot Director's
  // reference picker already uses (see referenceChoiceTile's data-lightbox-
  // asset) so "preview large" actually means large, everywhere this grid
  // appears.
  return `<label class="reference-library-card ${role ? "selected" : ""}"><input type="checkbox" name="${REFERENCE_LIBRARY_INPUT}" value="${esc(media.id)}" ${role ? "checked" : ""}/><span class="reference-library-thumb" style="background-image:url('${esc(fileUrl(media))}')"><button type="button" class="reference-tile-remove" data-remove-reference-asset="${esc(media.id)}" title="Remove ${esc(assetDisplayTitle(media))} from the project">×</button><button type="button" class="reference-library-preview" data-lightbox-asset="${esc(media.id)}" title="View ${esc(assetDisplayTitle(media))} full size">⤢</button></span><span class="reference-library-name">${esc(assetDisplayTitle(media))}</span><select data-reference-role="${esc(media.id)}" ${role ? "" : "disabled"}>${REFERENCE_ROLE_OPTIONS.map(([value, label]) => `<option value="${value}" ${role === value ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>`;
}
// head copy + hero + grid/empty-state + import button, ready to drop into a
// sidebar/portrait column. Caller still owns wiring the returned
// importButtonId's click handler (it varies: re-open a profile modal vs a
// Lab), and must call wireReferenceLibrary(images, onRemoved) right after
// injecting this into the DOM.
function referenceLibraryMarkup({ images, roles, headTitle, headDescription, importButtonId }) {
  const focused = referenceLibraryFocusedAsset(images, roles);
  return `<div class="reference-library-head"><small>${esc(headTitle)}</small><p>${esc(headDescription)}</p></div><div class="reference-library-hero" id="referenceLibraryHero" data-focused-asset="${focused ? esc(focused.id) : ""}">${referenceLibraryHeroMarkup(focused, roles.get(focused?.id))}</div>${images.length ? `<div class="reference-library-grid">${images.map((media) => referenceLibraryCardMarkup(media, roles.get(media.id) || "")).join("")}</div>` : `<div class="reference-library-empty">Import an image to establish the visual source of truth.</div>`}<button type="button" id="${importButtonId}" class="quiet-button">Import reference media</button>`;
}
// Call once right after the markup above is in the DOM. Keeps the hero in
// sync with three different ways a card can change: checking/unchecking it,
// re-rolling its tag, or explicitly previewing it (which touches neither
// checkbox nor role — browsing candidates must never silently tag them).
// Removing a card is handled in place (drop the DOM node, fall back the hero
// if it was the focused one) rather than by asking the caller to re-open its
// whole modal — a full re-open would discard whatever the user is mid-typing
// in the surrounding form fields just for pruning one bad reference.
// onRemoved(assetId), if given, only fires for cosmetic follow-up a caller
// wants (e.g. an "N references" count elsewhere in its own header).
function wireReferenceLibrary(images, onRemoved) {
  let pool = images.slice();
  const refreshHero = (assetId) => {
    const hero = $("#referenceLibraryHero"); if (!hero) return;
    const asset = pool.find((media) => media.id === assetId); if (!asset) return;
    const roleSelect = document.querySelector(`[data-reference-role="${CSS.escape(assetId)}"]`);
    const roleLabel = roleSelect && !roleSelect.disabled ? roleSelect.options[roleSelect.selectedIndex]?.text : "Preview";
    hero.dataset.focusedAsset = assetId;
    hero.innerHTML = referenceLibraryHeroMarkup(asset, roleLabel);
  };
  document.querySelectorAll(`input[name="${REFERENCE_LIBRARY_INPUT}"]`).forEach((input) => input.addEventListener("change", () => {
    const card = input.closest(".reference-library-card"); const role = card?.querySelector("select");
    card?.classList.toggle("selected", input.checked);
    if (role) role.disabled = !input.checked;
    refreshHero(input.value);
  }));
  document.querySelectorAll("[data-reference-role]").forEach((select) => select.addEventListener("change", () => refreshHero(select.dataset.referenceRole)));
  // The "⤢" button now carries data-lightbox-asset instead of
  // data-preview-reference-asset, so it's handled by the global delegated
  // lightbox listener in ensureLightboxDelegation() — no local wiring needed.
  document.querySelectorAll(".reference-library-card [data-remove-reference-asset]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault(); event.stopPropagation();
    const assetId = button.dataset.removeReferenceAsset;
    if (!(await removeReferenceAssetWithConfirm(assetId))) return;
    pool = pool.filter((media) => media.id !== assetId);
    button.closest(".reference-library-card")?.remove();
    const hero = $("#referenceLibraryHero");
    if (hero?.dataset.focusedAsset === assetId) {
      const fallback = pool[0] || null;
      hero.dataset.focusedAsset = fallback?.id || "";
      hero.innerHTML = referenceLibraryHeroMarkup(fallback, fallback ? "Preview" : "");
    }
    onRemoved?.(assetId);
  }));
}
const REFERENCE_LIBRARY_ROOT_ID = "referenceLibraryRoot";
// Builds (and, on re-invocation, refreshes) the reference-library region in
// place inside a caller-provided <... id="referenceLibraryRoot"> container —
// used both to populate it right after a modal opens and to redraw it after
// a successful import. Importing used to be wired to just reopen the whole
// modal, which meant it — like the remove button before this fix — silently
// discarded whatever the user was mid-typing elsewhere in the same form
// (design brief, name, description) just to show the new thumbnail. Every
// other field in the modal is left completely untouched. Self-re-arming: it
// re-attaches the import button's own click handler to call itself again on
// the next import, so callers only ever invoke it directly once, at mount.
function mountReferenceLibrary({ roles, getRoles, ownedAssetIds, onImported, headTitle, headDescription, importButtonId, onRemoved }) {
  const root = document.getElementById(REFERENCE_LIBRARY_ROOT_ID);
  if (!root) return;
  const activeRoles = getRoles ? getRoles() : roles || new Map();
  const ownedIds = typeof ownedAssetIds === "function" ? ownedAssetIds() : ownedAssetIds;
  const images = projectAssets().filter((media) => media.kind === "image" && (!ownedIds || ownedIds.has(media.id)));
  root.innerHTML = referenceLibraryMarkup({ images, roles: activeRoles, headTitle, headDescription, importButtonId });
  wireReferenceLibrary(images, onRemoved);
  const badge = document.querySelector(".character-lab-hero .autosave");
  if (badge) badge.textContent = `${images.length} IMAGE REFERENCE${images.length === 1 ? "" : "S"}`;
  const importButton = document.getElementById(importButtonId);
  if (importButton) importButton.onclick = async () => {
    try {
      const additions = await importAssetsIntoProject();
      if (additions.length) { onImported?.(additions); mountReferenceLibrary({ roles, getRoles, ownedAssetIds, onImported, headTitle, headDescription, importButtonId, onRemoved }); }
      else notify("No new media was imported. Choose image, video, or audio files from the picker.");
    } catch (error) { notify(error?.message || "Reference media could not be imported."); }
  };
}
function expandLabReferenceGallery(formSelector) {
  const form = document.querySelector(formSelector); const grid = form?.querySelector(".character-lab-grid"); const root = document.getElementById(REFERENCE_LIBRARY_ROOT_ID);
  if (!form || !grid || !root || form.querySelector(".asset-reference-section")) return;
  const section = document.createElement("section");
  section.className = "character-reference-section asset-reference-section";
  section.setAttribute("aria-label", "Reference gallery");
  grid.insertAdjacentElement("afterend", section);
  section.append(root);
}
// Read at submit/generate time: every checked card, each with whatever role
// its own dropdown currently holds (defaulting Secondary if somehow absent).
function readReferenceLibrarySelections() {
  return [...document.querySelectorAll(`input[name="${REFERENCE_LIBRARY_INPUT}"]:checked`)].map((input) => ({
    assetId: input.value,
    role: document.querySelector(`[data-reference-role="${CSS.escape(input.value)}"]`)?.value || "Secondary"
  }));
}
// Shared production-entity card: the same visual language across Character,
// Set, and Prop lists, which had each grown their own copy and drifted —
// Character showed three stats (LOOK/VOICE/SCENES) where Set and Prop showed
// one (SCENES alone, in a grid built for three columns, leaving two-thirds
// of the row empty), and an unset role/mood rendered as a stray eyebrow
// reading "A role still taking shape." above the name instead of just not
// being there. One card now: the name always leads (no eyebrow competing
// with it when there's nothing real to say yet), and every card shows the
// same two numbers — tagged references and scene usage — which actually
// means something now that references carry role tags, instead of a static
// "REFERENCE"/"ADD REFERENCE" label that never said how much existed.
function entityCardMarkup({ index, name, eyebrow, description, emptyDescription, referenceCount, sceneCount, image, editAttr, editLabel, labAttr, labLabel, removeAttr, cardClass = "", assignAttr, assignLabel = "Assign to scenes" }) {
  const hasImage = Boolean(image);
  const imageBadge = referenceCount > 0 ? `${referenceCount} REFERENCE${referenceCount === 1 ? "" : "S"}` : "ADD REFERENCE";
  return `<article class="character-profile ${cardClass} ${hasImage ? "has-image" : ""}"><button data-${editAttr}="${index}" class="character-profile-image" ${hasImage ? `style="background-image:linear-gradient(0deg,#090c14d8,#090c1400),url('${esc(image)}')"` : ""}><span>${String(index + 1).padStart(2, "0")}</span><em>${esc(imageBadge)}</em></button><div class="character-profile-copy">${eyebrow ? `<small>${esc(eyebrow)}</small>` : ""}<h2>${esc(name)}</h2><p>${esc(description || emptyDescription)}</p><dl><div><dt>REFERENCES</dt><dd>${referenceCount}</dd></div><div><dt>SCENES</dt><dd>${sceneCount}</dd></div></dl><div class="profile-card-actions"><button data-${labAttr}="${index}" class="character-lab-button">${esc(labLabel)}</button>${assignAttr ? `<button data-${assignAttr}="${index}" class="line-action">${esc(assignLabel)}</button>` : ""}<button data-${editAttr}="${index}" class="line-action">${esc(editLabel)}</button><button data-${removeAttr}="${index}" class="remove-button" title="Remove ${esc(name)}">Remove</button></div></div></article>`;
}
const formatBytes = (value) => { const size = Number(value || 0); if (!size) return "Local media"; if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`; return `${(size / (1024 * 1024)).toFixed(size > 10 * 1024 * 1024 ? 0 : 1)} MB`; };
const assetById = (id) => projectAssets().find((media) => media.id === id);
// The only prior usage check was scene.referenceAssetId — it missed character
// references, approved variations, scene variation history, and every shot
// output, so most in-use assets showed as "Not linked". This is the real,
// complete set of places an asset id can be referenced.
function assetUsages(assetId) {
  if (!assetId) return [];
  const usages = [];
  (project.characters || []).forEach((character) => { if (character.referenceAssetId === assetId || (character.references || []).some((reference) => reference.assetId === assetId)) usages.push({ label: character.name, target: "Character Bible" }); });
  (project.sets || []).forEach((set) => { if (set.referenceAssetId === assetId || (set.references || []).some((reference) => reference.assetId === assetId)) usages.push({ label: set.name, target: "Locations" }); });
  (project.props || []).forEach((prop) => { if (prop.referenceAssetId === assetId || (prop.references || []).some((reference) => reference.assetId === assetId)) usages.push({ label: prop.name, target: "Props" }); });
  (project.scenes || []).forEach((scene) => {
    if (scene.referenceAssetId === assetId || scene.approvedVariationId === assetId || scene.motionAssetId === assetId) usages.push({ label: scene.title, target: "Storyboard" });
    else if ((scene.variations || []).some((variation) => variation.assetId === assetId)) usages.push({ label: `${scene.title} (take)`, target: "Storyboard" });
    (scene.shots || []).forEach((shot) => {
      if (shot.outputAssetId === assetId) usages.push({ label: shot.title, target: "Shots" });
     else if ((shot.modelSettings?.outputHistory || []).some((job) => job.assetId === assetId)) usages.push({ label: `${shot.title} (take)`, target: "Shots" });
      else if ((shot.modelSettings?.outputHistory || []).some((job) => job.assetId === assetId)) usages.push({ label: `${shot.title} (take)`, target: "Shots" });
      const settings = shot.modelSettings || {};
      if ([...(settings.referenceAssetIds || []), ...(settings.videoReferenceAssetIds || []), ...(settings.audioReferenceAssetIds || []), settings.startFrameAssetId, settings.endFrameAssetId].includes(assetId)) usages.push({ label: `${shot.title} (model reference)`, target: "Shot Director" });
    });
  });
  (project.audioTracks || []).forEach((cue) => { if (cue.assetId === assetId) usages.push({ label: cue.type || "Audio cue", target: "Audio Studio" }); });
  return usages;
}
function repairShotOutputHistory(shot) {
  const history = Array.isArray(shot?.modelSettings?.outputHistory) ? shot.modelSettings.outputHistory : [];
  let changed = false;
  history.forEach((job) => {
    if (job?.assetId || !["completed", "succeeded"].includes(String(job?.status || "").toLowerCase())) return;
    const match = projectAssets().find((asset) => asset?.generation && asset.generation.provider === job.provider && asset.generation.model === job.model && asset.kind !== "file");
    if (match) { job.assetId = match.id; if (!shot.outputAssetId) shot.outputAssetId = match.id; changed = true; }
  });
  if (changed) setDirty();
  return history;
}
function shotTakeAssets(shot) {
  const ids = [shot?.outputAssetId, ...(shot?.modelSettings?.outputHistory || []).map((job) => job?.assetId)].filter(Boolean);
  return [...new Map(ids.map((id) => [id, assetById(id)]).filter(([, asset]) => asset)).values()];
}
function sceneTakeEntries(scene) {
  const metadata = new Map((scene?.variations || []).filter((item) => item?.assetId).map((item) => [item.assetId, item]));
  const ids = [
    scene?.motionAssetId,
    scene?.approvedVariationId,
    ...(scene?.shots || []).flatMap((shot) => [shot?.outputAssetId, ...(shot?.modelSettings?.outputHistory || []).map((job) => job?.assetId)]),
    ...(scene?.variations || []).map((variation) => variation?.assetId)
  ].filter(Boolean);
  return [...new Set(ids)].map((id) => {
    const asset = assetById(id);
    return asset ? { variation: metadata.get(id) || { assetId: id, generation: asset.generation || {}, source: "shot-output" }, asset } : null;
  }).filter(Boolean);
}
function visualTakeMarkup({ variation, asset }, index, total, scene) {
  const approved = scene.approvedVariationId === asset.id;
  const motionMaster = scene.motionAssetId === asset.id;
  const media = asset.kind === "video" ? `<video src="${esc(fileUrl(asset))}" muted playsinline preload="metadata"></video><i class="visual-take-play">▶</i>` : "";
  const style = asset.kind === "image" ? ` style="background-image:linear-gradient(0deg,#080b13a8,transparent 65%),url('${esc(fileUrl(asset))}')"` : "";
  const title = approved ? "Storyboard reference" : motionMaster ? "Timeline motion master" : asset.kind === "video" ? "Generated motion take" : "Candidate frame";
  const action = asset.kind === "image"
    ? `<button data-approve-variation="${esc(asset.id)}" class="line-action">${approved ? "Approved" : "Approve for storyboard →"}</button>`
    : `<button data-open-variation="${esc(asset.id)}" class="line-action">${motionMaster ? "Selected for timeline" : "Review video →"}</button>`;
  return `<article class="visual-take ${approved || motionMaster ? "approved" : ""}"><button data-open-variation="${esc(asset.id)}" class="visual-take-image"${style}>${media}<span>TAKE ${String(total - index).padStart(2, "0")} · ${asset.kind.toUpperCase()}</span></button><div><small>${esc(variation.generation?.model || asset.generation?.model || scene.generationSize || "Project media")}</small><h3>${title}</h3>${action}</div></article>`;
}
function syncAutomaticMotionMaster(scene, shot, assetId) {
  if (!scene || !shot || !assetId) return;
  // A one-shot scene can safely use its only video as the scene master. In a
  // multi-shot scene, preserve the explicit master and let each shot retain
  // its own output so the Timeline does not collapse to the last render.
  if ((scene.shots || []).length === 1 || scene.motionMasterShotId === shot.id) {
    scene.motionAssetId = assetId;
    scene.motionMasterShotId = shot.id;
  }
}
function selectShotTake(sceneIndex, shotIndex, assetId) {
  const scene = project.scenes?.[sceneIndex]; const shot = scene?.shots?.[shotIndex]; const asset = assetById(assetId);
  if (!scene || !shot || !asset) return;
  shot.outputAssetId = asset.id;
  if (asset.kind === "video") syncAutomaticMotionMaster(scene, shot, asset.id);
  else { scene.approvedVariationId = asset.id; if (scene.motionMasterShotId === shot.id) { scene.motionAssetId = ""; scene.motionMasterShotId = ""; } }
  setDirty(); render(); notify(`${assetDisplayTitle(asset)} is now the selected ${asset.kind} take for ${shot.title}.`);
}
async function downloadAsset(assetId) {
  const asset = assetById(assetId); if (!asset?.path) return notify("This asset has no local file to download.");
  try { const result = await window.storyMakerDesktop?.saveMediaCopy?.({ path: asset.path }); if (result?.ok) notify(`Saved a copy to ${result.filePath}`); else if (!result?.canceled) notify("That copy could not be saved."); } catch (error) { notify(error?.message || "That copy could not be saved."); }
}
const sceneGeneratedAsset = (scene) => {
  const ids = [scene?.motionAssetId, scene?.approvedVariationId, ...(scene?.shots || []).map((shot) => shot?.outputAssetId), ...(scene?.variations || []).map((variation) => variation?.assetId), scene?.referenceAssetId].filter(Boolean);
  const assets = ids.map(assetById).filter(Boolean);
  // A finished video is the most advanced output a scene has, so it outranks an
  // approved still. Without this the panel keeps showing the frame the video was
  // generated from, and the video is only reachable through the shot modal.
  return assets.find((asset) => asset.kind === "video") || assets[0] || null;
};
const storyboardVideoSourceFrame = (scene, shot) => {
  const ids = [
    scene?.approvedVariationId,
    shot?.outputAssetId,
    ...(shot?.modelSettings?.outputHistory || []).map((job) => job?.assetId),
    ...(scene?.variations || []).map((variation) => variation?.assetId),
    scene?.referenceAssetId
  ].filter(Boolean);
  return ids.map(assetById).find((asset) => asset?.kind === "image") || null;
};
// Every production entity can carry more than one approved reference. Keep
// those together when a set or prop is assigned to a scene: material/angle
// references matter just as much as the primary identity image.
const entityReferenceIds = (entity) => [...new Set([entity?.referenceAssetId, ...(entity?.references || []).map((reference) => reference.assetId)].filter(Boolean))];
const characterReferenceIds = (character) => [...new Set([...entityReferenceIds(character), ...(character?.turnaroundAssetIds || [])].filter(Boolean))];
const characterTurnaroundAssets = (character) => (character?.turnaroundAssetIds || []).map(assetById).filter((asset) => asset?.kind === "image");
function characterTurnaroundBoardMarkup(character) {
  const primary = assetById(character?.referenceAssetId);
  const turnarounds = characterTurnaroundAssets(character);
  const byView = (view) => turnarounds.find((asset) => new RegExp(`(?:^|[-_\\s])${view}(?:$|[-_\\s])`, "i").test(`${asset.name} ${asset.displayName || ""}`));
  const slots = [["Identity", primary], ["Front", byView("Front")], ["Side", byView("Side")], ["Back", byView("Back")]];
  const tile = ([label, asset]) => asset
    ? `<button type="button" class="character-turnaround-tile ${label === "Identity" ? "primary" : ""}" data-lightbox-asset="${esc(asset.id)}"><span style="background-image:url('${esc(fileUrl(asset))}')"></span><b>${label}</b><small>${label === "Identity" ? "Approved source" : "Turnaround view"}</small><i>⤢</i></button>`
    : `<div class="character-turnaround-tile empty"><span>${label === "Identity" ? "Generate an identity image to begin" : "Generate turnaround to fill this view"}</span><b>${label}</b></div>`;
  return `<section class="character-turnaround-board"><header><div><small>CHARACTER TURNAROUND</small><h3>One person, every essential angle.</h3><p>${primary ? "The approved identity and all three turnaround views automatically travel with this character into assigned scenes." : "Start with one strong identity image, then generate front, side, and back views from it."}</p></div><span>${primary ? `${turnarounds.length}/3 VIEWS READY` : "IDENTITY NEEDED"}</span></header><div class="character-turnaround-grid">${slots.map(tile).join("")}</div></section>`;
}
// Scene assignments are production facts, not optional prompt decoration.
// These stay attached to every compatible final render; the Shot Director's
// optional picker supplements them rather than accidentally replacing them.
const assignedContinuityReferenceIds = (scene) => [...new Set([
  scene?.referenceAssetId,
  ...(scene?.castIds || []).flatMap((id) => characterReferenceIds(project.characters.find((character) => character.id === id))),
  ...(scene?.setIds || []).flatMap((id) => entityReferenceIds(project.sets.find((set) => set.id === id))),
  ...(scene?.propIds || []).flatMap((id) => entityReferenceIds(project.props.find((prop) => prop.id === id)))
].filter(Boolean))];
const linkedReferenceIds = (scene, shot) => [...new Set([...(shot?.modelSettings?.referenceAssetIds || []), ...assignedContinuityReferenceIds(scene)])];
const sceneKey = (scene, index) => scene?.id || `scene-${index + 1}`;
const defaultShotModelSettings = () => ({ provider: "openai", model: "gpt-image-1", mode: "text-to-image", prompt: "", imagePrompt: "", videoPrompt: "", negativePrompt: "", referenceAssetIds: [], videoReferenceAssetIds: [], audioReferenceAssetIds: [], referenceSelectionVersion: 2, startFrameAssetId: "", endFrameAssetId: "", referenceUrls: [], aspectRatio: "16:9", resolution: "1536x1024", motion: "Controlled", seed: "", quality: "Balanced", referenceStrength: "Balanced", duration: "5", fps: "24", cameraInstruction: "", audioInstruction: "", promptEnhancement: true, styleContext: "storyboard", outputHistory: [], lastPreflight: null });
const normalizeReferenceRoles = (settings = {}) => ({ ...settings, referenceAssetIds: Array.isArray(settings.referenceAssetIds) ? settings.referenceAssetIds : [], videoReferenceAssetIds: Array.isArray(settings.videoReferenceAssetIds) ? settings.videoReferenceAssetIds : [], audioReferenceAssetIds: Array.isArray(settings.audioReferenceAssetIds) ? settings.audioReferenceAssetIds : [], startFrameAssetId: String(settings.startFrameAssetId || ""), endFrameAssetId: String(settings.endFrameAssetId || "") });
// performanceSource tracks where the acting/emotion direction in
// `performance` actually came from — "detected" (local parser found
// scene signals), "ai" (the shot planner wrote it), "manual" (the user
// typed or edited it), or "" (unset). Separate from the blueprint-wide
// `provenance` field, which covers every field at once; acting direction
// specifically deserves its own trail given how much it shapes the final
// generation.
const defaultShotBlueprint = () => ({ narrative: "", performance: "", performanceSource: "", blocking: "", camera: "", lighting: "", motion: "", audio: "", effects: "", continuity: "", provenance: "inferred" });
// A scene is safe to bulk-expand only if nothing would be destroyed by it:
// still on its single starter shot (not already broken into a real shot
// list, whether by a prior populate pass or by hand in Shot Planner), that
// shot has no generated output yet, and its blueprint isn't locked.
const shotPlanEligible = (scene) => {
  const shots = scene?.shots || [];
  if (shots.length !== 1) return false;
  const shot = shots[0];
  if (shot?.outputAssetId) return false;
  if (shot?.blueprint?.provenance === "locked") return false;
  return true;
};
const normalizeModelSettings = (settings = {}) => ({ ...settings, model: ["gpt-image-2", "gpt-5.6"].includes(settings.model) ? "gpt-image-1" : settings.model });
const ensureShotShape = (scene, shot, index) => ({ id: shot?.id || `shot-${scene?.id || "scene"}-${index + 1}`, title: shot?.title || `${scene?.title || "Scene"} Shot ${String(index + 1).padStart(2, "0")}`, purpose: shot?.purpose || scene?.note || "Advance the scene objective.", framing: shot?.framing || "Medium shot", lens: shot?.lens || "35mm", movement: shot?.movement || "Static", duration: shot?.duration || "4", audio: shot?.audio || "", outputAssetId: shot?.outputAssetId || "", outputReview: shot?.outputReview || "unreviewed", blueprint: { ...defaultShotBlueprint(), ...(shot?.blueprint || {}), narrative: shot?.blueprint?.narrative || shot?.purpose || scene?.note || "" }, modelSettings: { ...defaultShotModelSettings(), ...normalizeReferenceRoles(normalizeModelSettings(shot?.modelSettings || {})), referenceSelectionVersion: Number(shot?.modelSettings?.referenceSelectionVersion || 0), referenceUrls: Array.isArray(shot?.modelSettings?.referenceUrls) ? shot.modelSettings.referenceUrls : [], outputHistory: Array.isArray(shot?.modelSettings?.outputHistory) ? shot.modelSettings.outputHistory : [] } });
const ensureCharacterShape = () => { project.characters = Array.isArray(project.characters) ? project.characters.map((character, index) => { const primary = character?.referenceAssetId || ""; const references = Array.isArray(character?.references) ? character.references.filter((reference) => reference?.assetId) : primary ? [{ assetId: primary, role: "Primary" }] : []; if (primary && !references.some((reference) => reference.assetId === primary)) references.unshift({ assetId: primary, role: "Primary" }); return { id: character?.id || `character-${index + 1}`, name: character?.name || `Character ${index + 1}`, role: character?.role || "A role still taking shape.", appearance: character?.appearance || "", wardrobe: character?.wardrobe || "", voice: character?.voice || "", objective: character?.objective || "", movementStyle: character?.movementStyle || "", emotionalRange: character?.emotionalRange || "", continuityRules: character?.continuityRules || "", relationships: character?.relationships || "", referenceAssetId: primary || references.find((reference) => reference.role === "Primary")?.assetId || references[0]?.assetId || "", references, turnaroundAssetIds: Array.isArray(character?.turnaroundAssetIds) ? character.turnaroundAssetIds.filter(Boolean) : [] }; }) : []; };
const ensureSceneShape = () => {
  project.scenes = Array.isArray(project.scenes) ? project.scenes.map((scene, index) => {
    const normalized = {
      id: sceneKey(scene, index), title: scene?.title || `Untitled sequence ${index + 1}`, note: scene?.note || "A new beat waiting for its purpose.",
      referenceAssetId: scene?.referenceAssetId || "", variations: Array.isArray(scene?.variations) ? scene.variations : [], approvedVariationId: scene?.approvedVariationId || "",
      generationPrompt: scene?.generationPrompt || "", generationSize: scene?.generationSize || "1536x1024", generationReferenceAssetIds: Array.isArray(scene?.generationReferenceAssetIds) ? scene.generationReferenceAssetIds : [],
      castIds: Array.isArray(scene?.castIds) ? scene.castIds : [], setIds: Array.isArray(scene?.setIds) ? scene.setIds : [], propIds: Array.isArray(scene?.propIds) ? scene.propIds : [],
      driftHistory: Array.isArray(scene?.driftHistory) ? scene.driftHistory.slice(0, 5) : [], appliedStyleDnaId: scene?.appliedStyleDnaId || "", motionAssetId: scene?.motionAssetId || "", motionMasterShotId: scene?.motionMasterShotId || ""
    };
    normalized.shots = Array.isArray(scene?.shots) ? scene.shots.map((shot, shotIndex) => ensureShotShape(normalized, shot, shotIndex)) : [];
    return normalized;
  }) : [];
};
const ensureSetShape = () => { project.sets = Array.isArray(project.sets) ? project.sets.map((set, index) => ({ id: set?.id || `set-${index + 1}`, name: set?.name || `Set ${index + 1}`, description: set?.description || "", mood: set?.mood || "", referenceAssetId: set?.referenceAssetId || "", references: Array.isArray(set?.references) ? set.references : [] })) : []; };
const ensureStyleDnaShape = () => { project.styleDnas = Array.isArray(project.styleDnas) ? project.styleDnas.map((dna) => defaultStyleDna(dna)) : []; };
const ensureVisualDirectionShape = () => {
  project.visualDirection = migrateVisualDirection(project, styles);
  project.visualDirection.favorites = Array.isArray(project.visualDirection.favorites) ? project.visualDirection.favorites : [];
  project.visualDirection.recentlyUsed = Array.isArray(project.visualDirection.recentlyUsed) ? project.visualDirection.recentlyUsed.slice(0, 20) : [];
  project.visualDirection.sceneOverrides = project.visualDirection.sceneOverrides && typeof project.visualDirection.sceneOverrides === "object" ? project.visualDirection.sceneOverrides : {};
  project.visualDirection.shotOverrides = project.visualDirection.shotOverrides && typeof project.visualDirection.shotOverrides === "object" ? project.visualDirection.shotOverrides : {};
  project.visualDirection.styleHistory = project.visualDirection.styleHistory && typeof project.visualDirection.styleHistory === "object" ? project.visualDirection.styleHistory : {};
  project.visualDirection.stylePreviews = project.visualDirection.stylePreviews && typeof project.visualDirection.stylePreviews === "object" ? project.visualDirection.stylePreviews : {};
};
const ensureProductionShape = () => { ensureCharacterShape(); ensureSceneShape(); ensureSetShape(); ensureStyleDnaShape(); ensureVisualDirectionShape(); if (!project.id) project.id = `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; project.audioTracks = Array.isArray(project.audioTracks) ? project.audioTracks : []; project.props = Array.isArray(project.props) ? project.props.map((prop, index) => ({ id: prop?.id || `prop-${index + 1}`, name: prop?.name || `Prop ${index + 1}`, category: prop?.category || "prop", description: prop?.description || "", referenceAssetId: prop?.referenceAssetId || "", references: Array.isArray(prop?.references) ? prop.references : [] })) : []; project.ingestion = project.ingestion && typeof project.ingestion === "object" ? project.ingestion : { status: "empty", analysis: null, importedAt: "", warnings: [] }; project.scriptSuggestions = Array.isArray(project.scriptSuggestions) ? project.scriptSuggestions : []; project.lockedFields = Array.isArray(project.lockedFields) ? project.lockedFields : []; };

// Style Library: Style DNA operations
const savedStyleDnas = () => Array.isArray(project.styleDnas) ? project.styleDnas : [];
const styleDnaById = (id) => [...savedStyleDnas(), ...userStyleDnas, ...systemStyleDnas()].find(dna => dna.id === id);
function deleteStyleDna(dnaId) {
  project.styleDnas = savedStyleDnas().filter(dna => dna.id !== dnaId);
  // Same cleanup pattern as removing a character/set: clear the dangling
  // reference on every scene so a deleted style can't silently keep gating
  // the "check drift" button or surviving a re-save into the project file.
  (project.scenes || []).forEach((scene) => { if (scene.appliedStyleDnaId === dnaId) scene.appliedStyleDnaId = ""; if (project.visualDirection?.sceneOverrides?.[scene.id]?.styleId === dnaId) delete project.visualDirection.sceneOverrides[scene.id]; scene.shots?.forEach((shot) => { if (project.visualDirection?.shotOverrides?.[shot.id]?.styleId === dnaId) delete project.visualDirection.shotOverrides[shot.id]; }); });
  if (project.visualDirection?.projectStyle?.styleId === dnaId) {
    project.visualDirection.projectStyle = null;
    project.style = "";
  }
  if (project.visualDirection?.favorites) project.visualDirection.favorites = project.visualDirection.favorites.filter((id) => id !== dnaId);
  if (project.visualDirection?.recentlyUsed) project.visualDirection.recentlyUsed = project.visualDirection.recentlyUsed.filter((id) => id !== dnaId);
  if (project.visualDirection?.stylePreviews) delete project.visualDirection.stylePreviews[dnaId];
  setDirty();
  notify(`Style DNA deleted`);
}
function captureStyleDna(name, description, fromScene) {
  ensureProductionShape();
  const dna = defaultStyleDna({
    id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name?.trim() || "Untitled Style", description: description?.trim() || "", source: "user", visibility: "project",
    creativeIntent: { summary: description?.trim() || fromScene?.note || "" },
    visualLanguage: { shapeLanguage: fromScene?.generationPrompt?.split(",")[0]?.trim() || "", levelOfRealism: 55, levelOfStylization: 55, detailDensity: 55, visualComplexity: 55, negativeSpace: 45 },
    color: { primaryColors: [], secondaryColors: [], accentColors: [], backgroundColors: [], paletteName: "", saturation: 55, contrast: 55, temperature: "mixed" },
    lighting: { approach: fromScene?.generationPrompt?.match(/[^.]*?(?:light|atmosphere)[^.]*\.?/i)?.[0] || "", softness: 55, contrast: 55, atmosphere: [], shadowBehavior: "" },
    materials: { primaryMaterials: fromScene?.generationPrompt?.match(/[^.]*?(?:material|surface|texture)[^.]*\.?/i)?.[0] ? [fromScene.generationPrompt.match(/[^.]*?(?:material|surface|texture)[^.]*\.?/i)[0]] : [], secondaryMaterials: [], surfaceProperties: [], imperfections: [] },
    promptBlocks: { universal: fromScene?.generationPrompt || "", image: fromScene?.generationPrompt || "", video: fromScene?.generationPrompt || "", negative: "" }
  });
  project.styleDnas.unshift(dna);
  setDirty();
  notify(`Saved Style DNA: "${dna.name}"`);
  return dna;
}

// Apply a Style DNA as a non-destructive scene binding. Prompt compilation
// resolves this layer at generation time; existing scene copy is never altered.
function applyStyleDna(dnaId, sceneIndex = selectedSceneIndex) {
  ensureProductionShape();
  const dna = styleDnaById(dnaId);
  const scene = project.scenes[sceneIndex];
  if (!dna || !scene) return;
  project.visualDirection.sceneOverrides[scene.id] = { styleId: dna.id, versionId: dna.versionId, snapshot: structuredClone(dna), patch: {} };
  scene.appliedStyleDnaId = dnaId;
  setDirty();
  notify(`Applied "${dna.name}" to this scene without changing its base direction.`);
}

// Validate drift check response from provider
function validateDriftReport(response) {
  if (!response || typeof response !== "object") throw new Error("Invalid response format");

  const required = ["styleDnaId", "styleDnaName", "colorDrift", "typographyDrift", "materialDrift", "moodDrift", "atmosphereDrift", "compositeDrift", "findings", "suggestions"];
  for (const field of required) {
    if (!(field in response)) throw new Error(`Missing required field: ${field}`);
  }

  // Validate numeric ranges (0-100)
  for (const field of ["colorDrift", "typographyDrift", "materialDrift", "moodDrift", "atmosphereDrift", "compositeDrift"]) {
    const val = Number(response[field]);
    if (isNaN(val) || val < 0 || val > 100) throw new Error(`Invalid ${field}: must be 0-100`);
  }

  // Validate findings is an object with string values
  if (!response.findings || typeof response.findings !== "object") throw new Error("findings must be an object");
  for (const key of Object.keys(response.findings)) {
    if (typeof response.findings[key] !== "string") throw new Error(`findings.${key} must be a string`);
  }

  // Validate suggestions is an array of strings
  if (!Array.isArray(response.suggestions)) throw new Error("suggestions must be an array");
  for (const suggestion of response.suggestions) {
    if (typeof suggestion !== "string") throw new Error("Each suggestion must be a string");
  }

  return {
    styleDnaId: String(response.styleDnaId),
    styleDnaName: String(response.styleDnaName),
    checkedAt: new Date().toISOString(),
    assetId: response.assetId || "",
    colorDrift: Number(response.colorDrift),
    typographyDrift: Number(response.typographyDrift),
    materialDrift: Number(response.materialDrift),
    moodDrift: Number(response.moodDrift),
    atmosphereDrift: Number(response.atmosphereDrift),
    compositeDrift: Number(response.compositeDrift),
    findings: response.findings,
    suggestions: response.suggestions,
    status: "pending"
  };
}

// Select which provider should do the drift check (vision-capable: Gemini or OpenAI)
function selectDriftCheckProvider() {
  // Prefer Gemini (already in use for image generation)
  if (providerReady("google")) return "google";
  // Fallback to OpenAI
  if (providerReady("openai")) return "openai";
  // No vision provider available
  return null;
}

// Check if a generated asset drifts from the saved Style DNA
async function checkStyleDrift(assetId, styleDnaId, sceneIndex = selectedSceneIndex) {
  const asset = assetById(assetId);
  const dna = styleDnaById(styleDnaId);
  const scene = project.scenes[sceneIndex];

  if (!asset?.path && !asset?.previewUrl) {
    notify("Asset not found or has no preview URL");
    return null;
  }
  if (asset.kind !== "image") {
    notify("Style drift can only be checked against an image, not a video or other file.");
    return null;
  }
  if (!dna) {
    notify("Style DNA not found");
    return null;
  }
  if (!scene) {
    notify("No active scene");
    return null;
  }

  const provider = selectDriftCheckProvider();
  if (!provider) {
    notify("No provider configured for style checks. Add one in Model Hub (Gemini or OpenAI).");
    return null;
  }

  notify("Checking style consistency (1 API check)...");

  try {
    // Call IPC handler in electron-main.js
    const report = await window.storyMakerDesktop?.requestDriftCheck?.({
      provider,
      styleDnaProfile: dna,
      assetPath: asset.path || "",
      assetUrl: asset.previewUrl || "",
      generationPrompt: scene.generationPrompt,
      assetKind: asset.kind
    });

    if (!report) {
      notify("Drift check unavailable (desktop app feature)");
      return null;
    }

    // Validate and normalize the response
    const validated = validateDriftReport(report);
    validated.assetId = assetId;

    // Store in scene history (ring buffer, max 5)
    scene.driftHistory = Array.isArray(scene.driftHistory) ? scene.driftHistory : [];
    scene.driftHistory.unshift(validated);
    if (scene.driftHistory.length > 5) scene.driftHistory.pop();

    setDirty();
    notify(`Checked: ${validated.compositeDrift.toFixed(0)}% drift`);
    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Drift check failed";
    notify(`Error: ${message}`);
    return null;
  }
}

function setDirty(value = true) { if (value) project.updatedAt = new Date().toISOString(); dirty = value; window.storyMakerDesktop?.setDirty(value); }
function notify(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
const FILM_TRIVIA = [
  "The first movie ever copyrighted, in 1894, was five seconds of a man sneezing.",
  "“The Wizard of Oz” used Kansas wheat flakes painted grey for the tornado's dust.",
  "“Star Wars” opens with the crawl because George Lucas loved Flash Gordon serials.",
  "The Lumière brothers' 1896 train film reportedly made some viewers flinch in their seats.",
  "“Jurassic Park”'s T. rex roar is a mix of a baby elephant, a tiger, and an alligator.",
  "Charlie Chaplin once won third prize in a Charlie Chaplin look-alike contest.",
  "“Psycho”'s shower scene took seven days and seventy camera setups to shoot.",
  "The Wilhelm Scream has been used in over 400 films since 1951.",
  "“Snow White” was the first animated feature to get its own dedicated film score album.",
  "Early nitrate film stock was so flammable that projection booths needed fireproof walls.",
  "“The Matrix” bullet-time shot used 120 still cameras fired in rapid sequence.",
  "Alfred Hitchcock never won a competitive Oscar for directing.",
  "“Toy Story” was the first entirely computer-animated feature film, released in 1995.",
  "The clapperboard's stripes exist so editors can sync sound to picture by sight and sound.",
  "“Casablanca”'s script was still being rewritten during filming, ending included.",
  "Technicolor's three-strip process needed three rolls of film exposed at once.",
  "“King Kong”'s 1933 ape was an 18-inch model animated one frame at a time.",
  "The first synchronized-sound feature, “The Jazz Singer,” premiered in 1927.",
  "“Mad Max: Fury Road” storyboarded almost the entire film before a script existed.",
  "Silent-era projectionists were told to run film slightly fast to save on rental fees."
];
const generationOverlayState = new Map();
function generationDockHost() {
  let host = document.querySelector("#generationDock");
  if (!host) { host = document.createElement("aside"); host.id = "generationDock"; host.setAttribute("aria-live", "polite"); host.setAttribute("aria-label", "Active renders"); document.body.appendChild(host); }
  return host;
}
function openGenerationOverlay(kind, options = {}) {
  // You can keep working while this render continues: this is a dock, never a modal lock.
  const id = options.id || "foreground";
  closeGenerationOverlay(id);
  const el = document.createElement("div");
  el.className = "generation-overlay";
  const pickTrivia = () => FILM_TRIVIA[Math.floor(Math.random() * FILM_TRIVIA.length)];
  el.innerHTML = `<div class="generation-overlay-card"><small>STORYMAKER RENDER STATUS</small><div class="generation-overlay-bar"><span></span></div><strong>Directing your ${esc(kind)}…</strong><b class="generation-overlay-progress">${Number(options.progress || 4)}%</b><em class="generation-overlay-stage">${esc(options.stage || "Preparing production instructions")}</em><p>${esc(pickTrivia())}</p></div>`;
  generationDockHost().appendChild(el);
  const paragraph = el.querySelector("p");
 const timer = setInterval(() => { if (paragraph) paragraph.textContent = pickTrivia(); }, 4200);
  const progressTimer = setInterval(() => { const node = el.querySelector(".generation-overlay-progress"); if (!node) return; const current = Number.parseInt(node.textContent, 10) || 4; if (current < 90) node.textContent = Math.min(90, current + (current < 28 ? 8 : 3)) + "%"; }, 3000);
  el.querySelector(".generation-overlay-card")?.insertAdjacentHTML("afterbegin", '<button type="button" class="generation-overlay-minimize" title="Minimize render status">−</button>');
  el.querySelector(".generation-overlay-minimize")?.addEventListener("click", () => el.classList.toggle("is-minimized"));
  generationOverlayState.set(id, { el, timer, progressTimer, startedAt: Date.now() });
  return id;
}
function updateGenerationOverlay({ id = "foreground", progress, stage, kind } = {}) {
  const state = generationOverlayState.get(id) || [...generationOverlayState.values()].at(-1); if (!state) return;
  const progressNode = state.el.querySelector(".generation-overlay-progress"); const stageNode = state.el.querySelector(".generation-overlay-stage"); const title = state.el.querySelector("strong");
  if (Number.isFinite(Number(progress)) && progressNode) progressNode.textContent = Math.max(1, Math.min(100, Math.round(Number(progress)))) + "%";
  if (stage && stageNode) stageNode.textContent = stage;
  if (kind && title) title.textContent = "Directing your " + kind + "…";
}
function closeGenerationOverlay(id = "foreground") {
  const [resolvedId, state] = generationOverlayState.has(id) ? [id, generationOverlayState.get(id)] : [...generationOverlayState.entries()].at(-1) || []; if (!state) return;
  clearInterval(state.timer);
  clearInterval(state.progressTimer);
  state.el.remove();
  generationOverlayState.delete(resolvedId);
}
async function monitorQueuedVideoJob(scene, shot, job, modelLabel, attempt = 0) {
  const dockId = job?.renderDockId || job?.id || "foreground";
  if (!job?.providerTaskId || !window.storyMakerDesktop?.pollShotVideo) return closeGenerationOverlay(dockId);
  const monitorKey = `${job.provider || "provider"}:${job.model || "model"}:${job.providerTaskId}`;
  if (!attempt) {
    if (activeVideoMonitorIds.has(monitorKey)) return;
    activeVideoMonitorIds.add(monitorKey);
  }
  const progress = Math.min(88, 16 + attempt * 4);
  updateGenerationOverlay({ progress, kind: "video", stage: attempt ? "Rendering at " + providerLabel(job.provider) + " · checking take " + (attempt + 1) : "Queued with " + providerLabel(job.provider) + " · preparing render" });
  try {
    const result = await window.storyMakerDesktop.pollShotVideo({ provider: job.provider, taskId: job.providerTaskId, model: job.model, title: shot.title });
    if (!result?.status) throw new Error("The provider did not return a generation status.");
    Object.assign(job, { status: result.status, checkedAt: new Date().toISOString(), progress: result.progress || progress, ...(result.error ? { error: result.error } : {}) });
    if (result.asset) {
      let finalAsset = result.asset; const upscaleFactor = job.deliveryResolution === "4k" ? 4 : ["1k", "2k"].includes(job.deliveryResolution) ? 2 : 1;
      if (upscaleFactor > 1) { if (!providerReady("fal")) throw new Error("Connect fal to create the requested " + job.deliveryResolution.toUpperCase() + " delivery file."); updateGenerationOverlay({ progress: 92, stage: "Creating the requested " + job.deliveryResolution.toUpperCase() + " delivery video" }); const upscaled = await window.storyMakerDesktop.upscaleMedia({ path: result.asset.path, kind: "video", factor: upscaleFactor }); if (!upscaled?.asset) throw new Error("The upscaler did not return the requested delivery video."); finalAsset = upscaled.asset; }
      const generated = { ...finalAsset, id: `shot-video-${Date.now()}`, importedAt: new Date().toISOString(), source: upscaleFactor > 1 ? "fal" : job.provider, generation: { ...(upscaleFactor > 1 ? { ...(result.generation || {}), upscale: { provider: "fal", factor: upscaleFactor, target: job.deliveryResolution } } : result.generation), sourceFrameAssetId: job.sourceFrameAssetId || "", visualDirection: job.visualDirection || visualDirectionMetadata(scene, shot) } };
      project.assets = projectAssets(); project.assets.unshift(generated); job.assetId = generated.id; job.completedAt = new Date().toISOString(); job.status = "completed"; shot.outputAssetId = generated.id; syncAutomaticMotionMaster(scene, shot, generated.id); setDirty(); updateGenerationOverlay({ progress: 100, stage: "Video is saved to this project." }); setTimeout(closeGenerationOverlay, 900); render(); notify(modelLabel + " video is ready to review.");
      activeVideoMonitorIds.delete(monitorKey); return;
    }
    if (result.status === "failed" || result.status === "cancelled") { setDirty(); updateGenerationOverlay({ progress: 100, stage: result.error || "The provider could not complete this video." }); setTimeout(closeGenerationOverlay, 1800); notify(result.error || "This video could not be completed."); activeVideoMonitorIds.delete(monitorKey); return; }
    setDirty(); setTimeout(() => monitorQueuedVideoJob(scene, shot, job, modelLabel, attempt + 1), Math.max(4000, Number(result.pollAfterSeconds || 6) * 1000));
  } catch (error) {
    Object.assign(job, { status: "check-failed", checkedAt: new Date().toISOString(), error: error?.message || "Video status could not be checked." }); setDirty(); updateGenerationOverlay({ stage: job.error }); setTimeout(closeGenerationOverlay, 1800); notify(job.error); activeVideoMonitorIds.delete(monitorKey);
  }
}

function nav() {
  // The production workflow itself now lives only in the top bar, which
  // always shows every step regardless of mode — Simple Mode's job is just
  // to trim the sidebar down to what a first-time user needs and no more.
  const guidedRooms = new Set(["Home", "Projects", "Media Library", "Model Hub", "Settings"]);
  return navGroups.map((group) => ({ ...group, items: experienceMode === "simple" ? group.items.filter(([name]) => guidedRooms.has(name)) : group.items })).filter((group) => group.items.length).map((group) => `<div class="nav-group"><p>${group.label}</p>${group.items.map(([name, mark]) => `<button class="nav-item ${active === name ? "active" : ""}" data-nav="${name}" title="${name}"><i>${mark}</i><span>${name}</span></button>`).join("")}</div>`).join("");
}
function simpleModeGuide() {
  if (experienceMode !== "simple") return "";
  const steps = [["01", "Story", "Story Bible"], ["02", "Look", "Style Library"], ["03", "Board", "Storyboard"], ["04", "Make", "Motion Graphics"], ["05", "Deliver", "Delivery"]];
  return `<section class="simple-mode-guide"><div><small>SIMPLE MODE</small><strong>One clear path. The full studio is still here when you need it.</strong></div><nav>${steps.map(([number, label, destination]) => `<button data-nav="${destination}" class="${active === destination ? "active" : ""}"><span>${number}</span>${label}</button>`).join("")}</nav></section>`;
}
function shell(content) {
  return `<div class="studio-shell nav-${navMode} experience-${experienceMode}" data-theme="${theme}">
    <aside class="studio-sidebar">
      <div class="studio-brand"><div class="studio-mark">S</div><span><b>STORYMAKER</b><small>WHEELBARROW STUDIOS</small></span><button id="navMode" class="sidebar-control" title="Change navigation density">☷</button></div>
      <button id="newProject" class="create-button"><b>+</b><span>NEW PROJECT</span></button>
      <button id="experienceMode" class="experience-mode-button" title="Switch workspace depth"><span>${experienceMode === "simple" ? "S" : "ST"}</span><b>${experienceMode === "simple" ? "Simple mode" : "Studio mode"}</b><small>${experienceMode === "simple" ? "Guided flow" : "Full controls"}</small></button>
      <nav>${nav()}</nav>
      <div class="sidebar-foot"><button class="workspace-chip" data-nav="Model Hub"><i>${providerCatalog.filter((provider) => providerReady(provider.id)).length ? "●" : "○"}</i><span><b>${providerCatalog.filter((provider) => providerReady(provider.id)).length ? "Studio connected" : "Local workspace"}</b><small>${providerCatalog.filter((provider) => providerReady(provider.id)).length ? "Provider access ready" : "Private · on this PC"}</small></span></button></div>
    </aside>
    <main class="studio-main">
      <header class="studio-bar">
        <div class="project-path"><span>WHEELBARROW STUDIOS</span><b>/</b><strong>${esc(project.name)}</strong></div>
        <div class="production-nav"><button class="${active === "Story Bible" ? "selected" : ""}" data-nav="Story Bible">Story</button><button class="${active === "Style Library" ? "selected" : ""}" data-nav="Style Library">Style</button><button class="${active === "Character Bible" ? "selected" : ""}" data-nav="Character Bible">Characters</button><button class="${active === "Locations" ? "selected" : ""}" data-nav="Locations">Locations</button><button class="${active === "Production Assets" ? "selected" : ""}" data-nav="Production Assets">Props & accessories</button><button class="${active === "Storyboard" ? "selected" : ""}" data-nav="Storyboard">Storyboard</button><button class="${active === "Continuity" ? "selected" : ""}" data-nav="Continuity">Continuity</button><button class="${active === "Shot Planner" ? "selected" : ""}" data-nav="Shot Planner">Shots</button><button class="${active === "Timeline" ? "selected" : ""}" data-nav="Timeline">Timeline</button><button class="${active === "Motion Graphics" ? "selected" : ""}" data-nav="Motion Graphics">Generate</button><button class="${active === "Audio Studio" ? "selected" : ""}" data-nav="Audio Studio">Audio</button><button class="${active === "Delivery" ? "selected" : ""}" data-nav="Delivery">Deliver</button></div>
        <div class="bar-actions"><button class="quiet-button" id="quickOpen">Open</button><button class="save-button" id="saveProject">Save<span>${dirty ? "•" : ""}</span></button></div>
      </header>
      <section class="studio-content">${simpleModeGuide()}${content}</section>
    </main>
    <div id="toast"></div><div id="modalRoot"></div><div id="lightboxRoot"></div><div id="splashRoot"></div>
  </div>`;
}

function homeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function homeProductionStatus() {
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const characters = Array.isArray(project.characters) ? project.characters : [];
  const shots = scenes.reduce((total, scene) => total + (Array.isArray(scene.shots) ? scene.shots.length : 0), 0);
  const hasStory = Boolean(project.logline?.trim() || project.source?.text?.trim());
  const steps = [hasStory, Boolean(project.style), characters.length > 0, scenes.length > 0, shots > 0];
  const complete = steps.filter(Boolean).length;
  const next = !hasStory
    ? { room: "Story Bible", eyebrow: "NEXT DECISION", title: "Give the story its foundation.", copy: "Import a script or define the premise before the production plan begins.", action: "Open Story Bible" }
    : !project.style
      ? { room: "Style Library", eyebrow: "NEXT DECISION", title: "Choose the visual language.", copy: "A locked visual direction keeps every frame moving toward the same film.", action: "Choose a style" }
      : !characters.length
        ? { room: "Character Bible", eyebrow: "NEXT DECISION", title: "Meet the people in the story.", copy: "Create the cast before assigning them to scenes and shots.", action: "Build the cast" }
        : !scenes.length
          ? { room: "Storyboard", eyebrow: "NEXT DECISION", title: "Put the story on the wall.", copy: "Turn your story foundation into scenes the production can direct.", action: "Open Storyboard" }
          : !shots
            ? { room: "Shot Planner", eyebrow: "NEXT DECISION", title: "Plan the camera moments.", copy: "Build a starter shot plan from the scenes you have approved.", action: "Plan shots" }
            : { room: "Motion Graphics", eyebrow: "READY TO MAKE", title: "Direct the next frame.", copy: "Your production has the context it needs for an intentional visual pass.", action: "Generate a frame" };
  return { scenes, characters, shots, complete, progress: Math.round((complete / steps.length) * 100), next };
}

function visualDirectionSummary(scene = null, shot = null) {
  const resolved = resolvedStyleFor(scene, shot);
  const style = resolved.style;
  if (!style) return { name: "Not set", detail: "Choose a visual direction before the first generation.", source: "Waiting" };
  const source = resolved.sources?.[resolved.sources.length - 1]?.scope || "project";
  // resolved.strength is the numeric STYLE_STRENGTHS value (0.3–1), used to
  // scale the actual prompt — not a display label. This used to interpolate
  // that number directly ("project look · 0.55") instead of the chosen
  // strength's name; read the raw key back off the project for display.
  const strengthLabel = project.visualDirection?.styleStrength || "balanced";
  return {
    name: style.name,
    detail: styleSummary(style),
    source: `${source} look · ${strengthLabel}`
  };
}

function home() {
  const selected = styles.find((style) => style.name === project.style) || styles[0];
  const availableStyles = readyStyles().slice(0, 4);
  const status = homeProductionStatus();
  const connectedProviders = providerCatalog.filter((provider) => providerReady(provider.id)).length;
  const projectName = project.name === "Untitled Film" ? "Untitled production" : project.name;
  const visualDirection = visualDirectionSummary();
  const hasStory = Boolean(project.logline?.trim() || project.source?.text?.trim());
  // A brand-new project used to show ~12 equally-weighted entry points at
  // once (header buttons, a resume CTA, a 4-tile status grid, a 4-tile
  // "choose a way in" grid that literally duplicated the header's New/Open
  // buttons, plus a style strip) — the opposite of a golden path, where
  // there should be exactly one obvious next move. For a project with no
  // story yet, the fastest route to something happening is pasting a
  // script directly, so that becomes the one dominant action here instead
  // of a generic "open a different page" CTA.
  return `<div class="production-home">
    <header class="production-home-heading">
      <div><p>${homeGreeting()}, Director</p><h1>Your production desk.</h1><span>${project.logline ? esc(project.logline) : "Start from a script, a treatment, or a single spark. Storymaker will keep every decision connected."}</span></div>
      <div class="home-command-row">${hasStory ? `<button id="newProjectHero" class="save-button">New project</button><button id="openProjectHero" class="quiet-button">Open project</button>` : `<button id="openProjectHero" class="quiet-button">Open project</button>`}</div>
    </header>
    <section class="production-resume-card">
      <div class="production-resume-art" style="background-image:linear-gradient(90deg,#090c15e8 0%,#090c158c 54%,#090c151c),url('${styleImage(selected)}')"><span>ACTIVE PRODUCTION</span><strong>${esc(projectName)}</strong><small>${esc(project.style || "Visual language not chosen")}</small></div>
      ${!hasStory ? `<div class="production-resume-copy production-resume-start"><div><p>START HERE</p><h2>Paste your script. Storymaker builds the storyboard.</h2><span>Drop in a script, treatment, or outline — the engine pulls out characters, scenes, and shots, then turns them into image and video prompts automatically.</span></div><div class="production-resume-actions"><button id="pasteScriptHero" class="save-button">Paste your script →</button><button id="importFileHero" class="line-action">or import a file</button></div></div>`
        : `<div class="production-resume-copy"><div><p>${status.next.eyebrow}</p><h2>${status.next.title}</h2><span>${status.next.copy}</span></div><div class="production-progress"><div><span>Production readiness</span><b>${status.progress}%</b></div><i><em style="width:${status.progress}%"></em></i><small>${status.complete} of 5 core production decisions are in place.</small></div><div class="production-resume-actions"><button data-nav="${status.next.room}" class="save-button">${status.next.action}</button><button data-nav="Projects" class="line-action">Project library →</button></div></div>`}
    </section>
    ${hasStory ? `<section class="production-home-section"><div class="production-section-heading"><div><p>PROJECT PULSE</p><h2>What is connected now</h2></div><span>${connectedProviders ? `${connectedProviders} provider${connectedProviders === 1 ? "" : "s"} connected` : "Local workspace"}</span></div><div class="production-pulse-grid">
      <button class="production-pulse-card" data-nav="Story Bible"><i>01</i><span>Story foundation</span><strong>${project.logline || project.source?.text ? "In progress" : "Waiting for direction"}</strong><small>${project.source?.name ? esc(project.source.name) : "Import or write the story source"}</small></button>
      <button class="production-pulse-card" data-nav="Character Bible"><i>02</i><span>Cast & continuity</span><strong>${status.characters.length} character${status.characters.length === 1 ? "" : "s"}</strong><small>${status.characters.length ? "Profiles are available to assign to scenes" : "Create the first character profile"}</small></button>
      <button class="production-pulse-card" data-nav="Storyboard"><i>03</i><span>Scenes & shots</span><strong>${status.scenes.length} scene${status.scenes.length === 1 ? "" : "s"} · ${status.shots} shot${status.shots === 1 ? "" : "s"}</strong><small>${status.scenes.length ? "Open the board to refine the production" : "Map the story into a first sequence"}</small></button>
      <button class="production-pulse-card" data-nav="Model Hub"><i>04</i><span>Generation access</span><strong>${connectedProviders ? "Studio connected" : "Connect providers"}</strong><small>${connectedProviders ? "Review available models and readiness" : "Keys remain encrypted on this PC"}</small></button>
    </div></section>
    <section class="visual-direction-home-card ${visualDirection.name === "Not set" ? "waiting" : "ready"}">
      <div class="visual-direction-home-mark">✦</div>
      <div><p>VISUAL DIRECTION</p><h2>${esc(visualDirection.name)}</h2><span>${esc(visualDirection.detail)}</span></div>
      <div class="visual-direction-home-state"><small>${esc(visualDirection.source)}</small><button data-nav="Style Library" class="${visualDirection.name === "Not set" ? "save-button" : "quiet-button"}">${visualDirection.name === "Not set" ? "Set the look" : "Open Visual Direction"}</button></div>
    </section>
    <section class="production-home-lower"><div class="production-start-grid"><div class="production-section-heading"><div><p>CREATE</p><h2>Choose a way in</h2></div></div><div class="production-entry-grid"><button id="pasteScriptHome" class="production-entry"><i>✎</i><strong>Paste script</strong><small>Drop your script straight in.</small></button><button id="openProjectHome" class="production-entry"><i>↥</i><strong>Import or open</strong><small>Bring in a saved project or story source.</small></button><button data-nav="AI Director" class="production-entry"><i>✦</i><strong>AI Director</strong><small>Review the creative direction.</small></button><button data-nav="Style Library" class="production-entry"><i>◈</i><strong>Visual direction</strong><small>Choose the film’s Style DNA.</small></button></div></div>
      <aside class="production-style-panel"><div class="production-section-heading"><div><p>VISUAL LANGUAGE</p><h2>${esc(project.style || "Choose a direction")}</h2></div><button data-nav="Style Library" class="line-action">Open Visual Direction →</button></div><p>${project.style ? esc(selected.tone) : "A visual choice here becomes shared context for scenes, shots, and generation."}</p><div class="production-style-strip">${availableStyles.map((style) => `<button class="production-style-card ${project.style === style.name ? "selected" : ""}" data-style="${esc(style.name)}" title="Choose ${esc(style.name)}"><img src="${styleImage(style)}" alt="${esc(style.name)}"/><span>${esc(style.name)}</span></button>`).join("")}</div></aside>
    </section>` : ""}
  </div>`;
}

function projectLibrary() {
  return `<div class="library-workspace"><div class="workspace-heading"><div><p>PROJECT LIBRARY</p><h1>Stories in progress.</h1></div><button id="newProjectLibrary" class="save-button">New project</button></div><div class="project-strip"><article class="project-primary"><div class="project-poster" style="background-image:linear-gradient(0deg,#0b0e17,#0b0e1720),url('${(styles.find((s) => s.name === project.style) || styles[6]).image}')"></div><div><small>ACTIVE PROJECT</small><h2>${esc(project.name)}</h2><p>${esc(project.logline || "A new story world ready for its first decision.")}</p><div class="project-metrics"><span><b>${project.characters.length}</b> characters</span><span><b>${project.scenes.length}</b> scenes</span><span><b>${project.style || "—"}</b> visual language</span></div><button data-nav="Story Bible" class="line-action">Resume workspace →</button></div></article><article class="project-empty"><i>+</i><h3>Make room for the next one.</h3><p>Each project carries its own story, design system, and production memory.</p><button id="newProjectEmpty" class="quiet-button">Create project</button></article></div></div>`;
}
function storyScore() {
  return [project.logline, project.premise, project.world, project.rules, project.style, project.characters.length, project.locations.length, project.themes.length].filter(Boolean).length * 12 + 4;
}
function storyWorkspace() {
  const themes = Array.isArray(project.themes) ? project.themes : [];
  const locations = Array.isArray(project.locations) ? project.locations : [];
  const source = project.source || {};
  const lockedFields = Array.isArray(project.lockedFields) ? project.lockedFields : [];
  const lockToggle = (scope, label) => `<button type="button" data-toggle-field-lock="${scope}" class="field-lock-toggle ${lockedFields.includes(scope) ? "locked" : ""}" title="${lockedFields.includes(scope) ? `Unlock ${label}` : `Lock ${label} from AI suggestions`}">${lockedFields.includes(scope) ? "LOCKED" : "LOCK"}</button>`;
  return `<div class="story-bible-workspace"><div class="workspace-heading"><div><p>STORY BIBLE / FOUNDATION</p><h1>Give every later decision a reason.</h1></div><div class="story-actions"><button id="importStorySource" class="quiet-button">Import story source</button><button id="pasteStorySource" class="quiet-button">Paste script</button>${source.filePath && !source.text?.trim() ? `<button id="runSourceOcr" class="save-button">Run OCR on this source</button>` : ""}<button id="runBreakdown" class="save-button" ${source.text ? "" : "disabled"}>Build production context</button></div></div><section class="story-bible-hero"><div><small>STORY CORE</small><h2>${project.logline ? esc(project.logline) : "A story is a system of promises."}</h2><p>${source.name ? `Built from ${esc(source.name)}. Import again any time to enrich the context.` : "Write directly, or bring in a script, treatment, Fountain file, or plain-text idea."}</p></div><div class="story-score"><strong>${Math.min(storyScore(), 100)}</strong><span>context<br>readiness</span></div></section><div class="story-bible-grid"><section class="story-canvas story-core-card"><div class="story-fields"><label><span>WORKING TITLE</span><input id="storyName" value="${esc(project.name)}" placeholder="Name this story" /></label><label><span>LOGLINE${lockToggle("logline", "the logline")}</span><textarea id="storyLogline" placeholder="One clear sentence that makes someone want to watch." ${lockedFields.includes("logline") ? "readonly" : ""}>${esc(project.logline)}</textarea></label><label><span>WHAT IS THIS REALLY ABOUT?${lockToggle("premise", "the premise")}</span><textarea id="storyPremise" placeholder="The question, tension, or feeling underneath the plot." ${lockedFields.includes("premise") ? "readonly" : ""}>${esc(project.premise)}</textarea></label></div><div class="bible-split"><label><span>WORLD</span><textarea id="storyWorld" placeholder="Where are we, and what makes this world feel unlike any other?">${esc(project.world)}</textarea></label><label><span>WORLD RULES</span><textarea id="storyRules" placeholder="The rules, limits, and truths that keep the world coherent.">${esc(project.rules)}</textarea></label></div><label class="story-field-wide"><span>RELATIONSHIPS & TENSIONS</span><textarea id="storyRelationships" placeholder="Who needs whom? Who cannot coexist? What is left unsaid?">${esc(project.relationships)}</textarea></label></section><aside class="story-context-panel"><div><p>THEMATIC THREADS</p><div class="theme-list">${themes.length ? themes.map((theme, index) => `<button class="theme-pill" data-remove-theme="${index}" title="Remove ${esc(theme)}">${esc(theme)} <i>×</i></button>`).join("") : `<span class="context-empty">Add the ideas that should echo through the film.</span>`}</div><div class="theme-entry"><input id="themeInput" placeholder="e.g. memory, courage, belonging" /><button id="addTheme">Add</button></div></div><div class="context-divider"></div><div><p>NARRATIVE LOCATIONS</p><div class="location-list">${locations.length ? locations.map((location, index) => `<article><div><strong>${esc(location.name || `Location ${index + 1}`)}</strong><span>${esc(location.description || "A place still taking shape.")}</span></div><button data-remove-location="${index}" title="Remove location">×</button></article>`).join("") : `<span class="context-empty">Lightweight notes for the world — not the full production Locations workspace. Appear here after you add one or import a script.</span>`}</div><button id="addLocation" class="line-action">Add narrative location →</button></div></aside></div><section class="source-strip ${source.text ? "has-source" : ""}"><div><p>SOURCE MATERIAL</p><strong>${source.name ? esc(source.name) : "No source imported"}</strong><span>${source.text ? `${source.text.trim().split(/\s+/).filter(Boolean).length} words available to the production record.` : "Import a treatment, screenplay, Fountain file, or text outline."}</span></div><button id="openSourcePreview" class="quiet-button" ${source.text ? "" : "disabled"}>Preview source</button></section></div>`;
}
function characterProductionWorkspace() {
  ensureCharacterShape(); ensureSceneShape();
  return `<div class="character-workspace"><div class="workspace-heading"><div><p>CHARACTER BIBLE / CONTINUITY</p><h1>People the camera can recognize.</h1></div><button id="addCharacter" class="save-button">Add character</button></div><section class="character-intro"><div><small>PRODUCTION PROFILES</small><h2>Appearance, voice, objective, and visual reference travel with every scene.</h2></div><span>${project.characters.length} profile${project.characters.length === 1 ? "" : "s"} in this project</span></section><section class="character-profile-grid">${project.characters.length ? project.characters.map((character, index) => { const reference = assetById(character.referenceAssetId); const image = reference?.kind === "image" ? fileUrl(reference) : ""; const sceneCount = project.scenes.filter((scene) => (scene.castIds || []).includes(character.id)).length; const referenceCount = entityReferenceRoles(character).size; const eyebrow = character.role && character.role !== "A role still taking shape." ? character.role : ""; return entityCardMarkup({ index, name: character.name, eyebrow, description: character.objective, emptyDescription: "Give this character a scene objective that can guide performance and framing.", referenceCount, sceneCount, image, editAttr: "edit-character", editLabel: "Edit production profile →", labAttr: "open-character-lab", labLabel: "Open Character Lab", removeAttr: "remove-character", cardClass: "world-asset-card character-card" }); }).join("") : `<div class="empty-stage wide"><span>♙</span><h2>Your cast is still offstage.</h2><p>Define the person whose choices carry the film.</p><button id="addFirstCharacter" class="line-action">Add the first character →</button></div>`}</section></div>`;
}
function mediaLibraryWorkspace() {
  const assets = projectAssets();
  const filtered = mediaFilter === "all" ? assets : mediaFilter === "unused" ? assets.filter((media) => !assetUsages(media.id).length) : assets.filter((media) => media.kind === mediaFilter);
  const unusedCount = assets.filter((media) => !assetUsages(media.id).length).length;
  return `<div class="media-workspace"><div class="workspace-heading"><div><p>MEDIA LIBRARY / PROJECT ASSETS</p><h1>Every reference, ready when the shot needs it.</h1></div><div class="story-actions">${unusedCount ? `<button id="cleanUnusedMedia" class="quiet-button">Clean up ${unusedCount} unused</button>` : ""}<button id="importMedia" class="save-button">Import media</button></div></div><section class="media-intro"><div><small>PROJECT-ASSET WORKFLOW</small><h2>Bring in the images, footage, and sound that make the world tangible.</h2><p>Imported files are staged beside your <b>.storymaker</b> project on save. Images can be attached to any storyboard scene as a visual reference.</p></div><div class="media-metrics"><span><b>${assets.length}</b> total</span><span><b>${assets.filter((media) => media.kind === "image").length}</b> images</span><span><b>${unusedCount}</b> unused</span></div></section><div class="media-filter-bar">${[["all", "All assets"], ["image", "Images"], ["video", "Video"], ["audio", "Audio"], ["unused", "Unused"]].map(([id, label]) => `<button data-media-filter="${id}" class="${mediaFilter === id ? "active" : ""}">${label}<span>${id === "all" ? assets.length : id === "unused" ? unusedCount : assets.filter((media) => media.kind === id).length}</span></button>`).join("")}</div><section class="media-grid">${filtered.length ? filtered.map((media) => { const usages = assetUsages(media.id); const visual = media.kind === "image" && fileUrl(media); const videoPreview = media.kind === "video" && fileUrl(media); const action = media.kind === "image" ? `<button data-attach-asset="${esc(media.id)}" class="quiet-button">Attach to scene</button>` : `<button class="quiet-button" disabled>Track linking soon</button>`; return `<article class="media-card ${media.kind}"><div class="media-preview ${visual ? "with-image" : videoPreview ? "with-video" : ""}" ${visual ? `style="background-image:linear-gradient(0deg,#090c14cb,#090c1400),url('${esc(visual)}')"` : ""}>${videoPreview ? `<video src="${esc(videoPreview)}" muted playsinline preload="metadata"></video>` : ""}<i>${mediaIcon(media.kind)}</i><span>${media.kind.toUpperCase()}</span></div><div class="media-card-copy"><small>${esc(formatBytes(media.size))} · ${usages.length ? `${usages.length} link${usages.length === 1 ? "" : "s"}` : "Not linked"}</small><h3 title="${esc(media.name)}">${esc(media.name)}</h3><p>${usages.length ? `Used by ${usages.map((usage) => esc(usage.label)).join(" · ")}` : media.kind === "image" ? "Not attached anywhere in this project. Safe to remove." : "Not used anywhere in this project. Safe to remove."}</p><div>${action}<button data-remove-asset="${esc(media.id)}" class="remove-button">Remove</button></div></div></article>`; }).join("") : `<div class="media-empty"><i>▧</i><h2>${assets.length ? "Nothing in this filter." : "The project has room for its first reference."}</h2><p>${assets.length ? "Choose another filter or import a new asset." : "Import images, video, or audio, then attach a visual reference to a storyboard scene."}</p><button id="importFirstMedia" class="save-button">Import media</button></div>`}</section></div>`;
}
function continuitySignals() {
  ensureProductionShape();
  const signals = [];
  if (!project.logline) signals.push({ level: "needs", title: "Story promise is missing", copy: "Add a logline so the scene planner and generators have a dramatic promise to protect.", target: "Story Bible" });
  if (!project.style) signals.push({ level: "needs", title: "Visual language is not locked", copy: "Choose a Style Library direction before judging continuity across frames.", target: "Style Library" });
  project.characters.forEach((character) => { const missing = [!character.appearance && "appearance", !character.voice && "voice", !character.referenceAssetId && "reference"].filter(Boolean); if (missing.length) signals.push({ level: "watch", title: `${character.name}: profile is still open`, copy: `Add ${missing.join(", ")} so this character can remain recognizable from scene to scene.`, target: "Character Bible" }); });
  // Locations and Props & Accessories became full first-class continuity
  // systems in 0.4.47 (their own workspaces, Lab, and protected continuity
  // references into Shot Director) — this audit only ever checked
  // Characters, so an under-filled-out location or prop stayed invisible
  // here even though the exact same gap on a character was already flagged.
  project.sets.forEach((set) => { const missing = [!set.description && "an environment description", !set.referenceAssetId && "a reference"].filter(Boolean); if (missing.length) signals.push({ level: "watch", title: `${set.name}: profile is still open`, copy: `Add ${missing.join(" and ")} so this location can remain recognizable from scene to scene.`, target: "Locations" }); });
  project.props.forEach((prop) => { const missing = [!prop.description && "a design description", !prop.referenceAssetId && "a reference"].filter(Boolean); if (missing.length) signals.push({ level: "watch", title: `${prop.name}: profile is still open`, copy: `Add ${missing.join(" and ")} so this asset can remain recognizable from scene to scene.`, target: "Production Assets" }); });
  project.scenes.forEach((scene, index) => { const cast = (scene.castIds || []).filter((id) => project.characters.some((character) => character.id === id)); if (!scene.note) signals.push({ level: "needs", title: `Scene ${index + 1} needs an objective`, copy: "Write what must change in this beat before planning its shots.", target: "Storyboard" }); if (!scene.referenceAssetId && !scene.approvedVariationId) signals.push({ level: "watch", title: `Scene ${index + 1} has no approved visual`, copy: "Attach a reference or approve a generated take to make visual continuity reviewable.", target: "Generate" }); if (!cast.length && project.characters.length) signals.push({ level: "watch", title: `Scene ${index + 1} has no cast assignment`, copy: "Assign the characters present in this beat so performance and reference context stay connected.", target: "Storyboard" }); if (!(scene.shots || []).length) signals.push({ level: "info", title: `Scene ${index + 1} has no shot plan`, copy: "Create a starter shot to carry the beat from storyboard into production.", target: "Shot Planner" }); });
  if (!signals.length) signals.push({ level: "ready", title: "The production record is coherent", copy: "Story, visual language, cast, scene references, and shot plans are connected. Keep reviewing after every major change.", target: "Ready" });
  return signals;
}
function continuityWorkspace() {
  const signals = continuitySignals();
  const counts = { needs: signals.filter((signal) => signal.level === "needs").length, watch: signals.filter((signal) => signal.level === "watch").length, ready: signals.filter((signal) => signal.level === "ready").length };
  return `<div class="continuity-workspace"><div class="workspace-heading"><div><p>CONTINUITY / PRODUCTION SIGNALS</p><h1>Protect the details that make belief possible.</h1></div><button id="refreshContinuity" class="quiet-button">Refresh signals</button></div><section class="continuity-hero"><div><small>LIVE PROJECT AUDIT</small><h2>${counts.needs ? `${counts.needs} production decision${counts.needs === 1 ? "" : "s"} need${counts.needs === 1 ? "s" : ""} attention.` : counts.watch ? `${counts.watch} continuity signal${counts.watch === 1 ? "" : "s"} to resolve.` : "The story system is holding together."}</h2><p>Continuity runs locally against the project record. It checks the information Storymaker actually uses for scene visualization and shot planning.</p></div><div class="continuity-metrics"><span><b>${counts.needs}</b> needs</span><span><b>${counts.watch}</b> watch</span><span><b>${project.scenes.length}</b> scenes</span></div></section><section class="continuity-list">${signals.map((signal, index) => `<article class="signal-${signal.level}"><i>${String(index + 1).padStart(2, "0")}</i><div><small>${signal.level === "needs" ? "DECISION REQUIRED" : signal.level === "watch" ? "CONTINUITY WATCH" : signal.level === "info" ? "NEXT PRODUCTION STEP" : "READY"}</small><h3>${esc(signal.title)}</h3><p>${esc(signal.copy)}</p></div>${signal.target !== "Ready" ? `<button data-nav="${esc(signal.target === "Generate" ? "Motion Graphics" : signal.target)}" class="quiet-button">Open ${esc(signal.target)}</button>` : `<span class="signal-ready">CONNECTED</span>`}</article>`).join("")}</section></div>`;
}
function resolvedStyleFor(scene, shot) {
  const resolved = resolveVisualDirection(project, { scene, shot, builtIns: systemStyleDnas() });
  if (resolved.style) return resolved;
  const legacy = styles.find((entry) => entry.name === project.style);
  return legacy ? { style: legacyStyleToDna(legacy), sources: [{ scope: "legacy project", styleId: legacy.name, versionId: "legacy" }], strength: STYLE_STRENGTHS.balanced } : { style: null, sources: [], strength: STYLE_STRENGTHS.balanced };
}
// Character/Set/Prop Lab used to give zero indication a project style was
// even being applied — likely part of why a chosen style felt like it
// wasn't reflecting anywhere: there was nothing on screen to confirm it was
// (or wasn't) in effect. Small, informational only — the actual injection
// happens in each Lab's generate function via resolvedStyleFor().
function styleIndicatorMarkup() {
  const active = project.visualDirection?.projectStyle?.snapshot;
  return active
    ? `<span class="style-indicator" title="Every generation from this screen uses this project's active Style DNA">🎨 Styled as ${esc(active.name)}</span>`
    : `<span class="style-indicator style-indicator-empty" title="No project style selected — generations use default, unstyled rendering">No style selected — using default rendering</span>`;
}
function visualDirectionMetadata(scene, shot) {
  const resolved = resolvedStyleFor(scene, shot);
  if (!resolved.style) return null;
  return { styleId: resolved.style.id, styleName: resolved.style.name, styleVersionId: resolved.style.versionId, styleVersion: resolved.style.version, strength: resolved.strength, sources: resolved.sources };
}
function productionPromptFor(scene, shot, kind = "image") {
  const blueprint = shot?.blueprint || defaultShotBlueprint();
  const resolvedStyle = resolvedStyleFor(scene, shot);
  const styleBlocks = stylePromptBlocks(resolvedStyle.style, kind, "", resolvedStyle.strength);
  const style = resolvedStyle.style ? `${resolvedStyle.style.name} (${resolvedStyle.sources.map((source) => source.scope).join(" → ")}): ${styleBlocks.positive.join(". ")}` : "Visual language: cinematic, coherent, production-ready.";
  const section = (label, value) => value ? `${label}:\n${value}` : "";
  const camera = blueprint.camera || `${shot?.framing || "Medium shot"}, ${shot?.lens || "35mm lens"}, ${shot?.movement || "controlled movement"}`;
  const cast = (scene?.castIds || []).map((id) => project.characters.find((character) => character.id === id)).filter(Boolean);
  const dialogue = Array.isArray(scene?.dialogue) ? scene.dialogue.map((line) => `${line.character || "Character"}: ${line.text || ""}`).filter(Boolean).join("\n") : shot?.audio || "";
  const castIdentity = cast.map((character) => {
    const references = (character.references || []).map((reference) => reference.role || "Reference").join(", ");
    return `${character.name}: ${[character.role, character.appearance, character.wardrobe, character.objective, character.continuityRules, references && `reference roles: ${references}`].filter(Boolean).join("; ")}`;
  }).join("\n");
  // Acting/lighting/VFX/continuity sections reflect only what's actually
  // written in the shot's Production Blueprint boxes now — a blank box
  // means a blank section in the compiled prompt, not generated boilerplate
  // standing in for direction nobody wrote.
  const acting = blueprint.performance || "";
  const stillPerformance = blueprint.performance || "";
  const core = [
    section("SCENE", scene?.title || "Untitled scene"),
    section("STORY PURPOSE", shot?.purpose || scene?.note || "Advance the scene objective."),
    section("NARRATIVE & DIALOGUE", [blueprint.narrative, dialogue].filter(Boolean).join("\n")),
    section("CAST CONTINUITY", castIdentity),
    section(kind === "video" ? "ACTING & MICRO-ANIMATION" : "CHARACTER PERFORMANCE", kind === "video" ? acting : stillPerformance),
    section(kind === "video" ? "BLOCKING & CAMERA" : "COMPOSITION & CAMERA", [blueprint.blocking, camera].filter(Boolean).join("\n")),
    section("LIGHTING & ATMOSPHERE", blueprint.lighting || ""),
    section("ENVIRONMENT & VFX", blueprint.effects || ""),
    section("VISUAL DIRECTION", style),
    section("CONTINUITY", blueprint.continuity || "")
  ].filter(Boolean);
  const styleNegative = styleBlocks.negative.length ? `STYLE NEGATIVE CONSTRAINTS:\n${styleBlocks.negative.join(", ")}` : "";
  if (kind === "video") return [
    "VIDEO GENERATION PACKAGE",
    "Create one continuous cinematic shot with no cuts. Preserve character identity, wardrobe, facial features, set geometry, lighting continuity, screen direction, and approved reference frames.",
    ...core,
    section("MOTION & TIMING", `${blueprint.motion || "Choreograph one readable beat: establish the situation, play the emotional change, then land on a stable final composition."} Camera motion remains smooth, stabilized, and motivated by the drama. Secondary motion follows the acting: breath, eye focus, hands, fabric, hair, and the environment respond naturally without distraction.`),
    section("AUDIO", blueprint.audio),
    styleNegative,
    section("CINEMATIC STRUCTURE", "1. Establish the world and emotional pressure.\n2. Let the internal decision become visible through restrained acting and camera language.\n3. Resolve on the clearest emotional image, holding long enough for the audience to read it."),
    "NEGATIVE CONSTRAINTS:\nNo visual drift, text, subtitles, logos, watermarks, split screens, UI, unmotivated camera movement, arbitrary motion, frozen faces, lip-sync-like mouth movement without dialogue, or exaggerated performance."
  ].filter(Boolean).join("\n\n");
  return ["IMAGE GENERATION PACKAGE", "Create one finished cinematic still frame from this exact story moment. Preserve character identity, facial features, wardrobe, proportions, set logic, and approved reference images.", ...core, "STILL-FRAME INTENTION:\nCapture the instant just before, during, or just after the emotional realization—not a posed portrait. Let the character's thought read through gaze, silhouette, hands, posture, expression, and the placement of light in the composition.", styleNegative, "NEGATIVE CONSTRAINTS:\nNo static mannequin posing, generic smiles, exaggerated expressions, text, captions, logos, watermarks, split panels, UI, or invented characters, props, and plot events."].filter(Boolean).join("\n\n");
}
function newShot(scene, number) {
  const shot = { id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: `${scene.title} · Shot ${String(number).padStart(2, "0")}`, purpose: scene.note || "Advance the scene objective.", framing: "Medium shot", lens: "35mm", movement: "Static", duration: "4", audio: "", blueprint: defaultShotBlueprint() };
  shot.blueprint.narrative = shot.purpose;
  shot.modelSettings = { ...defaultShotModelSettings(), imagePrompt: productionPromptFor(scene, shot, "image"), videoPrompt: productionPromptFor(scene, shot, "video"), prompt: productionPromptFor(scene, shot, "image") };
  return shot;
}
function shotModelDirectorWorkspace() {
  ensureProductionShape();
  const rows = project.scenes.flatMap((scene, sceneIndex) => (scene.shots || []).map((shot, shotIndex) => ({ scene, sceneIndex, shot, shotIndex })));
  return `<div class="shot-planner-workspace"><div class="workspace-heading"><div><p>SHOT PLANNER / PRODUCTION CONTROLS</p><h1>Give every shot its own engine.</h1></div><div class="story-actions"><button id="buildShotPlan" class="quiet-button" ${project.scenes.length ? "" : "disabled"}>Build starter plan</button><button data-nav="Model Hub" class="quiet-button">Model Hub</button></div></div><section class="shot-planner-intro"><div><small>PER-SHOT MODEL ROUTING</small><h2>Each shot remembers its own model, prompt, references, and every take it's produced.</h2></div><span>${rows.length} shot${rows.length === 1 ? "" : "s"} ready for direction</span></section><section class="shot-model-grid">${rows.length ? rows.map(({ scene, sceneIndex, shot, shotIndex }) => { const settings = shot.modelSettings || defaultShotModelSettings(); const model = modelCatalog.find((item) => item.model === settings.model) || { label: settings.model, status: "next" }; const references = (settings.referenceAssetIds || []).map(assetById).filter(Boolean); return `<article class="shot-model-card"><div><small>SCENE ${String(sceneIndex + 1).padStart(2, "0")} / SHOT ${String(shotIndex + 1).padStart(2, "0")}</small><span class="${model.status}">${model.status === "live" ? "LIVE" : "IN BUILD"}</span></div><h2>${esc(shot.title)}</h2><p>${esc(shot.purpose)}</p><dl><div><dt>MODEL</dt><dd>${esc(model.label)}</dd></div><div><dt>MODE</dt><dd>${esc(settings.mode)}</dd></div><div><dt>CAMERA</dt><dd>${esc(shot.framing)} · ${esc(shot.movement)}</dd></div><div><dt>REFERENCES</dt><dd>${references.length ? `${references.length} attached` : "None"}</dd></div></dl><div class="shot-model-card-actions"><button data-direct-shot="${sceneIndex}:${shotIndex}" class="save-button">Direct this shot</button><button data-open-timeline-scene="${sceneIndex}" class="quiet-button">Open scene</button><button data-remove-shot="${sceneIndex}:${shotIndex}" class="remove-button">Remove</button></div></article>`; }).join("") : `<div class="shot-empty"><i>◇</i><h2>There are no shots to direct yet.</h2><p>Build the starter plan, then give every shot its own model and reference strategy.</p><button id="buildFirstShotPlan" class="save-button">Build starter plan</button></div>`}</section>${project.scenes.length ? `<div class="shot-add-row">${project.scenes.map((scene, index) => `<button data-add-shot="${index}" class="line-action">+ Add shot to Scene ${String(index + 1).padStart(2, "0")} · ${esc(scene.title)}</button>`).join("")}</div>` : ""}</div>`;
}
function numericDuration(value) { const parsed = Number.parseFloat(value); return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 99) : 4; }
function ensureTimelineShape() {
  ensureProductionShape();
  const transitions = ["Cut", "Dissolve", "Dip to black", "Wipe", "Match cut"];
  project.scenes.forEach((scene) => {
    scene.timeline = { transition: transitions.includes(scene.timeline?.transition) ? scene.timeline.transition : "Cut", transitionDuration: String(scene.timeline?.transitionDuration || "0.4"), collapsed: Boolean(scene.timeline?.collapsed) };
    scene.shots.forEach((shot) => { shot.duration = String(numericDuration(shot.duration)); });
  });
  project.audioTracks = project.audioTracks.map((cue, index) => ({ ...cue, id: cue.id || `cue-${index + 1}`, start: String(cue.start || "0"), duration: String(numericDuration(cue.duration || "5")) }));
}
function productionTimelineWorkspace() {
  ensureTimelineShape();
  const scenes = project.scenes;
  const clips = scenes.flatMap((scene, sceneIndex) => scene.shots.map((shot, shotIndex) => ({ scene, sceneIndex, shot, shotIndex })));
  const total = clips.reduce((sum, item) => sum + numericDuration(item.shot.duration), 0);
  const totalWithHandles = Math.max(total, 1);
  let cursor = 0;
  const outputFor = (scene, shot) => assetById(scene.motionMasterShotId === shot.id ? scene.motionAssetId : "") || assetById(shot.outputAssetId) || assetById(scene.approvedVariationId || scene.referenceAssetId);
  const sceneRows = scenes.map((scene, sceneIndex) => {
    const sceneClips = scene.shots.map((shot, shotIndex) => ({ shot, shotIndex }));
    const sceneDuration = sceneClips.reduce((sum, item) => sum + numericDuration(item.shot.duration), 0);
    const start = cursor; cursor += sceneDuration;
    const cast = (scene.castIds || []).map((id) => project.characters.find((character) => character.id === id)).filter(Boolean);
    return `<article class="timeline-sequence ${scene.timeline.collapsed ? "collapsed" : ""}"><header class="timeline-sequence-head"><button type="button" class="timeline-collapse" data-toggle-timeline-scene="${sceneIndex}">${scene.timeline.collapsed ? "＋" : "−"}</button><div class="timeline-sequence-title"><small>SCENE ${String(sceneIndex + 1).padStart(2, "0")} · ${start.toFixed(1)}s</small><strong>${esc(scene.title)}</strong><span>${esc(scene.note)}</span></div><div class="timeline-cast">${cast.length ? cast.map((character) => `<span title="${esc(character.name)}">${esc(character.name)}</span>`).join("") : `<em>No cast assigned</em>`}</div><label class="timeline-transition">TRANSITION<select data-timeline-transition="${sceneIndex}">${["Cut", "Dissolve", "Dip to black", "Wipe", "Match cut"].map((value) => `<option ${scene.timeline.transition === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="timeline-transition-duration">SEC<input data-timeline-transition-duration="${sceneIndex}" value="${esc(scene.timeline.transitionDuration)}" inputmode="decimal" /></label><button type="button" class="quiet-button" data-open-timeline-scene="${sceneIndex}">Direct scene</button></header><div class="timeline-sequence-body"><div class="timeline-shot-lane">${sceneClips.length ? sceneClips.map(({ shot, shotIndex }) => { const duration = numericDuration(shot.duration); const output = outputFor(scene, shot); const width = Math.max(92, duration / totalWithHandles * 1000); const isVideoOutput = output?.kind === "video";
                return `<article class="timeline-shot-clip ${output ? "has-output" : "planned-output"}" style="width:${width}px"><button type="button" class="timeline-shot-visual" data-direct-timeline-shot="${sceneIndex}:${shotIndex}" ${output?.kind === "image" ? `style="background-image:linear-gradient(0deg,#080c15db,#080c151a),url('${esc(fileUrl(output))}')"` : isVideoOutput ? `style="position:relative;overflow:hidden"` : ""}>${isVideoOutput ? `<video src="${esc(fileUrl(output))}" muted playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none"></video><i class="timeline-shot-play">▶</i>` : ""}<b>${String(shotIndex + 1).padStart(2, "0")}</b><span>${output ? (output.kind === "video" ? "VIDEO" : "FRAME") : "DIRECT"}</span></button><div class="timeline-shot-copy"><div class="timeline-shot-reorder"><button type="button" title="Move earlier in the sequence" data-move-shot-up="${sceneIndex}:${shotIndex}" ${shotIndex === 0 ? "disabled" : ""}>◀</button><button type="button" title="Move later in the sequence" data-move-shot-down="${sceneIndex}:${shotIndex}" ${shotIndex === sceneClips.length - 1 ? "disabled" : ""}>▶</button></div><strong>${esc(shot.title)}</strong><small>${esc(shot.framing)} · ${esc(shot.movement)}</small><div><label>DURATION<input data-timeline-shot-duration="${sceneIndex}:${shotIndex}" value="${duration}" inputmode="decimal" /></label><span>${shot.modelSettings?.model ? esc(shot.modelSettings.model) : "Model not selected"}</span></div></div></article>`; }).join("") : `<button class="timeline-empty-clip" data-nav="Shot Planner">Add shots from Shot Planner →</button>`}</div></div></article>`;
  }).join("");
  const audioCues = project.audioTracks.map((cue) => { const asset = assetById(cue.assetId); const left = Math.max(0, Number(cue.start || 0)) / totalWithHandles * 100; const width = Math.max(8, Number(cue.duration || 5) / totalWithHandles * 100); return `<article class="timeline-audio-clip" style="left:${left}%;width:${width}%"><button type="button" data-edit-audio-cue="${esc(cue.id)}" title="Edit this cue's start, duration, and level"><strong>${esc(cue.type || "Audio")}</strong><span>${esc(asset?.name || "Missing media")}</span><small>${cue.start}s · ${cue.duration}s</small></button><button type="button" class="timeline-audio-remove" data-remove-audio-cue="${esc(cue.id)}">×</button></article>`; }).join("");
  return `<div class="timeline-workspace timeline-workspace-v2"><div class="workspace-heading"><div><p>TIMELINE / SEQUENCE EDITOR</p><h1>Shape the rhythm of the film.</h1></div><div class="story-actions"><button data-nav="Shot Planner" class="quiet-button">Edit shots</button><button data-nav="Audio Studio" class="quiet-button">Audio Studio</button><button id="addTimelineAudio" class="save-button">Add audio cue</button></div></div><section class="timeline-intro timeline-intro-v2"><div><small>CONNECTED ASSEMBLY</small><h2>${scenes.length ? `${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${clips.length} shot${clips.length === 1 ? "" : "s"} · ${total.toFixed(1)} seconds` : "Your cut is ready for its first scene."}</h2><p>Every lane below is connected to the project record. Scene transitions, character assignments, generated outputs, shot duration, and audio cues remain editable here.</p></div><div class="timeline-health"><span><b>${clips.filter(({ shot }) => shot.outputAssetId).length}</b> generated output${clips.filter(({ shot }) => shot.outputAssetId).length === 1 ? "" : "s"}</span><span><b>${project.characters.length}</b> character${project.characters.length === 1 ? "" : "s"}</span><span><b>${project.audioTracks.length}</b> audio cue${project.audioTracks.length === 1 ? "" : "s"}</span></div></section>${scenes.length ? `<section class="timeline-editor timeline-editor-v2"><div class="timeline-scale"><span>00:00</span><span>${(total * .25).toFixed(1)}s</span><span>${(total * .5).toFixed(1)}s</span><span>${(total * .75).toFixed(1)}s</span><span>${total.toFixed(1)}s</span></div><div class="timeline-sequences">${sceneRows}</div><section class="timeline-audio-track"><header><div><small>AUDIO / MUSIC / VOICE</small><strong>${project.audioTracks.length ? "Cues stay aligned to the edit." : "No audio cues yet."}</strong></div><button id="addTimelineAudioSecondary" class="quiet-button">Add cue</button></header><div class="timeline-audio-canvas"><div class="timeline-audio-grid"></div>${audioCues || `<span class="timeline-audio-empty">Add music, ambience, narration, or a sound effect.</span>`}</div></section></section>` : `<section class="timeline-empty"><i>⌁</i><h2>There is no cut to time yet.</h2><p>Build starter shots from Shot Planner, then return here to direct the rhythm.</p><button data-nav="Shot Planner" class="save-button">Open Shot Planner</button></section>`}<section class="timeline-footer-note"><strong>Production memory stays intact.</strong><span>Changing timing here updates the same shot records used by preview rendering, delivery, and export.</span></section></div>`;
}
function openAudioCueModal(cueId = "") {
  ensureProductionShape(); const audioAssets = projectAssets().filter((asset) => asset.kind === "audio");
  if (!audioAssets.length) { active = "Media Library"; render(); notify("Import an audio file before creating a cue."); return; }
  // Editing reuses the same form as creating — the only difference is
  // whether submit pushes a new cue or updates the existing one in place.
  // Without this, START/DURATION/LEVEL on an already-created cue were only
  // ever set once and could never be changed short of deleting and
  // recreating it.
  const existing = cueId ? project.audioTracks.find((cue) => cue.id === cueId) : null;
  const sceneOptions = [`<option value="">Global / not scene-specific</option>`, ...project.scenes.map((scene, index) => `<option value="${esc(scene.id)}">Scene ${String(index + 1).padStart(2, "0")} · ${esc(scene.title)}</option>`)].join("");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="audioCueForm" class="project-modal audio-cue-modal"><button type="button" id="closeModal">×</button><p>AUDIO STUDIO / ${existing ? "EDIT CUE" : "NEW CUE"}</p><h2>${existing ? "Adjust this cue's timing." : "Give the cut a pulse."}</h2><label>AUDIO ASSET<select id="cueAsset">${audioAssets.map((asset) => `<option value="${esc(asset.id)}" ${existing?.assetId === asset.id ? "selected" : ""}>${esc(asset.name)}</option>`).join("")}</select></label><div class="audio-cue-grid"><label>TYPE<select id="cueType">${["Dialogue", "Music", "Ambience", "Sound effect"].map((value) => `<option ${(existing?.type || "Music") === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>SCENE<select id="cueScene">${sceneOptions}</select></label><label>START (SEC)<input id="cueStart" value="${esc(existing?.start ?? "0")}" /></label><label>DURATION (SEC)<input id="cueDuration" value="${esc(existing?.duration ?? "5")}" /></label><label>LEVEL<input id="cueLevel" value="${esc(existing?.level ?? "0 dB")}" /></label><label>NOTES<input id="cueNotes" value="${esc(existing?.notes || "")}" placeholder="Intent, transition, or cue point" /></label></div><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">${existing ? "Save cue" : "Add cue"}</button></div></form></div>`;
  if (existing?.sceneId) $("#cueScene").value = existing.sceneId;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#audioCueForm").onsubmit = (event) => { event.preventDefault(); const scene = project.scenes.find((item) => item.id === $("#cueScene").value); const asset = assetById($("#cueAsset").value); const payload = { assetId: asset?.id || "", type: $("#cueType").value, sceneId: scene?.id || "", shotTitle: scene?.shots?.[0]?.title || "", start: $("#cueStart").value.trim() || "0", duration: $("#cueDuration").value.trim() || "5", level: $("#cueLevel").value.trim() || "0 dB", notes: $("#cueNotes").value.trim() }; if (existing) Object.assign(existing, payload); else project.audioTracks.push({ id: `cue-${Date.now()}`, ...payload }); setDirty(); closeModal(); render(); notify(existing ? "Cue updated." : "Audio cue added to the cut."); };
}
// Same gap the Character/Set/Prop/Shot deletes had before this pass: a cue
// carries a chosen asset, scene assignment, and tuned start/duration/level —
// real configured work — but the Timeline's "×" and Audio Studio's "Remove"
// both deleted it in one click with no confirmation and no undo.
function removeAudioCue(cueId) {
  ensureProductionShape();
  const cue = project.audioTracks.find((item) => item.id === cueId);
  if (!cue) return;
  const asset = assetById(cue.assetId);
  if (!confirm(`Remove this ${cue.type || "audio"} cue${asset ? ` (${asset.name})` : ""}? This cannot be undone.`)) return;
  project.audioTracks = project.audioTracks.filter((item) => item.id !== cueId); setDirty(); render(); notify("Audio cue removed.");
}
function audioStudioWorkspace() {
  ensureProductionShape(); const cues = project.audioTracks; const assets = projectAssets().filter((asset) => asset.kind === "audio");
  return `<div class="audio-workspace"><div class="workspace-heading"><div><p>AUDIO STUDIO / CUE SHEET</p><h1>Let the story be heard.</h1></div><div class="story-actions"><button id="importAudioDirect" class="quiet-button">Import audio</button><button id="addAudioCue" class="save-button" ${assets.length ? "" : "disabled"}>Add audio cue</button></div></div><section class="audio-intro"><div><small>PROJECT AUDIO</small><h2>Dialogue, music, ambience, and effects stay attached to the story—not buried in a folder.</h2><p>Import a file, place it as a cue, then fine-tune timing in the connected Timeline. Every cue is saved with the project and included in preview rendering and delivery.</p></div><div><b>${assets.length}</b><span>audio asset${assets.length === 1 ? "" : "s"}</span><b>${cues.length}</b><span>planned cue${cues.length === 1 ? "" : "s"}</span></div></section><section class="audio-workflow"><span><b>1</b> Import audio</span><i>→</i><span><b>2</b> Add a cue</span><i>→</i><span><b>3</b> Place it in the Timeline</span><i>→</i><span><b>4</b> Render or export</span></section><section class="audio-cue-list">${cues.length ? cues.map((cue, index) => { const asset = assetById(cue.assetId); const scene = project.scenes.find((item) => item.id === cue.sceneId); return `<article><i>${String(index + 1).padStart(2, "0")}</i><div><small>${esc(cue.type)} · ${esc(scene?.title || "Global cue")}</small><h3>${esc(asset?.name || "Missing audio asset")}</h3><p>${esc(cue.notes || "No cue note.")}</p></div><div class="audio-cue-time"><span>START <b>${esc(cue.start)}s</b></span><span>DURATION <b>${esc(cue.duration)}s</b></span><span>LEVEL <b>${esc(cue.level)}</b></span></div><div class="audio-preview">${asset ? `<audio controls preload="metadata" src="${esc(fileUrl(asset))}"></audio>` : ""}<button data-edit-audio-cue="${esc(cue.id)}" class="quiet-button">Edit timing</button><button data-remove-audio-cue="${esc(cue.id)}" class="remove-button">Remove</button></div></article>`; }).join("") : `<div class="audio-empty"><i>♫</i><h2>${assets.length ? "Audio is ready to be placed." : "Build the soundtrack in four clear steps."}</h2><p>${assets.length ? "Create the first cue, choose its scene and timing, and it will appear in the Timeline immediately." : "Import music, dialogue, ambience, or effects here. Storymaker keeps the source in the Media Library and places each cue on the Timeline."}</p><div class="audio-empty-actions"><button ${assets.length ? 'id="addFirstAudioCue"' : 'id="importFirstAudioDirect"'} class="save-button">${assets.length ? "Add first cue" : "Import audio file"}</button><button data-nav="Timeline" class="quiet-button">Open timeline</button></div></div>`}</section></div>`;
}
async function exportProductionPackage() {
  if (!window.storyMakerDesktop?.exportProductionPackage) return notify("Production-package export is available in the Windows app.");
  const button = $("#exportProductionPackage"); if (button) { button.disabled = true; button.textContent = "Exporting…"; }
  try { const result = await window.storyMakerDesktop.exportProductionPackage({ project }); if (!result || result.canceled) return; notify(`Production package exported to ${result.folderPath}`); }
  catch (error) { notify(error?.message || "The production package could not be exported."); }
  finally { if (button) { button.disabled = false; button.textContent = "Export production package"; } }
}
async function refreshDeliveryCapabilities() {
  try { deliveryState = await window.storyMakerDesktop?.deliveryCapabilities() || deliveryState; }
  catch { deliveryState = { previewRender: false }; }
  if (active === "Delivery") render();
}
async function renderVisualPreview() {
  if (!window.storyMakerDesktop?.renderVisualPreview) return notify("Visual preview rendering is available in the Windows app.");
  const button = $("#renderVisualPreview"); if (button) { button.disabled = true; button.textContent = "Rendering preview…"; }
  try {
    const result = await window.storyMakerDesktop.renderVisualPreview({ project });
    if (!result || result.canceled) return;
    notify(`Production preview saved with ${result.clips || "the selected"} clip${result.clips === 1 ? "" : "s"}${result.audioCues ? ` and ${result.audioCues} audio cue${result.audioCues === 1 ? "" : "s"}` : ""}: ${result.filePath}`);
  } catch (error) { notify(error?.message || "The visual preview could not be rendered."); }
  finally { if (button) { button.disabled = false; button.textContent = "Render local visual preview"; } }
}
function shotDeliveryState(shot) {
  const history = shot.modelSettings?.outputHistory || [];
  const latest = history[0];
  const output = assetById(shot.outputAssetId);
  if (output) return { tone: shot.outputReview === "approved" ? "approved" : shot.outputReview === "revision" ? "revision" : "review", label: shot.outputReview === "approved" ? "Approved" : shot.outputReview === "revision" ? "Needs revision" : "Ready to review", detail: `${output.kind || "media"} output · ${output.name}` };
  if (latest?.status === "failed") return { tone: "failed", label: "Render failed", detail: latest.error || "Open this shot to retry with the saved brief." };
  if (["submitting", "queued", "generating", "processing", "running"].includes(latest?.status)) return { tone: "queued", label: "In production", detail: `${latest.provider || "Provider"} · ${latest.model || "model"}` };
  if (!shot.modelSettings?.prompt?.trim()) return { tone: "needs", label: "Needs a prompt", detail: "Add a specific production brief before rendering." };
  return { tone: "planned", label: "Ready to render", detail: `${shot.modelSettings?.model || "Choose a model"} · ${shot.modelSettings?.aspectRatio || "frame unset"}` };
}
function deliveryAudit() {
  ensureProductionShape();
  return project.scenes.flatMap((scene, sceneIndex) => scene.shots.map((shot, shotIndex) => ({ scene, sceneIndex, shot, shotIndex, state: shotDeliveryState(shot) })));
}
function deliveryWorkspace() {
  const audit = deliveryAudit(); const shotCount = audit.length; const approved = project.scenes.filter((scene) => scene.motionAssetId || scene.approvedVariationId || scene.referenceAssetId).length; const finished = audit.filter((item) => ["review", "approved", "revision"].includes(item.state.tone)).length; const reviewed = audit.filter((item) => item.state.tone === "approved").length; const activeJobs = audit.filter((item) => item.state.tone === "queued").length; const blockers = audit.filter((item) => ["needs", "failed", "revision"].includes(item.state.tone)).length; const canRender = deliveryState.previewRender && approved > 0;
  return `<div class="delivery-workspace"><div class="workspace-heading"><div><p>DELIVERY / PRODUCTION HANDOFF</p><h1>Hand the film to the next craft.</h1></div><button id="exportProductionPackage" class="save-button">Export production package</button></div><section class="delivery-hero"><div><small>PACKAGE READY</small><h2>${project.name === "Untitled Film" ? "Name the production before handing it off." : esc(project.name)}</h2><p>Export a structured project record with staged assets, a shot list, audio cue sheet, and production notes. The export is a folder you can hand to an editor, producer, or the next Storymaker session.</p></div><div class="delivery-counts"><span><b>${project.scenes.length}</b> scene${project.scenes.length === 1 ? "" : "s"}</span><span><b>${shotCount}</b> shot${shotCount === 1 ? "" : "s"}</span><span><b>${finished}</b> output${finished === 1 ? "" : "s"}</span><span><b>${project.audioTracks.length}</b> audio cue${project.audioTracks.length === 1 ? "" : "s"}</span></div></section><section class="delivery-contents"><article><i>01</i><h3>Project record</h3><p>A reopenable <b>.storymaker</b> file with visual references staged beside it.</p></article><article><i>02</i><h3>Shot list</h3><p><b>shot-list.csv</b> with scene, camera, timing, cast, and reference context.</p></article><article><i>03</i><h3>Audio cue sheet</h3><p><b>audio-cues.csv</b> with source, timing, type, level, and notes.</p></article><article><i>04</i><h3>Production notes</h3><p>A clean <b>production-notes.md</b> brief for a human handoff.</p></article></section><section class="delivery-preflight"><div class="delivery-preflight-head"><div><small>SHOT DELIVERY PREFLIGHT</small><h2>Every generated frame has a next decision.</h2><p>Review the current output, identify missing direction, and return to the exact shot that needs work. Nothing is marked approved by default.</p></div><div class="delivery-preflight-metrics"><span><b>${reviewed}</b> approved</span><span><b>${activeJobs}</b> rendering</span><span class="${blockers ? "attention" : ""}"><b>${blockers}</b> attention</span></div></div>${audit.length ? `<div class="delivery-audit-list">${audit.map(({ scene, sceneIndex, shot, shotIndex, state }, index) => `<article class="delivery-audit-row delivery-${state.tone}"><i>${String(index + 1).padStart(2, "0")}</i><div class="delivery-audit-copy"><small>${esc(scene.title)} · ${esc(shot.modelSettings?.model || "No model")}</small><h3>${esc(shot.title)}</h3><p>${esc(state.detail)}</p></div><div class="delivery-audit-status"><b>${esc(state.label)}</b><span>${esc(shot.modelSettings?.aspectRatio || "Frame unset")} · ${shot.modelSettings?.referenceAssetIds?.length || 0} local ref${(shot.modelSettings?.referenceAssetIds?.length || 0) === 1 ? "" : "s"}</span></div><div class="delivery-audit-actions"><button class="quiet-button" data-direct-shot="${sceneIndex}:${shotIndex}">Direct</button>${shot.outputAssetId ? `<button class="line-action" data-review-delivery-shot="${sceneIndex}:${shotIndex}">Review</button>${state.tone !== "approved" ? `<button class="line-action" data-approve-delivery-shot="${sceneIndex}:${shotIndex}">Approve</button>` : ""}` : ""}</div></article>`).join("")}</div>` : `<div class="delivery-audit-empty"><h3>Build a shot plan to begin preflight.</h3><p>Storymaker will keep each shot’s model, prompt, references, job history, and approval state together here.</p><button data-nav="Shot Planner" class="quiet-button">Open Shot Planner</button></div>`}</section><section class="delivery-render"><div><small>LOCAL VISUAL PREVIEW</small><h2>See the pacing before the full render.</h2><p>${deliveryState.previewRender ? (approved ? "Render a silent 1080p MP4 from approved storyboard frames. Each image holds for its planned shot duration, so the preview tells the truth about your current cut." : "Approve or attach a storyboard image first. Storymaker will use that visual and your planned shot durations to make a local MP4 preview.") : "FFmpeg is not available on this PC, so local MP4 preview is unavailable. Your production package remains ready to export."}</p></div><div><span class="delivery-render-status ${deliveryState.previewRender ? "ready" : ""}">${deliveryState.previewRender ? "LOCAL RENDER READY" : "LOCAL RENDER UNAVAILABLE"}</span><button id="renderVisualPreview" class="quiet-button" ${canRender ? "" : "disabled"}>Render local visual preview</button></div></section><section class="delivery-next"><div><small>CONNECTED VIDEO</small><h2>Queued video jobs return to this project.</h2><p>Video renders through fal, Kie, or WaveSpeed preserve their model, prompt, references, task ID, status history, and outputs in the same shot record. Eligible saved jobs are checked after reopening, so a completed render can return to review instead of disappearing between sessions.</p></div><button data-nav="Model Hub" class="quiet-button">Review provider connections</button></section></div>`;
}
function reviewDeliveryShot(sceneIndex, shotIndex) {
  ensureProductionShape();
  const shot = project.scenes[sceneIndex]?.shots?.[shotIndex];
  if (!shot?.outputAssetId) return notify("This shot does not have an output to review yet.");
  selectedSceneIndex = sceneIndex;
  openVariation(shot.outputAssetId);
}
function approveDeliveryShot(sceneIndex, shotIndex) {
  ensureProductionShape();
  const scene = project.scenes[sceneIndex]; const shot = scene?.shots?.[shotIndex]; const output = assetById(shot?.outputAssetId);
  if (!scene || !shot || !output) return notify("This output is no longer available in the project.");
  shot.outputReview = "approved";
  if (output.kind === "image") {
    scene.referenceAssetId = output.id;
    scene.approvedVariationId = output.id;
    if (!scene.variations.some((variation) => variation.assetId === output.id)) scene.variations.unshift({ assetId: output.id, createdAt: new Date().toISOString(), source: "shot-delivery" });
  } else if (output.kind === "video") {
    syncAutomaticMotionMaster(scene, shot, output.id);
  }
  setDirty(); render(); notify(output.kind === "image" ? "Shot approved and staged as the scene reference." : "Video approved and placed in the timeline as this scene's motion master.");
}
function sceneVisualizationWorkspace() {
  ensureSceneShape();
  const scenes = project.scenes;
  if (!scenes.length) return `<div class="visualization-workspace"><div class="workspace-heading"><div><p>SCENE VISUALIZATION / GENERATE</p><h1>Turn a beat into a frame.</h1></div></div><section class="visual-empty"><i>+</i><h2>First, give the film a sequence.</h2><p>Scene Visualization turns a specific storyboard beat into an editable visual take. Build the story map or add a scene, then return here.</p><button data-nav="Storyboard" class="save-button">Open storyboard</button></section></div>`;
  selectedSceneIndex = Math.max(0, Math.min(selectedSceneIndex, scenes.length - 1));
  const scene = scenes[selectedSceneIndex];
  const reference = assetById(scene.referenceAssetId);
  const direction = scene.generationPrompt || `A decisive cinematic still that captures ${scene.title.toLowerCase()}. ${scene.note}`;
  const variations = scene.variations.map((variation) => ({ variation, asset: assetById(variation.assetId) })).filter(({ asset }) => asset);
  const connected = providerReady("openai");
  const context = [project.logline, project.style, ...(project.themes || []).slice(0, 3)].filter(Boolean);
  return `<div class="visualization-workspace"><div class="workspace-heading"><div><p>SCENE VISUALIZATION / OPENAI IMAGE STUDIO</p><h1>Direct the frame before it exists.</h1></div><div class="visual-connection ${connected ? "ready" : ""}">${connected ? "OPENAI CONNECTED" : "CONNECT OPENAI IN MODEL HUB"}</div></div><section class="visual-context"><div><small>PRODUCTION CONTEXT</small><h2>${esc(project.logline || "The story context will shape every frame.")}</h2><div class="visual-context-tags">${context.length ? context.map((item) => `<span>${esc(item)}</span>`).join("") : `<span>Add story and design context for sharper results.</span>`}</div></div><aside><small>SCENE PROGRESS</small><strong>${String(selectedSceneIndex + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}</strong><span>${variations.length} visual take${variations.length === 1 ? "" : "s"} in this scene</span></aside></section><div class="visual-layout"><section class="visual-director"><div class="visual-scene-picker"><label>SCENE<select id="visualizeScene">${scenes.map((item, index) => `<option value="${index}" ${index === selectedSceneIndex ? "selected" : ""}>${String(index + 1).padStart(2, "0")} · ${esc(item.title)}</option>`).join("")}</select></label><div><small>STORY BEAT</small><strong>${esc(scene.note)}</strong></div></div><label class="visual-prompt-label">DIRECTOR'S VISUAL BRIEF<textarea id="scenePrompt">${esc(direction)}</textarea></label><div class="visual-controls"><label>FRAME<select id="sceneSize"><option value="1536x1024" ${scene.generationSize === "1536x1024" ? "selected" : ""}>Landscape · 16:9</option><option value="1024x1024" ${scene.generationSize === "1024x1024" ? "selected" : ""}>Square · 1:1</option><option value="1024x1536" ${scene.generationSize === "1024x1536" ? "selected" : ""}>Portrait · 9:16</option></select></label><div class="visual-reference ${reference ? "has-reference" : ""}"><small>VISUAL REFERENCE</small><strong>${reference ? esc(reference.name) : "No reference attached"}</strong><span>${reference ? "Sent with this request to guide the image." : "Attach an image from Storyboard or Media Library."}</span></div><button id="generateSceneImage" class="save-button" ${connected ? "" : "disabled"}>Generate scene frame</button></div><p class="visual-disclosure">Generation is explicit: only this scene brief and its attached image reference, if present, are sent when you select Generate. Your key stays encrypted on this PC.</p></section><aside class="visual-takes"><div><p>SELECTED TAKE</p>${scene.approvedVariationId ? `<strong>Approved for storyboard</strong>` : `<strong>Choose a visual direction</strong>`}</div>${variations.length ? variations.map(({ variation, asset }, index) => `<article class="visual-take ${scene.approvedVariationId === asset.id ? "approved" : ""}"><button data-open-variation="${esc(asset.id)}" class="visual-take-image" style="background-image:linear-gradient(0deg,#080b13a8,transparent 65%),url('${esc(fileUrl(asset))}')"><span>TAKE ${String(variations.length - index).padStart(2, "0")}</span></button><div><small>${esc(variation.generation?.size || scene.generationSize)}</small><h3>${scene.approvedVariationId === asset.id ? "Storyboard reference" : "Candidate frame"}</h3><button data-approve-variation="${esc(asset.id)}" class="line-action">${scene.approvedVariationId === asset.id ? "Approved" : "Approve for storyboard →"}</button></div></article>`).join("") : `<div class="visual-take-empty"><i>◇</i><h3>No takes yet.</h3><p>Your first frame will land here, attached to the same scene that prompted it.</p></div>`}</aside></div></div>`;
}
function directorSuggestions() {
  const suggestions = [];
  if (!project.logline) suggestions.push({ signal: "STORY CORE", title: "Write the one sentence that makes the film watchable.", copy: "A logline gives the director a dramatic promise to protect in every scene.", target: "Story Bible" });
  if (!project.premise) suggestions.push({ signal: "EMOTIONAL THROUGHLINE", title: "Name the question beneath the plot.", copy: "A premise keeps the film from becoming a sequence of attractive but unrelated images.", target: "Story Bible" });
  if (!project.style) suggestions.push({ signal: "VISUAL LANGUAGE", title: "Choose a visual language before planning shots.", copy: "A locked direction tells the board how color, texture, pace, and lensing should feel.", target: "Design Bible" });
  if (!project.locations?.length) suggestions.push({ signal: "WORLD", title: "Give the story one place that carries emotional weight.", copy: "A specific location makes the world easier to stage, light, and remember.", target: "Story Bible" });
  if (!project.characters?.length) suggestions.push({ signal: "CAST", title: "Define the person with the most to lose.", copy: "The first character becomes the emotional anchor for scene objectives and performance notes.", target: "Character Bible" });
  if (!project.scenes?.length && project.logline) suggestions.push({ signal: "SEQUENCE", title: "Turn the story core into a first production map.", copy: "Storymaker can make a local four-beat draft you can revise in the storyboard.", target: "build" });
  return suggestions.length ? suggestions.slice(0, 4) : [{ signal: "READY TO BOARD", title: "Your foundations are connected. Build the first sequence.", copy: "The story, world, cast, and visual language can now become a scene blueprint.", target: "Storyboard" }];
}
function aiWorkspace() {
  const providers = providerCatalog.filter((provider) => providerReady(provider.id));
  const openAiReady = providerReady("openai");
  const suggestions = directorSuggestions();
  const review = project.directorReview;
  const reviewPanel = review ? `<section class="live-review-card"><div class="live-review-heading"><div><small>LIVE OPENAI DIRECTOR REVIEW</small><h2>${esc(review.summary || "The director has reviewed the current production context.")}</h2></div><span>${review.generatedAt ? new Date(review.generatedAt).toLocaleDateString() : "JUST NOW"}</span></div>${review.decisions?.length ? `<div class="live-review-grid">${review.decisions.map((decision, index) => `<article><i>${String(index + 1).padStart(2, "0")}</i><div><small>${esc(decision.signal)}</small><h3>${esc(decision.title)}</h3><p>${esc(decision.rationale)}</p></div><button data-nav="${esc(decision.target || "Story Bible")}" class="quiet-button">Open</button></article>`).join("")}</div>` : ""}${review.suggestedThemes?.length ? `<div class="review-themes"><div><small>DIRECTOR-SUGGESTED THEMES</small><p>${review.suggestedThemes.map(esc).join(" · ")}</p></div><button id="applyLiveDirectorReview" class="line-action">Apply missing themes →</button></div>` : ""}${review.recommendedStructure ? `<div class="review-structure"><small>RECOMMENDED STRUCTURE</small><h3>${esc(review.recommendedStructure.name)}</h3><p>${esc(review.recommendedStructure.rationale)}</p></div>` : ""}</section>` : "";
  const influence = project.creativeInfluence;
  const influenceProviderReady = openAiReady || providerReady("openrouter");
  // Per spec section 7: describe a reference conversationally and get back
  // reusable craft attributes, never a "do it like <name>" promise the app
  // can't legally or ethically keep.
  const influencePanel = `<section class="creative-influence-card"><div class="live-review-heading"><div><small>CREATIVE INFLUENCE</small><h2>Describe a film, director, era, or mood — get back the craft attributes, not an imitation.</h2></div></div><div class="influence-input-row"><input id="creativeInfluenceInput" type="text" placeholder="e.g. a 1970s conspiracy thriller, or a specific director's visual language" ${influenceProviderReady ? "" : "disabled"} /><button id="translateCreativeInfluence" class="quiet-button" ${influenceProviderReady ? "" : "disabled"}>Translate</button></div>${!influenceProviderReady ? `<p class="scene-modal-note">Connect OpenAI or OpenRouter in Model Hub to translate a creative influence.</p>` : ""}${influence ? `<div class="influence-result"><small>${esc(influence.category.toUpperCase())}</small><div class="influence-traits">${influence.traits.map((trait) => `<span>${esc(trait)}</span>`).join("")}</div><p>${esc(influence.note)}</p></div>` : ""}</section>`;
  // The Director workspace is an inbox for undecided editorial work. Keep
  // accepted/rejected items in the project for audit history, but do not
  // present them again as actionable recommendations here.
  const scriptSuggestions = (project.scriptSuggestions || []).filter((item) => !item.status || item.status === "pending");
  const suggestionsPanel = `<section class="script-suggestions-card"><div class="live-review-heading"><div><small>SCRIPT IMPROVEMENT SUGGESTIONS</small><h2>${scriptSuggestions.length ? `${scriptSuggestions.length} suggestion${scriptSuggestions.length === 1 ? "" : "s"} ready to review` : "Have the parser read the script and propose concrete rewrites."}</h2></div>${openAiReady || providerReady("openrouter") ? `<button id="requestScriptImprovements" class="quiet-button">${scriptSuggestions.length ? "Read again" : "Suggest improvements"}</button>` : ""}</div>${scriptSuggestions.length ? `<div class="suggestion-list">${scriptSuggestions.map((item) => `<article class="suggestion-card"><div class="suggestion-head"><small>${esc(item.category.toUpperCase())} · ${item.scope === "scene" ? esc(item.sceneTitle) : item.scope.toUpperCase()}</small><h3>${esc(item.title)}</h3></div><p class="suggestion-rationale">${esc(item.rationale)}</p><div class="suggestion-impact">${item.expectedBenefit ? `<span><small>EXPECTED BENEFIT</small>${esc(item.expectedBenefit)}</span>` : ""}<span><small>PRODUCTION CONSEQUENCE</small>${esc(item.productionConsequence)}</span></div>${item.currentText ? `<div class="suggestion-diff"><div><small>CURRENT</small><p>${esc(item.currentText)}</p></div><div><small>SUGGESTED · EDITABLE</small><textarea data-suggestion-text="${esc(item.id)}" rows="3">${esc(item.suggestedText)}</textarea></div></div>` : `<div class="suggestion-diff single"><div><small>SUGGESTED · EDITABLE</small><textarea data-suggestion-text="${esc(item.id)}" rows="3">${esc(item.suggestedText)}</textarea></div></div>`}<div class="suggestion-actions"><button data-accept-suggestion="${esc(item.id)}" class="save-button">Accept</button><button data-reject-suggestion="${esc(item.id)}" class="quiet-button">Reject</button></div></article>`).join("")}</div>` : !openAiReady && !providerReady("openrouter") ? `<p class="scene-modal-note">Connect OpenAI or OpenRouter in Model Hub to enable script improvement suggestions.</p>` : ""}</section>`;
  return `<div class="director-workspace"><div class="workspace-heading"><div><p>AI DIRECTOR / STORY REVIEW</p><h1>Make the next decision the right one.</h1></div><span class="ai-online">${openAiReady ? "● LIVE OPENAI READY" : "○ LOCAL DIRECTOR"}</span></div><section class="director-context"><div><small>CONNECTED STORY CONTEXT</small><h2>${project.logline ? esc(project.logline) : "The director is waiting for the first story signal."}</h2><div class="director-context-tags"><span>${project.style || "No visual language"}</span><span>${project.themes?.length ? project.themes.join(" · ") : "No themes"}</span><span>${project.locations?.length || 0} locations</span><span>${project.characters?.length || 0} characters</span></div></div><aside><strong>${openAiReady ? "A live Director review is ready." : "Private offline analysis is active."}</strong><p>${openAiReady ? "When you run a review, Storymaker sends this current project record to OpenAI and saves the structured direction inside your project." : providers.length ? "Other provider connections are saved. The first live Director adapter currently uses OpenAI; local suggestions below remain available." : "Suggestions below are generated locally from your current project record."}</p>${openAiReady ? `<button id="requestLiveDirectorReview" class="save-button">Run live director review</button>` : `<button data-nav="Model Hub" class="line-action">Connect OpenAI in Model Hub →</button>`}</aside></section>${reviewPanel}${influencePanel}${suggestionsPanel}<section class="director-decision-list">${suggestions.map((suggestion, index) => `<article><i>${String(index + 1).padStart(2, "0")}</i><div><small>${suggestion.signal}</small><h3>${suggestion.title}</h3><p>${suggestion.copy}</p></div>${suggestion.target === "build" ? `<button id="buildStoryMap" class="save-button">Build story map</button>` : `<button data-nav="${suggestion.target}" class="quiet-button">Open</button>`}</article>`).join("")}</section></div>`;
}
function visualizationWorkspace() {
  ensureProductionShape(); const scenes = project.scenes; const scene = scenes[selectedSceneIndex] || scenes[0]; if (!scene) return `<div class="empty-stage wide"><h2>Add a scene before directing frames.</h2></div>`;
  const variations = sceneTakeEntries(scene);
  const imageModels = modelCatalog.filter((item) => item.status === "live" && modelCapability(item.model).output === "Image");
  const selectedModel = imageModels.find((item) => item.model === (scene.generationModel || "gpt-image-1")) || imageModels[0];
  const linked = Array.isArray(scene.generationReferenceAssetIds) ? scene.generationReferenceAssetIds : []; const refs = projectAssets().filter((asset) => asset.kind === "image");
  const direction = scene.generationPrompt || `A decisive cinematic still that captures ${scene.title}. ${scene.note}`;
  const context = [project.name, project.style, ...(project.themes || [])].filter(Boolean);
  return `<div class="visualization-workspace"><div class="workspace-heading"><div><p>SCENE VISUALIZATION / MODEL DIRECTOR</p><h1>Direct the frame before it exists.</h1></div><div class="visual-connection ${providerReady(selectedModel?.provider) ? "ready" : ""}">${selectedModel ? `${esc(selectedModel.label)} · ${providerReady(selectedModel.provider) ? "CONNECTED" : "CONNECT IN MODEL HUB"}` : "CONNECT A MODEL"}</div></div><section class="visual-context"><div><small>PRODUCTION CONTEXT</small><h2>${esc(project.logline || "The story context will shape every frame.")}</h2><div class="visual-context-tags">${context.map((item) => `<span>${esc(item)}</span>`).join("")}</div></div><aside><small>SCENE PROGRESS</small><strong>${String(selectedSceneIndex + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}</strong><span>${variations.length} saved take${variations.length === 1 ? "" : "s"} in this scene</span></aside></section><div class="visual-layout"><section class="visual-director"><div class="visual-scene-picker"><label>SCENE<select id="visualizeScene">${scenes.map((item, index) => `<option value="${index}" ${index === selectedSceneIndex ? "selected" : ""}>${String(index + 1).padStart(2, "0")} · ${esc(item.title)}</option>`).join("")}</select></label><div><small>STORY BEAT</small><strong>${esc(scene.note)}</strong></div></div><label class="visual-prompt-label">DIRECTOR'S VISUAL BRIEF<textarea id="scenePrompt">${esc(direction)}</textarea></label><div class="visual-controls"><label>IMAGE MODEL<select id="sceneModel">${imageModels.map((item) => `<option value="${esc(item.model)}" ${item.model === selectedModel.model ? "selected" : ""}>${esc(item.label)} · ${providerReady(item.provider) ? "Connected" : "Not connected"}</option>`).join("")}</select></label><label>FRAME<select id="sceneSize"><option value="1536x1024" ${scene.generationSize === "1536x1024" ? "selected" : ""}>Landscape · 16:9</option><option value="1024x1024" ${scene.generationSize === "1024x1024" ? "selected" : ""}>Square · 1:1</option><option value="1024x1536" ${scene.generationSize === "1024x1536" ? "selected" : ""}>Portrait · 9:16</option><option value="21:9" ${scene.generationSize === "21:9" ? "selected" : ""}>Cinematic · 21:9</option></select></label></div><section class="visual-reference-tray"><div><small>REFERENCE TRAY</small><span>Characters, sets, props, and scene references</span></div><div>${refs.length ? `<div class="reference-grid">${refs.map((asset) => referenceChoiceTile(asset, linked.includes(asset.id), "sceneReferences", true)).join("")}</div>` : `<p class="scene-modal-note">Import reference images from Media Library or here.</p>`}</div><button id="importSceneReferences" type="button" class="quiet-button">Import reference media</button></section><button id="generateSceneImage" class="save-button" ${providerReady(selectedModel.provider) ? "" : "disabled"}>Generate scene frame</button><p class="visual-disclosure">The selected model receives the scene brief plus only the references you check. Video and audio references are available from Shot Model Director for compatible video models.</p></section><aside class="visual-takes"><div><p>SCENE TAKE HISTORY</p><strong>${variations.length ? "Review every saved image and video" : "Choose a visual direction"}</strong></div>${variations.length ? variations.map((entry, index) => visualTakeMarkup(entry, index, variations.length, scene)).join("") : `<div class="visual-take-empty"><i>◇</i><h3>No takes yet.</h3><p>Your first frame will land here, attached to the same scene that prompted it.</p></div>`}</aside></div></div>`;
}
function locationsWorkspace() {
  ensureSetShape();
  const cards = project.sets.length ? project.sets.map((set, index) => {
    const reference = assetById(set.referenceAssetId); const image = reference?.kind === "image" ? fileUrl(reference) : "";
    const sceneCount = project.scenes.filter((scene) => (scene.setIds || []).includes(set.id)).length;
    return entityCardMarkup({ index, name: set.name, eyebrow: set.mood || "Environment", description: set.description, emptyDescription: "Define this place once, then its approved reference follows it into every assigned scene.", referenceCount: entityReferenceRoles(set).size, sceneCount, image, editAttr: "edit-set", editLabel: "Edit location profile →", labAttr: "open-set-lab", labLabel: "Open Environment Lab", removeAttr: "remove-set", cardClass: "world-asset-card location-card", assignAttr: "assign-set" });
  }).join("") : `<div class="empty-stage wide"><span>✦</span><h2>Build the places your story returns to.</h2><p>Create a location, generate an environment reference, and let it travel into every assigned render.</p><button id="addFirstSet" class="save-button">Add first location</button></div>`;
  return `<div class="asset-workspace"><div class="workspace-heading"><div><p>LOCATIONS / ENVIRONMENT BIBLE</p><h1>Give every returning place a visual memory.</h1></div><div class="story-actions"><button data-nav="Storyboard" class="quiet-button">Open storyboard</button><button id="addSet" class="save-button">Add location</button></div></div><section class="asset-workspace-hero"><div><small>CONTINUITY-FIRST ENVIRONMENTS</small><h2>${project.sets.length ? `${project.sets.length} location${project.sets.length === 1 ? "" : "s"} ready to assign.` : "Build the first environment before you frame the scene."}</h2><p>Each location owns its design brief, full-screen reference gallery, and environment-specific Style DNA. Assign it to a storyboard scene and its approved imagery is carried to compatible final renders automatically.</p></div><div><span>${project.sets.length} LOCATIONS</span><span>${project.sets.reduce((total, set) => total + entityReferenceRoles(set).size, 0)} REFERENCES</span></div></section><section class="asset-library-section"><header><div><small>LOCATION LIBRARY</small><h2>Places with a consistent camera language.</h2></div><p>Open Environment Lab to generate or inspect a location at full size.</p></header><div class="character-profile-grid">${cards}</div></section></div>`;
}
function productionAssetsWorkspace() {
  ensureProductionShape();
  const cards = project.props.length ? project.props.map((item, index) => {
    const reference = assetById(item.referenceAssetId); const image = reference?.kind === "image" ? fileUrl(reference) : "";
    const sceneCount = project.scenes.filter((scene) => (scene.propIds || []).includes(item.id)).length;
    return entityCardMarkup({ index, name: item.name, eyebrow: item.category || "Prop", description: item.description, emptyDescription: "Create it once, approve its visual reference, and preserve it across every assigned scene.", referenceCount: entityReferenceRoles(item).size, sceneCount, image, editAttr: "edit-production-asset", editLabel: "Edit asset profile →", labAttr: "open-prop-lab", labLabel: "Open Asset Lab", removeAttr: "remove-production-asset", cardClass: "world-asset-card production-asset-card", assignAttr: "assign-production-asset" });
  }).join("") : `<div class="empty-stage wide"><span>✦</span><h2>Build the things the camera remembers.</h2><p>Props, accessories, wardrobe, vehicles, creatures, weapons, and products each get their own continuity profile.</p><button id="addFirstProductionAsset" class="save-button">Add first asset</button></div>`;
  const categories = ["prop", "accessory", "wardrobe / costume", "vehicle", "creature", "weapon", "product", "other"];
  return `<div class="asset-workspace"><div class="workspace-heading"><div><p>PROPS & ACCESSORIES / ASSET BIBLE</p><h1>Make every important object return on model.</h1></div><div class="story-actions"><button data-nav="Storyboard" class="quiet-button">Open storyboard</button><button id="addProductionAsset" class="save-button">Add asset</button></div></div><section class="asset-workspace-hero"><div><small>CONTINUITY-FIRST PRODUCTION DESIGN</small><h2>${project.props.length ? `${project.props.length} reusable asset${project.props.length === 1 ? "" : "s"} ready to assign.` : "Give the world its objects before the camera asks for them."}</h2><p>Each asset has a full reference gallery and a dedicated Asset Lab. Its approved images are automatically protected as continuity inputs when the asset is assigned to a scene.</p></div><div>${categories.map((category) => `<span>${project.props.filter((item) => (item.category || "prop") === category).length} ${esc(category)}</span>`).join("")}</div></section><section class="asset-library-section"><header><div><small>ASSET LIBRARY</small><h2>Props, accessories, wardrobe, vehicles, and more.</h2></div><p>Choose an asset type, then open Asset Lab for the same full-width generation and viewing experience as Character Lab.</p></header><div class="character-profile-grid">${cards}</div></section></div>`;
}
function storyboardProductionWorkspace() {
  const isStudio = experienceMode !== "simple";
  const card = (scene, index) => { const asset = sceneGeneratedAsset(scene); const cast = (scene.castIds || []).map((id) => project.characters.find((character) => character.id === id)?.name).filter(Boolean); const image = asset?.kind === "image" ? fileUrl(asset) : ""; const video = asset?.kind === "video"; const layer = video ? ` style="position:relative;z-index:1"` : ""; const appliedDna = scene.appliedStyleDnaId ? styleDnaById(scene.appliedStyleDnaId) : null; const videoLabel = asset?.kind === "image" ? "Generate video from frame" : video ? "Generate another video" : "Generate video"; return `<article class="scene-card ${asset ? "has-generated-output" : "needs-generation"}"><button class="scene-image" ${video ? `data-view-scene-output="${esc(asset.id)}" title="Play this take"` : `data-edit-scene="${index}"`} ${image ? `style="background-image:linear-gradient(0deg,#0a0c15dc,#0a0c1500),url('${esc(image)}')"` : video ? `style="position:relative;overflow:hidden"` : ""}>${video ? `<video src="${esc(fileUrl(asset))}" muted playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none"></video><b style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;width:44px;height:44px;border-radius:50%;background:#0a0c15b0;border:1px solid #ffffff40;display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff">▶</b>` : ""}<span${layer}>${String(index + 1).padStart(2, "0")}</span>${asset ? `<em${layer}>${video ? "GENERATED VIDEO" : "GENERATED FRAME"}</em>` : `<em>NO GENERATED OUTPUT</em>`}</button><div><small>SCENE ${String(index + 1).padStart(2, "0")}</small><h3>${esc(scene.title)}</h3><p>${esc(scene.note)}</p>${cast.length ? `<span class="scene-cast-label">${esc(cast.join(" · "))}</span>` : ""}${appliedDna ? `<span class="scene-cast-label">🎨 ${esc(appliedDna.name)}</span>` : ""}<div class="scene-card-actions"><button data-generate-scene-shot="${index}" class="save-button">${asset ? "Generate another take" : "Generate with AI model"}</button><button data-generate-scene-video="${index}" class="save-button animate-button">${videoLabel}</button>${asset ? `<button data-save-style-dna="${index}" class="line-action" title="Capture this scene's visual style as a reusable profile">Save as Style DNA</button>` : ""}${asset?.kind === "image" && appliedDna ? `<button data-check-scene-drift="${index}" data-asset-id="${esc(asset.id)}" class="line-action" title="Compare against ${esc(appliedDna.name)} — 1 API check">Check style drift</button>` : ""}<button data-edit-scene="${index}" class="line-action">Edit scene, cast & references →</button></div></div></article>`; };
  const shotCard = (scene, sceneIndex, shot, shotIndex) => { const outputAsset = assetById(shot.outputAssetId); const outputIsVideo = outputAsset?.kind === "video"; const actions = isStudio ? `<button data-direct-shot="${sceneIndex}:${shotIndex}" class="save-button">Direct this shot</button>` : `<button data-prime-shot-image="${sceneIndex}:${shotIndex}" class="save-button">Generate image</button><button data-prime-shot-video="${sceneIndex}:${shotIndex}" class="save-button animate-button">Generate video</button>`; return `<article class="scene-card shot-card ${shot.outputAssetId ? "has-generated-output" : "needs-generation"}"><button class="scene-image" data-direct-shot="${sceneIndex}:${shotIndex}" ${outputIsVideo ? `style="position:relative;overflow:hidden"` : outputAsset ? `style="background-image:linear-gradient(0deg,#0a0c15dc,#0a0c1500),url('${esc(fileUrl(outputAsset))}')"` : ""}>${outputIsVideo ? `<video src="${esc(fileUrl(outputAsset))}" muted playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none"></video>` : ""}<span>${String(sceneIndex + 1).padStart(2, "0")}.${String(shotIndex + 1).padStart(2, "0")}</span><em>${shot.outputAssetId ? (outputIsVideo ? "VIDEO READY" : "FRAME READY") : "NO FRAME"}</em></button><div><small>SCENE ${String(sceneIndex + 1).padStart(2, "0")} / SHOT ${String(shotIndex + 1).padStart(2, "0")}</small><h3>${esc(shot.title || "Untitled shot")}</h3><p>${esc(shot.purpose || "Define this shot's intention.")}</p><div class="scene-card-actions">${actions}</div></div></article>`; };
  const unexpandedScenes = project.scenes.filter((scene) => shotPlanEligible(scene)).length;
  // Sets used to live in the retired Design Bible screen — the only
  // reachable UI for addSet()/openSetModal() and nowhere else, so removing
  // that screen would have silently orphaned set creation entirely. This
  // is its new home: Storyboard is where scenes actually reference sets.
  ensureSetShape();
  const setCards = project.sets.length ? project.sets.map((set, index) => { const reference = assetById(set.referenceAssetId); const image = reference?.kind === "image" ? fileUrl(reference) : ""; const sceneCount = project.scenes.filter((scene) => (scene.setIds || []).includes(set.id)).length; const referenceCount = entityReferenceRoles(set).size; return entityCardMarkup({ index, name: set.name, eyebrow: set.mood || "", description: set.description, emptyDescription: "Give this location a description so continuity and generation stay grounded.", referenceCount, sceneCount, image, editAttr: "edit-set", editLabel: "Edit location profile →", labAttr: "open-set-lab", labLabel: "Open Set Lab", removeAttr: "remove-set" }); }).join("") : `<div class="empty-stage wide"><span>✦</span><h2>No locations yet.</h2><p>Add the first location this story returns to.</p><button id="addFirstSet" class="line-action">Add the first location →</button></div>`;
  const sceneBoardContent = project.scenes.map((scene, sceneIndex) => {
    const shots = scene.shots || [];
    const shotsMarkup = shots.length ? `<div class="scene-shots"><small>${shots.length} SHOT${shots.length === 1 ? "" : "S"} TO DIRECT</small><div class="scene-shots-row">${shots.map((shot, shotIndex) => shotCard(scene, sceneIndex, shot, shotIndex)).join("")}</div></div>` : "";
    return `<div class="scene-group">${card(scene, sceneIndex)}${shotsMarkup}</div>`;
  }).join("");
  return `<div class="board-workspace"><div class="workspace-heading"><div><p>STORYBOARD / GENERATED PRODUCTION BOARD</p><h1>Put the generated film on the wall.</h1></div><div class="story-actions">${unexpandedScenes ? `<button id="populateAllShots" class="quiet-button" title="Break ${unexpandedScenes} scene${unexpandedScenes === 1 ? "" : "s"} into a full shot list with camera, lighting, performance, and audio for every shot">Populate all shots (${unexpandedScenes})</button>` : ""}<button data-nav="Locations" class="quiet-button">Locations</button><button data-nav="Production Assets" class="quiet-button">Props & accessories</button><button data-nav="Shot Planner" class="quiet-button">Plan shots</button><button data-nav="Media Library" class="quiet-button">Open media library</button><button id="addScene" class="save-button">Add scene</button></div></div><div class="board-canvas"><section class="storyboard-notice"><strong>Generated outputs only</strong><span>${isStudio ? "Studio mode: every scene groups its own shots beneath it. Generate a quick scene take, or direct any shot individually — camera, lighting, model, and references, all yours to command." : "Simple mode: every shot is here, grouped under its scene. Hit Generate image or Generate video right on the card — no dials to turn, just direction."}</span></section><div class="beatline"><span>ACT I</span><i></i><span>ACT II</span><i></i><span>ACT III</span></div><div class="scene-board">${project.scenes.length ? sceneBoardContent || `<div class="empty-stage wide"><span>▤</span><h2>No scenes yet. Just possibility.</h2><p>Build the first beat and let the rhythm emerge.</p><button id="addFirstScene" class="line-action">Add first scene →</button></div>` : `<div class="empty-stage wide"><span>▤</span><h2>No scenes yet. Just possibility.</h2><p>Build the first beat and let the rhythm emerge.</p><button id="addFirstScene" class="line-action">Add first scene →</button></div>`}</div></div></div>`;
}
function modelHubWorkspace() {
  const readyCount = providerCatalog.filter((provider) => providerReady(provider.id)).length;
  const localReadyCount = ["ollama", "comfyui"].filter((id) => ["ready", "available"].includes(localRuntimeState?.[id]?.state)).length;
  const query = modelHubQuery.trim().toLowerCase();
  const filteredModels = modelCatalog.filter((item) => {
    const output = String(modelCapability(item.model).output || "").toLowerCase();
    const matchesFilter = modelHubFilter === "all" || modelHubFilter === "connected" && providerReady(item.provider) || modelHubFilter === "image" && output === "image" || modelHubFilter === "video" && output === "video" || modelHubFilter === "text" && !["image", "video"].includes(output);
    return matchesFilter && (!query || [item.label, item.provider, item.model, ...(item.modes || [])].join(" ").toLowerCase().includes(query));
  });
  const modelGroups = [
    { id: "comfyui", label: "ComfyUI · On-device", mark: "C" },
    ...providerCatalog
  ].map((provider) => ({ provider, models: filteredModels.filter((item) => item.provider === provider.id) })).filter((group) => group.models.length);
  const providerCard = (provider) => {
    const health = providerState.health?.[provider.id]; const hasKey = providerReady(provider.id); const state = hasKey ? (health?.state || "saved") : "offline";
    const label = !hasKey ? "Not connected" : state === "verified" ? "Verified" : state === "failed" ? "Check failed" : "Key saved";
    const detail = health?.message || (hasKey ? "The key is encrypted on this PC. Run a connection check before a production render." : provider.note);
    const placeholder = hasKey ? "Stored securely — enter a new key to replace" : "Paste key to connect";
    return `<article class="provider-card ${hasKey ? "connected" : ""} provider-${state}"><div class="provider-card-top"><i>${provider.mark}</i><div><small>${provider.capability}</small><h3>${provider.label}</h3></div><span>${label}</span></div><p>${esc(detail)}</p><form data-provider-form="${provider.id}"><label>API KEY<input type="password" autocomplete="off" placeholder="${placeholder}" /></label><div><button type="submit" class="${hasKey ? "quiet-button" : "save-button"}">${hasKey ? "Replace key" : "Connect"}</button>${hasKey ? `<button type="button" class="quiet-button" data-verify-provider="${provider.id}">Check connection</button><button type="button" class="remove-provider" data-remove-provider="${provider.id}">Disconnect</button>` : ""}</div></form></article>`;
  };
  const ollama = localRuntimeState.ollama || {}; const comfy = localRuntimeState.comfyui || {};
  const localCard = (id, label, mark, capability, runtime, readyCopy, nextCopy) => {
    const resolvedReadyCopy = id === "comfyui"
      ? "FLUX image generation is verified and available in Shot Director, alongside Wan (start and end frame) and LTX-Video (start frame) for local video."
      : readyCopy;
    return `<article class="local-runtime-card ${runtime.state || "offline"}"><div><i>${mark}</i><span><small>${capability}</small><h3>${label}</h3></span><b>${runtime.state === "ready" ? "READY" : runtime.state === "available" ? "RUNNING" : "NOT DETECTED"}</b></div><p>${esc(runtime.message || "Local runtime has not been checked.")}</p>${id === "ollama" && runtime.models?.length ? `<div class="local-model-chips">${runtime.models.slice(0, 8).map((model) => `<span>${esc(model)}</span>`).join("")}</div>` : ""}${id === "comfyui" && runtime.devices?.length ? `<div class="local-model-chips">${runtime.devices.map((device) => `<span>${esc(device.name)}</span>`).join("")}${runtime.capabilities?.image ? "<span>FLUX IMAGE READY</span>" : ""}${runtime.capabilities?.video ? "<span>WAN VIDEO READY</span>" : ""}${runtime.capabilities?.videoLtx ? "<span>LTX VIDEO READY</span>" : ""}</div>` : ""}<small>${runtime.state === "ready" || runtime.state === "available" ? resolvedReadyCopy : nextCopy}</small></article>`;
  };
  return `<div class="model-hub-workspace"><div class="workspace-heading"><div><p>MODEL HUB / PRIVATE CONNECTIONS</p><h1>Bring the studio to life.</h1></div><span class="autosave">${readyCount || localReadyCount ? `${readyCount + localReadyCount} ENGINE${readyCount + localReadyCount === 1 ? "" : "S"} AVAILABLE` : "OFFLINE-READY"}</span></div><section class="model-hub-intro"><div><p>LOCAL OR CONNECTED</p><h2>One creative language.<br>Many possible engines.</h2></div><p>Use private local runtimes when they fit the job, and connected providers when a shot needs frontier quality or speed. Cloud keys remain protected by Windows encryption and are never written into project files.</p></section><section class="local-runtime-section"><header><div><small>ON-DEVICE AI</small><h2>Keep private work on this PC.</h2><p>Storymaker checks only the standard loopback addresses. It never downloads models or starts heavyweight services without your choice.</p></div><button id="refreshLocalRuntimes" class="quiet-button">Refresh local engines</button></header><div class="local-runtime-grid">${localCard("ollama", "Ollama", "L", "Story analysis · recommendations · shot planning", ollama, "Private story intelligence is live. Storymaker reaches for it whenever no connected language provider is available.", "Install and start Ollama, then add a capable instruct model. No API key is required.")}${localCard("comfyui", "ComfyUI", "C", "Local image · video · workflow engine", comfy, "FLUX.1 Schnell appears in Shot Director as soon as its checkpoint is installed. Local video remains behind its own verified workflow gate.", "Opening Comfy Desktop alone isn't enough — it's a launcher, not the server. From its dashboard, open or start a ComfyUI instance (not Comfy Cloud); Storymaker checks port 8000, or 8188 for the portable build. Model installation remains opt-in.")}</div></section><section class="model-catalog model-catalog-v2"><header><div><small>SHOT MODEL CATALOG</small><h2>Find the right engine without the scroll.</h2><p>Only Live models can be selected for a render. Filter by output or connected provider, then search by model, gateway, or capability.</p></div><strong>${filteredModels.length} model${filteredModels.length === 1 ? "" : "s"}</strong></header><div class="model-catalog-tools"><input id="modelHubSearch" value="${esc(modelHubQuery)}" placeholder="Search models, providers, or capabilities…" /><nav>${[["all","All"],["connected","Connected"],["image","Image"],["video","Video"],["text","Story / text"]].map(([id,label]) => `<button type="button" data-model-hub-filter="${id}" class="${modelHubFilter === id ? "active" : ""}">${label}</button>`).join("")}</nav></div><div class="model-provider-groups">${modelGroups.length ? modelGroups.map(({ provider, models }) => `<details class="model-provider-group" ${models.length < 18 || query ? "open" : ""}><summary><span><i>${provider.mark}</i><b>${esc(provider.label)}</b><small>${providerReady(provider.id) ? "CONNECTED" : "NOT CONNECTED"}</small></span><em>${models.length}</em></summary><div>${models.map((item) => `<article class="${item.status}"><span>${esc(item.label)}</span><b>${item.status === "live" ? "LIVE" : "IN BUILD"}</b><small>${item.modes.map(esc).join(" · ")}</small></article>`).join("")}</div></details>`).join("") : `<div class="model-catalog-empty">No models match this filter.</div>`}</div></section><section class="provider-connections"><div><small>CLOUD CONNECTIONS</small><h2>Credentials and connection health</h2></div><div class="provider-grid">${providerCatalog.map(providerCard).join("")}</div></section><div class="model-hub-foot"><span>${providerState.encryptionAvailable ? "Windows credential encryption is active on this device." : "Windows credential encryption was not available. Provider keys cannot be saved until it is."}</span><button class="line-action" data-nav="Settings">Studio preferences →</button></div></div>`;
}
let helpTopic = "start";
function helpWorkspace() {
  const cloudReady = providerCatalog.filter((provider) => providerReady(provider.id)).length;
  const ollamaReady = ["ready", "available"].includes(localRuntimeState.ollama?.state);
  const comfyImageReady = Boolean(localRuntimeState.comfyui?.capabilities?.image);
  const comfyVideoReady = Boolean(localRuntimeState.comfyui?.capabilities?.video);
  const topics = [
    ["start", "01", "Install & begin"],
    ["cloud", "02", "Connect cloud AI"],
    ["local", "03", "Set up local AI"],
    ["workflow", "04", "Make your first shot"],
    ["styles", "05", "Create custom styles"],
    ["troubleshooting", "06", "Troubleshooting"]
  ];
  const start = `<section class="help-chapter"><header><small>INSTALLATION</small><h2>From download to first project.</h2><p>Storymaker is a Windows desktop application. Your projects, imported media, generated takes, and encrypted provider credentials remain on this PC unless you deliberately send a generation request to a cloud provider.</p></header><ol class="help-steps"><li><b>Choose your package.</b><span>Use <strong>Setup</strong> for Start Menu and desktop integration. Use <strong>Portable</strong> when you want to run Storymaker without installing it.</span></li><li><b>Install or launch.</b><span>Close an older Storymaker version first. Run the Setup file and follow Windows prompts, or place the Portable file in a writable folder and open it.</span></li><li><b>Create a project.</b><span>Select <strong>New project</strong>, or open an existing <code>.storymaker</code> project. Save early so Storymaker knows where project media belongs.</span></li><li><b>Choose Simple or Studio Mode.</b><span>Simple Mode follows Story → Look → Board → Make → Deliver. Studio Mode exposes every model, reference, camera, lighting, performance, audio, and continuity control.</span></li><li><b>Connect an engine.</b><span>Cloud and local engines are optional and can coexist. Open <strong>Model Hub</strong> to see exactly what is ready.</span></li></ol><div class="help-callout"><strong>Recommended first launch</strong><span>Create a small test project, connect one image engine, generate one frame, save, close Storymaker, then reopen the project and confirm the frame is still present.</span></div></section>`;
  const cloud = `<section class="help-chapter"><header><small>CLOUD AI · ${cloudReady} READY</small><h2>Connect only the providers you want.</h2><p>Storymaker supports OpenAI, Google Gemini, fal, Kie, WaveSpeed, and OpenRouter. Provider keys are encrypted using Windows protection and are never written into a project file.</p></header><ol class="help-steps"><li><b>Create a key with the provider.</b><span>Sign in to the provider's official dashboard, create an API key, and make sure the account has access or credits for the models you intend to use.</span></li><li><b>Open Model Hub.</b><span>Select the circular Model Hub icon in the left sidebar. Find the provider under <strong>Cloud connections</strong>.</span></li><li><b>Save and verify.</b><span>Paste the key, choose <strong>Save key</strong>, then <strong>Check connection</strong>. Storymaker shows Verified, Rejected, Missing, or a provider-specific error.</span></li><li><b>Choose provider and model per shot.</b><span>Open Storyboard → Generate with AI model. The provider selector controls where the request is sent; the model selector exposes only that model's supported controls.</span></li></ol><div class="help-provider-guide"><article><b>OpenAI / Gemini</b><span>Story intelligence and premium image generation.</span></article><article><b>fal</b><span>Image, editing, Kling, Seedance, reference-to-video, and multimodal workflows.</span></article><article><b>Kie</b><span>Image and video gateway models including Kling, Veo, and Seedance variants.</span></article><article><b>WaveSpeed</b><span>Image and video gateway models including Wan and Seedance variants.</span></article><article><b>OpenRouter</b><span>Optional language-model routing for story analysis and recommendations.</span></article></div><div class="help-warning"><strong>Protect your credentials</strong><span>Never place an API key inside prompts, project notes, screenshots, or exported production packages. Disconnect a provider in Model Hub if a key is replaced or revoked.</span></div></section>`;
  const local = `<section class="help-chapter"><header><small>LOCAL AI · PRIVATE ON THIS PC</small><h2>Run story, image, and video tools locally.</h2><p>Local engines avoid per-generation API charges and can keep sensitive material on the workstation. They require separate software, model downloads, disk space, and suitable hardware.</p></header><div class="help-local-grid"><article class="${ollamaReady ? "ready" : ""}"><span>${ollamaReady ? "READY" : "SETUP"}</span><h3>Ollama · story intelligence</h3><ol><li>Install Ollama for Windows from its official website.</li><li>Open Ollama and install an instruct model. Storymaker was verified with <code>qwen3:8b</code>.</li><li>Keep Ollama running on <code>127.0.0.1:11434</code>.</li><li>Open Model Hub and choose <strong>Refresh local engines</strong>.</li></ol><p>Storymaker uses Ollama for structured story analysis and recommendations when no connected language provider succeeds.</p></article><article class="${comfyImageReady || comfyVideoReady ? "ready" : ""}"><span>${comfyImageReady && comfyVideoReady ? "IMAGE + VIDEO READY" : comfyImageReady ? "IMAGE READY" : comfyVideoReady ? "VIDEO READY" : "SETUP"}</span><h3>ComfyUI · local media</h3><ol><li>Install ComfyUI Desktop for Windows and confirm it opens normally.</li><li>Keep Desktop on <code>127.0.0.1:8000</code>, or portable ComfyUI on <code>127.0.0.1:8188</code>.</li><li>For local images, install <code>flux1-schnell-fp8.safetensors</code> in <code>ComfyUI/models/checkpoints</code>.</li><li>For local video, install the Wan 2.1 Fun InP diffusion model, UMT5 text encoder, Wan VAE, and CLIP Vision model in their matching ComfyUI model folders.</li><li>Restart ComfyUI after adding models, then refresh Model Hub.</li></ol><p>A running ComfyUI service is not enough: Storymaker marks image and video ready independently after checking the required models and nodes.</p></article></div><div class="help-callout"><strong>Local video requirements</strong><span>Local Wan video needs a deliberately selected Start Frame. General reference images remain guidance and are never silently used as start or end frames. A modern NVIDIA GPU with at least 12 GB VRAM is recommended for the verified draft workflow.</span></div><button class="save-button" data-nav="Model Hub">Open Model Hub</button></section>`;
  const workflow = `<section class="help-chapter"><header><small>FIRST PRODUCTION PASS</small><h2>Generate one complete shot safely.</h2></header><ol class="help-steps"><li><b>Import or write the story.</b><span>Review what the parser understood. Preserve the script or request AI improvements and accept only the changes you want.</span></li><li><b>Approve production assets.</b><span>Create characters, locations, and props/accessories in their own workspaces — Character Lab, Environment Lab, and Asset Lab each generate or import a reference image. Then choose <strong>Assign to scenes</strong> on the asset (or assign it from the scene's own edit view) so its approved reference reaches every shot in that scene automatically.</span></li><li><b>Choose the visual direction.</b><span>Apply a system style or custom Style DNA. It supplies image and video prompt blocks without replacing character identity.</span></li><li><b>Generate the storyboard frame.</b><span>Select provider, image model, aspect ratio, references, and Director Controls. Run readiness before spending credits.</span></li><li><b>Animate the exact frame.</b><span>Select <strong>Animate this exact image</strong> or deliberately assign the approved frame as Start Frame. Choose a compatible image-to-video model.</span></li><li><b>Review and deliver.</b><span>Select the winning take, place it on the Timeline, add audio, save the project, and export the production package.</span></li></ol><div class="help-callout"><strong>References versus frames</strong><span>Character, set, prop, and style references guide identity and appearance. Start and End Frames define video composition. Storymaker keeps these roles separate.</span></div></section>`;
  const stylesHelp = `<section class="help-chapter"><header><small>STYLE DNA</small><h2>Create a visual language users can reuse.</h2><p>Custom styles control materials, palette, lighting, camera, composition, motion, prompt blocks, negative constraints, and continuity. They do not overwrite characters, sets, or props.</p></header><div class="help-callout"><strong>Try a built-in style first</strong><span>The Style tab ships genre/mood foundations plus a dedicated 2D Animation set — Sunlit Graphic Storybook, Cut-Paper Theatre, Ink-and-Wash Legend, and more (filter with the 2D Animation chip). Applying one reaches Character Lab, Environment Lab, and Asset Lab too, not just the storyboard — no custom authoring needed unless you want a look none of them cover.</span></div><ol class="help-steps"><li><b>Open Visual Direction.</b><span>Choose <strong>Create style</strong> and describe the visual world in plain language.</span></li><li><b>Add references deliberately.</b><span>Select optional images and assign each a role, strength, what to extract, and what to ignore.</span></li><li><b>Save manually or interpret with AI.</b><span>Manual drafts work without AI. AI interpretation produces structured Style DNA and pauses for comparison before saving.</span></li><li><b>Validate the look.</b><span>Generate character, environment, prop, and storyboard previews. Animate an approved preview to validate motion language.</span></li><li><b>Apply and version.</b><span>Apply at project, scene, or shot level. Editing creates a new version; prior versions remain restorable.</span></li><li><b>Reuse elsewhere.</b><span>Save to My Styles or export a <code>.storymaker-style</code> package. Manage, rename, duplicate, export, and remove styles from the My Styles screen.</span></li></ol></section>`;
  const troubleshooting = `<section class="help-chapter"><header><small>DIAGNOSTICS</small><h2>When something does not generate.</h2></header><div class="help-troubleshooting"><details open><summary>A provider says the key is invalid or rejected</summary><p>Open Model Hub, replace the saved key, and run Check connection. Confirm the key belongs to the selected provider and that the provider account has model access.</p></details><details><summary>ComfyUI is running but Storymaker says Not Ready</summary><p>Confirm the port is 8000 for Desktop or 8188 for portable. Restart ComfyUI after installing models. Refresh local engines and read the missing-capability message.</p></details><details><summary>Image-to-video asks for a Start Frame</summary><p>Select the approved storyboard image inside the Start Frame control or choose Animate this exact image. General references intentionally do not become start frames automatically.</p></details><details><summary>A model rejects too many references</summary><p>Every model has its own reference limit. Remove unneeded references in Shot Director, or choose a multimodal/reference model with a larger supported limit.</p></details><details><summary>A completed output is not visible</summary><p>Open the shot's Output History, use Review take, then check Media Library. Save and reopen the project. If recovery is needed, Storymaker checks durable generation jobs during startup.</p></details><details><summary>Video is slow locally</summary><p>Local video is compute-intensive. Use a shorter duration and draft resolution, close other GPU applications, or route the final render to a connected cloud provider.</p></details></div><div class="help-warning"><strong>When asking for support</strong><span>Include the provider, exact model, operation, time of failure, and the displayed correlation ID. Never include the API key itself.</span></div></section>`;
  const chapters = { start, cloud, local, workflow, styles: stylesHelp, troubleshooting };
  return `<div class="help-workspace help-workspace-v2"><div class="workspace-heading"><div><p>STORYMAKER / GETTING STARTED</p><h1>Set up once. Stay with the story.</h1></div><div class="story-actions"><button class="quiet-button" data-nav="Model Hub">Model Hub</button><button class="save-button" data-nav="Home">Return home</button></div></div><section class="help-hero help-hero-v2"><div><small>INSTALL · CONNECT · CREATE</small><h2>Everything needed for a confident first production.</h2><p>Follow the chapters in order, or jump directly to the engine or workflow you need. Status comes from this workstation—not a generic checklist.</p></div><div class="help-health"><span class="${cloudReady ? "ready" : ""}">${cloudReady} cloud</span><span class="${ollamaReady ? "ready" : ""}">Ollama ${ollamaReady ? "ready" : "not detected"}</span><span class="${comfyImageReady ? "ready" : ""}">FLUX ${comfyImageReady ? "ready" : "not ready"}</span><span class="${comfyVideoReady ? "ready" : ""}">Wan ${comfyVideoReady ? "ready" : "not ready"}</span></div></section><div class="help-layout"><nav class="help-topic-nav">${topics.map(([id, number, label]) => `<button data-help-topic="${id}" class="${helpTopic === id ? "active" : ""}"><span>${number}</span>${label}</button>`).join("")}</nav><main>${chapters[helpTopic] || start}</main></div><section class="help-shortcuts"><div><p>CORE SHORTCUTS</p><span>New story <b>Ctrl + N</b></span><span>Open story <b>Ctrl + O</b></span><span>Save <b>Ctrl + S</b></span><span>Help <b>F1</b></span></div><div><p>PROJECT SAFETY</p><span>Save project files and generated media to a backed-up production folder.</span><span>Never store provider credentials inside project notes.</span></div></section></div>`;
}
function settingsWorkspace() {
  return `<div class="settings-workspace"><div class="workspace-heading"><div><p>STUDIO / PREFERENCES</p><h1>Make the room your own.</h1></div></div><section class="settings-surface"><div><small>APPEARANCE</small><h2>Quiet tools. Clear thinking.</h2><p>Choose how Storymaker looks and how much of the production desk is visible at once.</p></div><div class="settings-controls"><label>WORKSPACE DEPTH<select id="experienceSelect"><option value="simple" ${experienceMode === "simple" ? "selected" : ""}>Simple mode · guided production</option><option value="studio" ${experienceMode === "studio" ? "selected" : ""}>Studio mode · full controls</option></select></label><label>COLOR MODE<select id="themeSelect"><option value="dark" ${theme === "dark" ? "selected" : ""}>Dark studio</option><option value="light" ${theme === "light" ? "selected" : ""}>Light studio</option></select></label><label>NAVIGATION<select id="navSelect"><option value="full" ${navMode === "full" ? "selected" : ""}>Full navigation</option><option value="compact" ${navMode === "compact" ? "selected" : ""}>Compact navigation</option><option value="icons" ${navMode === "icons" ? "selected" : ""}>Icons only</option></select></label></div></section></div>`;
}
let visualStyleQuery = "";
let visualStyleScope = "all";
let modelHubQuery = "";
let modelHubFilter = "all";
let userStyleDnas = [];
const visualStyleLibrary = () => {
  const unique = new Map();
  [...systemStyleDnas(), ...userStyleDnas, ...savedStyleDnas()].forEach((style) => unique.set(style.id, defaultStyleDna(style)));
  return [...unique.values()];
};
const styleSummary = (dna) => [dna.medium?.primary, dna.lighting?.approach, dna.visualLanguage?.shapeLanguage].filter(Boolean).join(" · ") || dna.description || "A reusable visual direction.";
const stylePreviewUrl = (dna) => {
  const generated = dna.thumbnailAssetId ? assetById(dna.thumbnailAssetId) : null;
  if (generated?.path) return fileUrl(generated);
  // Bundled assets/styles/{name}.png lookup by the DNA's own name, checked
  // before the legacy styles[] fallback. The 12 2D-animation Style DNAs
  // (system2dStyleDnas()) aren't in the legacy array at all — without this,
  // styles.find() never matches them and every one silently falls through
  // to the generic splash graphic, indistinguishable from every other style
  // in the grid.
  return optionalStyleAsset(dna.name) || styles.find((style) => style.name === dna.name)?.image || splashArtwork;
};
const styleCreatorReferences = () => projectAssets().filter((asset) => asset.kind === "image");
const stylePreviewAssetIds = (dna) => [...new Set([...(dna?.previewAssetIds || []), ...(project.visualDirection?.stylePreviews?.[dna?.id] || [])])];
const stylePreviewScenarios = {
  character: "A full-body lead character in a neutral production pose, emotionally readable expression, signature wardrobe, clean studio environment.",
  environment: "A cinematic establishing environment with clear architecture, atmosphere, depth, and narrative-ready set dressing.",
  prop: "A story-critical hero prop on a considered surface, materially believable, clearly readable silhouette, editorial product composition.",
  storyboard: "A decisive cinematic storyboard frame: one character enters a meaningful environment, clear camera language, motivated lighting, and a readable emotional beat."
};
async function generateStylePreview(dnaId, scenario, modelId) {
  ensureProductionShape(); const dna = styleDnaById(dnaId); const model = modelCatalog.find((item) => item.model === modelId) || modelCatalog.find((item) => item.status === "live" && modelCapability(item.model).output === "Image" && providerReady(item.provider));
  if (!dna) return notify("Style not found.");
  if (!model || !providerReady(model.provider)) return notify("Connect an image provider in Model Hub before generating a style preview.");
  const supportedReferences = modelCapability(model.model).references.includes("image");
  const refs = supportedReferences ? (dna.referenceAssets || []).map((reference) => assetById(reference.assetId)).filter((asset) => asset?.kind === "image").slice(0, 4) : [];
  const blocks = stylePromptBlocks(dna, "image"); const subject = stylePreviewScenarios[scenario] || stylePreviewScenarios.storyboard;
  const styleContext = scenario === "environment" ? "environment" : scenario === "prop" ? "prop" : scenario === "character" ? "character" : "storyboard";
  const prompt = `STYLE DNA PREVIEW — ${scenario.toUpperCase()}\n${subject}\n\nVISUAL DIRECTION:\n${blocks.positive.join(". ")}\n\nPreserve the specified material language, palette, lighting, composition, camera, and continuity rules. This is a style-validation preview, not a new story asset.`;
  const button = document.querySelector(`[data-generate-style-preview="${CSS.escape(dnaId)}:${scenario}"]`); if (button) { button.disabled = true; button.textContent = "Generating…"; }
  openGenerationOverlay(`${scenario} style preview`);
  try {
    const result = await window.storyMakerDesktop.generateShotImage({ project: { id: project.id, name: project.name, style: dna.name, visualDirection: { projectStyle: { styleId: dna.id, versionId: dna.versionId, snapshot: dna } } }, scene: { id: `style-preview-${dna.id}`, title: `${dna.name} style preview`, note: subject, castIds: [], setIds: [], propIds: [] }, shot: { id: `style-preview-${scenario}`, title: `${dna.name} · ${scenario} preview`, purpose: subject, framing: scenario === "storyboard" ? "Cinematic master frame" : "Editorial studio composition", lens: scenario === "environment" ? "24mm" : "50mm", movement: "Static", blueprint: { ...defaultShotBlueprint(), narrative: subject, lighting: dna.lighting?.approach || "", camera: dna.camera?.shotLanguage?.join(", ") || "" } }, settings: { provider: model.provider, model: model.model, mode: refs.length ? "image-edit" : "text-to-image", styleContext, aspectRatio: "16:9", resolution: "1536x1024", prompt, negativePrompt: stylePromptBlocks(dna, "image").negative.join(", "), referenceAssetIds: refs.map((asset) => asset.id), quality: "High", referenceStrength: "Balanced" }, references: refs.map((asset) => ({ path: asset.path, name: asset.name, kind: asset.kind })) });
    if (!result?.asset) throw new Error("The provider returned no preview image.");
    const asset = { ...result.asset, id: `style-preview-${Date.now()}-${scenario}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), stylePreview: { styleId: dna.id, styleVersionId: dna.versionId, scenario } } };
    project.assets = projectAssets(); project.assets.unshift(asset);
    project.visualDirection.stylePreviews[dna.id] = [asset.id, ...(project.visualDirection.stylePreviews[dna.id] || []).filter((id) => id !== asset.id)].slice(0, 12);
    const saved = savedStyleDnas().find((style) => style.id === dna.id); if (saved) { saved.previewAssetIds = stylePreviewAssetIds(dna); if (!saved.thumbnailAssetId) saved.thumbnailAssetId = asset.id; }
    setDirty(); closeModal(); render(); openStyleDetail(dna.id); notify(`${dna.name} ${scenario} preview is ready to review.`);
  } catch (error) { notify(error?.message || "Style preview generation failed."); }
  finally { closeGenerationOverlay(); if (button?.isConnected) { button.disabled = false; button.textContent = `Generate ${scenario}`; } }
}
async function generateStyleMotionPreview(dnaId, modelId) {
  ensureProductionShape();
  const dna = styleDnaById(dnaId);
  const source = stylePreviewAssetIds(dna).map(assetById).find((asset) => asset?.kind === "image");
  const model = modelCatalog.find((item) => item.model === modelId)
    || modelCatalog.find((item) => item.status === "live" && modelCapability(item.model).output === "Video" && item.modes.includes("image-to-video") && modelReady(item));
  if (!dna) return notify("Style not found.");
  if (!source) return notify("Generate at least one image preview before testing motion.");
  if (!model || !modelReady(model)) return notify("Connect a compatible image-to-video model in Model Hub first.");
  const capability = modelCapability(model.model);
  const blocks = stylePromptBlocks(dna, "video");
  const duration = String(Math.max(2, Number(Array.isArray(capability.duration) ? capability.duration[0] : capability.duration?.min) || 4));
  const prompt = `STYLE DNA MOTION TEST\nAnimate this exact approved style frame without redesigning it. ${blocks.positive.join(". ")}. Preserve composition, identity, materials, palette, lighting, and continuity. Use restrained, physically believable motion.`;
  const payload = {
    project: { id: project.id, name: project.name, style: dna.name, visualDirection: { projectStyle: { styleId: dna.id, versionId: dna.versionId, snapshot: dna } } },
    scene: { id: `style-preview-${dna.id}`, title: `${dna.name} motion preview`, note: prompt, castIds: [], setIds: [], propIds: [] },
    shot: { id: `style-preview-motion-${Date.now()}`, title: `${dna.name} · motion preview`, purpose: prompt, framing: "Cinematic style test", lens: "50mm", movement: dna.animation?.motionQuality || "Restrained motion", blueprint: { ...defaultShotBlueprint(), narrative: prompt, lighting: dna.lighting?.approach || "", camera: dna.camera?.shotLanguage?.join(", ") || "", motion: dna.animation?.motionQuality || "Restrained motion" } },
    settings: { provider: model.provider, model: model.model, mode: "image-to-video", styleContext: "storyboard", aspectRatio: capability.ratios?.includes("16:9") ? "16:9" : capability.ratios?.[0] || "16:9", resolution: capability.resolutions?.[0] || "720p", duration, prompt, videoPrompt: prompt, negativePrompt: blocks.negative.join(", "), startFrameAssetId: source.id, endFrameAssetId: "", referenceAssetIds: [], videoReferenceAssetIds: [], audioReferenceAssetIds: [], quality: "Balanced", referenceStrength: "Preserve", referenceSelectionVersion: 2 },
    references: [{ id: source.id, path: source.path, name: source.name, kind: "image", role: "start-frame" }]
  };
  const button = $("#generateStyleMotion");
  if (button) { button.disabled = true; button.textContent = "Rendering motion…"; }
  openGenerationOverlay("style motion preview");
  try {
    let result = await window.storyMakerDesktop.submitShotVideo(payload);
    const taskId = result?.taskId;
    for (let attempt = 0; !result?.asset && taskId && attempt < 180; attempt += 1) {
      updateGenerationOverlay({ progress: Math.min(92, 12 + attempt * .45), stage: `${providerLabel(model.provider)} is rendering the style motion test.` });
      await new Promise((resolve) => setTimeout(resolve, Math.max(3, Number(result.pollAfterSeconds) || 5) * 1000));
      result = await window.storyMakerDesktop.pollShotVideo({ provider: model.provider, taskId, model: model.model, title: `${dna.name} motion preview` });
      if (result?.status === "failed") throw new Error(result.error || "The style motion preview failed.");
    }
    if (!result?.asset) throw new Error("The video provider did not return a playable style preview.");
    const asset = { ...result.asset, id: `style-preview-${Date.now()}-motion`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), stylePreview: { styleId: dna.id, styleVersionId: dna.versionId, scenario: "motion", sourceFrameAssetId: source.id } } };
    project.assets = projectAssets(); project.assets.unshift(asset);
    project.visualDirection.stylePreviews[dna.id] = [asset.id, ...(project.visualDirection.stylePreviews[dna.id] || []).filter((id) => id !== asset.id)].slice(0, 12);
    const saved = savedStyleDnas().find((style) => style.id === dna.id);
    if (saved) saved.previewAssetIds = stylePreviewAssetIds(dna);
    setDirty(); closeModal(); render(); openStyleDetail(dna.id); notify(`${dna.name} motion preview is ready.`);
  } catch (error) {
    notify(error?.message || "Style motion preview failed.");
  } finally {
    closeGenerationOverlay();
    if (button?.isConnected) { button.disabled = false; button.textContent = "Generate motion preview"; }
  }
}
function styleReferenceSelections(root = document) {
  return [...root.querySelectorAll('input[name="styleReferenceAsset"]:checked')].map((input) => ({ assetId: input.value, role: root.querySelector(`[data-style-reference-role="${CSS.escape(input.value)}"]`)?.value || "overall", strength: Number(root.querySelector(`[data-style-reference-strength="${CSS.escape(input.value)}"]`)?.value || 50), extract: root.querySelector(`[data-style-reference-extract="${CSS.escape(input.value)}"]`)?.value.trim() || "", ignore: root.querySelector(`[data-style-reference-ignore="${CSS.escape(input.value)}"]`)?.value.trim() || "" }));
}
function saveStyleDraft(draft, references = [], { apply = false } = {}) {
  ensureProductionShape();
  const previous = draft.id ? savedStyleDnas().find((style) => style.id === draft.id) : null;
  if (previous) appendStyleHistory(project.visualDirection, previous);
  const dna = defaultStyleDna({ ...draft, id: draft.id || `style-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, source: draft.source || "user", visibility: "project", referenceAssets: references, status: "ready", version: previous ? Math.max(previous.version + 1, Number(draft.version) || 1) : draft.version, parentStyleId: previous?.parentStyleId || draft.parentStyleId || (previous ? previous.id : "") });
  project.styleDnas = [dna, ...savedStyleDnas().filter((style) => style.id !== dna.id)];
  if (apply) { project.style = dna.name; project.visualDirection.projectStyle = { styleId: dna.id, versionId: dna.versionId, snapshot: structuredClone(dna), patch: {} }; }
  setDirty(); return dna;
}
function styleDiff(previous, candidate) {
  const before = previous ? defaultStyleDna(previous) : null; const after = defaultStyleDna(candidate);
  const fields = [
    ["Creative intent", before?.creativeIntent?.summary, after.creativeIntent.summary], ["Medium", before?.medium?.primary, after.medium.primary], ["Shape language", before?.visualLanguage?.shapeLanguage, after.visualLanguage.shapeLanguage], ["Materials", before?.materials?.primaryMaterials?.join(", "), after.materials.primaryMaterials.join(", ")], ["Palette", before ? [...before.color.primaryColors, ...before.color.accentColors].join(", ") : "", [...after.color.primaryColors, ...after.color.accentColors].join(", ")], ["Lighting", before?.lighting?.approach, after.lighting.approach], ["Camera", before?.camera?.shotLanguage?.join(", "), after.camera.shotLanguage.join(", ")], ["Motion", before?.animation?.motionQuality, after.animation.motionQuality], ["Negative constraints", before?.promptBlocks?.negative, after.promptBlocks.negative]
  ];
  return fields.filter(([, left, right]) => String(left || "") !== String(right || ""));
}
function openStyleComparison(existing, interpreted, references) {
  const candidate = defaultStyleDna({ ...interpreted, id: existing?.id || "", source: "generated", parentStyleId: existing?.parentStyleId || existing?.id || "" }); const changes = styleDiff(existing, candidate);
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal wide-modal style-comparison-modal"><button type="button" id="closeModal">×</button><p>STYLE DNA / AI INTERPRETATION REVIEW</p><h2>${existing ? `Review v${existing.version + 1} before saving.` : "Review the proposed Style DNA."}</h2><p>Nothing is applied until you accept this version. This comparison changes visual direction only; characters, sets, and props stay untouched.</p><div class="style-diff-list">${changes.length ? changes.map(([label, before, after]) => `<article><small>${esc(label)}</small><div><p><b>Current</b>${esc(before || "Not defined")}</p><p><b>Proposed</b>${esc(after || "Not defined")}</p></div></article>`).join("") : `<p>No structured fields changed; edit the brief and interpret again.</p>`}</div><div class="style-creator-actions"><button id="rejectStyleComparison" class="quiet-button">Keep editing</button><button id="acceptStyleComparison" class="save-button">Accept ${existing ? "new version" : "Style DNA"}</button></div></section></div>`;
  $("#closeModal").onclick = closeModal; $("#rejectStyleComparison").onclick = () => openStyleCreator(existing || candidate); $("#acceptStyleComparison").onclick = () => { const saved = saveStyleDraft({ ...candidate, id: existing?.id || "", parentStyleId: existing?.parentStyleId || existing?.id || "" }, references); closeModal(); render(); openStyleDetail(saved.id); notify("Style DNA accepted. Apply it when the direction feels right."); };
}
function openStyleCreator(existing = null) {
  ensureProductionShape(); const images = styleCreatorReferences(); const dna = existing ? defaultStyleDna(existing) : null;
  const referenceCards = images.length ? images.map((asset) => { const active = dna?.referenceAssets?.find((reference) => reference.assetId === asset.id); return `<article class="style-reference-card"><label><input type="checkbox" name="styleReferenceAsset" value="${esc(asset.id)}" ${active ? "checked" : ""}/> <img src="${esc(fileUrl(asset))}" alt=""/> <span>${esc(assetDisplayTitle(asset))}</span></label><select data-style-reference-role="${esc(asset.id)}" ${active ? "" : "disabled"}>${STYLE_REFERENCE_ROLES.map((role) => `<option value="${role}" ${(active?.role || "overall") === role ? "selected" : ""}>${role}</option>`).join("")}</select><input data-style-reference-strength="${esc(asset.id)}" type="range" min="0" max="100" value="${active?.strength || 50}" ${active ? "" : "disabled"}/><input data-style-reference-extract="${esc(asset.id)}" placeholder="Extract…" value="${esc(active?.extract || "")}" ${active ? "" : "disabled"}/><input data-style-reference-ignore="${esc(asset.id)}" placeholder="Ignore…" value="${esc(active?.ignore || "")}" ${active ? "" : "disabled"}/></article>`; }).join("") : `<p class="scene-modal-note">Reference images are optional. Import them into Media Library first; they remain separate from video start/end frames.</p>`;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="styleCreatorForm" class="project-modal wide-modal style-creator-modal"><button type="button" id="closeModal">×</button><p>VISUAL DIRECTION / CREATE STYLE</p><h2>${dna ? `Refine ${esc(dna.name)}` : "Describe the visual world."}</h2><div class="style-creator-grid"><label>STYLE NAME<input id="styleCreatorName" value="${esc(dna?.name || "")}" placeholder="e.g. Layered Paper Adventure" /></label><label>FORMAT<select id="styleCreatorFormat"><option>Animation</option><option>Live action</option><option>Hybrid</option></select></label><label>GENRE<input id="styleCreatorGenre" placeholder="e.g. family adventure" /></label><label>AUDIENCE<input id="styleCreatorAudience" placeholder="e.g. all ages" /></label><label>REALISM<select id="styleCreatorRealism"><option>Stylized</option><option>Balanced</option><option>Naturalistic</option></select></label></div><label>DESCRIBE THE STYLE<textarea id="styleCreatorDescription" rows="7" placeholder="Materials, shapes, lighting, camera language, character feeling, motion, and what to avoid…">${esc(dna?.description || "")}</textarea></label><p class="scene-modal-note">AI turns this into structured Style DNA. You can edit it, version it, and apply it without changing character, set, or prop identity.</p><details><summary>Reference images and roles</summary><div class="style-reference-grid">${referenceCards}</div></details><div class="style-creator-actions"><button type="button" id="interpretStyle" class="quiet-button">Interpret with AI</button><button type="button" id="saveStyleManual" class="quiet-button">Save editable draft</button><button class="save-button">Save & apply to project</button></div></form></div>`;
  const root = $("#styleCreatorForm"); const read = () => ({ name: $("#styleCreatorName").value.trim() || "Untitled Style", description: $("#styleCreatorDescription").value.trim(), source: "user", creativeIntent: { summary: $("#styleCreatorDescription").value.trim(), narrativeUseCases: [$("#styleCreatorGenre").value.trim()].filter(Boolean), audience: [$("#styleCreatorAudience").value.trim()].filter(Boolean) }, medium: { primary: $("#styleCreatorFormat").value, digital: true }, visualLanguage: { shapeLanguage: $("#styleCreatorDescription").value.trim(), levelOfRealism: $("#styleCreatorRealism").value === "Naturalistic" ? 80 : $("#styleCreatorRealism").value === "Stylized" ? 25 : 55, levelOfStylization: $("#styleCreatorRealism").value === "Stylized" ? 80 : 50, detailDensity: 55, visualComplexity: 55, negativeSpace: 45 }, promptBlocks: { universal: $("#styleCreatorDescription").value.trim(), image: $("#styleCreatorDescription").value.trim(), video: $("#styleCreatorDescription").value.trim(), negative: "" } });
  const setReferenceEnabled = (input) => { const card = input.closest(".style-reference-card"); card?.querySelectorAll("select,input:not([type=checkbox])").forEach((field) => { field.disabled = !input.checked; }); };
  root.querySelectorAll('input[name="styleReferenceAsset"]').forEach((input) => input.addEventListener("change", () => setReferenceEnabled(input)));
  $("#closeModal").onclick = closeModal;
  $("#saveStyleManual").onclick = () => { const saved = saveStyleDraft(existing ? { ...read(), id: existing.id, parentStyleId: existing.parentStyleId } : read(), styleReferenceSelections(root)); closeModal(); render(); openStyleDetail(saved.id); };
  $("#interpretStyle").onclick = async () => { const button = $("#interpretStyle"); const brief = read(); if (!brief.description) return notify("Describe the visual direction first."); if (!window.storyMakerDesktop?.interpretStyle) return notify("AI style interpretation is only available in the desktop app."); button.disabled = true; button.textContent = "Interpreting…"; try { const references = styleReferenceSelections(root); const interpreted = await window.storyMakerDesktop.interpretStyle({ ...brief, genre: $("#styleCreatorGenre").value.trim(), audience: $("#styleCreatorAudience").value.trim(), realism: $("#styleCreatorRealism").value, format: $("#styleCreatorFormat").value, references, existingStyle: existing || null }); openStyleComparison(existing, interpreted, references); } catch (error) { notify(error?.message || "Style interpretation failed. Your entered brief is still here; try again or save an editable draft."); } finally { if (button.isConnected) { button.disabled = false; button.textContent = "Interpret with AI"; } } };
  root.onsubmit = (event) => { event.preventDefault(); const saved = saveStyleDraft(existing ? { ...read(), id: existing.id, parentStyleId: existing.parentStyleId } : read(), styleReferenceSelections(root), { apply: true }); closeModal(); render(); notify(`${saved.name} is now the project visual direction.`); };
}
function openStyleDetail(id) {
  const dna = visualStyleLibrary().find((style) => style.id === id); if (!dna) return notify("Style not found.");
  const blocks = stylePromptBlocks(dna, "image");
  const history = styleHistoryFor(project.visualDirection, dna.id);
  const videoBlocks = stylePromptBlocks(dna, "video");
  const previewAssets = stylePreviewAssetIds(dna).map(assetById).filter(Boolean);
  const previewModelOptions = modelCatalog.filter((item) => item.status === "live" && modelCapability(item.model).output === "Image").map((item) => `<option value="${esc(item.model)}" ${providerReady(item.provider) ? "" : "disabled"}>${esc(item.label)}${providerReady(item.provider) ? "" : " · connect provider"}</option>`).join("");
  const previewVideoOptions = modelCatalog.filter((item) => item.status === "live" && modelCapability(item.model).output === "Video" && item.modes.includes("image-to-video")).map((item) => `<option value="${esc(item.model)}" ${modelReady(item) ? "" : "disabled"}>${esc(item.label)}${modelReady(item) ? "" : " · connect provider"}</option>`).join("");
  const motionPreview = previewAssets.find((item) => item.kind === "video" && item.generation?.stylePreview?.scenario === "motion");
  const previewMarkup = `<section class="style-preview-lab"><div><small>STYLE VALIDATION PREVIEWS</small><h3>Test the look before it directs the film.</h3><p>Each preview is a real generation saved to this project; it never replaces story, character, or set assets.</p></div><div class="style-preview-models"><label>IMAGE MODEL<select id="stylePreviewModel">${previewModelOptions}</select></label><label>VIDEO MODEL<select id="stylePreviewVideoModel">${previewVideoOptions}</select></label></div><div class="style-preview-grid">${["character", "environment", "prop", "storyboard"].map((scenario) => { const asset = previewAssets.find((item) => item.kind === "image" && item.generation?.stylePreview?.scenario === scenario); return `<article>${asset ? `<button type="button" data-preview-asset="${esc(asset.id)}"><img src="${esc(fileUrl(asset))}" alt="${esc(scenario)} style preview" /></button>` : `<span class="style-preview-empty">${esc(scenario)}</span>`}<strong>${scenario}</strong><button type="button" class="quiet-button" data-generate-style-preview="${esc(dna.id)}:${scenario}">Generate ${scenario}</button></article>`; }).join("")}<article class="style-motion-preview">${motionPreview ? `<video controls src="${esc(fileUrl(motionPreview))}"></video>` : `<span class="style-preview-empty">motion</span>`}<strong>motion</strong><button type="button" id="generateStyleMotion" class="quiet-button" ${previewAssets.some((item) => item.kind === "image") && previewVideoOptions ? "" : "disabled"}>${motionPreview ? "Generate another motion test" : "Generate motion preview"}</button></article></div></section>`;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal wide-modal style-detail-modal"><button type="button" id="closeModal">×</button><p>STYLE DNA / ${esc(dna.source.toUpperCase())}</p><h2>${esc(dna.name)} <small>v${dna.version}</small></h2><p>${esc(dna.description || dna.creativeIntent.summary)}</p><div class="style-detail-grid"><article><small>MEDIUM</small><p>${esc(dna.medium.primary)}</p><small>PALETTE</small><p>${esc([...dna.color.primaryColors, ...dna.color.accentColors].join(" · ") || "Defined during refinement")}</p><small>LIGHTING</small><p>${esc(dna.lighting.approach || "Defined during refinement")}</p></article><article><small>CHARACTERS</small><p>${esc(dna.characters.actingStyle || dna.characters.proportions || "Identity remains separate from rendering")}</p><small>CAMERA</small><p>${esc(dna.camera.shotLanguage.join(" · ") || "Model-aware")}</p><small>MOTION</small><p>${esc(dna.animation.motionQuality || "Defined during refinement")}</p></article><article><small>CONTINUITY LOCKS</small><p>${esc(dna.lockedProperties.join(" · ") || "No property locks")}</p><small>NEGATIVE CONSTRAINTS</small><p>${esc(blocks.negative.join(" · ") || "No additional constraints")}</p></article></div><details><summary>Prompt inspector · image</summary><p class="style-prompt-preview">${esc(blocks.positive.join(". "))}</p></details><details><summary>Prompt inspector · video</summary><p class="style-prompt-preview">${esc(videoBlocks.positive.join(". "))}</p><p class="style-prompt-preview">Avoid: ${esc(videoBlocks.negative.join(". "))}</p></details>${previewMarkup}${history.length ? `<details><summary>Version history (${history.length})</summary><div class="style-version-history">${history.map((entry) => `<button type="button" class="quiet-button" data-restore-style-version="${esc(entry.versionId)}">Restore v${entry.version} · ${esc(new Date(entry.updatedAt || entry.createdAt).toLocaleDateString())}</button>`).join("")}</div></details>` : ""}<div class="style-creator-actions"><button id="styleDetailApply" class="save-button">Apply to project</button>${project.scenes.length ? `<button id="styleDetailScene" class="quiet-button">Apply to selected scene</button>` : ""}${dna.source !== "system" ? `<button id="styleDetailEdit" class="quiet-button">Edit / new version</button><button id="styleDetailSaveLibrary" class="quiet-button">Save to My Styles</button>` : ""}<button id="styleDetailDuplicate" class="quiet-button">Duplicate</button></div></section></div>`;
  $("#closeModal").onclick = closeModal; $("#styleDetailApply").onclick = () => { closeModal(); chooseStyle(dna.name); }; $("#styleDetailScene")?.addEventListener("click", () => { applyStyleDna(dna.id); closeModal(); render(); }); $("#styleDetailEdit")?.addEventListener("click", () => openStyleCreator(dna)); $("#styleDetailSaveLibrary")?.addEventListener("click", async () => { if (!window.storyMakerDesktop?.saveUserStyle) return notify("My Styles is available in the packaged desktop app."); try { userStyleDnas = (await window.storyMakerDesktop.saveUserStyle(dna)).map(defaultStyleDna); notify(`Saved ${dna.name} to My Styles.`); render(); } catch (error) { notify(error?.message || "Could not save that style to My Styles."); } }); $("#styleDetailDuplicate").onclick = () => openStyleCreator(defaultStyleDna({ ...dna, id: "", name: `${dna.name} Remix`, source: "remixed", parentStyleId: dna.id, version: 1 })); $("#generateStyleMotion")?.addEventListener("click", () => generateStyleMotionPreview(dna.id, $("#stylePreviewVideoModel")?.value)); document.querySelectorAll("[data-generate-style-preview]").forEach((button) => button.addEventListener("click", () => { const [styleId, scenario] = button.dataset.generateStylePreview.split(":"); generateStylePreview(styleId, scenario, $("#stylePreviewModel")?.value); })); document.querySelectorAll("[data-restore-style-version]").forEach((button) => button.addEventListener("click", () => { const version = history.find((entry) => entry.versionId === button.dataset.restoreStyleVersion); if (!version) return; const restored = saveStyleDraft({ ...version, id: dna.id, parentStyleId: dna.parentStyleId || dna.id }); closeModal(); render(); openStyleDetail(restored.id); notify(`Restored ${restored.name} as v${restored.version}.`); }));
}
function openStyleMixer() {
  const options = visualStyleLibrary().map((style) => `<option value="${esc(style.id)}">${esc(style.name)}</option>`).join("");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="styleMixerForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>VISUAL DIRECTION / STYLE MIXER</p><h2>Blend structure, not prompt fragments.</h2><label>NEW STYLE NAME<input id="styleMixName" value="Untitled Style Mix" /></label><div class="style-mixer-rows"><label>PRIMARY<select id="styleMixA">${options}</select><input id="styleMixAWeight" type="range" min="1" max="99" value="60" /></label><label>SECONDARY<select id="styleMixB">${options}</select><input id="styleMixBWeight" type="range" min="1" max="99" value="40" /></label></div><p class="scene-modal-note">The mixer preserves negative constraints, harmonizes palette/material fields, and creates a new Style DNA. It never changes the source styles.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Create mixed style</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal; $("#styleMixerForm").onsubmit = (event) => { event.preventDefault(); const a = styleDnaById($("#styleMixA").value); const b = styleDnaById($("#styleMixB").value); if (!a || !b || a.id === b.id) return notify("Choose two different styles to mix."); const mixed = blendStyles([{ style: a, weight: Number($("#styleMixAWeight").value) }, { style: b, weight: Number($("#styleMixBWeight").value) }]); mixed.name = $("#styleMixName").value.trim() || mixed.name; const saved = saveStyleDraft(mixed); closeModal(); render(); openStyleDetail(saved.id); };
}
function openMyStylesManager() {
  ensureProductionShape();
  const projectStyles = savedStyleDnas();
  const libraryStyles = userStyleDnas;
  const rows = (items, location) => items.map((dna) => `<article class="my-style-row"><img src="${esc(stylePreviewUrl(dna))}" alt="" /><div><small>${location}</small><h3>${esc(dna.name)} <em>v${dna.version}</em></h3><p>${esc(dna.shortDescription || styleSummary(dna))}</p></div><div><button type="button" class="quiet-button" data-manage-open-style="${esc(dna.id)}">Open</button><button type="button" class="quiet-button" data-manage-edit-style="${esc(dna.id)}">Edit</button><button type="button" class="quiet-button" data-manage-export-style="${esc(dna.id)}">Export</button><button type="button" class="remove-button" data-manage-remove-style="${location}:${esc(dna.id)}">Remove</button></div></article>`).join("");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal wide-modal my-styles-modal"><button type="button" id="closeModal">×</button><p>VISUAL DIRECTION / MY STYLES</p><h2>Your reusable visual language.</h2><p>Project styles travel with this production. Library styles remain available when you create or open another project.</p><div class="my-styles-heading"><strong>THIS PROJECT</strong><span>${projectStyles.length}</span></div><div class="my-style-list">${rows(projectStyles, "project") || `<div class="empty-stage"><p>No custom styles in this project yet.</p></div>`}</div><div class="my-styles-heading"><strong>PERSONAL LIBRARY</strong><span>${libraryStyles.length}</span></div><div class="my-style-list">${rows(libraryStyles, "library") || `<div class="empty-stage"><p>Save a project style to My Styles to reuse it across productions.</p></div>`}</div><div class="style-creator-actions"><button type="button" id="manageImportStyle" class="quiet-button">Import style package</button><button type="button" id="manageCreateStyle" class="save-button">Create a style</button></div></section></div>`;
  $("#closeModal").onclick = closeModal;
  $("#manageCreateStyle").onclick = () => openStyleCreator();
  $("#manageImportStyle").onclick = () => { closeModal(); $("#importStylePackage")?.click(); };
  document.querySelectorAll("[data-manage-open-style]").forEach((button) => button.addEventListener("click", () => openStyleDetail(button.dataset.manageOpenStyle)));
  document.querySelectorAll("[data-manage-edit-style]").forEach((button) => button.addEventListener("click", () => openStyleCreator(styleDnaById(button.dataset.manageEditStyle))));
  document.querySelectorAll("[data-manage-export-style]").forEach((button) => button.addEventListener("click", async () => {
    const dna = styleDnaById(button.dataset.manageExportStyle);
    if (!dna || !window.storyMakerDesktop?.exportUserStyle) return;
    try { const result = await window.storyMakerDesktop.exportUserStyle(dna); if (!result?.canceled) notify(`${dna.name} exported.`); } catch (error) { notify(error?.message || "Style package could not be exported."); }
  }));
  document.querySelectorAll("[data-manage-remove-style]").forEach((button) => button.addEventListener("click", async () => {
    const [location, id] = button.dataset.manageRemoveStyle.split(":");
    const dna = styleDnaById(id);
    if (!dna || !confirm(`Remove "${dna.name}" from ${location === "library" ? "My Styles" : "this project"}?`)) return;
    if (location === "library") {
      try { userStyleDnas = (await window.storyMakerDesktop.removeUserStyle(id)).map(defaultStyleDna); } catch (error) { return notify(error?.message || "Could not update My Styles."); }
    } else deleteStyleDna(id);
    render(); openMyStylesManager();
  }));
}
function styleDnaWorkspace() {
  ensureProductionShape();
  const all = visualStyleLibrary(); const query = visualStyleQuery.trim().toLowerCase();
  const customIds = new Set([...savedStyleDnas(), ...userStyleDnas].map((dna) => dna.id));
  const favoriteIds = project.visualDirection.favorites || [];
  const visible = all.filter((dna) => visualStyleScope === "my" ? customIds.has(dna.id) : visualStyleScope === "favorites" ? favoriteIds.includes(dna.id) : visualStyleScope === "2d" ? (dna.categoryIds || []).includes("2d-animation") : true).filter((dna) => !query || [dna.name, dna.description, ...(dna.tags || []), ...(dna.categoryIds || [])].join(" ").toLowerCase().includes(query));
  const sceneAssets = projectAssets().filter((asset) => asset.kind === "image");
  const active = project.visualDirection.projectStyle?.snapshot || null;
  const card = (dna) => `<article class="visual-style-card ${active?.id === dna.id ? "active" : ""}"><button class="visual-style-card-main" data-style-detail="${esc(dna.id)}"><img src="${esc(stylePreviewUrl(dna))}" alt="" /><span>${esc((dna.categoryIds || ["visual direction"])[0])}</span><h3>${esc(dna.name)}</h3><p>${esc(dna.shortDescription || styleSummary(dna))}</p><small>${esc(dna.source)} · v${dna.version}</small></button><div><button class="quiet-button" data-toggle-style-favorite="${esc(dna.id)}" aria-label="Toggle favorite">${favoriteIds.includes(dna.id) ? "★" : "☆"}</button><button class="save-button" data-apply-project-style="${esc(dna.id)}">Apply</button></div></article>`;
  const styleAdvisorReady = providerReady("openai") || providerReady("openrouter");
  const recommendedStyles = Array.isArray(project.recommendedStyles) ? project.recommendedStyles : [];
  // Per Style Library spec section 4: recommend from the story instead of
  // making the user browse the whole library blind. No fabricated
  // "consistency score" here — only a name the model picked from the real
  // library plus its stated reason, both enforced server-side. This used to
  // live in a separate "Design Bible" screen that duplicated this one —
  // moved here so there's a single visual-style destination, not two.
  const recommendedPanel = `<section class="recommended-styles"><header><small>RECOMMENDED FOR THIS STORY</small>${styleAdvisorReady ? `<button id="recommendStyles" class="quiet-button">${recommendedStyles.length ? "Recommend again" : "Recommend styles"}</button>` : ""}</header>${!styleAdvisorReady ? `<p class="scene-modal-note">Connect OpenAI or OpenRouter in Model Hub to get story-based style recommendations.</p>` : recommendedStyles.length ? `<div class="visual-style-grid">${recommendedStyles.map((rec) => { const dna = all.find((item) => item.name === rec.name); if (!dna) return ""; return `<article class="visual-style-card recommended ${active?.id === dna.id ? "active" : ""}"><button class="visual-style-card-main" data-style-detail="${esc(dna.id)}"><img src="${esc(stylePreviewUrl(dna))}" alt="" /><h3>${esc(dna.name)}</h3><p class="recommended-reason">${esc(rec.reason)}</p></button><div><button class="save-button" data-apply-project-style="${esc(dna.id)}">Apply</button></div></article>`; }).join("")}</div>` : `<p class="scene-modal-note">Add a logline, premise, or theme in Story Bible, then request recommendations tailored to this story.</p>`}</section>`;
  return `<div class="visual-direction-workspace"><div class="workspace-heading"><div><p>VISUAL DIRECTION / STYLE LIBRARY</p><h1>Choose the visual language of the film.</h1></div><div class="story-actions"><button id="importStylePackage" class="quiet-button">Import style</button><button id="exportProjectStyle" class="quiet-button" ${active ? "" : "disabled"}>Export project style</button><button id="manageMyStyles" class="quiet-button">Manage My Styles</button><button id="openStyleMixer" class="quiet-button">Style Mixer</button><button id="openStyleCreator" class="save-button">Create style</button></div></div><section class="visual-direction-hero"><div><small>PROJECT LOOK</small><h2>${esc(active?.name || "No visual direction locked")}</h2><p>${esc(active ? styleSummary(active) : "Choose a foundation, create a custom Style DNA, or mix existing directions. Assets remain themselves; this determines how they render.")}</p><div class="style-inheritance"><span>Project ${active ? "✓" : "—"}</span><span>Scene overrides ${(Object.keys(project.visualDirection.sceneOverrides || {}).length) || "—"}</span><span>Shot overrides ${(Object.keys(project.visualDirection.shotOverrides || {}).length) || "—"}</span></div></div><aside><label>STYLE STRENGTH<select id="styleStrength"><option value="subtle" ${project.visualDirection.styleStrength === "subtle" ? "selected" : ""}>Subtle</option><option value="balanced" ${project.visualDirection.styleStrength === "balanced" ? "selected" : ""}>Balanced</option><option value="strong" ${project.visualDirection.styleStrength === "strong" ? "selected" : ""}>Strong</option><option value="signature" ${project.visualDirection.styleStrength === "signature" ? "selected" : ""}>Signature</option></select></label><small>Changes compile into future generations only; completed media stays intact.</small></aside></section>${recommendedPanel}<section class="visual-style-toolbar"><input id="visualStyleSearch" value="${esc(visualStyleQuery)}" placeholder="Search styles, categories, materials, moods…" /><nav><button data-style-scope="all" class="${visualStyleScope === "all" ? "active" : ""}">All</button><button data-style-scope="2d" class="${visualStyleScope === "2d" ? "active" : ""}">2D Animation</button><button data-style-scope="my" class="${visualStyleScope === "my" ? "active" : ""}">My Styles</button><button data-style-scope="favorites" class="${visualStyleScope === "favorites" ? "active" : ""}">Favorites</button></nav><span>${visible.length} of ${all.length} styles</span></section><section class="visual-style-grid">${visible.map(card).join("") || `<div class="empty-stage wide"><h2>No styles match this view.</h2><p>Create a custom Style DNA or change the filter.</p><button id="clearStyleSearch" class="quiet-button">Show all styles</button></div>`}</section><section class="visual-direction-qa"><div><small>CONSISTENCY</small><h2>Check completed frames against a locked Style DNA.</h2></div>${savedStyleDnas().length && sceneAssets.length ? `<form id="driftCheckForm" class="drift-check-inputs"><label>STYLE<select id="driftCheckDna" required>${savedStyleDnas().map((dna) => `<option value="${esc(dna.id)}">${esc(dna.name)} · v${dna.version}</option>`).join("")}</select></label><label>FRAME<select id="driftCheckAsset" required>${sceneAssets.map((asset) => `<option value="${esc(asset.id)}">${esc(asset.name)}</option>`).join("")}</select></label><button class="quiet-button">Check consistency</button></form>` : `<p>Create or save a custom style, then generate a frame to unlock visual drift checking.</p>`}</section></div>`;
}
function placeholder(title) {
  return `<div class="placeholder-workspace"><div><p>${title.toUpperCase()} / WORKSPACE</p><h1>This room is being built into the production engine.</h1><span>It will stay tied to story, assets, visual language, and final delivery—not become an isolated tool.</span></div><button data-nav="Storyboard" class="save-button">Go to storyboard</button></div>`;
}
function view() {
  if (active === "Home") return home();
  if (active === "Projects") return projectLibrary();
  if (active === "Story Bible") return storyWorkspace();
  // Design Bible was retired — its style picker and story-based
  // recommendations were folded into Style Library, the more complete of
  // the two systems. Alias rather than drop the route outright so any
  // stale reference (an old data-nav call site, a saved simple-mode step)
  // lands somewhere real instead of rendering blank.
  if (active === "Design Bible") { active = "Style Library"; return styleDnaWorkspace(); }
  if (active === "Style Library") return styleDnaWorkspace();
  if (active === "Character Bible") return characterProductionWorkspace();
  if (active === "Locations") return locationsWorkspace();
  if (active === "Production Assets") return productionAssetsWorkspace();
  if (active === "Storyboard") return storyboardProductionWorkspace();
  if (active === "Continuity") return continuityWorkspace();
  if (active === "Shot Planner") return shotModelDirectorWorkspace();
  if (active === "Timeline") return productionTimelineWorkspace();
  if (active === "Media Library") return mediaLibraryWorkspace();
  if (active === "Motion Graphics") return visualizationWorkspace();
  if (active === "Audio Studio") return audioStudioWorkspace();
  if (active === "Delivery") return deliveryWorkspace();
  if (active === "AI Director") return aiWorkspace();
  if (active === "Model Hub") return modelHubWorkspace();
  if (active === "Help") return helpWorkspace();
  if (active === "Settings") return settingsWorkspace();
  return placeholder(active);
}
function mountLaunchSplash() {
  if (!launchVisible) return;
  const root = $("#splashRoot");
  if (!root) return;
  $(".studio-sidebar")?.classList.add("splash-obscured");
  $(".studio-main")?.classList.add("splash-obscured");
  // The splash artwork is a finished, fully-branded graphic (logo, tagline,
  // and feature icons already baked in) — layering our own duplicate
  // headline/logo text on top of it would just repeat what's already on
  // screen. The functional bits (dismiss, entry actions) live in a solid
  // footer bar below the art instead of over it.
  root.innerHTML = `<div class="launch-splash-wrap"><section class="launch-splash"><div class="launch-splash-art" style="background-image:url('${splashArtwork}')"><button id="dismissSplash" class="launch-dismiss" title="Enter Storymaker">×</button><div class="launch-status"><i></i> WHEELBARROW STUDIOS</div></div><div class="launch-content"><div><button id="splashNewProject" class="save-button">Create a project</button><button id="splashOpenProject" class="quiet-button">Open project</button></div><button id="splashGuide" class="launch-guide">Explore the studio guide →</button></div></section></div>`;
  $("#dismissSplash")?.addEventListener("click", dismissSplash);
  $("#splashNewProject")?.addEventListener("click", () => { dismissSplash(); openProjectModal(); });
  $("#splashOpenProject")?.addEventListener("click", () => { dismissSplash(); openProject(); });
  $("#splashGuide")?.addEventListener("click", () => { active = "Help"; dismissSplash(); render(); });
}
function dismissSplash() {
  launchVisible = false;
  $(".studio-sidebar")?.classList.remove("splash-obscured");
  $(".studio-main")?.classList.remove("splash-obscured");
  const root = $("#splashRoot");
  const splash = root?.firstElementChild;
  if (!splash) return;
  splash.classList.add("is-leaving");
  window.setTimeout(() => { if (root.firstElementChild === splash) root.innerHTML = ""; }, 240);
}
function render() { $("#app").innerHTML = shell(view()); bind(); mountLaunchSplash(); }

function characterImageModels() { return modelCatalog.filter((model) => model.status === "live" && model.modes.some((mode) => ["text-to-image", "image-edit", "reference-image"].includes(mode))); }
function characterIdentityActionLabel(character) {
  const portrait = assetById(character?.referenceAssetId); const activeStyle = resolvedStyleFor().style;
  const appliedStyle = portrait?.generation?.visualDirection;
  // Existing media is never silently altered when a creator changes visual
  // direction. Make that state explicit and offer the safe, deliberate
  // restyle action instead of presenting an old render as though it were
  // already compliant with the newly selected look.
  return portrait && activeStyle && appliedStyle && (appliedStyle.styleId !== activeStyle.id || appliedStyle.styleVersionId !== activeStyle.versionId)
    ? "Restyle identity image"
    : "Generate identity image";
}
function openCharacterLab(index) {
  ensureCharacterShape(); const character = project.characters[index]; if (!character) return;
  const images = projectAssets().filter((media) => media.kind === "image"); const models = characterImageModels(); const defaultModel = models.find(modelReady) || models[0];
  const roles = entityReferenceRoles(character);
  const modelOptions = models.map((model) => `<option value="${esc(model.model)}" ${model.model === defaultModel?.model ? "selected" : ""}>${esc(model.label)} · ${providerReady(model.provider) ? "Connected" : "Connect in Model Hub"}</option>`).join("");
  const prompt = [character.name, character.appearance, character.wardrobe, character.voice].filter(Boolean).join(", ") || `A production-ready character design for ${character.name}.`;
  const hasPortrait = Boolean(assetById(character.referenceAssetId)); const identityAction = characterIdentityActionLabel(character);
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="characterLabForm" class="project-modal character-lab-modal"><button type="button" id="closeModal">×</button><p>CHARACTER LAB / GENERATION WORKBENCH</p><h2>Build a character the camera can remember.</h2><section class="character-lab-hero"><div><small>CONTINUITY-FIRST DESIGN</small><h3>${esc(character.name)}</h3><p>${identityAction.startsWith("Restyle") ? "This approved identity predates the active Style DNA. Restyle it deliberately, then regenerate the turnaround for a matching set." : "Build the approved identity first; then inspect the full turnaround before it is carried into every assigned scene."}</p></div><div class="character-lab-hero-badges"><span class="autosave">${images.length} PROJECT IMAGES</span>${styleIndicatorMarkup()}</div></section><div class="character-lab-grid"><div><label>CHARACTER DESIGN BRIEF<textarea id="characterLabPrompt">${esc(prompt)}</textarea></label><label>NEGATIVE CONSTRAINTS<textarea id="characterLabNegative" placeholder="No costume changes, no extra limbs, no text, no logos…"></textarea></label><div class="character-lab-actions"><button type="button" id="characterLabTurnaround" class="quiet-button" ${hasPortrait ? "" : "disabled title=\"Generate an identity image first.\""}>Generate turnaround (front · side · back)</button><button type="button" id="characterLabGenerate" class="save-button">${identityAction}</button></div></div><aside class="character-lab-side"><h4>Model direction</h4><label class="select-label">IMAGE MODEL<select id="characterLabModel" class="model-select">${modelOptions}</select></label><label>OUTPUT RATIO<select id="characterLabAspect"><option>1:1</option><option>3:2</option><option>2:3</option><option>16:9</option><option>9:16</option></select></label><label>QUALITY<select id="characterLabQuality"><option>Balanced</option><option>Fast</option><option>High</option></select></label><p class="character-lab-model-note">Style DNA is re-locked at the provider boundary for every image model. References preserve identity—not the old render's medium.</p></aside></div><div id="characterTurnaroundBoard">${characterTurnaroundBoardMarkup(character)}</div><section class="character-reference-section"><div id="${REFERENCE_LIBRARY_ROOT_ID}"></div></section><div class="character-lab-actions"><button type="button" id="cancelModal" class="quiet-button">Close</button><button class="save-button">Save character profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(character), ownedAssetIds: () => entityOwnedReferenceIds(character, character.turnaroundAssetIds), onImported: (additions) => attachImportedReferences(character, additions, character.turnaroundAssetIds), headTitle: "REFERENCE GALLERY", headDescription: "This character's approved identity and turnaround only. Import a new image here to add it to this character—not another asset.", importButtonId: "characterLabImport" });
  $("#characterLabForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(character, { references, referenceAssetId: primary?.assetId || character.referenceAssetId || "" }); setDirty(); closeModal(); render(); notify("Character profile saved to the continuity system."); };
  $("#characterLabGenerate").onclick = () => generateCharacterReference(index);
  $("#characterLabTurnaround").onclick = () => generateCharacterTurnaround(index);
}
// Generates front/side/back views from the character's approved portrait, using
// it as an image reference so the same face and costume carry across views
// rather than generating three unrelated characters.
async function generateCharacterTurnaround(index) {
  const character = project.characters[index]; const portrait = assetById(character?.referenceAssetId);
  if (!character || !portrait?.path) return notify("Generate or approve a portrait before requesting a turnaround.");
  const model = modelCatalog.find((item) => item.model === $("#characterLabModel")?.value); if (!model) return;
  if (!modelReady(model)) return notify(`${model.label} is not ready. Check its runtime or connection in Model Hub.`);
  const aspectRatio = $("#characterLabAspect")?.value || "1:1";
  const button = $("#characterLabTurnaround"); if (button) { button.disabled = true; button.textContent = "Generating turnaround…"; }
  openGenerationOverlay("turnaround");
  const views = [["front view, facing camera directly", "Front"], ["side profile view, facing left", "Side"], ["back view, facing away from camera", "Back"]];
  // Character/Set/Prop Lab used to send only the bare project.style NAME —
  // meaningless to the model unless it happened to match one of the ~24
  // legacy presets electron-main.js hardcodes as a fallback. Resolving and
  // injecting the actual Style DNA here (same resolveVisualDirection() the
  // Shot Director already uses) is what makes a chosen style actually reach
  // this generation, "character" context also pulls the DNA's dedicated
  // character-design rules (facial design, identity-consistency, etc.).
  const resolvedStyle = resolvedStyleFor(); const styleBlocks = stylePromptBlocks(resolvedStyle.style, "image", "character", resolvedStyle.strength);
  const stylePrefix = resolvedStyle.style ? `STYLE DNA — ${resolvedStyle.style.name}. ${styleBlocks.positive.join(". ")}. ` : "";
  const styleNegative = styleBlocks.negative.join(", ");
  let created = 0;
  try {
    for (const [direction, label] of views) {
      try {
        const result = await window.storyMakerDesktop.generateShotImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, style: project.style, visualDirection: project.visualDirection, characters: project.characters }, scene: { title: "Character Lab", note: `Turnaround view for ${character.name}.` }, shot: { title: `${character.name} · ${label} turnaround`, purpose: `Same character, same costume and proportions as the reference image, ${direction}.`, framing: "Character design sheet", lens: "Portrait", movement: "Static" }, settings: { provider: model.provider, model: model.model, mode: "image-edit", styleContext: "character", aspectRatio, resolution: aspectRatio === "9:16" ? "1024x1536" : aspectRatio === "16:9" ? "1536x1024" : "1024x1024", prompt: `${stylePrefix}${[character.name, character.appearance, character.wardrobe].filter(Boolean).join(", ")}. ${direction}. Preserve only the person's identity, costume, and proportions from the supplied reference; render the result in the active Style DNA.`, negativePrompt: [styleNegative, "No costume changes, no different character, no text, no logos."].filter(Boolean).join(", "), referenceAssetIds: [portrait.id], quality: $("#characterLabQuality")?.value || "Balanced", referenceStrength: "Preserve" }, references: [{ path: portrait.path, name: portrait.name, kind: portrait.kind }] });
        if (!result?.asset) continue;
        const generated = { ...result.asset, id: `character-turnaround-${Date.now()}-${label}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), visualDirection: visualDirectionMetadata() } };
        project.assets = projectAssets(); project.assets.unshift(generated); character.turnaroundAssetIds = [...new Set([...(character.turnaroundAssetIds || []).filter((id) => !String(id).endsWith(`-${label}`)), generated.id])]; created += 1;
      } catch { /* one failed view should not stop the rest */ }
    }
    setDirty();
    // Refresh just the reference gallery in place instead of reopening the
    // whole Lab — a full reopen would silently wipe the design brief,
    // negative constraints, and model/aspect/quality choices right after
    // Generate, the exact moment someone is most likely to tweak and
    // regenerate. Mirrors the fix already applied to Import.
    if (created) { $("#characterTurnaroundBoard").innerHTML = characterTurnaroundBoardMarkup(character); mountReferenceLibrary({ getRoles: () => entityReferenceRoles(character), ownedAssetIds: () => entityOwnedReferenceIds(character, character.turnaroundAssetIds), onImported: (additions) => attachImportedReferences(character, additions, character.turnaroundAssetIds), headTitle: "REFERENCE GALLERY", headDescription: "This character's approved identity and turnaround only. Import a new image here to add it to this character—not another asset.", importButtonId: "characterLabImport" }); }
    notify(created ? `${created} of ${views.length} turnaround views added to the reference gallery.` : "The turnaround could not be generated. Please retry.");
  } finally { closeGenerationOverlay(); if (button) { button.disabled = false; button.textContent = "Generate turnaround (front · side · back)"; } }
}
async function generateCharacterReference(index) {
  const character = project.characters[index]; const model = modelCatalog.find((item) => item.model === $("#characterLabModel")?.value); if (!character || !model) return;
  if (!modelReady(model)) return notify(`${model.label} is not ready. Check its runtime or connection in Model Hub.`);
  const selectedRefs = readReferenceLibrarySelections().map((reference) => assetById(reference.assetId)).filter((asset) => asset?.path && asset.kind === "image"); const aspectRatio = $("#characterLabAspect")?.value || "1:1"; const prompt = $("#characterLabPrompt")?.value.trim() || `A consistent production character design for ${character.name}.`;
  // See generateCharacterTurnaround for why this resolution exists — without
  // it the model gets nothing but the character's own brief text, no matter
  // which style is selected in the Style Library.
  const resolvedStyle = resolvedStyleFor(); const styleBlocks = stylePromptBlocks(resolvedStyle.style, "image", "character", resolvedStyle.strength);
  const stylePrefix = resolvedStyle.style ? `STYLE DNA — ${resolvedStyle.style.name}. ${styleBlocks.positive.join(". ")}. ` : "";
  const button = $("#characterLabGenerate"); if (button) { button.disabled = true; button.textContent = "Generating character…"; }
  openGenerationOverlay("character sheet");
  try {
    const result = await window.storyMakerDesktop.generateShotImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, style: project.style, visualDirection: project.visualDirection, characters: project.characters }, scene: { title: "Character Lab", note: `Create a clean character reference for ${character.name}.` }, shot: { title: `${character.name} · Character reference`, purpose: prompt, framing: "Character design sheet", lens: "Portrait", movement: "Static" }, settings: { provider: model.provider, model: model.model, mode: selectedRefs.length ? "image-edit" : "text-to-image", styleContext: "character", aspectRatio, resolution: aspectRatio === "9:16" ? "1024x1536" : aspectRatio === "16:9" ? "1536x1024" : "1024x1024", prompt: `${stylePrefix}${prompt}`, negativePrompt: [styleBlocks.negative.join(", "), $("#characterLabNegative")?.value.trim() || "No text, logos, watermarks, costume changes, or duplicate characters."].filter(Boolean).join(", "), referenceAssetIds: selectedRefs.map((asset) => asset.id), quality: $("#characterLabQuality")?.value || "Balanced", referenceStrength: "Preserve" }, references: selectedRefs.map((asset) => ({ path: asset.path, name: asset.name, kind: asset.kind })) });
    if (!result?.asset) throw new Error("No character image was returned."); const generated = { ...result.asset, id: `character-generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), visualDirection: visualDirectionMetadata() } }; project.assets = projectAssets(); project.assets.unshift(generated); character.referenceAssetId = generated.id; character.turnaroundAssetIds = []; setDirty();
    // Refresh just the reference gallery and turnaround availability in place
    // instead of reopening the whole Lab — a full reopen would silently wipe
    // the design brief, negative constraints, and model/aspect/quality
    // choices right after Generate, the exact moment someone is most likely
    // to tweak and regenerate. Mirrors the fix already applied to Import.
    $("#characterTurnaroundBoard").innerHTML = characterTurnaroundBoardMarkup(character); mountReferenceLibrary({ getRoles: () => entityReferenceRoles(character), ownedAssetIds: () => entityOwnedReferenceIds(character, character.turnaroundAssetIds), onImported: (additions) => attachImportedReferences(character, additions, character.turnaroundAssetIds), headTitle: "REFERENCE GALLERY", headDescription: "This character's approved identity and turnaround only. Import a new image here to add it to this character—not another asset.", importButtonId: "characterLabImport" });
    const turnaroundButton = $("#characterLabTurnaround"); if (turnaroundButton) { turnaroundButton.disabled = false; turnaroundButton.removeAttribute("title"); }
    notify(`${model.label} created a continuity reference for ${character.name}.`);
  } catch (error) { notify(error?.message || "Character generation failed."); } finally { closeGenerationOverlay(); if (button) { button.disabled = false; button.textContent = characterIdentityActionLabel(character); } }
}

function openProjectModal() {
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="newProjectForm" class="project-modal"><button type="button" id="closeModal">×</button><p>NEW PROJECT</p><h2>Give the film a first name.</h2><label>TITLE<input id="newTitle" autofocus placeholder="Untitled Film" /></label><label>ONE-LINE IDEA<textarea id="newLogline" placeholder="A story in one magnetic sentence."></textarea></label><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Create workspace</button></div></form></div>`;
  $("#closeModal").onclick = closeModal;
  $("#cancelModal").onclick = closeModal;
  // The window-close handler in electron-main.js already prompts to save
  // dirty work before the app quits — but this action doesn't quit anything,
  // it swaps `project` out from under the same still-open window, so that
  // safety net never fires here. Without this check, every character, set,
  // prop, scene, and shot in the current project was replaced by a blank one
  // in a single click with no warning at all.
  $("#newProjectForm").onsubmit = (event) => { event.preventDefault(); if (dirty && !confirm(`You have unsaved story work in "${project.name}". Starting a new project will lose it unless you save first. Continue anyway?`)) return; project = { ...blankProject(), name: $("#newTitle").value.trim() || "Untitled Film", logline: $("#newLogline").value.trim() }; filePath = ""; setDirty(); active = "Story Bible"; closeModal(); render(); notify("Project workspace created."); };
}
function closeModal() { $("#modalRoot").innerHTML = ""; }
function addCharacter() { ensureCharacterShape(); const count = project.characters.length + 1; project.characters.push({ id: `character-${Date.now()}-${count}`, name: `Character ${count}`, role: "A role still taking shape.", appearance: "", wardrobe: "", voice: "", objective: "", movementStyle: "", continuityRules: "", references: [], referenceAssetId: "" }); setDirty(); render(); openCharacterModal(count - 1); }
function openCharacterModal(index) {
  ensureCharacterShape(); const character = project.characters[index]; if (!character) return;
  const roles = entityReferenceRoles(character);
  // Two-column profile: a portrait sidebar (hero preview + reference picker)
  // pinned via position:sticky beside the written fields, so the character's
  // face stays visible the whole time you're writing appearance/wardrobe/
  // voice text against it, instead of only being visible once you scroll
  // down to a reference section buried at the bottom of a single column.
  // The sidebar mounts via mountReferenceLibrary() after this markup is in
  // the DOM, not inline here, so importing a reference can refresh just that
  // region afterward instead of reopening the whole modal.
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="characterForm" class="project-modal character-modal"><button type="button" id="closeModal">×</button><p>CHARACTER BIBLE / PRODUCTION PROFILE</p><h2>Make this person consistent.</h2><div class="character-modal-layout"><aside class="character-modal-portrait" id="${REFERENCE_LIBRARY_ROOT_ID}"></aside><div class="character-modal-fields"><label>CHARACTER NAME<input id="characterName" autofocus value="${esc(character.name)}" /></label><label>STORY ROLE<input id="characterRole" value="${esc(character.role)}" /></label><div class="character-form-grid"><label>APPEARANCE<textarea id="characterAppearance" placeholder="Age range, silhouette, hair, features, posture…">${esc(character.appearance)}</textarea></label><label>WARDROBE & PROPS<textarea id="characterWardrobe" placeholder="Signature clothing, palette, objects…">${esc(character.wardrobe)}</textarea></label><label>VOICE & PERFORMANCE<textarea id="characterVoice" placeholder="Cadence, energy, emotional register…">${esc(character.voice)}</textarea></label><label>SCENE OBJECTIVE<textarea id="characterObjective" placeholder="What does this person want when the camera finds them?">${esc(character.objective)}</textarea></label><label>MOVEMENT STYLE<textarea id="characterMovementStyle" placeholder="Tempo, gesture, physicality, micro-behaviors…">${esc(character.movementStyle)}</textarea></label><label>CONTINUITY RULES<textarea id="characterContinuityRules" placeholder="Features, proportions, costume, and behavior that must remain consistent…">${esc(character.continuityRules)}</textarea></label></div></div></div><p class="scene-modal-note">Character references are automatically offered to compatible image and video models whenever this character is assigned to a scene.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(character), ownedAssetIds: () => entityOwnedReferenceIds(character, character.turnaroundAssetIds), onImported: (additions) => attachImportedReferences(character, additions, character.turnaroundAssetIds), headTitle: "VISUAL REFERENCE LIBRARY", headDescription: "Only this character's visual source of truth. Imported images are attached here and travel only when this character is cast in a scene.", importButtonId: "importCharacterReference" });
  $("#characterForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(character, { name: $("#characterName").value.trim() || `Character ${index + 1}`, role: $("#characterRole").value.trim() || "A role still taking shape.", appearance: $("#characterAppearance").value.trim(), wardrobe: $("#characterWardrobe").value.trim(), voice: $("#characterVoice").value.trim(), objective: $("#characterObjective").value.trim(), movementStyle: $("#characterMovementStyle").value.trim(), continuityRules: $("#characterContinuityRules").value.trim(), references, referenceAssetId: primary?.assetId || "" }); setDirty(); closeModal(); render(); notify("Character production profile and visual continuity references saved."); };
}
async function importAssetsIntoProject() {
  const result = await window.storyMakerDesktop?.importMedia();
  if (!result || result.canceled || !result.assets?.length) return [];
  project.assets = projectAssets();
  const knownByPath = new Map(project.assets.map((media) => [String(media.path || "").toLowerCase(), media]));
  const additions = [];
  const selected = result.assets.map((media, index) => {
    const known = knownByPath.get(String(media.path || "").toLowerCase());
    if (known) return { ...known, alreadyInProject: true };
    const added = { ...media, id: `media-${Date.now()}-${index + 1}`, importedAt: new Date().toISOString() };
    additions.push(added); knownByPath.set(String(media.path || "").toLowerCase(), added);
    return added;
  });
  project.assets.push(...additions); if (additions.length) setDirty(); return selected;
}
function addSet() { ensureSetShape(); const count = project.sets.length + 1; project.sets.push({ id: `set-${Date.now()}-${count}`, name: `Set ${count}`, description: "", mood: "", referenceAssetId: "" }); setDirty(); render(); openSetModal(count - 1); }
// Assigning from the asset card is deliberately a first-class shortcut. The
// Scene editor remains the complete production form, but an object/place
// should not require hunting through every scene before it can travel into
// its shot continuity pack.
function openEntitySceneAssignments(kind, index) {
  ensureSceneShape(); ensureSetShape(); ensureProductionShape();
  const isSet = kind === "set";
  const entity = (isSet ? project.sets : project.props)[index];
  if (!entity) return;
  const field = isSet ? "setIds" : "propIds";
  const noun = isSet ? "location" : "asset";
  const choices = project.scenes.map((scene, sceneIndex) => `<label class="scene-cast-choice"><input type="checkbox" name="entitySceneAssignment" value="${esc(scene.id)}" ${(scene[field] || []).includes(entity.id) ? "checked" : ""}/><span>${String(sceneIndex + 1).padStart(2, "0")} · ${esc(scene.title)}</span><small>${esc(scene.note || "Storyboard scene")}</small></label>`).join("");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="entitySceneAssignmentForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>${isSet ? "LOCATIONS" : "PROPS & ASSETS"} / STORYBOARD LINK</p><h2>Place ${esc(entity.name)} in the story.</h2><p class="scene-modal-note">Selected scenes automatically send this ${noun}'s approved references into every compatible shot render. You can still add shot-specific references in Shot Director.</p><div class="scene-cast"><small>ASSIGN TO STORYBOARD SCENES</small><div>${choices || `<p class="scene-modal-note">Create a storyboard scene first, then return here to assign this ${noun}.</p>`}</div></div><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save scene assignments</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#entitySceneAssignmentForm").onsubmit = (event) => {
    event.preventDefault(); const selected = new Set([...document.querySelectorAll('input[name="entitySceneAssignment"]:checked')].map((input) => input.value));
    project.scenes.forEach((scene) => { const current = new Set(scene[field] || []); if (selected.has(scene.id)) current.add(entity.id); else current.delete(entity.id); scene[field] = [...current]; });
    setDirty(); closeModal(); render(); notify(`${entity.name} is now linked to ${selected.size} storyboard scene${selected.size === 1 ? "" : "s"}.`);
  };
}
function addProductionAsset() {
  ensureProductionShape();
  const count = project.props.length + 1;
  project.props.push({ id: `production-asset-${Date.now()}-${count}`, name: `Prop ${count}`, category: "prop", description: "", referenceAssetId: "", references: [] });
  setDirty(); render(); openProductionAssetModal(count - 1);
}
function openProductionAssetModal(index) {
  ensureProductionShape(); const item = project.props[index]; if (!item) return;
  const roles = entityReferenceRoles(item);
  // Same two-column, sticky-portrait pattern as Character/Set profiles. This
  // was the last of the three still on the old single-<select> pattern, and
  // the only one of the three with no generation Lab at all (see openPropLab
  // below) — props/wardrobe/vehicles could only ever be hand-imported.
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="productionAssetForm" class="project-modal character-modal"><button type="button" id="closeModal">×</button><p>PROPS & PRODUCTION ASSETS / REUSABLE ASSET</p><h2>Make this asset consistent.</h2><div class="character-modal-layout"><aside class="character-modal-portrait" id="${REFERENCE_LIBRARY_ROOT_ID}"></aside><div class="character-modal-fields"><label>ASSET NAME<input id="productionAssetName" autofocus value="${esc(item.name)}" /></label><label>ASSET TYPE<select id="productionAssetType">${["prop", "accessory", "wardrobe / costume", "vehicle", "creature", "weapon", "product", "other"].map((type) => `<option value="${esc(type)}" ${item.category === type ? "selected" : ""}>${esc(type)}</option>`).join("")}</select></label><label>DESIGN & CONTINUITY<textarea id="productionAssetDescription" placeholder="Appearance, material, scale, condition, story function, and what must remain consistent…">${esc(item.description)}</textarea></label></div></div><p class="scene-modal-note">After saving, this identity is available in every storyboard scene and its approved reference is included in compatible image and video generation.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(item), ownedAssetIds: () => entityOwnedReferenceIds(item), onImported: (additions) => attachImportedReferences(item, additions), headTitle: "VISUAL REFERENCE LIBRARY", headDescription: "Only this asset's visual source of truth. Importing here attaches an image to this asset; character imagery never appears by default.", importButtonId: "importProductionAssetReference" });
  $("#productionAssetForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(item, { name: $("#productionAssetName").value.trim() || `Prop ${index + 1}`, category: $("#productionAssetType").value, description: $("#productionAssetDescription").value.trim(), references, referenceAssetId: primary?.assetId || "" }); setDirty(); closeModal(); render(); notify("Reusable asset saved."); };
}
// Closes the biggest gap this pass found: Character and Set both had a
// generation workbench (Character Lab / Set Lab); props/wardrobe/vehicles/
// creatures/weapons had none — only hand-import via the profile modal above.
// Mirrors those two Labs exactly (same hero+role reference picker, same
// Model direction sidebar, same "generate → the new image is immediately
// the visible hero, no separate approval click" flow) rather than inventing
// a fourth interaction pattern for what is functionally the same job.
function openPropLab(index) {
  ensureProductionShape(); const item = project.props[index]; if (!item) return;
  const models = characterImageModels(); const defaultModel = models.find(modelReady) || models[0];
  const roles = entityReferenceRoles(item);
  const modelOptions = models.map((model) => `<option value="${esc(model.model)}" ${model.model === defaultModel?.model ? "selected" : ""}>${esc(model.label)} · ${providerReady(model.provider) ? "Connected" : "Connect in Model Hub"}</option>`).join("");
  const category = item.category || "asset";
  const prompt = [item.name, category, item.description].filter(Boolean).join(", ") || `A production-ready design for ${item.name}.`;
  const imageCount = projectAssets().filter((media) => media.kind === "image").length;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="propLabForm" class="project-modal character-lab-modal"><button type="button" id="closeModal">×</button><p>PROP LAB / GENERATION WORKBENCH</p><h2>Build ${/^[aeiou]/i.test(category) ? "an" : "a"} ${esc(category)} the camera can return to.</h2><section class="character-lab-hero"><div><small>CONTINUITY-FIRST DESIGN</small><h3>${esc(item.name)}</h3><p>Generate a reference image, keep the approved look in the project library, and reuse it in every scene where this asset appears.</p></div><div class="character-lab-hero-badges"><span class="autosave">${imageCount} IMAGE REFERENCE${imageCount === 1 ? "" : "S"}</span>${styleIndicatorMarkup()}</div></section><div class="character-lab-grid"><div><label>DESIGN BRIEF<textarea id="propLabPrompt">${esc(prompt)}</textarea></label><label>NEGATIVE CONSTRAINTS<textarea id="propLabNegative" placeholder="No people, no text, no logos, no background clutter…"></textarea></label><div class="character-lab-actions"><button type="button" id="propLabGenerate" class="save-button">Generate reference</button></div></div><aside class="character-lab-side"><h4>Model direction</h4><label class="select-label">IMAGE MODEL<select id="propLabModel" class="model-select">${modelOptions}</select></label><label>OUTPUT RATIO<select id="propLabAspect"><option>1:1</option><option>3:2</option><option>16:9</option><option>9:16</option></select></label><label>QUALITY<select id="propLabQuality"><option>Balanced</option><option>Fast</option><option>High</option></select></label><div id="${REFERENCE_LIBRARY_ROOT_ID}"></div></aside></div><div class="character-lab-actions"><button type="button" id="cancelModal" class="quiet-button">Close</button><button class="save-button">Save prop profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(item), ownedAssetIds: () => entityOwnedReferenceIds(item), onImported: (additions) => attachImportedReferences(item, additions), headTitle: "REFERENCE GALLERY", headDescription: "Only this asset's approved references are used for generation. Importing here adds media to this asset—not to the character library.", importButtonId: "propLabImport" });
  expandLabReferenceGallery("#propLabForm");
  $("#propLabForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(item, { references, referenceAssetId: primary?.assetId || item.referenceAssetId || "" }); setDirty(); closeModal(); render(); notify("Prop profile saved to the continuity system."); };
  $("#propLabGenerate").onclick = () => generatePropReference(index);
}
async function generatePropReference(index) {
  const item = project.props[index]; const model = modelCatalog.find((entry) => entry.model === $("#propLabModel")?.value); if (!item || !model) return;
  if (!modelReady(model)) return notify(`${model.label} is not ready. Check its runtime or connection in Model Hub.`);
  const selectedRefs = readReferenceLibrarySelections().map((reference) => assetById(reference.assetId)).filter((asset) => asset?.path && asset.kind === "image"); const aspectRatio = $("#propLabAspect")?.value || "1:1"; const prompt = $("#propLabPrompt")?.value.trim() || `A production-ready design for ${item.name}.`;
  // See generateCharacterTurnaround for why this resolution exists.
  // "prop" context also pulls the DNA's dedicated prop design/material/scale
  // rules, not just its generic image-level guidance.
  const resolvedStyle = resolvedStyleFor(); const styleBlocks = stylePromptBlocks(resolvedStyle.style, "image", "prop", resolvedStyle.strength);
  const stylePrefix = resolvedStyle.style ? `STYLE DNA — ${resolvedStyle.style.name}. ${styleBlocks.positive.join(". ")}. ` : "";
  const button = $("#propLabGenerate"); if (button) { button.disabled = true; button.textContent = "Generating…"; }
  openGenerationOverlay(item.category || "asset");
  try {
    const result = await window.storyMakerDesktop.generateShotImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, style: project.style, visualDirection: project.visualDirection, characters: project.characters }, scene: { title: "Prop Lab", note: `Create a clean reference for ${item.name}.` }, shot: { title: `${item.name} · Reference`, purpose: prompt, framing: "Product design sheet", lens: "Macro", movement: "Static" }, settings: { provider: model.provider, model: model.model, mode: selectedRefs.length ? "image-edit" : "text-to-image", styleContext: "prop", aspectRatio, resolution: aspectRatio === "9:16" ? "1024x1536" : aspectRatio === "16:9" ? "1536x1024" : "1024x1024", prompt: `${stylePrefix}${prompt}`, negativePrompt: [styleBlocks.negative.join(", "), $("#propLabNegative")?.value.trim() || "No people, no text, no logos, no background clutter."].filter(Boolean).join(", "), referenceAssetIds: selectedRefs.map((asset) => asset.id), quality: $("#propLabQuality")?.value || "Balanced", referenceStrength: "Preserve" }, references: selectedRefs.map((asset) => ({ path: asset.path, name: asset.name, kind: asset.kind })) });
    if (!result?.asset) throw new Error("No reference image was returned."); const generated = { ...result.asset, id: `prop-generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), visualDirection: visualDirectionMetadata() } }; project.assets = projectAssets(); project.assets.unshift(generated); item.referenceAssetId = generated.id; setDirty();
    // Refresh just the reference gallery in place instead of reopening the
    // whole Lab — a full reopen would silently wipe the design brief,
    // negative constraints, and model/aspect/quality choices right after
    // Generate, the exact moment someone is most likely to tweak and
    // regenerate. Mirrors the fix already applied to Import.
    mountReferenceLibrary({ getRoles: () => entityReferenceRoles(item), ownedAssetIds: () => entityOwnedReferenceIds(item), onImported: (additions) => attachImportedReferences(item, additions), headTitle: "REFERENCE GALLERY", headDescription: "Only this asset's approved references are used for generation. Importing here adds media to this asset—not to the character library.", importButtonId: "propLabImport" });
    notify(`${model.label} created a continuity reference for ${item.name}.`);
  } catch (error) { notify(error?.message || "Reference generation failed."); } finally { closeGenerationOverlay(); if (button) { button.disabled = false; button.textContent = "Generate reference"; } }
}
function openSetModal(index) {
  ensureSetShape(); const set = project.sets[index]; if (!set) return;
  const roles = entityReferenceRoles(set);
  // Same two-column, sticky-portrait pattern as Character Bible's profile:
  // the environment's reference stays visible while writing description and
  // mood text against it. Set used to be the old single-<select> pattern,
  // never upgraded alongside Character — this closes that gap.
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="setForm" class="project-modal character-modal"><button type="button" id="closeModal">×</button><p>SETS & LOCATIONS / LOCATION PROFILE</p><h2>Make this place consistent.</h2><div class="character-modal-layout"><aside class="character-modal-portrait" id="${REFERENCE_LIBRARY_ROOT_ID}"></aside><div class="character-modal-fields"><label>SET NAME<input id="setName" autofocus value="${esc(set.name)}" /></label><label>ENVIRONMENT & LAYOUT<textarea id="setDescription" placeholder="Location type, scale, architecture, key features…">${esc(set.description)}</textarea></label><label>MOOD & LIGHTING<textarea id="setMood" placeholder="Time of day, weather, palette, atmosphere…">${esc(set.mood)}</textarea></label></div></div><p class="scene-modal-note">Set references are automatically offered to compatible image and video models whenever this set is assigned to a scene.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(set), ownedAssetIds: () => entityOwnedReferenceIds(set), onImported: (additions) => attachImportedReferences(set, additions), headTitle: "VISUAL REFERENCE LIBRARY", headDescription: "Only this location's visual source of truth. Importing here attaches an image to this place; character and prop imagery never appears by default.", importButtonId: "importSetReference" });
  $("#setForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(set, { name: $("#setName").value.trim() || `Set ${index + 1}`, description: $("#setDescription").value.trim(), mood: $("#setMood").value.trim(), references, referenceAssetId: primary?.assetId || "" }); setDirty(); closeModal(); render(); notify("Set profile saved."); };
}
function openSetLab(index) {
  ensureSetShape(); const set = project.sets[index]; if (!set) return;
  const models = characterImageModels(); const defaultModel = models.find(modelReady) || models[0];
  const roles = entityReferenceRoles(set);
  const modelOptions = models.map((model) => `<option value="${esc(model.model)}" ${model.model === defaultModel?.model ? "selected" : ""}>${esc(model.label)} · ${providerReady(model.provider) ? "Connected" : "Connect in Model Hub"}</option>`).join("");
  const prompt = [set.name, set.description, set.mood].filter(Boolean).join(", ") || `A production-ready environment design for ${set.name}.`;
  const imageCount = projectAssets().filter((media) => media.kind === "image").length;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="setLabForm" class="project-modal character-lab-modal"><button type="button" id="closeModal">×</button><p>SET LAB / GENERATION WORKBENCH</p><h2>Build an environment the camera can return to.</h2><section class="character-lab-hero"><div><small>CONTINUITY-FIRST DESIGN</small><h3>${esc(set.name)}</h3><p>Generate an environment reference, keep the approved look in the project library, and reuse it in every scene that happens here.</p></div><div class="character-lab-hero-badges"><span class="autosave">${imageCount} IMAGE REFERENCE${imageCount === 1 ? "" : "S"}</span>${styleIndicatorMarkup()}</div></section><div class="character-lab-grid"><div><label>ENVIRONMENT DESIGN BRIEF<textarea id="setLabPrompt">${esc(prompt)}</textarea></label><label>NEGATIVE CONSTRAINTS<textarea id="setLabNegative" placeholder="No people, no text, no logos, no UI…"></textarea></label><div class="character-lab-actions"><button type="button" id="setLabGenerate" class="save-button">Generate environment</button></div></div><aside class="character-lab-side"><h4>Model direction</h4><label class="select-label">IMAGE MODEL<select id="setLabModel" class="model-select">${modelOptions}</select></label><label>OUTPUT RATIO<select id="setLabAspect"><option>16:9</option><option>21:9</option><option>1:1</option><option>3:2</option><option>9:16</option></select></label><label>QUALITY<select id="setLabQuality"><option>Balanced</option><option>Fast</option><option>High</option></select></label><div id="${REFERENCE_LIBRARY_ROOT_ID}"></div></aside></div><div class="character-lab-actions"><button type="button" id="cancelModal" class="quiet-button">Close</button><button class="save-button">Save set profile</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  mountReferenceLibrary({ getRoles: () => entityReferenceRoles(set), ownedAssetIds: () => entityOwnedReferenceIds(set), onImported: (additions) => attachImportedReferences(set, additions), headTitle: "REFERENCE GALLERY", headDescription: "Only this location's approved references are used for generation. Importing here adds media to this place—not to a character or prop.", importButtonId: "setLabImport" });
  expandLabReferenceGallery("#setLabForm");
  $("#setLabForm").onsubmit = (event) => { event.preventDefault(); const references = readReferenceLibrarySelections(); const primary = references.find((reference) => reference.role === "Primary") || references[0]; Object.assign(set, { references, referenceAssetId: primary?.assetId || set.referenceAssetId || "" }); setDirty(); closeModal(); render(); notify("Set profile saved to the continuity system."); };
  $("#setLabGenerate").onclick = () => generateSetReference(index);
}
async function generateSetReference(index) {
  const set = project.sets[index]; const model = modelCatalog.find((item) => item.model === $("#setLabModel")?.value); if (!set || !model) return;
  if (!modelReady(model)) return notify(`${model.label} is not ready. Check its runtime or connection in Model Hub.`);
  const selectedRefs = readReferenceLibrarySelections().map((reference) => assetById(reference.assetId)).filter((asset) => asset?.path && asset.kind === "image"); const aspectRatio = $("#setLabAspect")?.value || "16:9"; const prompt = $("#setLabPrompt")?.value.trim() || `A production-ready environment design for ${set.name}.`;
  // See generateCharacterTurnaround for why this resolution exists.
  // "environment" context also pulls the DNA's dedicated architecture and
  // set-dressing rules, not just its generic image-level guidance.
  const resolvedStyle = resolvedStyleFor(); const styleBlocks = stylePromptBlocks(resolvedStyle.style, "image", "environment", resolvedStyle.strength);
  const stylePrefix = resolvedStyle.style ? `STYLE DNA — ${resolvedStyle.style.name}. ${styleBlocks.positive.join(". ")}. ` : "";
  const button = $("#setLabGenerate"); if (button) { button.disabled = true; button.textContent = "Generating environment…"; }
  openGenerationOverlay("environment");
  try {
    const result = await window.storyMakerDesktop.generateShotImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, style: project.style, visualDirection: project.visualDirection, characters: project.characters }, scene: { title: "Set Lab", note: `Create a clean environment reference for ${set.name}.` }, shot: { title: `${set.name} · Set reference`, purpose: prompt, framing: "Establishing wide", lens: "24mm", movement: "Static" }, settings: { provider: model.provider, model: model.model, mode: selectedRefs.length ? "image-edit" : "text-to-image", styleContext: "environment", aspectRatio, resolution: aspectRatio === "9:16" ? "1024x1536" : aspectRatio === "1:1" ? "1024x1024" : "1536x1024", prompt: `${stylePrefix}${prompt}`, negativePrompt: [styleBlocks.negative.join(", "), $("#setLabNegative")?.value.trim() || "No people, no text, no logos, no UI."].filter(Boolean).join(", "), referenceAssetIds: selectedRefs.map((asset) => asset.id), quality: $("#setLabQuality")?.value || "Balanced", referenceStrength: "Preserve" }, references: selectedRefs.map((asset) => ({ path: asset.path, name: asset.name, kind: asset.kind })) });
    if (!result?.asset) throw new Error("No environment image was returned."); const generated = { ...result.asset, id: `set-generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: { ...(result.generation || {}), visualDirection: visualDirectionMetadata() } }; project.assets = projectAssets(); project.assets.unshift(generated); set.referenceAssetId = generated.id; setDirty();
    // Refresh just the reference gallery in place instead of reopening the
    // whole Lab — a full reopen would silently wipe the design brief,
    // negative constraints, and model/aspect/quality choices right after
    // Generate, the exact moment someone is most likely to tweak and
    // regenerate. Mirrors the fix already applied to Import.
    mountReferenceLibrary({ getRoles: () => entityReferenceRoles(set), ownedAssetIds: () => entityOwnedReferenceIds(set), onImported: (additions) => attachImportedReferences(set, additions), headTitle: "REFERENCE GALLERY", headDescription: "Only this location's approved references are used for generation. Importing here adds media to this place—not to a character or prop.", importButtonId: "setLabImport" });
    notify(`${model.label} created a continuity reference for ${set.name}.`);
  } catch (error) { notify(error?.message || "Environment generation failed."); } finally { closeGenerationOverlay(); if (button) { button.disabled = false; button.textContent = "Generate environment"; } }
}
function addScene() { const count = project.scenes.length + 1; project.scenes.push({ id: `scene-${Date.now()}-${count}`, title: `Untitled sequence ${count}`, note: "A new beat waiting for its purpose.", referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds: [], shots: [] }); setDirty(); render(); notify("Scene added to the board."); }
function buildShotPlan() { ensureSceneShape(); let added = 0; project.scenes.forEach((scene) => { if (!scene.shots.length) { scene.shots.push(newShot(scene, 1)); added += 1; } }); if (!added) return notify("Every scene already has a starting shot."); setDirty(); render(); notify(`${added} starter shot${added === 1 ? "" : "s"} added to the production plan.`); }
function generateSceneShot(sceneIndex) { ensureSceneShape(); const scene = project.scenes[sceneIndex]; if (!scene) return; if (!scene.shots.length) scene.shots.push(newShot(scene, 1)); setDirty(); openShotDirector(sceneIndex, 0); enhanceShotDirector(sceneIndex, 0); }
// Simple mode's per-shot quick actions: same "prime the settings, open Shot
// Director, one click to Generate" pattern the scene-level buttons already
// use — just addressed at a specific shot instead of always shots[0]. Studio
// mode keeps its single "Direct this shot" entry for full manual control;
// these exist so Simple mode users reach every shot without needing that
// deeper surface.
function primeShotImage(sceneIndex, shotIndex) {
  ensureSceneShape();
  const scene = project.scenes[sceneIndex]; const shot = scene?.shots?.[shotIndex]; if (!shot) return;
  const currentOutput = shot.modelSettings?.model ? modelCapability(shot.modelSettings.model).output : null;
  if (currentOutput !== "Image") shot.modelSettings = { ...defaultShotModelSettings(), ...(shot.modelSettings || {}), provider: "openai", model: "gpt-image-1", mode: (shot.modelSettings?.referenceAssetIds || []).length ? "image-edit" : "text-to-image" };
  setDirty(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex);
  notify("Shot primed for an image — choose controls, then click Generate.");
}
function primeShotVideo(sceneIndex, shotIndex) {
  ensureSceneShape();
  const scene = project.scenes[sceneIndex]; const shot = scene?.shots?.[shotIndex]; if (!scene || !shot) return;
  const currentOutput = shot.modelSettings?.model ? modelCapability(shot.modelSettings.model).output : null;
  if (currentOutput === "Video") { setDirty(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex); return; }
  const sourceFrame = assetById(shot.outputAssetId) || storyboardVideoSourceFrame(scene, shot);
  const mode = sourceFrame ? "image-to-video" : "text-to-video";
  const videoModel = defaultVideoModel(mode);
  if (!videoModel) return notify(`No live ${mode} model is available. Connect fal, Kie, or WaveSpeed in Model Hub.`);
  const prior = shot.modelSettings || {};
  shot.modelSettings = { ...defaultShotModelSettings(), ...prior, provider: videoModel.provider, model: videoModel.model, mode, prompt: prior.prompt || `${shot.purpose || scene.note} Cinematic ${shot.movement || "controlled"} motion, coherent action, stable subject identity.`, referenceAssetIds: [], startFrameAssetId: sourceFrame ? sourceFrame.id : "" };
  setDirty(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex);
  notify(sourceFrame ? "Video is primed from this shot's frame — choose controls, then click Generate video." : "Video is primed from the shot's purpose — choose controls, then click Generate video.");
}
// alibaba/wan-2.7/image-to-video · WaveSpeed is the one path proven to render
// a real video end-to-end in this app; prefer it, and only fall back to
// "any live image-to-video model" if it's ever renamed or removed upstream.
function defaultVideoModel(mode = "image-to-video") {
  const preferredModel = mode === "text-to-video" ? "alibaba/wan-2.7/text-to-video" : "alibaba/wan-2.7/image-to-video";
  const preferred = modelCatalog.find((item) => item.model === preferredModel && item.status === "live");
  if (preferred) return preferred;
  return modelCatalog.find((item) => item.status === "live" && modelCapability(item.model).output === "Video" && item.modes.includes(mode));
}
// The gap this closes: approving a scene image never surfaced a path to
// animate it. The reference-attachment plumbing (linkedReferenceIds) already
// worked — what was missing was an entry point that opens Shot Director
// already primed for image-to-video instead of defaulting to a still image.
function animateSceneFrame(sceneIndex) {
  ensureSceneShape();
  const scene = project.scenes[sceneIndex]; if (!scene) return;
  const approved = assetById(scene.approvedVariationId);
  if (!approved || approved.kind !== "image") return notify("Approve a generated frame for this scene before animating it.");
  if (!scene.shots.length) scene.shots.push(newShot(scene, 1));
  const shot = scene.shots[0];
  const currentOutput = shot.modelSettings?.model ? modelCapability(shot.modelSettings.model).output : null;
  if (currentOutput !== "Video") {
    const videoModel = defaultVideoModel();
    if (!videoModel) return notify("No live image-to-video model is available. Connect fal, Kie, or WaveSpeed in Model Hub.");
    // This button is an explicit user decision to animate the approved frame,
    // so it may safely prime that frame as the I2V start frame. It does not
    // change the behavior of ordinary imported/general references.
    shot.modelSettings = { ...defaultShotModelSettings(), provider: videoModel.provider, model: videoModel.model, mode: "image-to-video", referenceAssetIds: [], startFrameAssetId: approved.id };
  }
  setDirty(); openShotDirector(sceneIndex, 0); enhanceShotDirector(sceneIndex, 0); notify("Shot primed to animate this frame — review, then click Generate video.");
}
// Every storyboard panel needs a video path. Prefer the approved/generated
// image as an image-to-video start frame; when a scene has no frame yet, open
// a real text-to-video setup instead of making the creator hunt through
// Shot Planner first.
function generateSceneVideo(sceneIndex) {
  ensureSceneShape();
  const scene = project.scenes[sceneIndex]; if (!scene) return;
  if (!scene.shots.length) scene.shots.push(newShot(scene, 1));
  const shot = scene.shots[0];
  const sourceFrame = storyboardVideoSourceFrame(scene, shot);
  const mode = sourceFrame ? "image-to-video" : "text-to-video";
  const videoModel = defaultVideoModel(mode);
  if (!videoModel) return notify(`No live ${mode} model is available. Connect fal, Kie, or WaveSpeed in Model Hub.`);
  const prior = shot.modelSettings || {};
  shot.modelSettings = {
    ...defaultShotModelSettings(),
    ...prior,
    provider: videoModel.provider,
    model: videoModel.model,
    mode,
    prompt: prior.prompt || `${scene.note} Cinematic ${shot.movement || "controlled"} motion, coherent action, stable subject identity.`,
    // “Generate video from frame” is an explicit frame-selection action.
    // Preserve general references separately; this specific scene frame is
    // deliberately the start composition for I2V.
    referenceAssetIds: [],
    startFrameAssetId: sourceFrame ? sourceFrame.id : ""
  };
  setDirty(); openShotDirector(sceneIndex, 0); enhanceShotDirector(sceneIndex, 0);
  notify(sourceFrame ? "Video is primed from this scene frame — choose controls, then click Generate video." : "Video is primed from the scene brief — choose controls, then click Generate video.");
}
function animateExactImageTake(sceneIndex, shotIndex, assetId) {
  ensureSceneShape();
  const scene = project.scenes?.[sceneIndex]; const shot = scene?.shots?.[shotIndex]; const frame = assetById(assetId);
  if (!scene || !shot || frame?.kind !== "image") return notify("Choose an image take to animate.");
  const videoModel = defaultVideoModel("image-to-video");
  if (!videoModel) return notify("No live image-to-video model is available. Connect fal, Kie, or WaveSpeed in Model Hub.");
  scene.approvedVariationId = frame.id;
  shot.outputAssetId = frame.id;
  shot.modelSettings = normalizeReferenceRoles({ ...defaultShotModelSettings(), ...(shot.modelSettings || {}), provider: videoModel.provider, model: videoModel.model, mode: "image-to-video", referenceSelectionVersion: 2, referenceAssetIds: [], videoReferenceAssetIds: [], audioReferenceAssetIds: [], startFrameAssetId: frame.id, endFrameAssetId: "" });
  setDirty(); closeModal(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex);
  notify(`Animating exactly from ${assetDisplayTitle(frame)}. It is now the selected Start Frame.`);
}
function addShot(sceneIndex) { ensureSceneShape(); const scene = project.scenes[sceneIndex]; if (!scene) return; scene.shots.push(newShot(scene, scene.shots.length + 1)); setDirty(); render(); notify("Shot added to the plan."); }
// Same gap the Character/Set/Prop deletes had before this pass: every other
// destructive delete in this app confirms (Style DNA, media assets, a single
// reference image, whole production profiles) — this one didn't, despite
// destroying a shot's prompt, model settings, references, and every take
// it's already generated, in one click with no undo.
function removeShot(sceneIndex, shotIndex) {
  const scene = project.scenes[sceneIndex]; if (!scene) return;
  const shot = scene.shots[shotIndex]; if (!shot) return;
  const takeCount = (shot.modelSettings?.outputHistory || []).length;
  if (!confirm(`Remove "${shot.title}"${takeCount ? ` — ${takeCount} generated take${takeCount === 1 ? "" : "s"}` : ""}? This cannot be undone.`)) return;
  scene.shots.splice(shotIndex, 1); setDirty(); render(); notify("Shot removed from the plan.");
}
// The Timeline has no drag-and-drop — a shot's position is just its index in
// scene.shots, so reordering is a plain array splice. This is the only way
// to build a sequence out of order today; see moveShotUp/Down below.
function moveShot(sceneIndex, shotIndex, delta) {
  const scene = project.scenes[sceneIndex]; if (!scene) return;
  const target = shotIndex + delta;
  if (target < 0 || target >= scene.shots.length) return;
  const [shot] = scene.shots.splice(shotIndex, 1);
  scene.shots.splice(target, 0, shot);
  setDirty(); render();
}
function openShotDirector(sceneIndex, shotIndex) {
  ensureProductionShape(); const scene = project.scenes[sceneIndex]; const shot = scene?.shots?.[shotIndex]; if (!shot) return;
  const storedSettings = shot.modelSettings || {};
  const settings = { ...defaultShotModelSettings(), ...storedSettings, referenceAssetIds: Number(storedSettings.referenceSelectionVersion || 0) >= 2 ? [...(storedSettings.referenceAssetIds || [])] : [] };
  const images = projectAssets().filter((asset) => asset.kind === "image");
  const shotModels = modelCatalog.filter((item) => modelCapability(item.model).output !== "Text");
  const modelOptions = shotModels.map((item) => `<option value="${esc(item.model)}" ${item.model === settings.model ? "selected" : ""}>${esc(item.label)} · ${item.status === "live" ? "Live" : "In build"}</option>`).join("");
  const shotProviders = [...new Set(shotModels.map((item) => item.provider))];
  const providerOptions = shotProviders.map((provider) => `<option value="${esc(provider)}" ${provider === settings.provider ? "selected" : ""}>${esc(providerLabel(provider))}</option>`).join("");
  const references = images.length ? `<div class="reference-grid">${images.map((asset) => referenceChoiceTile(asset, (settings.referenceAssetIds || []).includes(asset.id))).join("")}</div>` : `<p class="scene-modal-note">Import media in Media Library before attaching shot references.</p>`;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="shotDirectorForm" class="project-modal shot-director-modal"><button type="button" id="closeModal">×</button><p>SHOT MODEL DIRECTOR / SCENE ${String(sceneIndex + 1).padStart(2, "0")} · SHOT ${String(shotIndex + 1).padStart(2, "0")}</p><h2>${esc(shot.title)}</h2><div class="shot-director-grid"><label>MODEL<select id="shotModel">${modelOptions}</select></label><label>MODE<select id="shotMode"><option ${settings.mode === "text-to-image" ? "selected" : ""}>text-to-image</option><option ${settings.mode === "image-edit" ? "selected" : ""}>image-edit</option><option ${settings.mode === "image-to-video" ? "selected" : ""}>image-to-video</option><option ${settings.mode === "reference-to-video" ? "selected" : ""}>reference-to-video</option></select></label><label>ASPECT RATIO<select id="shotAspect"><option ${settings.aspectRatio === "16:9" ? "selected" : ""}>16:9</option><option ${settings.aspectRatio === "9:16" ? "selected" : ""}>9:16</option><option ${settings.aspectRatio === "3:2" ? "selected" : ""}>3:2</option><option ${settings.aspectRatio === "1:1" ? "selected" : ""}>1:1</option></select></label><label>RESOLUTION<select id="shotResolution"><option ${settings.resolution === "1536x1024" ? "selected" : ""}>1536x1024</option><option ${settings.resolution === "1024x1024" ? "selected" : ""}>1024x1024</option><option ${settings.resolution === "1920x1080" ? "selected" : ""}>1920x1080</option><option ${settings.resolution === "4K" ? "selected" : ""}>4K</option></select></label><label>MOTION<select id="shotMotion"><option ${settings.motion === "Controlled" ? "selected" : ""}>Controlled</option><option ${settings.motion === "Subtle" ? "selected" : ""}>Subtle</option><option ${settings.motion === "Dynamic" ? "selected" : ""}>Dynamic</option><option ${settings.motion === "Handheld" ? "selected" : ""}>Handheld</option></select></label></div><label>SHOT INTENT / STORY BEAT<textarea id="shotPrompt" placeholder="What must this shot make the audience feel and reveal?">${esc(shot.blueprint?.narrative || shot.purpose || settings.prompt)}</textarea><small class="shot-intent-note">This is creative intent, not the provider payload. The authoritative Image Prompt or Video Prompt below is what gets sent.</small></label><label>NEGATIVE CONSTRAINTS<textarea id="shotNegative" placeholder="What must not change, appear, or be invented?">${esc(settings.negativePrompt)}</textarea></label><div class="shot-reference-picker"><small>IMAGE REFERENCES</small><div>${references}</div></div><p class="scene-modal-note">This saves a production specification on this shot. A model marked In build is never presented as a working render until its native adapter has been completed.</p><div class="shot-director-actions"><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save shot direction</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  const modelField = $("#shotModel")?.closest("label");
  if (modelField && !$("#shotProvider")) {
    const providerField = document.createElement("label");
    providerField.innerHTML = `API PROVIDER<select id="shotProvider">${providerOptions}</select>`;
    modelField.before(providerField);
  }
  const capabilitySummary = document.createElement("div");
  capabilitySummary.id = "modelCapabilitySummary";
  capabilitySummary.className = "model-capability-summary";
  capabilitySummary.setAttribute("aria-live", "polite");
  $("#shotModel")?.closest(".shot-director-grid")?.after(capabilitySummary);
  $("#shotDirectorForm").onsubmit = (event) => { event.preventDefault(); const provider = $("#shotProvider")?.value || settings.provider; const model = modelCatalog.find((item) => item.provider === provider && item.model === $("#shotModel").value); shot.modelSettings = { ...settings, provider: model?.provider || provider, model: $("#shotModel").value, mode: $("#shotMode").value, aspectRatio: $("#shotAspect").value, resolution: $("#shotResolution").value, motion: $("#shotMotion").value, prompt: $("#shotPrompt").value.trim(), negativePrompt: $("#shotNegative").value.trim(), referenceAssetIds: [...document.querySelectorAll('input[name="shotReferences"]:checked')].map((input) => input.value) }; setDirty(); closeModal(); render(); notify("Shot model direction saved."); };
}
function enhanceShotDirector(sceneIndex, shotIndex) {
  const scene = project.scenes[sceneIndex];
  const shot = scene?.shots?.[shotIndex];
  const form = $("#shotDirectorForm");
  if (!scene || !shot || !form) return;
  const storedSettings = shot.modelSettings || {};
  const settings = { ...defaultShotModelSettings(), ...storedSettings, referenceAssetIds: Number(storedSettings.referenceSelectionVersion || 0) >= 2 ? [...(storedSettings.referenceAssetIds || [])] : [] };
  const automaticReferenceIds = assignedContinuityReferenceIds(scene);
  const styleBinding = project.visualDirection.shotOverrides?.[shot.id];
  const styleControl = document.createElement("label");
  styleControl.innerHTML = `VISUAL DIRECTION<select id="shotVisualDirection"><option value="">Inherit project / scene direction</option>${visualStyleLibrary().map((style) => `<option value="${esc(style.id)}" ${styleBinding?.styleId === style.id ? "selected" : ""}>${esc(style.name)} · v${style.version}</option>`).join("")}</select>`;
  form.querySelector(".shot-director-grid")?.append(styleControl);
  const styleSelect = $("#shotVisualDirection");
  if (styleSelect) {
    const styledPicker = document.createElement("div"); styledPicker.className = "studio-select";
    const syncStyledPicker = () => { const option = styleSelect.options[styleSelect.selectedIndex]; const label = styledPicker.querySelector(".studio-select-trigger span"); if (label) label.textContent = option?.textContent || "Inherit project / scene direction"; styledPicker.querySelectorAll("[data-studio-select-value]").forEach((item) => item.classList.toggle("selected", item.dataset.studioSelectValue === styleSelect.value)); };
    styledPicker.innerHTML = `<button type="button" class="studio-select-trigger" aria-haspopup="listbox" aria-expanded="false"><span>${esc(styleSelect.options[styleSelect.selectedIndex]?.textContent || "Inherit project / scene direction")}</span><i>⌄</i></button><div class="studio-select-menu" role="listbox" hidden>${[...styleSelect.options].map((option) => `<button type="button" role="option" data-studio-select-value="${esc(option.value)}">${esc(option.textContent)}</button>`).join("")}</div>`;
    styleSelect.hidden = true; styleSelect.after(styledPicker);
    const trigger = styledPicker.querySelector(".studio-select-trigger"); const menu = styledPicker.querySelector(".studio-select-menu");
    trigger.addEventListener("click", () => { const open = menu.hidden; menu.hidden = !open; trigger.setAttribute("aria-expanded", String(open)); });
    styledPicker.querySelectorAll("[data-studio-select-value]").forEach((item) => item.addEventListener("click", () => { styleSelect.value = item.dataset.studioSelectValue; styleSelect.dispatchEvent(new Event("change", { bubbles: true })); menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); syncStyledPicker(); }));
    form.addEventListener("click", (event) => { if (!styledPicker.contains(event.target)) { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); } });
    syncStyledPicker();
  }
  const persistShotStyle = () => { const id = $("#shotVisualDirection")?.value || ""; if (!id) { delete project.visualDirection.shotOverrides[shot.id]; return; } const style = styleDnaById(id); if (style) project.visualDirection.shotOverrides[shot.id] = { styleId: style.id, versionId: style.versionId, snapshot: structuredClone(style), patch: {} }; };
  const importButton = document.createElement("button"); importButton.type = "button"; importButton.className = "quiet-button"; importButton.textContent = "Import and attach media"; importButton.addEventListener("click", async () => { try { const selected = await importAssetsIntoProject(); if (!selected.length) return notify("No supported media was selected."); const capability = modelCapability(selectedModel().model); const limits = inputLimits(capability); const attached = { image: 0, video: 0, audio: 0 };
    // Importing creates compatible references only. Start/end frames are an
    // explicit creative decision; no imported asset is silently promoted.
    selected.forEach((asset) => { if (!asset?.id) return; if (asset.kind === "image" && limits.image && !(settings.referenceAssetIds || []).includes(asset.id) && settings.referenceAssetIds.length < limits.image) { settings.referenceAssetIds.push(asset.id); attached.image += 1; } if (asset.kind === "video" && limits.video && !(settings.videoReferenceAssetIds || []).includes(asset.id) && settings.videoReferenceAssetIds.length < limits.video) { settings.videoReferenceAssetIds.push(asset.id); attached.video += 1; } if (asset.kind === "audio" && limits.audio && !(settings.audioReferenceAssetIds || []).includes(asset.id) && settings.audioReferenceAssetIds.length < limits.audio) { settings.audioReferenceAssetIds.push(asset.id); attached.audio += 1; } });
    shot.modelSettings = normalizeReferenceRoles({ ...settings, outputHistory: Array.isArray(shot.modelSettings?.outputHistory) ? shot.modelSettings.outputHistory : [] }); setDirty(); renderReferenceInputs();
    let attachedCount = attached.image + attached.video + attached.audio;
    let routedModel = null;
    const isAttachedToShot = (asset) => { const key = referenceRoleKey(asset.kind); return Boolean(key && Array.isArray(settings[key]) && settings[key].includes(asset.id)); };
    // Route when *any* item in a mixed batch is incompatible with the current
    // model. Checking only attachedCount allowed an image-only model to accept
    // one image while quietly stranding the accompanying video/audio files.
    const needsCompatibleRoute = selected.some((asset) => ["image", "video", "audio"].includes(asset.kind) && !isAttachedToShot(asset));
    if (needsCompatibleRoute) {
      const importedKinds = [...new Set(selected.map((asset) => asset.kind).filter((kind) => ["image", "video", "audio"].includes(kind)))];
      const compatible = modelCatalog.filter((item) => item.status === "live" && modelCapability(item.model).output === "Video" && importedKinds.every((kind) => (inputLimits(modelCapability(item.model))[kind] || 0) > 0));
      routedModel = compatible.find(modelReady) || compatible[0] || null;
      if (routedModel) {
        $("#shotProvider").value = routedModel.provider; updateProviderModels(); $("#shotModel").value = routedModel.model; updateCapabilities();
        const routedLimits = inputLimits(modelCapability(routedModel.model));
        selected.forEach((asset) => { const key = referenceRoleKey(asset.kind); if (!key || !routedLimits[asset.kind]) return; settings[key] = Array.isArray(settings[key]) ? settings[key] : []; if (!settings[key].includes(asset.id) && settings[key].length < routedLimits[asset.kind]) { settings[key].push(asset.id); attached[asset.kind] += 1; } });
        attachedCount = attached.image + attached.video + attached.audio;
        shot.modelSettings = normalizeReferenceRoles({ ...settings, provider: routedModel.provider, model: routedModel.model, mode: routedModel.modes[0], outputHistory: Array.isArray(shot.modelSettings?.outputHistory) ? shot.modelSettings.outputHistory : [] });
        renderReferenceInputs();
      }
    }
    notify(attachedCount ? `${routedModel ? `Switched to ${routedModel.label}. ` : ""}Imported and attached ${attachedCount} compatible input${attachedCount === 1 ? "" : "s"} to this shot. Select a start or end frame manually when supported.` : "Media was imported into the project library, but no available model accepts this combination of media types.");
  } catch (error) { notify(error?.message || "Reference media could not be imported."); } }); form.querySelector(".shot-reference-picker")?.append(importButton);
  const referencePack = document.createElement("section");
  referencePack.id = "shotReferencePack";
  referencePack.className = "shot-reference-pack";
  // Frame controls are deliberately not rendered until a model explicitly
  // supports them. A hidden static element was vulnerable to CSS overriding
  // the browser's hidden attribute, which made image models appear to have
  // start/end-frame controls.
  referencePack.innerHTML = '<div class="shot-reference-pack-head"><div><small>MODEL INPUTS</small><strong>Attached references for this shot</strong><p>Import attaches compatible files immediately. Remove detaches an asset from this shot only; your Media Library is unchanged.</p></div><button type="button" class="quiet-button" id="clearShotReferences">Clear shot references</button></div><div class="shot-reference-role-grid"><div class="shot-reference-role" id="shotVideoReferenceRole"><strong>VIDEO REFERENCES <span id="shotVideoReferenceLimit"></span></strong><div class="reference-grid" id="shotVideoReferenceChoices"></div></div><div class="shot-reference-role" id="shotAudioReferenceRole"><strong>AUDIO REFERENCES <span id="shotAudioReferenceLimit"></span></strong><div class="reference-grid" id="shotAudioReferenceChoices"></div></div></div><div class="shot-reference-attached" id="shotReferenceAttached"></div>';
  form.querySelector(".shot-reference-picker")?.append(referencePack);
  const history = repairShotOutputHistory(shot);
  if (history.length) {
    form.querySelector(".shot-reference-picker")?.insertAdjacentHTML("afterend", `<section class="shot-job-history"><small>OUTPUT HISTORY</small>${history.slice(0, 5).map((job) => {
      const status = String(job.status || "unknown").toLowerCase();
      const statusClass = ["completed", "succeeded"].includes(status) ? "done" : ["failed", "check-failed", "error"].includes(status) ? "failed" : "active";
      const detail = job.error || (job.completedAt ? `Completed ${new Date(job.completedAt).toLocaleString()}` : `Requested ${new Date(job.requestedAt || Date.now()).toLocaleString()}`);
      return `<article class="shot-job-row ${statusClass}"><span class="shot-job-dot"></span><div class="shot-job-body"><div class="shot-job-top"><b title="${esc(job.model || "Model job")}">${esc(job.model || "Model job")}</b><em>${esc(status)}</em></div><p>${esc(detail)}</p></div>${job.assetId && assetById(job.assetId) ? `<button type="button" data-review-shot-output="${esc(job.assetId)}" class="line-action">Review take →</button>` : ""}</article>`;
    }).join("")}</section>`);
  }
  const toolbar = document.createElement("div");
  toolbar.className = "generation-mode-toolbar";
  toolbar.innerHTML = `<div><small>GENERATION EXPERIENCE</small><strong>Choose your working depth</strong></div><div><button type="button" data-generation-view="quick">Quick Create</button><button type="button" data-generation-view="director">Director Controls</button></div>`;
  form.querySelector("h2")?.after(toolbar);
  // Both an image and a video take can exist on the same shot (an approved
  // still animated into a video keeps both in history) — show whichever
  // exist, without making the user click through "Review take" for either.
  const completedOutputs = history.filter((job) => job.assetId).map((job) => assetById(job.assetId)).filter(Boolean);
  const latestImageOutput = completedOutputs.find((asset) => asset.kind === "image");
  const latestVideoOutput = completedOutputs.find((asset) => asset.kind === "video");
  const videoSourceFrame = assetById(latestVideoOutput?.generation?.sourceFrameAssetId);
  const videoSourceLabel = videoSourceFrame ? `VIDEO · FROM ${assetDisplayTitle(videoSourceFrame)}` : "VIDEO · SOURCE NOT RECORDED";
  if (latestImageOutput || latestVideoOutput) {
    const currentOutputs = document.createElement("section");
    currentOutputs.className = "shot-current-outputs";
    currentOutputs.innerHTML = `<small>CURRENT OUTPUT</small><div class="shot-output-grid">${latestImageOutput ? `<div><img src="${esc(fileUrl(latestImageOutput))}" alt="Latest image take" /><span>IMAGE</span><button type="button" data-download-shot-output="image" class="quiet-button">Download</button></div>` : ""}${latestVideoOutput ? `<div><video src="${esc(fileUrl(latestVideoOutput))}" controls></video><span>${esc(videoSourceLabel)}</span><button type="button" data-download-shot-output="video" class="quiet-button">Download</button></div>` : ""}</div>`;
    if (latestImageOutput) currentOutputs.querySelector(".shot-output-grid>div")?.insertAdjacentHTML("beforeend", `<button type="button" data-animate-exact-image="${esc(latestImageOutput.id)}" class="save-button">Animate this exact image</button>`);
    toolbar.after(currentOutputs);
    if (latestImageOutput) bindDownloadButton('[data-download-shot-output="image"]', latestImageOutput);
    if (latestVideoOutput) bindDownloadButton('[data-download-shot-output="video"]', latestVideoOutput);
    currentOutputs.querySelector("[data-animate-exact-image]")?.addEventListener("click", (event) => animateExactImageTake(sceneIndex, shotIndex, event.currentTarget.dataset.animateExactImage));
  }
  const allTakes = shotTakeAssets(shot);
  if (allTakes.length) {
    const takeGallery = document.createElement("section");
    takeGallery.className = "shot-take-gallery";
    takeGallery.innerHTML = `<header><div><small>ALL RENDERED TAKES</small><strong>${allTakes.length} preserved ${allTakes.length === 1 ? "take" : "takes"}</strong></div><span>Choose the take used by this shot. Other takes stay available until removed.</span></header><div>${allTakes.map((asset) => `<article class="${shot.outputAssetId === asset.id ? "selected" : ""}"><button type="button" data-preview-asset="${esc(asset.id)}" class="take-thumb">${asset.kind === "video" ? `<video src="${esc(fileUrl(asset))}" muted playsinline preload="metadata"></video><b>▶</b>` : `<img src="${esc(fileUrl(asset))}" alt="" />`}</button><div><small>${asset.kind.toUpperCase()} ${shot.outputAssetId === asset.id ? "· SELECTED" : ""}</small><strong>${esc(assetDisplayTitle(asset))}</strong><span><button type="button" data-select-shot-take="${sceneIndex}:${shotIndex}:${esc(asset.id)}" class="quiet-button">${shot.outputAssetId === asset.id ? "Selected" : "Use this take"}</button><button type="button" data-download-asset="${esc(asset.id)}" class="quiet-button">Download</button><button type="button" data-remove-asset="${esc(asset.id)}" class="remove-button">Remove</button></span></div></article>`).join("")}</div>`;
    allTakes.filter((asset) => asset.kind === "image").forEach((asset) => takeGallery.querySelector(`[data-preview-asset="${CSS.escape(asset.id)}"]`)?.closest("article")?.querySelector("span")?.insertAdjacentHTML("beforeend", `<button type="button" data-animate-exact-image="${esc(asset.id)}" class="save-button">Animate this image</button>`));
    toolbar.after(takeGallery);
    // This gallery is inserted after the app-wide bind() pass, so bind its
    // actions locally. The previous implementation rendered working-looking
    // controls that had no event listeners.
    takeGallery.querySelectorAll("[data-preview-asset]").forEach((button) => button.addEventListener("click", () => openVariation(button.dataset.previewAsset)));
    takeGallery.querySelectorAll("[data-download-asset]").forEach((button) => button.addEventListener("click", () => downloadAsset(button.dataset.downloadAsset)));
    takeGallery.querySelectorAll("[data-select-shot-take]").forEach((button) => button.addEventListener("click", () => { const [targetSceneIndex, targetShotIndex, assetId] = button.dataset.selectShotTake.split(":"); selectShotTake(Number(targetSceneIndex), Number(targetShotIndex), assetId); closeModal(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex); }));
    takeGallery.querySelectorAll("[data-remove-asset]").forEach((button) => button.addEventListener("click", async () => { await removeMedia(button.dataset.removeAsset); }));
    takeGallery.querySelectorAll("[data-animate-exact-image]").forEach((button) => button.addEventListener("click", () => animateExactImageTake(sceneIndex, shotIndex, button.dataset.animateExactImage)));
  }
  form.querySelector(".shot-director-grid")?.classList.add("shot-quick-grid");
  form.querySelector(".shot-reference-picker")?.insertAdjacentHTML("beforebegin", `<section class="shot-director-controls" hidden><div class="shot-director-controls-head"><div><small>DIRECTOR CONTROLS</small><h3>Model-aware shot specification</h3></div><p id="modelCapabilityCopy"></p></div><div class="shot-director-extra"><label data-capability="quality">QUALITY<select id="shotQuality"><option>Fast</option><option>Balanced</option><option>High</option></select></label><label data-capability="reference fidelity">REFERENCE FIDELITY<select id="shotReferenceStrength"><option>Loose</option><option>Balanced</option><option>Preserve</option></select></label><label data-capability="seed">SEED<input id="shotSeed" inputmode="numeric" placeholder="Optional repeatable seed" /></label><label data-capability="duration">DURATION<select id="shotDuration"><option>3</option><option>5</option><option>8</option><option>10</option><option>15</option></select></label><label data-capability="camera">CAMERA INTENT<textarea id="shotCameraInstruction" placeholder="Lens behavior, framing, movement, focus pull..."></textarea></label><label data-capability="audio">AUDIO INTENT<textarea id="shotAudioInstruction" placeholder="Dialogue, ambience or sound direction..."></textarea></label><label class="prompt-enhancement"><input id="shotPromptEnhancement" type="checkbox" /> <span><b>Prompt enhancement</b><small>Let the selected model expand the production direction.</small></span></label></div><p class="model-reference-status" id="modelReferenceStatus"></p></section>`);
  $("#shotQuality").value = settings.quality || "Balanced";
  $("#shotReferenceStrength").value = settings.referenceStrength || "Balanced";
  $("#shotSeed").value = settings.seed || "";
  $("#shotDuration").value = settings.duration || "5";
  $("#shotCameraInstruction").value = settings.cameraInstruction || "";
  $("#shotAudioInstruction").value = settings.audioInstruction || "";
  $("#shotPromptEnhancement").checked = settings.promptEnhancement !== false;
  const remoteReferenceLabel = document.createElement("label");
  remoteReferenceLabel.dataset.capability = "remote-references";
  remoteReferenceLabel.innerHTML = `PUBLIC REFERENCE URLS<textarea id="shotReferenceUrls" placeholder="One public https:// URL per line. Image, video, and audio links are sent to video providers."></textarea>`;
 form.querySelector(".shot-director-extra")?.append(remoteReferenceLabel);
  const deliveryResolutionLabel = document.createElement("label");
  deliveryResolutionLabel.innerHTML = `DELIVERY QUALITY<div class="delivery-preset-grid" role="group" aria-label="Delivery quality"><button type="button" data-delivery-preset="native">Native</button><button type="button" data-delivery-preset="1k">1K</button><button type="button" data-delivery-preset="2k">2K</button><button type="button" data-delivery-preset="4k">4K</button></div><select id="shotDeliveryResolution" aria-label="Delivery quality"><option value="native">Native model output</option><option value="1k">1K delivery · Topaz upscale</option><option value="2k">2K delivery · Topaz upscale</option><option value="4k">4K delivery · Topaz 4× upscale</option></select><small>Shown as a delivery target. Unsupported native sizes stay hidden by the selected model.</small>`;
  form.querySelector(".shot-director-extra")?.append(deliveryResolutionLabel);
  const blueprint = { ...defaultShotBlueprint(), ...(shot.blueprint || {}) };
  // Where the acting direction below actually came from — same idea as
  // the Locked/Suggested/Inferred provenance already shown for style
  // choices, applied to performance specifically since it shapes the
  // final generation as much as anything else on this form.
  const PERFORMANCE_SOURCE_LABEL = { detected: "AUTO-DETECTED", ai: "AI SUGGESTED", manual: "YOUR DIRECTION" };
  const performanceSourceBadge = PERFORMANCE_SOURCE_LABEL[blueprint.performanceSource] ? `<span class="performance-source performance-source-${esc(blueprint.performanceSource)}" title="${blueprint.performanceSource === "detected" ? "Pulled from acting/emotion language found in the imported script." : blueprint.performanceSource === "ai" ? "Written by the AI shot planner." : "Edited or written by you."}">${PERFORMANCE_SOURCE_LABEL[blueprint.performanceSource]}</span>` : "";
  const castWithBaseline = (scene.castIds || []).map((id) => project.characters.find((character) => character.id === id)).filter((character) => character?.emotionalProfile);
  const performanceBaselineNote = castWithBaseline.length ? `<small class="performance-baseline-note">Also carries ${castWithBaseline.map((character) => esc(character.name)).join(" and ")}'s established emotional baseline from Character Bible into generation, in addition to the direction below.</small>` : "";
  const productionBrief = document.createElement("section");
  productionBrief.className = "shot-production-brief";
  productionBrief.innerHTML = `<div class="shot-director-controls-head"><div><small>PRODUCTION BLUEPRINT</small><h3>Direct performance, light, staging, and continuity</h3></div><p>These fields are saved on this shot and compiled into supported image and video requests.</p></div><div class="shot-director-extra"><label>ACTING & PERFORMANCE ${performanceSourceBadge}<textarea id="shotPerformanceInstruction" placeholder="Objective, emotion, facial expression, eye line, gesture, pace…"></textarea>${performanceBaselineNote}</label><label>LIGHTING & ATMOSPHERE<textarea id="shotLightingInstruction" placeholder="Key/fill/rim, practicals, color temperature, weather, exposure…"></textarea></label><label>BLOCKING & COMPOSITION<textarea id="shotBlockingInstruction" placeholder="Placement, entrances, movement path, screen direction, composition…"></textarea></label><label>VFX & CONTINUITY<textarea id="shotContinuityInstruction" placeholder="Effects, recurring props/costume, match-cut or continuity constraints…"></textarea></label></div>`;
  form.querySelector(".shot-director-controls")?.after(productionBrief);
  $("#shotPerformanceInstruction").value = blueprint.performance || "";
  $("#shotLightingInstruction").value = blueprint.lighting || "";
  $("#shotBlockingInstruction").value = blueprint.blocking || "";
  $("#shotContinuityInstruction").value = [blueprint.effects, blueprint.continuity].filter(Boolean).join("\n");
  const promptPackage = document.createElement("section");
  promptPackage.className = "shot-production-brief shot-prompt-package";
  const hasStructuredPromptPackage = Number(settings.promptPackageVersion || 0) >= 2;
  promptPackage.innerHTML = `<div class="shot-director-controls-head"><div><small>AUTHORITATIVE MODEL-READY PROMPTS</small><h3>One payload for the selected output</h3></div><p id="activePromptNotice">The selected model decides which prompt is sent. The other prompt remains safely editable for the next pass.</p></div><div class="shot-director-extra"><label>IMAGE PROMPT <small>Used only by image models.</small><textarea id="shotImagePrompt" placeholder="Detailed image direction">${esc(hasStructuredPromptPackage ? (settings.imagePrompt || productionPromptFor(scene, shot, "image")) : productionPromptFor(scene, shot, "image"))}</textarea></label><label>VIDEO PROMPT <small>Used only by video models.</small><textarea id="shotVideoPrompt" placeholder="Detailed video direction">${esc(hasStructuredPromptPackage ? (settings.videoPrompt || productionPromptFor(scene, shot, "video")) : productionPromptFor(scene, shot, "video"))}</textarea></label></div><div class="prompt-package-actions"><button type="button" id="rebuildPromptPackage" class="quiet-button">Rebuild both from shot intent</button><span>Rebuilding replaces only the two model-ready prompts; your story, blueprint, references, and constraints stay intact.</span></div>`;
  productionBrief.after(promptPackage);
  const multiShotLabel = document.createElement("label");
  multiShotLabel.dataset.capability = "multi-shot";
  multiShotLabel.innerHTML = `MULTI-SHOT PLAN<textarea id="shotMultiPrompts" placeholder="One beat per line: 3 | First shot description\n2 | Next shot description"></textarea>`;
  form.querySelector(".shot-director-extra")?.append(multiShotLabel);
 $("#shotReferenceUrls").value = (settings.referenceUrls || []).join("\n");
 $("#shotDeliveryResolution").value = settings.deliveryResolution || "native";
  const syncDeliveryPreset = () => document.querySelectorAll("[data-delivery-preset]").forEach((button) => button.classList.toggle("selected", button.dataset.deliveryPreset === $("#shotDeliveryResolution")?.value));
  syncDeliveryPreset();
  document.querySelectorAll("[data-delivery-preset]").forEach((button) => button.addEventListener("click", () => { $("#shotDeliveryResolution").value = button.dataset.deliveryPreset; syncDeliveryPreset(); }));
  $("#shotDeliveryResolution")?.addEventListener("change", syncDeliveryPreset);
  $("#shotMultiPrompts").value = settings.multiShotPrompts || "";
  $("#rebuildPromptPackage")?.addEventListener("click", () => { const nextBlueprint = { ...blueprint, narrative: $("#shotPrompt")?.value.trim() || shot.purpose, camera: $("#shotCameraInstruction")?.value.trim() || blueprint.camera, audio: $("#shotAudioInstruction")?.value.trim() || blueprint.audio, performance: $("#shotPerformanceInstruction")?.value.trim() || blueprint.performance, lighting: $("#shotLightingInstruction")?.value.trim() || blueprint.lighting, blocking: $("#shotBlockingInstruction")?.value.trim() || blueprint.blocking, continuity: $("#shotContinuityInstruction")?.value.trim() || blueprint.continuity, motion: $("#shotMotion")?.value || blueprint.motion }; const promptShot = { ...shot, blueprint: nextBlueprint }; $("#shotImagePrompt").value = productionPromptFor(scene, promptShot, "image"); $("#shotVideoPrompt").value = productionPromptFor(scene, promptShot, "video"); notify("Image and video prompts rebuilt from the current shot intent."); });
  const selectedModel = () => {
    const provider = $("#shotProvider")?.value || settings.provider;
    const model = $("#shotModel")?.value || settings.model;
    return modelCatalog.find((item) => item.provider === provider && item.model === model) || modelCatalog.find((item) => item.model === model) || modelCatalog[0];
  };
  const inputLimits = (capability) => capability.inputLimits || { image: capability.references?.includes("image") ? 1 : 0, video: capability.references?.includes("video") ? 1 : 0, audio: capability.references?.includes("audio") ? 1 : 0 };
  const effectiveInputLimits = (model = selectedModel(), mode = $("#shotMode")?.value || settings.mode) => {
    const capability = modelCapability(model.model);
    if (mode === "image-to-video" && (capability.singleSourceImageToVideo === true || model.provider === "wavespeed")) return { image: 0, video: 0, audio: 0 };
    return inputLimits(capability);
  };
  const referenceRoleKey = (role) => role === "image" ? "referenceAssetIds" : role === "video" ? "videoReferenceAssetIds" : "audioReferenceAssetIds";
  const refreshAttachedReferences = () => {
    const host = form.querySelector("#shotReferenceAttached"); if (!host) return;
    const frameControlEnabled = supportsStartEndFrames(modelCapability(selectedModel().model));
    const references = [
      ...(settings.referenceAssetIds || []).map((id) => ["image", id]),
      ...(settings.videoReferenceAssetIds || []).map((id) => ["video", id]),
      ...(settings.audioReferenceAssetIds || []).map((id) => ["audio", id]),
      frameControlEnabled && settings.startFrameAssetId ? ["start", settings.startFrameAssetId] : null,
      frameControlEnabled && settings.endFrameAssetId ? ["end", settings.endFrameAssetId] : null
    ].filter(Boolean).map(([role, id]) => ({ role, asset: assetById(id) })).filter((item) => item.asset);
    host.innerHTML = references.length ? references.map((item) => '<span class="shot-reference-chip"><b>' + esc(item.role === "start" ? "Start frame" : item.role === "end" ? "End frame" : item.role) + '</b>' + esc(item.asset.name) + '<button type="button" data-detach-reference="' + esc(item.role) + ':' + esc(item.asset.id) + '" aria-label="Detach reference">×</button></span>').join("") : '<span class="shot-reference-empty">No references attached to this shot.</span>';
    host.querySelectorAll("[data-detach-reference]").forEach((button) => { const id = button.dataset.detachReference.split(":")[1]; const remove = document.createElement("button"); remove.type = "button"; remove.dataset.deleteReference = id; remove.setAttribute("aria-label", "Remove this asset from project"); remove.textContent = "⌫"; button.after(remove); });
    host.querySelectorAll("[data-delete-reference]").forEach((button) => button.addEventListener("click", async () => { const asset = assetById(button.dataset.deleteReference); if (!asset || !confirm("Remove " + asset.name + " from this project and every shot that uses it?")) return; closeModal(); await removeMedia(asset.id); }));
    host.querySelectorAll("[data-detach-reference]").forEach((button) => button.addEventListener("click", () => {
      const [role, id] = button.dataset.detachReference.split(":");
      if (role === "start") settings.startFrameAssetId = "";
      else if (role === "end") settings.endFrameAssetId = "";
      else { settings[referenceRoleKey(role)] = (settings[referenceRoleKey(role)] || []).filter((value) => value !== id); const input = form.querySelector('input[value="' + CSS.escape(id) + '"][name="shot' + (role === "image" ? "References" : role[0].toUpperCase() + role.slice(1) + "References") + '"]'); if (input) input.checked = false; }
      renderReferenceInputs();
    }));
  };
  const renderReferenceInputs = () => {
    const capability = modelCapability(selectedModel().model); const limits = effectiveInputLimits(); const assets = projectAssets();
    if (!limits.image && capability.singleSourceImageToVideo) settings.referenceAssetIds = [];
    const images = assets.filter((asset) => asset.kind === "image"); const videos = assets.filter((asset) => asset.kind === "video"); const audio = assets.filter((asset) => asset.kind === "audio");
    const frameControlEnabled = supportsStartEndFrames(capability);
    let frameHost = form.querySelector("#shotReferenceFrames");
    // Frame controls are a video-only UI surface. Remove, rather than hide,
    // them for every other model so CSS cannot reveal a stale control.
    if (!frameControlEnabled) {
      frameHost?.remove(); frameHost = null;
    } else if (!frameHost) {
      const roleGrid = form.querySelector(".shot-reference-role-grid");
      roleGrid?.insertAdjacentHTML("beforebegin", '<div class="shot-reference-frames" id="shotReferenceFrames"><section><strong>START FRAME</strong><p>Optional opening composition. Select deliberately.</p><div class="reference-grid frame-choice-grid" id="shotStartFrameChoices"></div></section><section><strong>END FRAME</strong><p>Optional final composition for this supported model.</p><div class="reference-grid frame-choice-grid" id="shotEndFrameChoices"></div></section></div>');
      frameHost = form.querySelector("#shotReferenceFrames");
    }
    if (frameHost) {
      const approvedFrame = [shot.outputAssetId, scene.approvedVariationId, scene.referenceAssetId, ...(scene.variations || []).map((variation) => variation.assetId)].map(assetById).find((asset) => asset?.kind === "image");
      if (approvedFrame && !frameHost.querySelector("#useApprovedFrameAsStart")) {
        const quickStart = document.createElement("button");
        quickStart.type = "button"; quickStart.id = "useApprovedFrameAsStart"; quickStart.className = "quiet-button";
        quickStart.textContent = "Use approved storyboard frame as Start Frame";
        quickStart.addEventListener("click", () => { settings.startFrameAssetId = approvedFrame.id; renderReferenceInputs(); notify("Approved storyboard frame selected as the Start Frame."); });
        frameHost.prepend(quickStart);
      }
      const fillFrame = (selector, role, current) => { const host = form.querySelector(selector); if (!host) return; const none = `<button type="button" class="frame-choice ${current ? "" : "selected"}" data-frame-role="${role}" data-frame-id=""><span>Ø</span><b>${role === "start" ? "No start frame" : "No end frame"}</b></button>`; const importControl = `<button type="button" class="frame-choice frame-import" data-import-frame-role="${role}"><span>+</span><b>Import ${role} frame</b></button>`; host.innerHTML = none + importControl + images.map((asset) => `<div class="frame-choice-shell"><button type="button" class="frame-choice ${current === asset.id ? "selected" : ""}" data-frame-role="${role}" data-frame-id="${esc(asset.id)}"><img src="${esc(fileUrl(asset))}" alt="" /><b>${esc(asset.name)}</b></button><button type="button" class="frame-choice-delete" data-delete-frame-asset="${esc(asset.id)}" aria-label="Remove ${esc(asset.name)} from project">×</button></div>`).join(""); };
      fillFrame("#shotStartFrameChoices", "start", settings.startFrameAssetId || ""); fillFrame("#shotEndFrameChoices", "end", settings.endFrameAssetId || "");
    }
    const fillChoices = (selector, role, items, limit) => { const host = form.querySelector(selector); const roleHost = host?.closest(".shot-reference-role"); if (!host || !roleHost) return; roleHost.hidden = !limit; const key = referenceRoleKey(role); host.innerHTML = items.map((asset) => referenceChoiceTile(asset, (settings[key] || []).includes(asset.id), "shot" + role[0].toUpperCase() + role.slice(1) + "References", true)).join("") || '<p class="scene-modal-note">No compatible media in Media Library yet.</p>'; };
    fillChoices("#shotVideoReferenceChoices", "video", videos, limits.video); fillChoices("#shotAudioReferenceChoices", "audio", audio, limits.audio);
    const videoLimit = form.querySelector("#shotVideoReferenceLimit"); const audioLimit = form.querySelector("#shotAudioReferenceLimit"); if (videoLimit) videoLimit.textContent = limits.video ? "up to " + limits.video : ""; if (audioLimit) audioLimit.textContent = limits.audio ? "up to " + limits.audio : "";
    form.querySelectorAll('input[name="shotReferences"], input[name="shotVideoReferences"], input[name="shotAudioReferences"]').forEach((input) => input.addEventListener("change", () => { const role = input.name.includes("Video") ? "video" : input.name.includes("Audio") ? "audio" : "image"; const limit = limits[role] || 0; const checked = [...form.querySelectorAll('input[name="' + input.name + '"]:checked')]; if (checked.length > limit) { input.checked = false; notify("This model accepts up to " + limit + " " + role + " reference" + (limit === 1 ? "" : "s") + "."); } settings[referenceRoleKey(role)] = [...form.querySelectorAll('input[name="' + input.name + '"]:checked')].map((item) => item.value); refreshAttachedReferences(); }));
    form.querySelectorAll("[data-frame-role]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.frameRole === "start") settings.startFrameAssetId = button.dataset.frameId || ""; else settings.endFrameAssetId = button.dataset.frameId || ""; renderReferenceInputs(); }));
    form.querySelectorAll("[data-import-frame-role]").forEach((button) => button.addEventListener("click", async () => { try { const additions = await importAssetsIntoProject(); const image = additions.find((asset) => asset?.kind === "image"); if (!image) return notify("Choose an image file for a start or end frame."); if (button.dataset.importFrameRole === "start") settings.startFrameAssetId = image.id; else settings.endFrameAssetId = image.id; setDirty(); renderReferenceInputs(); notify(`${button.dataset.importFrameRole === "start" ? "Start" : "End"} frame imported and selected.`); } catch (error) { notify(error?.message || "The frame image could not be imported."); } }));
    // A small "×" sitting on every image tile in the frame-choice grid reads
    // as "dismiss this from the picker" — but it actually calls removeMedia(),
    // a permanent, project-wide delete (its own aria-label says "from
    // project"). removeMedia() only confirms when the asset is already used
    // elsewhere, so a frame image nobody's referenced yet was deleted with no
    // warning at all on a single misclick. Every other project-wide asset
    // delete in this app confirms unconditionally (see data-delete-reference
    // above) — match that here instead of relying on removeMedia's
    // usage-only confirm.
    form.querySelectorAll("[data-delete-frame-asset]").forEach((button) => button.addEventListener("click", async () => { const id = button.dataset.deleteFrameAsset; const asset = assetById(id); if (!asset || !confirm(`Remove ${asset.name} from this project and every shot that uses it?`)) return; await removeMedia(id); if (assetById(id)) return; if (settings.startFrameAssetId === id) settings.startFrameAssetId = ""; if (settings.endFrameAssetId === id) settings.endFrameAssetId = ""; settings.referenceAssetIds = (settings.referenceAssetIds || []).filter((value) => value !== id); closeModal(); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex); }));
    form.querySelector("#clearShotReferences")?.addEventListener("click", () => { settings.referenceAssetIds = []; settings.videoReferenceAssetIds = []; settings.audioReferenceAssetIds = []; settings.startFrameAssetId = ""; settings.endFrameAssetId = ""; renderReferenceInputs(); });
    refreshAttachedReferences();
  };
  // WaveSpeed gateway slugs encode their operation ({vendor}/{model}/{operation}),
  // so a slug that only does image-to-video must not offer text-to-video.
  // Every catalog entry declares its own supported modes; trust that over a
  // hardcoded guess. kie-veo-3.1 was quietly offering "reference-to-video" as
  // an option before this — a mode its own catalog entry never listed.
  const availableModes = (model, capability) => Array.isArray(model.modes) && model.modes.length ? model.modes : capability.output === "Video" ? ["text-to-video", "image-to-video", "reference-to-video"] : ["text-to-image", "image-edit", "reference-image"];
  const replaceOptions = (element, values, current) => { if (!element) return; element.innerHTML = values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join(""); element.value = values.includes(current) ? current : values[0]; };
  const updateProviderModels = () => {
    const provider = $("#shotProvider")?.value || settings.provider;
    const providerModels = modelCatalog.filter((item) => item.provider === provider && modelCapability(item.model).output !== "Text");
    const currentMode = $("#shotMode")?.value || settings.mode;
    const currentModel = $("#shotModel")?.value || settings.model;
    const compatible = providerModels.find((item) => item.modes?.includes(currentMode));
    replaceOptions($("#shotModel"), providerModels.map((item) => item.model), providerModels.some((item) => item.model === currentModel) ? currentModel : compatible?.model || providerModels[0]?.model);
  };
  const updateCapabilities = () => {
    const model = selectedModel(); const capability = modelCapability(model.model);
    const activePromptNotice = $("#activePromptNotice"); if (activePromptNotice) activePromptNotice.textContent = capability.output === "Video" ? "Active submission: Video Prompt. Image Prompt is retained for a future still or start frame." : "Active submission: Image Prompt. Video Prompt is retained for a future animation pass.";
    replaceOptions($("#shotAspect"), capability.ratios, $("#shotAspect").value || settings.aspectRatio);
    replaceOptions($("#shotResolution"), capability.resolutions || (capability.output === "Video" ? ["480p", "720p", "1080p"] : ["1024x1024", "1536x1024", "1024x1536"]), $("#shotResolution").value || settings.resolution);
    replaceOptions($("#shotMode"), availableModes(model, capability), $("#shotMode").value || settings.mode);
    if (capability.output === "Video" && Array.isArray(capability.duration)) {
      const [minimum, maximum] = capability.duration;
      const durations = [...new Set([minimum, 3, 4, 5, 6, 8, 10, 15, maximum])]
        .filter((value) => value >= minimum && value <= maximum)
        .sort((a, b) => a - b)
        .map(String);
      replaceOptions($("#shotDuration"), durations, $("#shotDuration").value || settings.duration);
    }
    const referenceChoices = form.querySelector(".shot-reference-picker>div");
    const limits = effectiveInputLimits(model, $("#shotMode")?.value || settings.mode);
    const allowedAssets = projectAssets().filter((asset) => asset.kind === "image" && limits.image);
    const lockedReferenceIds = automaticReferenceIds.slice(0, limits.image || 0);
    if (referenceChoices) referenceChoices.innerHTML = allowedAssets.length ? `<div class="reference-grid">${allowedAssets.map((asset) => referenceChoiceTile(asset, lockedReferenceIds.includes(asset.id) || (settings.referenceAssetIds || []).includes(asset.id), "shotReferences", true, lockedReferenceIds.includes(asset.id))).join("")}</div>` : `<p class="scene-modal-note">No ${esc(capability.references.join(" or "))} references are in Media Library yet.</p>`;
    form.querySelectorAll("[data-capability]").forEach((element) => { element.hidden = element.dataset.capability === "remote-references" ? capability.output !== "Video" : !capability.controls.includes(element.dataset.capability); });
    $("#modelCapabilityCopy").textContent = `${capability.output} output. ${capability.ratios.join(" / ")} frames. ${capability.controls.join(", ")}.`;
    if ($("#modelCapabilitySummary")) $("#modelCapabilitySummary").innerHTML = `<strong>${esc(model.label)}</strong><span>${esc(capability.output)} · ${esc(capability.ratios.join(" / "))}</span><span>Inputs: ${esc(capability.references.length ? capability.references.join(" + ") : "prompt only")}</span><span>Controls: ${esc(capability.controls.join(" · "))}</span>`;
    $("#modelReferenceStatus").textContent = `${model.label} accepts ${capability.references.join(" + ")} reference${capability.references.length === 1 ? "" : "s"}. ${model.status === "live" ? "Generation is enabled when its connection is saved." : "This provider does not offer that model or operation yet — its per-shot production brief is saved now for when it does."}`;
    if (model.model === "kie-seedance-2-video") $("#modelReferenceStatus").textContent = "Kie Seedance supports separately selected image guidance plus optional start and end frames. For video and audio reference assets, choose fal → Seedance 2.0 Reference-to-Video.";
    const frameInputs = supportsStartEndFrames(capability) ? ["start frame", capability.endFrame ? "optional end frame" : "", ...capability.references].filter(Boolean) : capability.references;
    const inputSummaryNode = $("#modelCapabilitySummary")?.querySelectorAll("span")[1];
    if (inputSummaryNode) inputSummaryNode.textContent = `Inputs: ${frameInputs.length ? [...new Set(frameInputs)].join(" + ") : "prompt only"}`;
    if (supportsStartEndFrames(capability) && model.model !== "kie-seedance-2-video") $("#modelReferenceStatus").textContent = `${model.label} uses a deliberately selected Start Frame${capability.endFrame ? " and supports an optional End Frame" : ""}. General references remain independent guidance and never replace the selected frame.`;
    if (automaticReferenceIds.length) {
      const carriedCount = Math.min(automaticReferenceIds.length, limits.image || 0);
      const omittedCount = Math.max(0, automaticReferenceIds.length - carriedCount);
      $("#modelReferenceStatus").textContent += limits.image
        ? ` ${carriedCount} required continuity reference${carriedCount === 1 ? " is" : "s are"} carried into this render${omittedCount ? `; ${omittedCount} more cannot fit this model's reference limit` : ""}.`
        : " This model cannot accept image references; Style DNA is still locked in its prompt.";
    }
    renderReferenceInputs();
    const bridgeReady = Boolean(capability.output === "Video" ? window.storyMakerDesktop?.submitShotVideo : window.storyMakerDesktop?.generateShotImage);
    const canRender = modelReady(model) && bridgeReady;
    const button = $("#generateShotFrame");
    // Only a missing desktop bridge disables the button. When the blocker is an
    // unsaved key or an in-build adapter the button stays clickable so the click
    // handler can record the reason in generation-diagnostics.jsonl. A disabled
    // button left no trace at all, which is why video failures looked like the
    // app doing nothing.
    if (button) { button.disabled = !bridgeReady; button.textContent = canRender ? `Generate ${capability.output.toLowerCase()}` : model.status === "live" ? `Connect ${providerLabel(model.provider)}` : `${capability.output} adapter unavailable`; }
  };
  const setExperience = (view) => { const director = form.querySelector(".shot-director-controls"); const isDirector = view === "director"; director.hidden = !isDirector; form.classList.toggle("shot-director-expanded", isDirector); toolbar.querySelectorAll("[data-generation-view]").forEach((button) => button.classList.toggle("active", button.dataset.generationView === view)); localStorage.setItem("storymaker-generation-view", view); };
  toolbar.querySelectorAll("[data-generation-view]").forEach((button) => button.addEventListener("click", () => setExperience(button.dataset.generationView)));
  $("#shotProvider")?.addEventListener("change", () => { updateProviderModels(); updateCapabilities(); });
  $("#shotModel")?.addEventListener("change", updateCapabilities);
  // Delegated once on the form rather than rebound inside updateCapabilities
  // — that function replaces these tiles' innerHTML on every provider/model
  // change, which would otherwise orphan a directly-attached listener.
  form.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-remove-reference-asset]");
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    if (!(await removeReferenceAssetWithConfirm(button.dataset.removeReferenceAsset))) return;
    updateCapabilities();
  });
  const actions = form.lastElementChild;
  if (!actions) return;
  const collectSettings = () => {
    const model = selectedModel();
    // blueprint.performance (captured when this panel opened) vs. the
    // textarea's live value: if they differ, the user actually edited
    // acting direction themselves, so this shot's performance is now
    // manually authored regardless of how it started out. If they match,
    // preserve whatever source it already had (detected/ai/unset) rather
    // than silently overwriting that trail just because the form saved.
    const editedPerformance = $("#shotPerformanceInstruction").value.trim();
    const performanceSource = editedPerformance !== (blueprint.performance || "").trim() ? (editedPerformance ? "manual" : "") : blueprint.performanceSource;
    const nextBlueprint = { ...blueprint, narrative: $("#shotPrompt").value.trim() || shot.purpose, camera: $("#shotCameraInstruction").value.trim(), audio: $("#shotAudioInstruction").value.trim(), performance: editedPerformance, performanceSource, lighting: $("#shotLightingInstruction").value.trim(), blocking: $("#shotBlockingInstruction").value.trim(), continuity: $("#shotContinuityInstruction").value.trim(), motion: $("#shotMotion").value };
    const limits = effectiveInputLimits(model, $("#shotMode").value);
    settings.deliveryResolution = $("#shotDeliveryResolution")?.value || "native";
    const imagePrompt = $("#shotImagePrompt")?.value.trim() || productionPromptFor(scene, { ...shot, blueprint: nextBlueprint }, "image");
    const videoPrompt = $("#shotVideoPrompt")?.value.trim() || productionPromptFor(scene, { ...shot, blueprint: nextBlueprint }, "video");
    settings.referenceSelectionVersion = 2;
    const manualReferenceIds = [...form.querySelectorAll('input[name="shotReferences"]:checked')].filter((input) => !input.disabled).map((input) => input.value);
    const continuityAndManualIds = [...new Set([...automaticReferenceIds, ...manualReferenceIds])].slice(0, limits.image || 0);
    return normalizeReferenceRoles({ ...settings, provider: model.provider, model: model.model, mode: $("#shotMode").value, aspectRatio: $("#shotAspect").value, resolution: $("#shotResolution").value, motion: $("#shotMotion").value, prompt: modelCapability(model.model).output === "Video" ? videoPrompt : imagePrompt, imagePrompt, videoPrompt, promptPackageVersion: 2, negativePrompt: $("#shotNegative").value.trim(), referenceAssetIds: continuityAndManualIds, videoReferenceAssetIds: [...form.querySelectorAll('input[name="shotVideoReferences"]:checked')].map((input) => input.value).slice(0, limits.video || 0), audioReferenceAssetIds: [...form.querySelectorAll('input[name="shotAudioReferences"]:checked')].map((input) => input.value).slice(0, limits.audio || 0), startFrameAssetId: supportsStartEndFrames(modelCapability(model.model)) ? settings.startFrameAssetId || "" : "", endFrameAssetId: supportsStartEndFrames(modelCapability(model.model)) ? settings.endFrameAssetId || "" : "", referenceUrls: $("#shotReferenceUrls").value.split(/\r?\n/).map((value) => value.trim()).filter((value) => /^https:\/\//i.test(value)), quality: $("#shotQuality").value, referenceStrength: $("#shotReferenceStrength").value, seed: $("#shotSeed").value.trim(), duration: $("#shotDuration").value, cameraInstruction: nextBlueprint.camera, audioInstruction: nextBlueprint.audio, multiShotPrompts: $("#shotMultiPrompts").value.trim(), referenceRole: "guidance", promptEnhancement: $("#shotPromptEnhancement").checked, blueprint: nextBlueprint, outputHistory: Array.isArray(shot.modelSettings?.outputHistory) ? shot.modelSettings.outputHistory : [] });
  };
  const payloadFor = (nextSettings) => {
    const startFrameId = nextSettings.startFrameAssetId || ""; const endFrameId = nextSettings.endFrameAssetId || "";
    const capability = modelCapability(nextSettings.model); const singleSourceI2V = nextSettings.mode === "image-to-video" && (capability.singleSourceImageToVideo === true || nextSettings.provider === "wavespeed");
    const imageIds = new Set(singleSourceI2V ? [] : (nextSettings.referenceAssetIds || [])); const videoIds = new Set(singleSourceI2V ? [] : (nextSettings.videoReferenceAssetIds || [])); const audioIds = new Set(singleSourceI2V ? [] : (nextSettings.audioReferenceAssetIds || []));
    const ids = [...new Set([...imageIds, ...videoIds, ...audioIds, startFrameId, endFrameId].filter(Boolean))];
    const roleFor = (id, asset) => id === startFrameId ? "start-frame" : id === endFrameId ? "end-frame" : imageIds.has(id) ? "image" : videoIds.has(id) ? "video" : audioIds.has(id) ? "audio" : asset?.kind || "image";
    return { project: { id: project.id, name: project.name, logline: project.logline, premise: project.premise, world: project.world, themes: project.themes, style: project.style, visualDirection: project.visualDirection, characters: project.characters, sets: project.sets, props: project.props }, scene: { id: scene.id, title: scene.title, note: scene.note, castIds: scene.castIds || [] }, shot: { id: shot.id, title: shot.title, purpose: shot.purpose, framing: shot.framing, lens: shot.lens, movement: shot.movement, blueprint: nextSettings.blueprint || shot.blueprint || defaultShotBlueprint() }, settings: { ...nextSettings, styleContext: nextSettings.styleContext || "storyboard" }, references: ids.map(assetById).filter((asset) => asset?.path).map((asset) => ({ id: asset.id, path: asset.path, name: asset.name, kind: asset.kind, role: roleFor(asset.id, asset) })) };
  };
  const showPreflight = (result) => { const target = $("#shotPreflight"); if (!target || !result) return; target.className = `shot-preflight ${result.ready ? "ready" : "blocked"}`; target.innerHTML = `<strong>${result.ready ? "Ready to generate" : "Needs attention"}</strong><span>${(result.checks || []).map((check) => `${check.level === "pass" ? "✓" : check.level === "warning" ? "!" : "×"} ${esc(check.message)}`).join("<br>")}</span>`; };
  actions.insertAdjacentHTML("afterbegin", `<button id="generateShotFrame" type="button" class="save-button" disabled>Preparing model...</button><button id="preflightShot" type="button" class="quiet-button">Check readiness</button><div id="shotPreflight" class="shot-preflight">Run a local readiness check before a provider request.</div>`);
  $("#preflightShot")?.addEventListener("click", async () => {
    if (!window.storyMakerDesktop?.preflightShot) return notify("Readiness checks are available in the packaged Windows app.");
    const nextSettings = collectSettings(); const result = await window.storyMakerDesktop.preflightShot(payloadFor(nextSettings));
    nextSettings.lastPreflight = result; shot.blueprint = nextSettings.blueprint; shot.modelSettings = nextSettings; setDirty(); showPreflight(result); notify(result.ready ? "Shot is ready for a provider request." : result.errors?.[0] || "This shot needs attention before rendering.");
  });
  $("#generateShotFrame")?.addEventListener("click", async () => {
    const model = selectedModel();
    const blocked = (stage, reason, target) => {
      window.storyMakerDesktop?.logGenerationBlocked?.({ stage, reason, provider: target?.provider || $("#shotProvider")?.value || "", model: target?.model || $("#shotModel")?.value || "", kind: target && modelCapability(target.model).output === "Video" ? "video" : "image", surface: "shot-director" });
      return notify(reason);
    };
    if (!model || model.status !== "live") return blocked("adapter-in-build", "This model's native adapter is still in build.", model);
    if (!modelReady(model)) return blocked("provider-not-connected", `${model.label} is not ready. Check its runtime or connection in Model Hub.`, model);
    persistShotStyle();
    const nextSettings = collectSettings();
    const preflight = await window.storyMakerDesktop?.preflightShot?.(payloadFor(nextSettings));
    if (preflight) { nextSettings.lastPreflight = preflight; showPreflight(preflight); if (!preflight.ready) { shot.blueprint = nextSettings.blueprint; shot.modelSettings = nextSettings; setDirty(); return blocked("preflight-failed", preflight.errors?.[0] || "This shot is not ready for a provider request.", model); } }
    if (modelCapability(model.model).output === "Video") {
      const job = { id: `job-${Date.now()}`, status: "submitting", provider: model.provider, model: model.model, requestedAt: new Date().toISOString(), prompt: nextSettings.prompt || shot.purpose, deliveryResolution: nextSettings.deliveryResolution || "native", sourceFrameAssetId: nextSettings.startFrameAssetId || "", visualDirection: visualDirectionMetadata(scene, shot) };
      nextSettings.outputHistory.unshift(job); shot.blueprint = nextSettings.blueprint; shot.modelSettings = nextSettings; setDirty();
      const button = $("#generateShotFrame"); if (button) { button.disabled = true; button.textContent = "Queueing video..."; }
      job.renderDockId = openGenerationOverlay("video", { id: job.id, stage: "Queued render will continue while you work elsewhere." });
      try {
        const result = await window.storyMakerDesktop.submitShotVideo(payloadFor(nextSettings));
        Object.assign(job, { status: result.status || "queued", providerTaskId: result.taskId, backendJobId: result.job?.id, credits: result.credits, submittedAt: new Date().toISOString(), pollAfterSeconds: result.pollAfterSeconds || 10 });
        setDirty(); closeModal(); render(); updateGenerationOverlay({ progress: 12, stage: "Video queued. Storymaker is now watching the render." }); monitorQueuedVideoJob(scene, shot, job, model.label); notify(`${model.label} video queued. Live render status is now visible.`); return;
      } catch (error) {
        Object.assign(job, { status: "failed", failedAt: new Date().toISOString(), error: error?.message || "This video could not be queued.", correlationId: error?.correlationId || "" });
        setDirty(); if (button) { button.disabled = false; button.textContent = "Retry video"; } notify(job.error); return;
      } finally { if (job.status === "failed") closeGenerationOverlay(); }
    }
    const job = { id: `job-${Date.now()}`, status: "running", provider: model.provider, model: model.model, requestedAt: new Date().toISOString(), prompt: nextSettings.prompt || shot.purpose, visualDirection: visualDirectionMetadata(scene, shot) };
    nextSettings.outputHistory.unshift(job);
    shot.blueprint = nextSettings.blueprint;
    shot.modelSettings = nextSettings;
    setDirty();
    const button = $("#generateShotFrame");
    if (button) { button.disabled = true; button.textContent = "Rendering frame…"; }
    openGenerationOverlay("frame");
    try {
      const result = await window.storyMakerDesktop.generateShotImage(payloadFor(nextSettings));
      if (!result?.asset) throw new Error("No frame was returned for this shot.");
      let finalAsset = result.asset; const upscaleFactor = nextSettings.deliveryResolution === "4k" ? 4 : ["1k", "2k"].includes(nextSettings.deliveryResolution) ? 2 : 1;
      if (upscaleFactor > 1) { if (!providerReady("fal")) throw new Error("Connect fal to automatically create the requested " + nextSettings.deliveryResolution.toUpperCase() + " delivery file."); updateGenerationOverlay({ progress: 92, stage: "Creating the requested " + nextSettings.deliveryResolution.toUpperCase() + " delivery file" }); const upscaled = await window.storyMakerDesktop.upscaleMedia({ path: result.asset.path, kind: "image", factor: upscaleFactor }); if (!upscaled?.asset) throw new Error("The upscaler did not return the requested delivery image."); finalAsset = upscaled.asset; }
      const generated = { ...finalAsset, id: `shot-output-${Date.now()}`, importedAt: new Date().toISOString(), source: upscaleFactor > 1 ? "fal" : model.provider, generation: { ...(upscaleFactor > 1 ? { ...(result.generation || {}), upscale: { provider: "fal", factor: upscaleFactor, target: nextSettings.deliveryResolution } } : result.generation), visualDirection: job.visualDirection } };
      project.assets = projectAssets();
      project.assets.unshift(generated);
      Object.assign(job, { status: "completed", completedAt: new Date().toISOString(), assetId: generated.id, backendJobId: result.job?.id, generation: result.generation });
      shot.outputAssetId = generated.id;
      setDirty();
      selectedSceneIndex = sceneIndex;
      closeModal();
      render();
      notify("Shot frame ready to review.");
    } catch (error) {
      Object.assign(job, { status: "failed", failedAt: new Date().toISOString(), error: error?.message || "This shot could not be rendered.", correlationId: error?.correlationId || "" });
      setDirty();
      if (button) { button.disabled = false; button.textContent = "Retry frame"; }
      notify(job.error);
    } finally { closeGenerationOverlay(); await recoverCompletedGenerationAssets({ silent: true }); }
  });
  document.querySelectorAll("[data-review-shot-output]").forEach((button) => button.addEventListener("click", () => { selectedSceneIndex = sceneIndex; openVariation(button.dataset.reviewShotOutput); }));
  document.querySelectorAll("[data-retry-shot-generation]").forEach((button) => button.addEventListener("click", () => form.querySelector("#generateShotFrame")?.click()));
  form.onsubmit = (event) => {
    event.preventDefault();
    persistShotStyle();
    const nextSettings = collectSettings();
    shot.blueprint = nextSettings.blueprint;
    shot.modelSettings = nextSettings;
    setDirty(); closeModal(); render(); notify("Shot direction saved.");
  };
  const pendingVideoJob = history.find((job) => ["fal", "kie", "wavespeed"].includes(job.provider) && job.providerTaskId && ["submitting", "queued", "generating", "processing", "submitted"].includes(job.status));
  if (pendingVideoJob) {
    const refreshVideo = document.createElement("button");
    // Was a 2-branch ternary that mislabeled every fal AND kie job as
    // "Seedance" — fixed to use the real per-provider label.
    const pendingProviderLabel = providerLabel(pendingVideoJob.provider);
    refreshVideo.type = "button"; refreshVideo.className = "quiet-button"; refreshVideo.textContent = `Refresh queued ${pendingProviderLabel} video`;
    form.querySelector(".shot-director-controls")?.append(refreshVideo);
    refreshVideo.addEventListener("click", async () => {
      refreshVideo.disabled = true; refreshVideo.textContent = `Checking ${pendingProviderLabel}...`;
      try {
        const result = await window.storyMakerDesktop.pollShotVideo({ provider: pendingVideoJob.provider, taskId: pendingVideoJob.providerTaskId, model: pendingVideoJob.model, title: shot.title });
        Object.assign(pendingVideoJob, { status: result.status, checkedAt: new Date().toISOString(), ...(result.error ? { error: result.error } : {}) });
        if (result.asset) { const generated = { ...result.asset, id: `shot-video-${Date.now()}`, importedAt: new Date().toISOString(), source: pendingVideoJob.provider, generation: { ...(result.generation || {}), sourceFrameAssetId: pendingVideoJob.sourceFrameAssetId || "", visualDirection: pendingVideoJob.visualDirection || visualDirectionMetadata(scene, shot) } }; project.assets = projectAssets(); project.assets.unshift(generated); pendingVideoJob.assetId = generated.id; shot.outputAssetId = generated.id; syncAutomaticMotionMaster(scene, shot, generated.id); }
        setDirty(); closeModal(); render(); notify(result.status === "completed" ? `${pendingProviderLabel} video saved to this project.` : `${pendingProviderLabel} is ${result.status}.`);
      } catch (error) { refreshVideo.disabled = false; refreshVideo.textContent = "Retry status check"; notify(error?.message || `${pendingProviderLabel} status could not be refreshed.`); }
    });
  }
  updateProviderModels();
  updateCapabilities();
  if (settings.lastPreflight) showPreflight(settings.lastPreflight);
  setExperience(localStorage.getItem("storymaker-generation-view") || "quick");
}

function bindDownloadButton(selector, asset) {
  $(selector)?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (!window.storyMakerDesktop?.saveMediaCopy) return notify("Saving a copy is available in the packaged Windows app.");
    if (!asset?.path) return notify("This take has no file on disk to copy.");
    button.disabled = true; button.textContent = "Choosing location…";
    try {
      const result = await window.storyMakerDesktop.saveMediaCopy({ path: asset.path });
      button.disabled = false; button.textContent = "Download a copy";
      if (result?.ok) notify(`Saved to ${result.filePath}`);
      else if (!result?.canceled) notify("That copy could not be saved.");
    } catch (error) { button.disabled = false; button.textContent = "Download a copy"; notify(error?.message || "That copy could not be saved."); }
  });
}
function openVariation(assetId) {
  const asset = assetById(assetId);
  if (!asset) return;
  const isVideo = asset.kind === "video";
  const visibleTitle = assetDisplayTitle(asset);
  if (asset.displayName || /[-_]\d{10,}[-_][a-z0-9]{4,}\./i.test(String(asset.name || ""))) asset.name = visibleTitle;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal variation-modal"><button type="button" id="closeModal">×</button><p>${isVideo ? "SHOT DELIVERY / GENERATED VIDEO" : "SCENE VISUALIZATION / GENERATED TAKE"}</p><h2>${esc(asset.name)}</h2>${isVideo ? `<video class="variation-video" controls autoplay src="${esc(fileUrl(asset))}"></video>` : `<div class="variation-preview" style="background-image:url('${esc(fileUrl(asset))}')"></div>`}<p class="scene-modal-note">This take is stored with the project on the next save. ${isVideo ? "Approve it in Delivery when it is ready for the cut." : "Approve it to make it the storyboard reference."}</p><div><button type="button" id="cancelModal" class="quiet-button">Close</button><button type="button" id="downloadVariation" class="quiet-button">Download a copy</button>${isVideo ? "" : `<button id="approveVariationModal" class="save-button">Approve for storyboard</button>`}</div></section></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#approveVariationModal")?.addEventListener("click", () => approveVariation(assetId));
  if (isVideo) {
    const owningSceneIndex = project.scenes.findIndex((scene) => (scene.shots || []).some((shot) => shot.outputAssetId === assetId));
    if (owningSceneIndex >= 0) {
      const actions = $("#downloadVariation")?.parentElement;
      actions?.insertAdjacentHTML("beforeend", `<button type="button" id="useVideoInStoryboard" class="save-button">Use as scene motion master</button>`);
      $("#useVideoInStoryboard")?.addEventListener("click", () => {
        const scene = project.scenes[owningSceneIndex];
        const owningShot = (scene.shots || []).find((shot) => shot.outputAssetId === assetId);
        scene.motionAssetId = assetId;
        scene.motionMasterShotId = owningShot?.id || "";
        if (owningShot) owningShot.outputReview = "approved";
        setDirty(); closeModal(); active = "Storyboard"; render();
        notify("This video is now the scene motion master and will be used in storyboard and delivery.");
      });
    }
  }
  bindDownloadButton("#downloadVariation", asset);
  if (["image", "video"].includes(asset.kind)) {
    const actions = $("#downloadVariation")?.parentElement;
    actions?.insertAdjacentHTML("beforeend", `<button type="button" id="upscaleVariation2x" class="quiet-button">Upscale 2×</button><button type="button" id="upscaleVariation4x" class="save-button">Upscale 4×</button>`);
    $("#upscaleVariation2x")?.addEventListener("click", () => upscaleProjectAsset(asset, 2));
    $("#upscaleVariation4x")?.addEventListener("click", () => upscaleProjectAsset(asset, 4));
  }
}
// A second, independent modal layer stacked above #modalRoot. Character Lab,
// Set Lab, and Shot Director all render their reference gallery into
// #modalRoot's own single form — calling openVariation() from inside one of
// those would overwrite that form (losing an unsaved design brief, negative
// constraints, or model choice) the moment the user just wanted to glance at
// a thumbnail full size. This opens on top instead and closes back to
// whatever was already open, exactly like a browser lightbox.
function openAssetLightbox(assetId) {
  const asset = assetById(assetId);
  const root = $("#lightboxRoot");
  if (!asset || !root) return;
  const isVideo = asset.kind === "video";
  root.innerHTML = `<div class="modal-backdrop lightbox-backdrop" id="lightboxBackdrop"><section class="project-modal variation-modal lightbox-modal"><button type="button" id="lightboxClose">×</button><p>REFERENCE PREVIEW</p><h2>${esc(assetDisplayTitle(asset))}</h2>${isVideo ? `<video class="variation-video" controls autoplay src="${esc(fileUrl(asset))}"></video>` : `<div class="variation-preview" style="background-image:url('${esc(fileUrl(asset))}')"></div>`}<div><button type="button" id="lightboxCloseAction" class="quiet-button">Close</button><button type="button" id="lightboxDownload" class="quiet-button">Download a copy</button><button type="button" id="lightboxUpscale2x" class="quiet-button">Upscale 2×</button><button type="button" id="lightboxUpscale4x" class="save-button">Upscale 4×</button></div></section></div>`;
  $("#lightboxClose").onclick = closeLightbox;
  $("#lightboxCloseAction").onclick = closeLightbox;
  bindDownloadButton("#lightboxDownload", asset);
  $("#lightboxUpscale2x")?.addEventListener("click", () => upscaleProjectAsset(asset, 2));
  $("#lightboxUpscale4x")?.addEventListener("click", () => upscaleProjectAsset(asset, 4));
}
function closeLightbox() { const root = $("#lightboxRoot"); if (root) root.innerHTML = ""; }
let lightboxDelegationBound = false;
// Delegated once on document rather than re-bound per render/modal: the zoom
// button on a reference tile can appear inside #modalRoot (Character Lab,
// Set Lab, Shot Director — none of which re-run bind()) or in normal
// bind()-covered content, and this single listener catches both without
// needing to remember a manual querySelectorAll at every call site, the way
// data-remove-reference-asset currently has to be wired three separate times.
function ensureLightboxDelegation() {
  if (lightboxDelegationBound) return;
  lightboxDelegationBound = true;
  document.addEventListener("click", (event) => {
    const zoomButton = event.target.closest("[data-lightbox-asset]");
    if (zoomButton) { event.preventDefault(); event.stopPropagation(); openAssetLightbox(zoomButton.dataset.lightboxAsset); return; }
    if (event.target.id === "lightboxBackdrop") closeLightbox();
  });
  // Escape closes whatever's on top: the lightbox if one's open over a modal
  // (matches the visual stacking), otherwise the modal itself. Every modal in
  // the app — all six Character/Set/Prop profile and Lab screens included —
  // only had a mouse path to dismiss (the × or Cancel/Close button); Escape
  // is the keyboard affordance every user expects a dialog to have.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if ($("#lightboxRoot")?.innerHTML) return closeLightbox();
    if ($("#modalRoot")?.innerHTML) closeModal();
  });
}
async function upscaleProjectAsset(asset, factor) {
  if (!window.storyMakerDesktop?.upscaleMedia) return notify("Upscaling is available in the packaged Windows app.");
  if (!providerReady("fal")) return notify("Connect fal in Model Hub before using the Topaz upscaler.");
  openGenerationOverlay(asset.kind + " upscale", { progress: 5, stage: "Sending source to the Topaz upscaler" });
  try {
    const result = await window.storyMakerDesktop.upscaleMedia({ path: asset.path, kind: asset.kind, factor });
    if (!result?.asset) throw new Error("The upscaler did not return a saved asset.");
    const generated = { ...result.asset, id: `upscaled-${Date.now()}`, importedAt: new Date().toISOString(), source: "fal", generation: result.generation, parentAssetId: asset.id };
    project.assets = projectAssets(); project.assets.unshift(generated); setDirty(); closeModal(); render(); notify(`${factor}× upscaled ${asset.kind} is ready in the project.`);
  } catch (error) { notify(error?.message || "This asset could not be upscaled."); }
  finally { closeGenerationOverlay(); }
}
function approveVariation(assetId) {
  ensureSceneShape();
  const scene = project.scenes[selectedSceneIndex];
  if (!scene || !assetById(assetId)) return;
  scene.approvedVariationId = assetId;
  scene.referenceAssetId = assetId;
  setDirty(); closeModal(); render(); notify("Approved take is now the storyboard reference.");
}
async function generateSceneImageLegacy() {
  ensureSceneShape();
  const scene = project.scenes[selectedSceneIndex];
  const button = $("#generateSceneImage");
  if (!scene || !window.storyMakerDesktop?.generateSceneImage) return notify("Scene generation is available in the packaged Windows app.");
  const direction = $("#scenePrompt")?.value.trim();
  if (!direction) return notify("Give this shot a visual brief before generating.");
  const size = $("#sceneSize")?.value || "1536x1024";
  if (button) { button.disabled = true; button.textContent = "Directing frame…"; }
  try {
    const reference = assetById(scene.referenceAssetId);
    const result = await window.storyMakerDesktop.generateSceneImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, themes: project.themes, style: project.style, visualDirection: project.visualDirection, characters: project.characters }, scene: { id: scene.id, title: scene.title, note: scene.note }, direction, size, reference: reference ? { path: reference.path, name: reference.name, kind: reference.kind } : null });
    if (!result?.asset) throw new Error("No image was returned for this scene.");
    const asset = { ...result.asset, id: `generated-${Date.now()}`, importedAt: new Date().toISOString(), source: "openai", generation: result.generation };
    project.assets = projectAssets(); project.assets.unshift(asset);
    scene.generationPrompt = direction; scene.generationSize = size; scene.variations.unshift({ assetId: asset.id, generation: result.generation, createdAt: new Date().toISOString() });
    setDirty(); render(); notify("A new cinematic take is ready to review.");
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = "Generate scene frame"; }
    notify(error?.message || "This scene could not be visualized.");
  }
}
async function generateSceneImage() {
  ensureProductionShape(); const scene = project.scenes[selectedSceneIndex]; const button = $("#generateSceneImage"); const model = modelCatalog.find((item) => item.model === $("#sceneModel")?.value) || modelCatalog.find((item) => item.model === "gpt-image-1");
  if (!scene || !model || !window.storyMakerDesktop?.generateShotImage) return notify("Scene generation is available in the packaged Windows app.");
  if (!providerReady(model.provider)) return notify(`Connect ${providerLabel(model.provider)} in Model Hub before rendering.`);
  const size = $("#sceneSize")?.value || "1536x1024"; const aspectRatio = size === "1024x1024" ? "1:1" : size === "1024x1536" ? "9:16" : size === "21:9" ? "21:9" : "16:9";
  // 21:9 is an aspect ratio, not a pixel size — gpt-image-1's only valid
  // "resolution"-shaped values are the three fixed WxH strings above. Passing
  // "21:9" through as resolution would fail model-capability validation for
  // every other image model too (none of them list "21:9" among their
  // resolutions, only among their ratios), so it's omitted here and carried
  // only via aspectRatio.
  const resolution = size === "21:9" ? "" : size;
  const checked = [...document.querySelectorAll('input[name="sceneReferences"]:checked')].map((input) => assetById(input.value)).filter((asset) => asset?.path && asset.kind === "image");
  const refs = checked;
  scene.generationReferenceAssetIds = refs.map((asset) => asset.id);
  // See generateCharacterTurnaround for why this resolution exists. Scene-
  // aware (unlike the three Labs) since this scene may carry its own style
  // override; "storyboard" context pulls the DNA's dedicated establishing-
  // frame guidance where one exists.
  const resolvedStyle = resolvedStyleFor(scene); const styleBlocks = stylePromptBlocks(resolvedStyle.style, "image", "storyboard", resolvedStyle.strength);
  const stylePrefix = resolvedStyle.style ? `STYLE DNA — ${resolvedStyle.style.name}. ${styleBlocks.positive.join(". ")}. ` : "";
  const scenePrompt = $("#scenePrompt")?.value.trim() || scene.note;
  if (button) { button.disabled = true; button.textContent = "Directing frame…"; }
  openGenerationOverlay("scene frame");
  try {
    const result = await window.storyMakerDesktop.generateShotImage({ project: { name: project.name, logline: project.logline, premise: project.premise, world: project.world, themes: project.themes, style: project.style, visualDirection: project.visualDirection, characters: project.characters, sets: project.sets, props: project.props }, scene: { id: scene.id, title: scene.title, note: scene.note }, shot: { id: `scene-preview-${scene.id}`, title: `${scene.title} · Scene frame`, purpose: scenePrompt, framing: "Cinematic master frame", lens: "35mm", movement: "Static" }, settings: { provider: model.provider, model: model.model, mode: refs.length ? "image-edit" : "text-to-image", styleContext: "storyboard", aspectRatio, resolution, prompt: `${stylePrefix}${scenePrompt}`, negativePrompt: [styleBlocks.negative.join(", "), "No text, logos, watermarks, split panels, or UI."].filter(Boolean).join(", "), referenceAssetIds: refs.map((asset) => asset.id), quality: "Balanced", referenceStrength: "Preserve" }, references: refs.map((asset) => ({ path: asset.path, name: asset.name, kind: asset.kind })) });
    if (!result?.asset) throw new Error("No image was returned for this scene."); const asset = { ...result.asset, id: `generated-${Date.now()}`, importedAt: new Date().toISOString(), source: result.generation?.provider || model.provider, generation: result.generation };
    project.assets = projectAssets(); project.assets.unshift(asset); scene.generationPrompt = scenePrompt; scene.generationSize = size; scene.generationModel = model.model; scene.variations = Array.isArray(scene.variations) ? scene.variations : []; scene.variations.unshift({ assetId: asset.id, generation: result.generation, createdAt: new Date().toISOString() }); setDirty(); render(); notify(`${model.label} created a new scene take.`);
  } catch (error) { if (button) { button.disabled = false; button.textContent = "Generate scene frame"; } notify(error?.message || "This scene could not be visualized."); } finally { closeGenerationOverlay(); }
}
async function importMedia() {
  try {
    const result = await window.storyMakerDesktop?.importMedia();
    if (!result || result.canceled || !result.assets?.length) return;
    project.assets = projectAssets();
    const existing = new Set(project.assets.map((media) => String(media.path || "").toLowerCase()));
    const additions = result.assets.filter((media) => !existing.has(String(media.path || "").toLowerCase())).map((media, index) => ({ ...media, id: `media-${Date.now()}-${index + 1}`, importedAt: new Date().toISOString() }));
    if (!additions.length) return notify("Those files are already in this project.");
    project.assets.push(...additions);
    setDirty(); render(); notify(`${additions.length} production asset${additions.length === 1 ? "" : "s"} imported.`);
  } catch (error) { notify(error?.message || "Those media files could not be imported."); }
}
async function removeMedia(assetId) {
  const media = assetById(assetId);
  if (!media) return;
  const usages = assetUsages(assetId);
  if (usages.length && !confirm(`${media.name} is still used by ${usages.map((usage) => usage.label).join(", ")}. Remove it anyway?`)) return;
  project.assets = projectAssets().filter((item) => item.id !== assetId);
  project.audioTracks = (project.audioTracks || []).filter((cue) => cue.assetId !== assetId);
  ensureCharacterShape(); project.characters.forEach((character) => { if (character.referenceAssetId === assetId) character.referenceAssetId = ""; character.references = (character.references || []).filter((reference) => reference.assetId !== assetId); character.turnaroundAssetIds = (character.turnaroundAssetIds || []).filter((id) => id !== assetId); });
  (project.sets || []).forEach((set) => { if (set.referenceAssetId === assetId) set.referenceAssetId = ""; set.references = (set.references || []).filter((reference) => reference.assetId !== assetId); });
  (project.props || []).forEach((prop) => { if (prop.referenceAssetId === assetId) prop.referenceAssetId = ""; prop.references = (prop.references || []).filter((reference) => reference.assetId !== assetId); });
  project.scenes.forEach((scene) => {
    if (scene.referenceAssetId === assetId) scene.referenceAssetId = "";
    if (scene.approvedVariationId === assetId) scene.approvedVariationId = "";
    if (scene.motionAssetId === assetId) { scene.motionAssetId = ""; scene.motionMasterShotId = ""; }
    scene.generationReferenceAssetIds = (scene.generationReferenceAssetIds || []).filter((id) => id !== assetId);
    scene.variations = Array.isArray(scene.variations) ? scene.variations.filter((variation) => variation.assetId !== assetId) : [];
    (scene.shots || []).forEach((shot) => {
     if (shot.outputAssetId === assetId) shot.outputAssetId = "";
      if (shot.outputAssetId === assetId) shot.outputAssetId = "";
      if (shot.modelSettings) {
        shot.modelSettings.referenceAssetIds = (shot.modelSettings.referenceAssetIds || []).filter((id) => id !== assetId);
        shot.modelSettings.videoReferenceAssetIds = (shot.modelSettings.videoReferenceAssetIds || []).filter((id) => id !== assetId);
        shot.modelSettings.audioReferenceAssetIds = (shot.modelSettings.audioReferenceAssetIds || []).filter((id) => id !== assetId);
        if (shot.modelSettings.startFrameAssetId === assetId) shot.modelSettings.startFrameAssetId = "";
        if (shot.modelSettings.endFrameAssetId === assetId) shot.modelSettings.endFrameAssetId = "";
      }
      if (Array.isArray(shot.modelSettings?.outputHistory)) shot.modelSettings.outputHistory.forEach((job) => { if (job.assetId === assetId) job.assetId = ""; });
    });
  });
  // Only ever physically deletes files this app generated (main process
  // refuses anything outside its own generated-media folder), so an imported
  // personal photo or video is detached from the project but never touched
  // on disk.
  if (media.path) { try { await window.storyMakerDesktop?.deleteMediaFile?.({ path: media.path }); } catch { /* project record is already updated; a stray file on disk is harmless */ } }
  setDirty(); render(); notify(`${media.name} was removed from the project record.`);
}
// Every "×" that deletes a reference image from the project — not just from
// the picker it happens to be showing in — has to be wired separately in
// three DOM contexts (the shared reference-library grid, the Shot Director's
// reference tiles, and the Storyboard scene's reference tray), because each
// re-renders its own markup. removeMedia()'s own confirm only fires once the
// asset is already used elsewhere, which silently skips the common case of
// an asset nothing references yet — so every one of those three call sites
// needs its own unconditional confirm first. Centralized here so all three
// ask the same question the same way instead of drifting independently.
async function removeReferenceAssetWithConfirm(assetId) {
  const asset = assetById(assetId);
  if (!asset || !confirm(`Remove ${asset.name} from this project and every shot that uses it?`)) return false;
  await removeMedia(assetId);
  return !assetById(assetId);
}
async function cleanUnusedMedia() {
  const unused = projectAssets().filter((media) => !assetUsages(media.id).length);
  if (!unused.length) return notify("No unused media to clean up.");
  if (!confirm(`Remove ${unused.length} unused asset${unused.length === 1 ? "" : "s"}? Generated files are deleted from disk; imported files are only detached from this project.`)) return;
  for (const media of unused) {
    project.assets = projectAssets().filter((item) => item.id !== media.id);
    if (media.path) { try { await window.storyMakerDesktop?.deleteMediaFile?.({ path: media.path }); } catch { /* ignore */ } }
  }
  setDirty(); render(); notify(`Removed ${unused.length} unused asset${unused.length === 1 ? "" : "s"}.`);
}
function openSceneProductionModal(index, preferredAssetId = "") {
  ensureProductionShape(); const scene = project.scenes[index]; if (!scene) return;
  const selectedAsset = preferredAssetId || scene.referenceAssetId || "";
  const assetOptions = [`<option value="">No project reference</option>`, ...projectAssets().filter((media) => media.kind === "image").map((media) => `<option value="${esc(media.id)}" ${media.id === selectedAsset ? "selected" : ""}>${esc(media.name)}</option>`)].join("");
  const castOptions = project.characters.length ? project.characters.map((character) => `<label class="scene-cast-choice"><input type="checkbox" value="${esc(character.id)}" ${(scene.castIds || []).includes(character.id) ? "checked" : ""} /> <span>${esc(character.name)}</span><small>${esc(character.role)}</small></label>`).join("") : `<span class="context-empty">Add character profiles to assign a cast.</span>`;
  const setOptions = project.sets.length ? project.sets.map((set) => `<label class="scene-cast-choice"><input data-scene-asset-type="set" type="checkbox" value="${esc(set.id)}" ${(scene.setIds || []).includes(set.id) ? "checked" : ""} /> <span>${esc(set.name)}</span><small>Set / location</small></label>`).join("") : `<span class="context-empty">Create a set in Storyboard to make it reusable here.</span>`;
  const propOptions = project.props.length ? project.props.map((prop) => `<label class="scene-cast-choice"><input data-scene-asset-type="prop" type="checkbox" value="${esc(prop.id)}" ${(scene.propIds || []).includes(prop.id) ? "checked" : ""} /> <span>${esc(prop.name)}</span><small>${esc(prop.category || "production asset")}</small></label>`).join("") : `<span class="context-empty">Production assets detected from the script will appear here.</span>`;
  // The scene's best-known output (video ranks over an approved still, same
  // priority the storyboard card thumbnail itself uses) — previously this
  // form only ever showed the reference filename in a dropdown, with no way
  // to actually see or download what had been generated without leaving to
  // another workspace.
  const preview = sceneGeneratedAsset(scene);
  const previewBlock = preview
    ? `<div class="scene-modal-preview">${preview.kind === "video" ? `<video src="${esc(fileUrl(preview))}" controls></video>` : `<img src="${esc(fileUrl(preview))}" alt="Scene preview" />`}<button type="button" id="downloadScenePreview" class="quiet-button">Download a copy</button></div>`
    : `<div class="scene-modal-preview empty"><span>No generated frame yet. Generate one from the storyboard, then return here to review it.</span></div>`;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="productionSceneForm" class="project-modal scene-modal wide-modal"><button type="button" id="closeModal">×</button><p>SCENE ${String(index + 1).padStart(2, "0")} / PRODUCTION NOTE</p><h2>Frame the moment.</h2>${previewBlock}<label>SCENE TITLE<input id="sceneTitle" autofocus value="${esc(scene.title)}" /></label><label>WHAT MUST THIS BEAT DO?<textarea id="sceneNote">${esc(scene.note)}</textarea></label><label>VISUAL REFERENCE<select id="sceneReference">${assetOptions}</select></label><div class="scene-cast"><small>CAST IN THIS SCENE</small><div>${castOptions}</div></div><p class="scene-modal-note">Cast assignments become continuity signals and travel into the shot planner. References are copied beside the project on save.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save scene</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#productionSceneForm .scene-modal-note")?.insertAdjacentHTML("beforebegin", `<div class="scene-cast"><small>SETS & LOCATIONS</small><div>${setOptions}</div></div><div class="scene-cast"><small>PROPS & PRODUCTION ASSETS</small><div>${propOptions}</div></div>`);
  if (preview) bindDownloadButton("#downloadScenePreview", preview);
  $("#productionSceneForm").onsubmit = (event) => { event.preventDefault(); scene.title = $("#sceneTitle").value.trim() || `Untitled sequence ${index + 1}`; scene.note = $("#sceneNote").value.trim() || "A new beat waiting for its purpose."; scene.referenceAssetId = $("#sceneReference").value; scene.castIds = [...document.querySelectorAll(".scene-cast-choice input:checked")].filter((input) => !input.dataset.sceneAssetType).map((input) => input.value); scene.setIds = [...document.querySelectorAll('[data-scene-asset-type="set"]:checked')].map((input) => input.value); scene.propIds = [...document.querySelectorAll('[data-scene-asset-type="prop"]:checked')].map((input) => input.value); setDirty(); closeModal(); render(); notify("Scene production assets and continuity assignments updated."); };
}
function openSceneModal(index, preferredAssetId = "") {
  const scene = project.scenes[index];
  if (!scene) return;
  const selectedAsset = preferredAssetId || scene.referenceAssetId || "";
  const options = [`<option value="">No project reference</option>`, ...projectAssets().filter((media) => media.kind === "image").map((media) => `<option value="${esc(media.id)}" ${media.id === selectedAsset ? "selected" : ""}>${esc(media.name)}</option>`)].join("");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="sceneForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>SCENE ${String(index + 1).padStart(2, "0")} / PRODUCTION NOTE</p><h2>Frame the moment.</h2><label>SCENE TITLE<input id="sceneTitle" autofocus value="${esc(scene.title)}" /></label><label>WHAT MUST THIS BEAT DO?<textarea id="sceneNote">${esc(scene.note)}</textarea></label><label>VISUAL REFERENCE<select id="sceneReference">${options}</select></label><p class="scene-modal-note">Reference images are copied beside the project the next time you save.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save scene</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#sceneForm").onsubmit = (event) => { event.preventDefault(); scene.title = $("#sceneTitle").value.trim() || `Untitled sequence ${index + 1}`; scene.note = $("#sceneNote").value.trim() || "A new beat waiting for its purpose."; scene.referenceAssetId = $("#sceneReference").value; setDirty(); closeModal(); render(); notify("Scene direction updated."); };
}
function attachMediaToScene(assetId) {
  if (!project.scenes.length) { active = "Storyboard"; render(); notify("Add a scene before attaching a reference."); return; }
  const media = assetById(assetId);
  if (!media) return;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="assetAttachForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>ATTACH VISUAL REFERENCE</p><h2>Where should this image guide the film?</h2><label>REFERENCE ASSET<input value="${esc(media.name)}" disabled /></label><label>STORYBOARD SCENE<select id="assetScene">${project.scenes.map((scene, index) => `<option value="${index}">Scene ${String(index + 1).padStart(2, "0")} · ${esc(scene.title)}</option>`).join("")}</select></label><p class="scene-modal-note">You can refine the scene note and replace this reference from the storyboard at any time.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Attach reference</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#assetAttachForm").onsubmit = (event) => { event.preventDefault(); const index = Number($("#assetScene").value); project.scenes[index].referenceAssetId = assetId; setDirty(); closeModal(); render(); notify(`${media.name} is now attached to Scene ${String(index + 1).padStart(2, "0")}.`); };
}
function addTheme() {
  const input = $("#themeInput");
  const value = input?.value.trim();
  if (!value) return;
  project.themes = Array.isArray(project.themes) ? project.themes : [];
  if (!project.themes.some((theme) => theme.toLowerCase() === value.toLowerCase())) project.themes.push(value);
  setDirty(); render(); notify("Theme added to the story bible.");
}
function openLocationModal() {
  // These are lightweight narrative notes (name + a line of mood/role),
  // stored on project.locations — a separate, older, much simpler data model
  // than project.sets, the full production Locations workspace (its own
  // reference gallery, Style DNA, and Shot Director continuity). Before
  // 0.4.47 the nav tab for that system was "Sets & Locations"; it's since
  // been shortened to just "Locations", which now collides in name with
  // this Story Bible feature even though the two share no data. The copy
  // here leans on "narrative"/"story bible" to keep them distinguishable.
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="locationForm" class="project-modal"><button type="button" id="closeModal">×</button><p>ADD NARRATIVE LOCATION</p><h2>Place the story somewhere unforgettable.</h2><p class="scene-modal-note">A quick story-bible note — mood and role, not a production asset. Build the full visual reference for a recurring place in the Locations workspace instead.</p><label>LOCATION NAME<input id="locationName" autofocus placeholder="The Observatory" /></label><label>WHAT MAKES IT MATTER?<textarea id="locationDescription" placeholder="The mood, role, and visual feeling of this place."></textarea></label><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Add to bible</button></div></form></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#locationForm").onsubmit = (event) => { event.preventDefault(); const name = $("#locationName").value.trim(); if (!name) return; project.locations = Array.isArray(project.locations) ? project.locations : []; project.locations.push({ name, description: $("#locationDescription").value.trim() }); setDirty(); closeModal(); render(); notify("Narrative location added to the story bible."); };
}
function extractStoryEntities(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const locations = new Set(); const characters = new Set();
  for (const line of lines) {
    const heading = line.match(/^(?:INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)[\s]+(.+?)(?:\s*[-–—]\s*(?:DAY|NIGHT|MORNING|EVENING|DAWN|DUSK))?$/i);
    if (heading) locations.add(heading[1].replace(/\s*[-–—]\s*$/, "").trim());
    if (/^[A-Z][A-Z0-9 .'-]{2,40}$/.test(line) && !/^(INT|EXT|DAY|NIGHT|MORNING|EVENING|FADE|CUT|TITLE|CONTINUED)/.test(line)) characters.add(line.replace(/\s+\([^)]*\)$/, "").trim());
  }
  const textLower = text.toLowerCase();
  const themes = [["memory", "Memory"], ["belong", "Belonging"], ["truth", "Truth"], ["grief", "Grief"], ["love", "Love"], ["fear", "Fear"], ["hope", "Hope"], ["family", "Family"], ["identity", "Identity"], ["freedom", "Freedom"]].filter(([needle]) => textLower.includes(needle)).map(([, label]) => label);
  return { locations: [...locations].slice(0, 12), characters: [...characters].slice(0, 14), themes };
}
function runSourceBreakdown(options = {}) {
  const source = project.source?.text || "";
  if (!source.trim()) return notify("Import story material before building production context.");
  const parsed = project.ingestion?.analysis;
  if (parsed?.scenes?.length || parsed?.characters?.length) {
    project.locations = Array.isArray(project.locations) ? project.locations : [];
    project.characters = Array.isArray(project.characters) ? project.characters : [];
    project.scenes = Array.isArray(project.scenes) ? project.scenes : [];
    project.props = Array.isArray(project.props) ? project.props : [];
    const locationKeys = new Set(project.locations.map((location) => String(location.name || "").toLowerCase()));
    (parsed.locations || []).forEach((location) => { if (!locationKeys.has(String(location.name || "").toLowerCase())) project.locations.push(location); });
    const characterKeys = new Set(project.characters.map((character) => String(character.name || "").toLowerCase()));
    (parsed.characters || []).forEach((character) => { if (!characterKeys.has(String(character.name || "").toLowerCase())) project.characters.push(character); });
    const existingSceneKeys = new Set(project.scenes.map((scene) => String(scene.title || "").toLowerCase()));
    const signalText = (collection, sourceScene, field = "description") => (collection || []).filter((item) => String(item?.sceneId || "") === String(sourceScene?.id || "")).map((item) => String(item?.[field] || item?.note || "").trim()).filter(Boolean).join(" ");
    parsed.scenes.forEach((scene) => {
      if (existingSceneKeys.has(String(scene.title || "").toLowerCase())) return;
      const note = scene.storyBeat || scene.heading || "Imported scene.";
      const detectedPerformance = (scene.performanceNotes || []).map((item) => item.note).join(" ") || signalText(parsed.performance, scene);
      const blueprint = {
        ...defaultShotBlueprint(),
        narrative: [scene.objective, scene.emotionalPurpose, note].filter(Boolean).join(" "),
        camera: (scene.cameraNotes || []).map((item) => item.note).join(" ") || signalText(parsed.camera, scene),
        lighting: (scene.lightingNotes || []).map((item) => item.note).join(" ") || signalText(parsed.lighting, scene),
        performance: detectedPerformance,
        performanceSource: detectedPerformance ? "detected" : "",
        audio: (scene.audioNotes || []).map((item) => item.note).join(" ") || signalText(parsed.audio, scene),
        effects: (scene.effectsNotes || []).map((item) => item.note).join(" ") || signalText(parsed.effects, scene),
        continuity: (scene.continuityNotes || []).map((item) => item.note).join(" ") || signalText(parsed.continuity, scene),
        blocking: signalText(parsed.performance, scene, "blocking"),
        provenance: "documented"
      };
      // One entry per speaking character, not per line of dialogue — a
      // character with 3 lines in the scene must not triple every
      // cast-derived sentence (identity, performance, acting direction) in
      // the compiled image/video prompts.
      const castIds = [...new Set((scene.dialogue || []).map((line) => project.characters.find((character) => String(character.name).toLowerCase() === String(line.character).toLowerCase())?.id).filter(Boolean))];
      const importedScene = { id: scene.id, title: scene.title, note, referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds, shots: [] };
      // A screenplay authored for Storymaker (see docs/storymaker-gpt-instructions.md)
      // lists its own SHOTS: breakdown per scene — sometimes 7-10 of them.
      // Use every one of those verbatim instead of collapsing the scene
      // down to a single generic starter shot; the writer already did the
      // shot-planning work, so there's nothing left for populateAllShots to
      // invent for this scene.
      const parsedShots = scene.parsedShots || [];
      if (parsedShots.length) {
        parsedShots.forEach((parsedShot, shotIndex) => {
          const shot = newShot(importedScene, shotIndex + 1);
          shot.title = parsedShot.description.slice(0, 80) || shot.title;
          shot.blueprint = { ...blueprint, narrative: parsedShot.description, provenance: "documented" };
          shot.purpose = parsedShot.description;
          const imagePrompt = productionPromptFor(importedScene, shot, "image");
          const videoPrompt = productionPromptFor(importedScene, shot, "video");
          shot.modelSettings = { ...defaultShotModelSettings(), ...(shot.modelSettings || {}), imagePrompt, videoPrompt, prompt: imagePrompt, cameraInstruction: blueprint.camera, audioInstruction: blueprint.audio };
          importedScene.shots.push(shot);
        });
      } else {
        const starter = newShot(importedScene, 1);
        starter.blueprint = blueprint;
        starter.purpose = blueprint.narrative || starter.purpose;
        const imagePrompt = productionPromptFor(importedScene, starter, "image");
        const videoPrompt = productionPromptFor(importedScene, starter, "video");
        starter.modelSettings = { ...defaultShotModelSettings(), ...(starter.modelSettings || {}), imagePrompt, videoPrompt, prompt: imagePrompt, cameraInstruction: blueprint.camera, audioInstruction: blueprint.audio };
        importedScene.shots.push(starter);
      }
      project.scenes.push(importedScene);
    });
    const propKeys = new Set(project.props.map((prop) => String(prop.name || "").toLowerCase()));
    (parsed.props || []).forEach((prop) => { if (!propKeys.has(String(prop.name || "").toLowerCase())) project.props.push(prop); });
    const parsedThemes = parsed.story?.themes || [];
    project.themes = Array.isArray(project.themes) ? project.themes : [];
    parsedThemes.forEach((theme) => { if (!project.themes.some((value) => String(value).toLowerCase() === String(theme).toLowerCase())) project.themes.push(theme); });
    if (!project.logline && parsed.story?.logline) project.logline = parsed.story.logline;
    if (!project.premise && parsed.story?.synopsis) project.premise = parsed.story.synopsis;
    project.ingestion.status = "needs-review";
    setDirty();
    if (options.render !== false) render();
    if (options.notify !== false) notify(`Production analysis imported: ${parsed.scenes?.length || 0} scenes, ${parsed.characters?.length || 0} characters, and ${parsed.props?.length || 0} props found.`);
    return;
  }
  const entities = extractStoryEntities(source);
  project.locations = Array.isArray(project.locations) ? project.locations : [];
  project.characters = Array.isArray(project.characters) ? project.characters : [];
  project.themes = Array.isArray(project.themes) ? project.themes : [];
  const locationKeys = new Set(project.locations.map((location) => String(location.name || "").toLowerCase()));
  entities.locations.forEach((name) => { if (!locationKeys.has(name.toLowerCase())) project.locations.push({ name, description: "Imported from story source." }); });
  const characterKeys = new Set(project.characters.map((character) => String(character.name || "").toLowerCase()));
  entities.characters.forEach((name) => { if (!characterKeys.has(name.toLowerCase())) project.characters.push({ name, role: "Imported character — define their story role." }); });
  const themeKeys = new Set(project.themes.map((theme) => String(theme).toLowerCase()));
  entities.themes.forEach((theme) => { if (!themeKeys.has(theme.toLowerCase())) project.themes.push(theme); });
  if (!project.world && entities.locations[0]) project.world = `A story world centered on ${entities.locations[0]}.`;
  if (!project.logline) { const candidate = source.split(/\n+/).map((line) => line.trim()).find((line) => line.length > 45 && line.length < 240 && !/^(INT|EXT|FADE|CUT)/.test(line)); if (candidate) project.logline = candidate; }
  setDirty();
  if (options.render !== false) render();
  if (options.notify !== false) notify(`Production context updated: ${entities.characters.length} characters and ${entities.locations.length} locations found.`);
}
function mergeAnalysisIntoProject(parsed) {
  if (!parsed) return;
  project.ingestion = { ...(project.ingestion || {}), analysis: parsed, status: "needs-review", reviewedAt: "" };
  runSourceBreakdown();
}
// "AI-Enhanced Optimization": the spec's Option 2 asks for one cohesive
// bundle — narrative critique, a structure recommendation (Three-Act,
// Hero's Journey, etc.), and visual-style recommendations — reviewed
// together, not three separate trips to different workspaces. All three
// calls already existed independently (story analysis, live director
// review, style recommendations); this just chains them into one import-
// time step. Structure/style recs need project.logline/premise/themes,
// which mergeAnalysisIntoProject only just populated, so they can't run
// any earlier in this sequence.
async function enrichImportedStory() {
  if (!window.storyMakerDesktop?.analyzeStory) return notify("AI story analysis is only available in the Windows app.");
  const button = $("#runAiStoryAnalysis"); if (button) { button.disabled = true; button.textContent = "Analyzing…"; }
  try {
    // The local importer has already produced a structured, reviewable parse.
    // Do not hold the creative-review screen hostage while a second provider
    // tries to recreate a huge script breakdown over the network.
    if (project.ingestion?.analysis) runSourceBreakdown({ render: false, notify: false });
    const remoteAnalysis = project.ingestion?.analysis
      ? Promise.resolve(null)
      : window.storyMakerDesktop.analyzeStory({ sourceText: project.source?.text || "" });
    // A previous failed attempt must never continue to look like the current
    // state after a later retry succeeds.
    delete project.ingestion.enrichmentError;
    delete project.ingestion.enrichmentFailedAt;
    // Best-effort from here: the story analysis itself already succeeded
    // and will be shown regardless of whether these two extra calls do.
    const [analysisResult, reviewResult, styleResult, improvementsResult] = await Promise.allSettled([
      remoteAnalysis,
      window.storyMakerDesktop.requestDirectorReview ? window.storyMakerDesktop.requestDirectorReview(project) : Promise.reject(new Error("unavailable")),
      window.storyMakerDesktop.recommendStyles ? window.storyMakerDesktop.recommendStyles({ project, availableStyles: styles.map((style) => ({ name: style.name, tone: style.tone })) }) : Promise.reject(new Error("unavailable")),
      window.storyMakerDesktop.suggestScriptImprovements ? window.storyMakerDesktop.suggestScriptImprovements(project) : Promise.reject(new Error("unavailable"))
    ]);
    if (analysisResult.status === "fulfilled" && analysisResult.value) mergeAnalysisIntoProject(analysisResult.value);
    if (reviewResult.status === "fulfilled" && reviewResult.value) project.directorReview = reviewResult.value;
    if (styleResult.status === "fulfilled" && Array.isArray(styleResult.value)) project.recommendedStyles = styleResult.value;
    if (improvementsResult.status === "fulfilled" && Array.isArray(improvementsResult.value)) project.scriptSuggestions = improvementsResult.value;
    const optionalFailures = [analysisResult, reviewResult, styleResult, improvementsResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message)
      .filter(Boolean);
    if (optionalFailures.length) project.ingestion.enrichmentNotice = `Some optional recommendations could not be loaded: ${optionalFailures[0]}`;
    else delete project.ingestion.enrichmentNotice;
    closeModal();
    openEnhancementReview();
  } catch (error) {
    const message = error?.message || "AI story analysis could not be completed.";
    // The remote AI pass is optional: retain the parsed plan and make the
    // failure visible instead of trapping the user at the import gate.
    project.ingestion = { ...(project.ingestion || {}), enrichmentError: message, enrichmentFailedAt: new Date().toISOString() };
    if (project.ingestion?.analysis) {
      runSourceBreakdown();
      closeModal();
      openEnhancementReview();
      notify(`AI enrichment is unavailable: ${message} You can still build the parsed storyboard or retry.`);
    } else notify(message);
  } finally {
    if (button?.isConnected) { button.disabled = false; button.textContent = "Get AI improvements to review"; }
  }
}
function openEnhancementReview() {
  const review = project.directorReview;
  const recommendedStyles = Array.isArray(project.recommendedStyles) ? project.recommendedStyles : [];
  const scriptSuggestions = Array.isArray(project.scriptSuggestions) ? project.scriptSuggestions : [];
  const pendingScriptSuggestions = scriptSuggestions.filter((item) => !item.status || item.status === "pending");
  const enrichmentError = String(project.ingestion?.enrichmentError || "").trim();
  const enrichmentNotice = String(project.ingestion?.enrichmentNotice || "").trim();
  // Each decision already carries a `target` workspace (Story Bible/
  // Character Bible/Design Bible/Storyboard) — "Open" is the accept action
  // for a decision: there's no single field to flip, but there is always a
  // concrete place to go act on it, matching the same data-nav pattern the
  // AI Director workspace already uses for its own decisions grid.
  const decisionsBlock = review?.decisions?.length ? `<div class="live-review-grid">${review.decisions.map((decision, index) => `<article><i>${String(index + 1).padStart(2, "0")}</i><div><small>${esc(decision.signal)}</small><h3>${esc(decision.title)}</h3><p>${esc(decision.rationale)}</p></div><button type="button" data-nav="${esc(decision.target || "Story Bible")}" class="quiet-button">Open</button></article>`).join("")}</div>` : "";
  const structureBlock = review?.recommendedStructure ? `<div class="review-structure"><small>RECOMMENDED STRUCTURE</small><h3>${esc(review.recommendedStructure.name)}</h3><p>${esc(review.recommendedStructure.rationale)}</p></div>` : "";
  const styleCards = recommendedStyles.map((rec) => { const style = styles.find((item) => item.name === rec.name); if (!style) return ""; return `<button data-enhancement-style="${esc(style.name)}" class="preset-card recommended ${project.style === style.name ? "picked" : ""} ${style.image ? "art-ready" : "art-pending"}" ${style.image ? `style="background-image:linear-gradient(0deg,#080a12e8 0%,#080a1212 72%),url('${styleImage(style)}')"` : ""}><span>${style.image ? "ART READY" : "ART PENDING"}</span><div><b>${esc(style.name)}</b><small>${esc(style.tone)}</small><p class="recommended-reason">${esc(rec.reason)}</p></div></button>`; }).filter(Boolean).join("");
  const scriptSuggestionBlock = scriptSuggestions.length ? `<section class="script-suggestions-card"><div class="live-review-heading"><div><small>EDITABLE STORY IMPROVEMENTS</small><h2>Accept only what makes the story stronger.</h2></div><span>${scriptSuggestions.length} proposal${scriptSuggestions.length === 1 ? "" : "s"}</span></div><div class="suggestion-list">${scriptSuggestions.map((item) => `<article class="suggestion-card"><div class="suggestion-head"><small>${esc(item.category.toUpperCase())} · ${item.scope === "scene" ? esc(item.sceneTitle) : item.scope.toUpperCase()}</small><h3>${esc(item.title)}</h3></div><p class="suggestion-rationale">${esc(item.rationale)}</p><div class="suggestion-impact"><span><small>EXPECTED BENEFIT</small>${esc(item.expectedBenefit || "Clearer production direction.")}</span><span><small>PRODUCTION CONSEQUENCE</small>${esc(item.productionConsequence || "No downstream production impact noted.")}</span></div><div class="suggestion-diff"><div><small>CURRENT</small><p>${esc(item.currentText || "No existing text recorded.")}</p></div><div><small>PROPOSED · EDITABLE</small><textarea data-suggestion-text="${esc(item.id)}" rows="3">${esc(item.suggestedText)}</textarea></div></div><div class="suggestion-actions"><button type="button" data-accept-import-suggestion="${esc(item.id)}" class="save-button">Accept & update storyboard</button><button type="button" data-reject-import-suggestion="${esc(item.id)}" class="quiet-button">Reject</button></div></article>`).join("")}</div></section>` : "";
  const nothingCame = !decisionsBlock && !structureBlock && !styleCards && !scriptSuggestionBlock;
  const failureBlock = enrichmentError ? `<div class="context-empty"><strong>AI recommendations could not be loaded.</strong><div>${esc(enrichmentError)}</div><p>The imported script and parsed production plan are preserved. Build the storyboard now, or retry after checking Model Hub.</p><button type="button" id="retryEnrichment" class="quiet-button">Retry AI improvements</button></div>` : "";
  const noticeBlock = enrichmentNotice ? `<div class="context-empty"><div>${esc(enrichmentNotice)}</div><p>The available recommendations below are still safe to review and accept individually.</p></div>` : "";
  const eligibleCount = project.scenes.filter((scene) => shotPlanEligible(scene)).length;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal wide-modal"><button type="button" id="closeModal">×</button><p>AI-ENHANCED OPTIMIZATION / REVIEW</p><h2>${esc(review?.summary || (enrichmentError ? "Your parsed production plan is ready." : "The story analysis is ready. Structure and style recommendations are shown below when available."))}</h2>${failureBlock}${noticeBlock}${decisionsBlock}${structureBlock}${styleCards ? `<div class="review-themes"><small>RECOMMENDED VISUAL STYLES</small><div class="preset-grid">${styleCards}</div></div>` : ""}${nothingCame && !enrichmentError ? `<p class="scene-modal-note">Structure and style recommendations need a connected OpenAI or OpenRouter key. The story analysis itself is already applied and ready to review in Story Bible.</p>` : ""}<p class="scene-modal-note">Implementing populates camera, lighting, performance, motion, audio, effects, and continuity for every shot that doesn't have one yet — the same detail level as a full production blueprint, not a placeholder prompt.</p><div>${eligibleCount ? `<button type="button" id="implementEnhancementReview" class="save-button">Implement — populate ${eligibleCount} shot${eligibleCount === 1 ? "" : "s"}</button>` : ""}<button type="button" id="cancelModal" class="${eligibleCount ? "quiet-button" : "save-button"}">Continue to Story Bible</button></div></section></div>`;
  if (scriptSuggestionBlock) $("#modalRoot .project-modal h2")?.insertAdjacentHTML("afterend", scriptSuggestionBlock);
  if (pendingScriptSuggestions.length) $("#modalRoot .script-suggestions-card .live-review-heading")?.insertAdjacentHTML("beforeend", `<button type="button" id="acceptAllImportSuggestions" class="save-button">Accept all ${pendingScriptSuggestions.length} remaining</button>`);
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  document.querySelectorAll("[data-enhancement-style]").forEach((el) => el.addEventListener("click", () => { chooseStyle(el.dataset.enhancementStyle); closeModal(); }));
  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => { active = el.dataset.nav; closeModal(); render(); }));
  document.querySelectorAll("[data-accept-import-suggestion]").forEach((button) => button.addEventListener("click", () => acceptScriptSuggestion(button.dataset.acceptImportSuggestion)));
  document.querySelectorAll("[data-reject-import-suggestion]").forEach((button) => button.addEventListener("click", () => rejectScriptSuggestion(button.dataset.rejectImportSuggestion)));
  $("#acceptAllImportSuggestions")?.addEventListener("click", acceptAllScriptSuggestions);
  scriptSuggestions.filter((item) => item.status && item.status !== "pending").forEach((item) => updateSuggestionCardDecision(item.id, item.status));
  $("#retryEnrichment")?.addEventListener("click", enrichImportedStory);
  $("#implementEnhancementReview")?.addEventListener("click", async () => {
    closeModal(); active = "Storyboard"; render();
    await populateAllShots();
  });
}

// Style Library: UI modals and handlers
function openSaveStyleDnaModal(sceneIndex) {
  const scene = project.scenes[sceneIndex];
  if (!scene) return;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="saveStyleDnaForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>SAVE STYLE / SCENE ${String(sceneIndex + 1).padStart(2, "0")}</p><h2>Capture the visual signature.</h2><label>STYLE NAME<input id="styleDnaName" autofocus placeholder="e.g. 'Luxury Product – Spring'" value="" /></label><label>DESCRIPTION<textarea id="styleDnaDescription" placeholder="What makes this style distinctive? Mood, colors, lighting, materials..."></textarea></label><p class="scene-modal-note">This style will be available to apply to any future scene in this project, or reuse in other productions.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Save as Style DNA</button></div></form></div>`;
  $("#closeModal").onclick = closeModal;
  $("#cancelModal").onclick = closeModal;
  $("#saveStyleDnaForm").onsubmit = (event) => {
    event.preventDefault();
    const name = $("#styleDnaName").value.trim();
    const description = $("#styleDnaDescription").value.trim();
    if (!name) { notify("Give the style a name."); return; }
    captureStyleDna(name, description, scene);
    closeModal();
    render();
  };
}

function driftStatusColor(score) {
  if (score <= 25) return "status-locked"; // green
  if (score <= 50) return "status-acceptable"; // amber
  if (score <= 75) return "status-minor"; // orange
  return "status-critical"; // red
}

function openDriftReportModal(report) {
  if (!report) { notify("No drift report available."); return; }
  const barHtml = (label, score) => `<div class="drift-score-bar"><span class="drift-label">${label}</span><progress value="${score}" max="100" class="${driftStatusColor(score)}"></progress><span class="drift-value">${Math.round(score)}%</span></div>`;
  const suggestionsList = report.suggestions && report.suggestions.length ? report.suggestions.map((s) => `<li>${esc(s)}</li>`).join("") : "<li>Style is within acceptable range.</li>";
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal drift-report-modal"><button type="button" id="closeModal">×</button><p>STYLE CHECK / ${esc(report.styleDnaName)}</p><h2>Consistency Report</h2><div class="drift-report-body"><div class="drift-scores">${barHtml("Color", report.colorDrift)}${barHtml("Typography", report.typographyDrift)}${barHtml("Materials", report.materialDrift)}${barHtml("Mood", report.moodDrift)}${barHtml("Atmosphere", report.atmosphereDrift)}<div class="drift-score-bar overall"><span class="drift-label"><strong>Overall Drift</strong></span><progress value="${report.compositeDrift}" max="100" class="${driftStatusColor(report.compositeDrift)}"></progress><span class="drift-value"><strong>${Math.round(report.compositeDrift)}%</strong></span></div></div><div class="drift-findings"><h3>Findings</h3><ul>${Object.entries(report.findings || {}).map(([key, value]) => `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${esc(value)}</li>`).join("")}</ul></div>${suggestionsList.length ? `<div class="drift-suggestions"><h3>To Reduce Drift</h3><ul>${suggestionsList}</ul></div>` : ""}</div><div><button type="button" id="closeModal" class="quiet-button">Close</button><button type="button" id="acceptDrift" class="line-action">Accept variation</button></div></section></div>`;
  $("#closeModal").onclick = closeModal;
  $("#acceptDrift").onclick = () => { closeModal(); notify("Variation accepted."); };
}

async function triggerDriftCheck(sceneIndex, assetId) {
  const scene = project.scenes[sceneIndex];
  if (!scene?.appliedStyleDnaId) {
    notify("Apply a Style DNA to this scene first (or save one from an approved reference).");
    return;
  }
  const report = await checkStyleDrift(assetId, scene.appliedStyleDnaId, sceneIndex);
  if (report) openDriftReportModal(report);
}

// Pick which scene a saved Style DNA should be applied to (called from the
// Style Library workspace, which has no single "current scene" context).
function openApplyDnaModal(dnaId) {
  const dna = styleDnaById(dnaId);
  if (!dna) return notify("Style DNA not found.");
  if (!project.scenes.length) return notify("Add a scene before applying a style.");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><form id="applyDnaForm" class="project-modal scene-modal"><button type="button" id="closeModal">×</button><p>APPLY STYLE / ${esc(dna.name)}</p><h2>Which scene should use this style?</h2><label>SCENE<select id="applyDnaScene">${project.scenes.map((scene, index) => `<option value="${index}">${String(index + 1).padStart(2, "0")} · ${esc(scene.title)}</option>`).join("")}</select></label><p class="scene-modal-note">This prepends the style's visual language, color palette, typography, materials, mood, and atmosphere to that scene's generation prompt.</p><div><button type="button" id="cancelModal" class="quiet-button">Cancel</button><button class="save-button">Apply style</button></div></form></div>`;
  $("#closeModal").onclick = closeModal;
  $("#cancelModal").onclick = closeModal;
  $("#applyDnaForm").onsubmit = (event) => {
    event.preventDefault();
    const sceneIndex = Number($("#applyDnaScene").value);
    selectedSceneIndex = sceneIndex; // also updates Motion Graphics' scene picker to match
    applyStyleDna(dnaId, sceneIndex);
    closeModal();
    render();
  };
}

// Batch drift check across every scene that has both a Style DNA applied and
// a generated visual to compare against. Sequential, not parallel — each
// check is a real paid API call, and running them one at a time keeps the
// in-flight cost visible in the notify() trail instead of firing a burst.
async function checkAllScenesDrift() {
  ensureProductionShape();
  const candidates = project.scenes
    .map((scene, index) => ({ scene, index, asset: sceneGeneratedAsset(scene) }))
    .filter(({ scene, asset }) => scene.appliedStyleDnaId && styleDnaById(scene.appliedStyleDnaId) && asset?.kind === "image");
  if (!candidates.length) {
    notify("No scenes have both a Style DNA applied and a generated image to check (video takes can't be checked).");
    return;
  }
  notify(`Checking ${candidates.length} scene${candidates.length === 1 ? "" : "s"} (${candidates.length} API check${candidates.length === 1 ? "" : "s"})...`);
  const results = [];
  for (const { scene, index, asset } of candidates) {
    const report = await checkStyleDrift(asset.id, scene.appliedStyleDnaId, index);
    if (report) results.push({ sceneIndex: index, sceneTitle: scene.title, report });
  }
  if (!results.length) { notify("Drift checks did not complete. See individual errors above."); return; }
  openBatchDriftReportModal(results);
}

function openBatchDriftReportModal(results) {
  const row = ({ sceneTitle, report }) => `<article class="batch-drift-row ${driftStatusColor(report.compositeDrift)}"><div><h3>${esc(sceneTitle)}</h3><small>vs ${esc(report.styleDnaName)}</small></div><progress value="${report.compositeDrift}" max="100" class="${driftStatusColor(report.compositeDrift)}"></progress><span class="drift-value">${Math.round(report.compositeDrift)}%</span></article>`;
  const sorted = [...results].sort((a, b) => b.report.compositeDrift - a.report.compositeDrift);
  const worst = sorted[0];
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal drift-report-modal"><button type="button" id="closeModal">×</button><p>STYLE LIBRARY / CONSISTENCY REPORT</p><h2>${results.length} scene${results.length === 1 ? "" : "s"} checked</h2>${worst && worst.report.compositeDrift > 50 ? `<p class="scene-modal-note">Highest drift: "${esc(worst.sceneTitle)}" at ${Math.round(worst.report.compositeDrift)}%.</p>` : ""}<div class="batch-drift-list">${sorted.map(row).join("")}</div><div><button type="button" id="closeModal" class="quiet-button">Close</button></div></section></div>`;
  $("#closeModal").onclick = closeModal;
}

// The gate between "text was extracted" and "the project record changed."
// Nothing from a source ever reaches project.scenes/characters/etc until the
// user picks one of the two buttons here — Preserve commits the local parse
// exactly as detected; Improve runs it through AI first, still landing on
// the same review-before-commit shape (mergeAnalysisIntoProject just swaps
// in a richer analysis object before the same commit step runs).
function openImportReview() {
  const analysis = project.ingestion?.analysis; if (!analysis) return notify("Import a source before reviewing its analysis.");
  const counts = [
    ["Scenes", analysis.scenes?.length || 0], ["Characters", analysis.characters?.length || 0], ["Locations", analysis.locations?.length || 0], ["Props", analysis.props?.length || 0]
  ];
  const gaps = [
    !analysis.scenes?.length && "No scene headings were detected — this may be prose or an outline rather than a formatted script.",
    !analysis.characters?.length && "No characters were detected. Character names are usually recognized from ALL-CAPS speaker cues above dialogue.",
    analysis.confidence != null && analysis.confidence < 0.4 && "Low parser confidence — check the source preview for formatting the parser may have missed."
  ].filter(Boolean);
  const notices = (project.ingestion?.warnings || []).concat(analysis.warnings || []).concat(gaps);
  // The local parser only recognizes screenplay formatting (INT./EXT.
  // sluglines, ALL-CAPS speaker cues). Prose, treatments, and outlines —
  // exactly what a "paste your script" box tends to receive — parse to
  // zero scenes. Preserve is still offered (it keeps whatever characters,
  // themes, and logline it did find) but framed honestly: at zero scenes,
  // clicking it produces no storyboard at all, since scenes are what
  // everything downstream is built from.
  const noScenesDetected = !(analysis.scenes?.length);
  const explanation = noScenesDetected
    ? "This doesn't read as a formatted screenplay, so the local parser found no scenes to build a storyboard from. AI analysis reads any format — prose, treatment, outline — and can still produce a full scene breakdown."
    : "Both paths create the same editable production blueprints and paired image/video prompts. Preserve keeps every authored story choice; Improve with AI presents recommendations for approval before changing anything.";
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal"><button type="button" id="closeModal">×</button><p>INGESTION REVIEW / ${esc(project.source?.name || "SOURCE")}</p><h2>What Storymaker understood</h2><div class="project-metrics">${counts.map(([label, value]) => `<span><b>${value}</b> ${label}</span>`).join("")}</div><p>${esc(analysis.confidence ? `Parser confidence ${(analysis.confidence * 100).toFixed(0)}%. Nothing is committed to this project until you choose below.` : "This analysis is a reviewable draft. Nothing is committed until you choose below.")}</p><p class="scene-modal-note">${esc(explanation)}</p>${notices.length ? `<div class="context-empty">${notices.map((warning) => `<div>${esc(warning)}</div>`).join("")}</div>` : ""}<div><button type="button" id="preserveImportExactly" class="quiet-button">Preserve & create prompt plan</button><button type="button" id="runAiStoryAnalysis" class="save-button">Improve with AI</button><button type="button" id="cancelModal" class="quiet-button">Review later</button></div></section></div>`;
  const preserveButton = $("#preserveImportExactly");
  if (preserveButton) preserveButton.textContent = noScenesDetected ? "Save story text only (no scenes)" : `Preserve exactly & build ${analysis.scenes?.length || 0}-scene storyboard`;
  const enrichButton = $("#runAiStoryAnalysis");
  if (enrichButton) enrichButton.textContent = noScenesDetected ? "Build storyboard with AI →" : "Get AI improvements to review";
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal; $("#runAiStoryAnalysis").onclick = enrichImportedStory;
  $("#preserveImportExactly").onclick = () => { closeModal(); runSourceBreakdown(); };
}
async function importStorySource() {
  try {
    const result = await window.storyMakerDesktop?.importStorySource();
    if (!result || result.canceled) return;
    project.source = { name: result.name, text: result.text || "", importedAt: result.importedAt || new Date().toISOString(), type: result.type || "text", filePath: result.filePath || "" };
    project.ingestion = { status: result.analysis?.status || "needs-review", analysis: result.analysis || null, importedAt: result.importedAt || new Date().toISOString(), warnings: result.warnings || [] };
    setDirty(); render();
    if (!result.text?.trim()) return notify((result.warnings || ["The source was imported but contains no extractable text yet."])[0]);
    // The local heuristic parser already ran inside ingestStoryFile and its
    // result sits in project.ingestion.analysis — nothing is written into
    // project.scenes/characters/etc until the user picks a path in this
    // review screen. Auto-committing here was the actual gap: parsing and
    // committing were the same step, so the user's material could be
    // rewritten into the project before they'd seen what was detected.
    openImportReview();
  } catch (error) { notify(error.message || "That source file could not be imported."); }
}
// Shared by the clipboard path and the paste-textarea path below — both
// hand the engine raw text and land on the same review gate as a file
// import. Nothing here bypasses openImportReview: pasted text gets exactly
// the same "nothing is committed until you choose" treatment as any other
// source.
async function commitImportedText(text, name) {
  const result = await window.storyMakerDesktop?.importStoryText?.({ text, name });
  if (!result || result.canceled) return false;
  project.source = { name: result.name, text: result.text || "", importedAt: result.importedAt || new Date().toISOString(), type: result.type || "text", filePath: "" };
  project.ingestion = { status: result.analysis?.status || "needs-review", analysis: result.analysis || null, importedAt: result.importedAt || new Date().toISOString(), warnings: result.warnings || [] };
  setDirty(); render(); openImportReview();
  return true;
}
async function importStoryFromClipboard() {
  try {
    const text = await window.storyMakerDesktop?.readClipboardText?.();
    if (!String(text || "").trim()) return notify("Copy a story, script, outline, or notes first, then import from the clipboard.");
    await commitImportedText(text, "Clipboard story");
  } catch (error) { notify(error?.message || "Clipboard import could not be completed."); }
}
function openPasteStoryModal() {
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal paste-story-modal"><button type="button" id="closeModal">×</button><p>STORY / PASTE SCRIPT</p><h2>Drop your script straight in.</h2><p class="scene-modal-note">Type or paste (Ctrl+V) a script, screenplay, treatment, or outline below. Nothing is committed until you review what was detected.</p><textarea id="pasteStoryText" rows="16" placeholder="INT. KITCHEN - NIGHT&#10;&#10;MARA stands at the counter, unmoving...&#10;&#10;MARA&#10;I said I'd be fine.&#10;&#10;Paste or type your script here."></textarea><div><button type="button" id="submitPastedStory" class="save-button">Parse & import</button><button type="button" id="cancelModal" class="quiet-button">Cancel</button></div></section></div>`;
  $("#closeModal").onclick = closeModal; $("#cancelModal").onclick = closeModal;
  $("#pasteStoryText").focus();
  $("#submitPastedStory").onclick = async () => {
    const text = $("#pasteStoryText").value;
    if (!text.trim()) return notify("Paste or type a script before importing.");
    const button = $("#submitPastedStory"); button.disabled = true; button.textContent = "Parsing…";
    // commitImportedText already swaps #modalRoot's content to the review
    // gate on success (via openImportReview) — closing here would just wipe
    // that modal right back out again.
    try { await commitImportedText(text, "Pasted script"); }
    catch (error) { notify(error?.message || "That script could not be imported."); }
    finally { if (button?.isConnected) { button.disabled = false; button.textContent = "Parse & import"; } }
  };
}
// A source imports with no text when it's a scanned image (or a scanned PDF
// with no text layer) — story-ingest.js can't read pixels, only a vision
// model can. This is the bridge: OCR the file, then run the same analysis
// path a normal text import would have taken.
async function runSourceOcr() {
  const source = project.source || {};
  if (!source.filePath) return notify("Re-import this source before running OCR.");
  if (!providerReady("openai") && !providerReady("openrouter")) return notify("Connect OpenAI or OpenRouter in Model Hub before running OCR.");
  openGenerationOverlay("scanned source");
  try {
    const result = await window.storyMakerDesktop.runSourceOcr({ filePath: source.filePath });
    if (!result?.text?.trim()) throw new Error("No text could be read from this source.");
    project.source = { ...source, text: result.text };
    project.ingestion = { status: result.analysis?.status || "needs-review", analysis: result.analysis || null, importedAt: new Date().toISOString(), warnings: [] };
    setDirty(); render(); notify("Scanned text recovered.");
    openImportReview();
  } catch (error) { notify(error?.message || "OCR could not read this source."); } finally { closeGenerationOverlay(); }
}
function openSourcePreview() {
  const source = project.source || {}; if (!source.text) return;
  $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="project-modal source-preview"><button type="button" id="closeModal">×</button><p>IMPORTED SOURCE / ${esc(source.name)}</p><h2>Production source</h2><pre>${esc(source.text)}</pre></section></div>`;
  $("#closeModal").onclick = closeModal;
}
function buildStoryMap() {
  if (project.scenes?.length) return;
  ensureCharacterShape();
  const location = project.locations?.[0]?.name || "the world of the story";
  const lead = project.characters?.[0]?.name || "the protagonist";
  const theme = project.themes?.[0] || "the central question";
  project.scenes = [
    { id: "scene-promise", title: "The promise", note: `Introduce ${lead} in ${location} and establish the visual language of the film.`, referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds: project.characters[0] ? [project.characters[0].id] : [], shots: [] },
    { id: "scene-disturbance", title: "The disturbance", note: `Force a choice that puts ${theme.toLowerCase()} under pressure.`, referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds: project.characters[0] ? [project.characters[0].id] : [], shots: [] },
    { id: "scene-turn", title: "The turn", note: "Reveal the cost of the choice and reshape what the audience believes.", referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds: project.characters[0] ? [project.characters[0].id] : [], shots: [] },
    { id: "scene-final-image", title: "The image that remains", note: "Land the emotional consequence in one clear, unforgettable final image.", referenceAssetId: "", variations: [], approvedVariationId: "", generationPrompt: "", generationSize: "1536x1024", castIds: project.characters[0] ? [project.characters[0].id] : [], shots: [] }
  ];
  setDirty(); active = "Storyboard"; render(); notify("A local four-beat story map is ready to direct.");
}
async function requestLiveDirectorReview() {
  const button = $("#requestLiveDirectorReview");
  if (!window.storyMakerDesktop?.requestDirectorReview) return notify("Live Director review is only available in the Windows app.");
  if (button) { button.disabled = true; button.textContent = "Reviewing story…"; }
  try {
    const review = await window.storyMakerDesktop.requestDirectorReview(project);
    if (!review) throw new Error("The Director returned no review.");
    project.directorReview = review;
    setDirty(); render(); notify("Live Director review added to this project.");
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = "Run live director review"; }
    notify(error?.message || "The live Director review could not be completed.");
  }
}
function applyLiveDirectorReview() {
  const suggestions = project.directorReview?.suggestedThemes || [];
  if (!suggestions.length) return;
  project.themes = Array.isArray(project.themes) ? project.themes : [];
  const existing = new Set(project.themes.map((theme) => String(theme).toLowerCase()));
  const added = suggestions.filter((theme) => !existing.has(String(theme).toLowerCase()));
  if (!added.length) return notify("Those Director themes are already in the Story Bible.");
  project.themes.push(...added);
  setDirty(); render(); notify(`${added.length} Director theme${added.length === 1 ? "" : "s"} added to the Story Bible.`);
}
async function requestScriptImprovements() {
  ensureProductionShape();
  const button = $("#requestScriptImprovements");
  if (!window.storyMakerDesktop?.suggestScriptImprovements) return notify("Script improvement suggestions are only available in the Windows app.");
  if (button) { button.disabled = true; button.textContent = "Reading the script…"; }
  try {
    const suggestions = await window.storyMakerDesktop.suggestScriptImprovements(project);
    if (!Array.isArray(suggestions) || !suggestions.length) throw new Error("No improvement suggestions were returned. The script may already be tight.");
    project.scriptSuggestions = suggestions;
    setDirty(); render(); notify(`${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} ready to review.`);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = "Suggest improvements"; }
    notify(error?.message || "Script improvements could not be generated.");
  }
}
async function translateCreativeInfluence() {
  const input = $("#creativeInfluenceInput");
  const referenceText = input?.value.trim();
  if (!referenceText) return notify("Describe a film, director, era, or mood first.");
  if (!window.storyMakerDesktop?.translateCreativeInfluence) return notify("Creative influence translation is only available in the Windows app.");
  const button = $("#translateCreativeInfluence");
  if (button) { button.disabled = true; button.textContent = "Translating…"; }
  try {
    const result = await window.storyMakerDesktop.translateCreativeInfluence({ referenceText });
    project.creativeInfluence = result;
    setDirty(); render(); notify(`Translated into ${result.traits.length} craft attributes.`);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = "Translate"; }
    notify(error?.message || "That reference could not be translated.");
  }
}
async function requestStyleRecommendations() {
  if (!window.storyMakerDesktop?.recommendStyles) return notify("Style recommendations are only available in the Windows app.");
  const button = $("#recommendStyles");
  if (button) { button.disabled = true; button.textContent = "Reading the story…"; }
  try {
    const availableStyles = visualStyleLibrary().map((dna) => ({ name: dna.name, tone: dna.shortDescription || styleSummary(dna) }));
    const recommendations = await window.storyMakerDesktop.recommendStyles({ project, availableStyles });
    project.recommendedStyles = recommendations;
    setDirty(); render(); notify(`${recommendations.length} style${recommendations.length === 1 ? "" : "s"} recommended for this story.`);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = "Recommend styles"; }
    notify(error?.message || "Style recommendations could not be generated.");
  }
}
// The single-button-press "Automated Storyboard Generation" step: expands
// every eligible scene's lone starter shot into a real shot list, each with
// a complete camera/lighting/performance/motion/audio/effects/continuity
// blueprint. Scenes already broken into multiple shots, already generated,
// or explicitly locked are left untouched — this only ever fills in scenes
// nothing has touched yet.
async function populateAllShots() {
  if (!window.storyMakerDesktop?.planShots) return notify("Shot planning is only available in the Windows app.");
  const button = $("#populateAllShots");
  const eligibleCount = project.scenes.filter((scene) => shotPlanEligible(scene)).length;
  if (!eligibleCount) return notify("Every scene already has a shot list, generated output, or a locked blueprint.");
  if (button) { button.disabled = true; button.textContent = "Planning shots…"; }
  try {
    const plan = await window.storyMakerDesktop.planShots({ project });
    let expanded = 0;
    plan.forEach((entry) => {
      const scene = project.scenes.find((item) => item.id === entry.sceneId);
      if (!scene || !shotPlanEligible(scene) || !entry.shots.length) return;
      scene.shots = entry.shots.map((planned, index) => {
        const shot = newShot(scene, index + 1);
        shot.title = planned.title || shot.title;
        shot.framing = planned.framing || shot.framing;
        shot.lens = planned.lens || shot.lens;
        shot.movement = planned.movement || shot.movement;
        shot.purpose = planned.purpose || shot.purpose;
        shot.blueprint = { ...defaultShotBlueprint(), narrative: planned.purpose || shot.purpose, camera: planned.camera, lighting: planned.lighting, performance: planned.performance, performanceSource: planned.performance ? "ai" : "", blocking: planned.blocking, motion: planned.motion, audio: planned.audio, effects: planned.effects, continuity: planned.continuity, provenance: "suggested" };
        const imagePrompt = productionPromptFor(scene, shot, "image");
        const videoPrompt = productionPromptFor(scene, shot, "video");
        shot.modelSettings = { ...defaultShotModelSettings(), ...(shot.modelSettings || {}), imagePrompt, videoPrompt, prompt: imagePrompt, cameraInstruction: shot.blueprint.camera, audioInstruction: shot.blueprint.audio };
        return shot;
      });
      expanded += 1;
    });
    setDirty(); render();
    notify(expanded ? `${expanded} scene${expanded === 1 ? "" : "s"} expanded into a full shot list.` : "The shot plan did not match any scene still eligible for expansion.");
  } catch (error) {
    if (button?.isConnected) { button.disabled = false; button.textContent = `Populate all shots (${eligibleCount})`; }
    notify(error?.message || "Shot planning could not be completed.");
  }
}
function captureStoryVersion(reason) {
  project.storyVersions = Array.isArray(project.storyVersions) ? project.storyVersions : [];
  project.storyVersions.unshift({ id: `story-version-${Date.now()}`, reason, createdAt: new Date().toISOString(), story: { logline: project.logline, premise: project.premise, themes: [...(project.themes || [])], scenes: (project.scenes || []).map((scene) => ({ id: scene.id, title: scene.title, note: scene.note })) } });
  project.storyVersions = project.storyVersions.slice(0, 30);
}
// Applies the suggested text to the exact field it was generated from —
// project.logline/premise for scope "logline"/"premise", or the matching
// scene's objective note for scope "scene". Matched by exact title since
// suggestions don't carry a scene id, so a renamed scene simply fails the
// match rather than silently landing on the wrong one.
function suggestionTextarea(id) {
  const selector = `[data-suggestion-text="${CSS.escape(id)}"]`;
  return $("#modalRoot")?.querySelector(selector) || document.querySelector(selector);
}
function updateSuggestionCardDecision(id, status) {
  // The same recommendation can also be visible in the Director workspace
  // behind this modal. Always update/read the modal copy first so accepting an
  // edited proposal affects the control the creator is actually looking at.
  const textarea = suggestionTextarea(id);
  const card = textarea?.closest("article");
  if (!card) return;
  card.classList.remove("suggestion-pending", "suggestion-accepted", "suggestion-rejected");
  card.classList.add(`suggestion-${status}`);
  if (textarea) textarea.disabled = true;
  card.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  const head = card.querySelector(".suggestion-head");
  let badge = head?.querySelector(".suggestion-status");
  if (head && !badge) { badge = document.createElement("b"); badge.className = "suggestion-status"; head.append(badge); }
  if (badge) badge.textContent = status.toUpperCase();
  const remaining = (project.scriptSuggestions || []).filter((item) => !item.status || item.status === "pending").length;
  const acceptAll = $("#acceptAllImportSuggestions");
  if (acceptAll) { acceptAll.textContent = `Accept all ${remaining} remaining`; if (!remaining) acceptAll.remove(); }
}
function acceptScriptSuggestion(id, options = {}) {
  const suggestion = (project.scriptSuggestions || []).find((item) => item.id === id);
  if (!suggestion) return;
  // Read whatever is currently in the editable textarea, not the original
  // AI-proposed text — the user may have tweaked a phrase before accepting.
  // Falls back to the stored suggestedText if the field can't be found.
  const editedText = suggestionTextarea(id)?.value.trim() || suggestion.suggestedText;
  if (!editedText) return notify("This suggestion has no text to apply. Reject it instead.");
  if (suggestion.status && suggestion.status !== "pending") return false;
  if (options.captureVersion !== false) captureStoryVersion(`Before applying: ${suggestion.title}`);
  if (suggestion.scope === "logline") { project.logline = editedText; if ($("#storyLogline")) $("#storyLogline").value = editedText; }
  else if (suggestion.scope === "premise") { project.premise = editedText; if ($("#storyPremise")) $("#storyPremise").value = editedText; }
  else {
    const scene = project.scenes.find((item) => item.title === suggestion.sceneTitle);
    if (!scene) { notify(`Could not find the scene “${suggestion.sceneTitle}” to apply this suggestion.`); return; }
    scene.note = editedText;
    if (shotPlanEligible(scene) && scene.shots?.[0]) {
      const draft = scene.shots[0];
      draft.purpose = editedText;
      draft.blueprint = { ...defaultShotBlueprint(), ...(draft.blueprint || {}), narrative: editedText, provenance: "approved-suggestion" };
      draft.modelSettings = { ...defaultShotModelSettings(), ...(draft.modelSettings || {}), imagePrompt: productionPromptFor(scene, draft, "image"), videoPrompt: productionPromptFor(scene, draft, "video") };
    }
  }
  suggestion.suggestedText = editedText;
  suggestion.status = "accepted";
  suggestion.decidedAt = new Date().toISOString();
  // An accepted editorial choice must affect the production plan, not just a
  // text field. Re-open only untouched/ungenerated scenes for planning so an
  // approved or manually directed shot is never silently replaced.
  // Detailed shot planning is applied once from the review footer, after the
  // creator has made all editorial decisions.
  setDirty();
  if (options.notify !== false) notify(`Accepted: ${suggestion.title}. The remaining recommendations are still available.`);
  updateSuggestionCardDecision(id, "accepted");
  return true;
}
function rejectScriptSuggestion(id) {
  const suggestion = (project.scriptSuggestions || []).find((item) => item.id === id);
  if (!suggestion || (suggestion.status && suggestion.status !== "pending")) return;
  suggestion.status = "rejected";
  suggestion.decidedAt = new Date().toISOString();
  setDirty(); updateSuggestionCardDecision(id, "rejected"); notify("Suggestion rejected. The remaining recommendations are still available.");
}
function acceptAllScriptSuggestions() {
  const pending = (project.scriptSuggestions || []).filter((item) => !item.status || item.status === "pending");
  if (!pending.length) return notify("Every recommendation already has a decision.");
  captureStoryVersion(`Before accepting ${pending.length} story recommendations`);
  let accepted = 0;
  pending.forEach((item) => { if (acceptScriptSuggestion(item.id, { captureVersion: false, notify: false })) accepted += 1; });
  setDirty(); openEnhancementReview(); notify(`${accepted} recommendation${accepted === 1 ? "" : "s"} accepted. Review the full decision set, then build the storyboard.`);
}
async function saveProject(saveAs = false, closing = false) {
  const result = await window.storyMakerDesktop?.saveProject({ project, filePath: saveAs ? "" : filePath, saveAs, suggestedName: `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "untitled-film"}.storymaker` });
  if (!result || result.canceled) { if (closing) window.storyMakerDesktop?.cancelClose(); return; }
  filePath = result.filePath; setDirty(false); render(); notify("Project saved safely."); if (closing) window.storyMakerDesktop?.closeAfterSave();
}
async function openProject() {
  const result = await window.storyMakerDesktop?.openProject();
  if (!result || result.canceled) return;
  // Same gap as New Project: this swaps `project` out from under the same
  // still-open window, so the quit-time save prompt in electron-main.js
  // never gets a chance to catch it. Confirmed after the file picker
  // resolves rather than before, so cancelling the picker itself never
  // shows an unnecessary prompt.
  if (dirty && !confirm(`You have unsaved story work in "${project.name}". Opening a different project will lose it unless you save first. Continue anyway?`)) return;
  project = { ...blankProject(), ...result.project }; ensureProductionShape(); filePath = result.filePath; setDirty(false); active = "Home"; dismissSplash(); render(); notify(result.recovered ? "Recovered the last safe backup." : "Project opened.");
  await refreshProviders(); recoverCompletedGenerationAssets(); recoverQueuedVideoJobs();
}
function chooseStyle(name) {
  ensureProductionShape();
  const legacy = styles.find((style) => style.name === name);
  const dna = [...systemStyleDnas(), ...savedStyleDnas()].find((style) => style.name === name) || (legacy ? legacyStyleToDna(legacy) : null);
  project.style = name;
  if (dna) {
    project.visualDirection.projectStyle = { styleId: dna.id, versionId: dna.versionId, snapshot: structuredClone(dna), patch: {} };
    project.visualDirection.recentlyUsed = [dna.id, ...project.visualDirection.recentlyUsed.filter((id) => id !== dna.id)].slice(0, 20);
  }
  setDirty(); render(); notify(`${name} selected as the project visual direction.`);
}
function applyProjectStyleDna(id) {
  ensureProductionShape(); const dna = styleDnaById(id); if (!dna) return notify("Style not found.");
  project.style = dna.name; project.visualDirection.projectStyle = { styleId: dna.id, versionId: dna.versionId, snapshot: structuredClone(dna), patch: {} };
  project.visualDirection.recentlyUsed = [dna.id, ...project.visualDirection.recentlyUsed.filter((value) => value !== dna.id)].slice(0, 20);
  setDirty(); render(); notify(`${dna.name} is now the project visual direction.`);
}
async function refreshProviders() {
  try {
    const [nextProviderState, nextDiagnostics, nextLocalState] = await Promise.all([
      window.storyMakerDesktop?.providerStatus(),
      window.storyMakerDesktop?.providerDiagnostics?.(),
      window.storyMakerDesktop?.localRuntimeStatus?.()
    ]);
    providerState = nextProviderState || providerState;
    providerDiagnostics = nextDiagnostics || providerDiagnostics;
    localRuntimeState = nextLocalState || localRuntimeState;
  }
  catch { providerState = { encryptionAvailable: false, providers: {}, health: {} }; providerDiagnostics = null; }
  if (active === "Model Hub" || active === "AI Director") render();
}
async function recoverCompletedGenerationAssets({ silent = true } = {}) {
  if (!window.storyMakerDesktop?.recoverGeneratedAssets || !project?.name) return;
  try {
    const known = project.scenes.flatMap((scene) => (scene.shots || []).flatMap((shot) => shot.modelSettings?.outputHistory || []));
    const completed = await window.storyMakerDesktop.recoverGeneratedAssets({ projectId: project.id, jobIds: known.map((job) => job.backendJobId || job.id).filter(Boolean), providerTaskIds: known.map((job) => job.providerTaskId).filter(Boolean) });
    let restored = 0;
    for (const result of completed || []) {
      if (!result?.jobId || recoveredGenerationJobIds.has(result.jobId)) continue;
      let scene = project.scenes.find((item) => item.title === result.sceneTitle);
      let shot = scene ? (scene.shots || []).find((item) => item.title === result.shotTitle) : null;
      if (!shot) {
        for (const candidateScene of project.scenes) {
          const candidateShot = (candidateScene.shots || []).find((item) => (item.modelSettings?.outputHistory || []).some((job) => job.backendJobId === result.jobId || job.providerTaskId === result.providerTaskId));
          if (candidateShot) { scene = candidateScene; shot = candidateShot; break; }
        }
      }
      if (!scene) continue;
      if (!shot) continue;
      const sourceJob = (shot.modelSettings?.outputHistory || []).find((item) => item.backendJobId === result.jobId || item.providerTaskId === result.providerTaskId) || (shot.modelSettings?.outputHistory || [])[0];
      let asset = projectAssets().find((item) => item.path === result.asset?.path);
      if (!asset) {
        asset = { ...result.asset, id: `recovered-output-${result.jobId}`, importedAt: new Date().toISOString(), source: result.provider, generation: { provider: result.provider, model: result.model, backendJobId: result.jobId, sourceFrameAssetId: sourceJob?.sourceFrameAssetId || "", recoveredAt: new Date().toISOString() } };
        project.assets = projectAssets(); project.assets.unshift(asset);
      }
      shot.outputAssetId = asset.id;
      if (asset.kind === "video") syncAutomaticMotionMaster(scene, shot, asset.id);
      shot.modelSettings = shot.modelSettings || {};
      shot.modelSettings.outputHistory = Array.isArray(shot.modelSettings.outputHistory) ? shot.modelSettings.outputHistory : [];
      const job = sourceJob;
      if (job) Object.assign(job, { status: "completed", assetId: asset.id, backendJobId: result.jobId, completedAt: job.completedAt || new Date().toISOString() });
      recoveredGenerationJobIds.add(result.jobId); restored += 1;
    }
    if (restored) { setDirty(); render(); if (!silent) notify(`${restored} completed generation${restored === 1 ? "" : "s"} restored to this project.`); }
  } catch { /* Recovery is best-effort; generation itself is already durable. */ }
}
async function recoverQueuedVideoJobs({ silent = false } = {}) {
  if (jobRecoveryRunning || !window.storyMakerDesktop?.pollShotVideo) return;
  ensureProductionShape();
  const pending = project.scenes.flatMap((scene, sceneIndex) => (scene.shots || []).flatMap((shot, shotIndex) => (shot.modelSettings?.outputHistory || []).filter((job) => ["fal", "kie", "wavespeed"].includes(job.provider) && job.providerTaskId && ["submitting", "queued", "generating", "processing", "submitted"].includes(job.status)).map((job) => ({ scene, sceneIndex, shot, shotIndex, job }))));
  if (!pending.length) return;
  jobRecoveryRunning = true; let changed = 0; let completed = 0;
  try {
    for (const item of pending) {
      if (!providerReady(item.job.provider)) continue;
      try {
        const result = await window.storyMakerDesktop.pollShotVideo({ provider: item.job.provider, taskId: item.job.providerTaskId, model: item.job.model, title: item.shot.title });
        if (!result?.status) continue;
        Object.assign(item.job, { status: result.status, checkedAt: new Date().toISOString(), ...(result.error ? { error: result.error } : {}) }); changed += 1;
        if (result.asset && !item.job.assetId) {
          const generated = { ...result.asset, id: `shot-video-${Date.now()}-${completed}`, importedAt: new Date().toISOString(), source: item.job.provider, generation: { ...(result.generation || {}), sourceFrameAssetId: item.job.sourceFrameAssetId || "", visualDirection: item.job.visualDirection || visualDirectionMetadata(item.scene, item.shot) } };
          project.assets = projectAssets(); project.assets.unshift(generated); item.job.assetId = generated.id; item.shot.outputAssetId = generated.id; syncAutomaticMotionMaster(item.scene, item.shot, generated.id); completed += 1;
        }
      } catch (error) { Object.assign(item.job, { status: "check-failed", checkedAt: new Date().toISOString(), error: error?.message || "Status check failed. Retry from this shot." }); changed += 1; }
    }
  } finally { jobRecoveryRunning = false; }
  // A real completion is worth surfacing even when this run came from the
  // silent 60s background poll — only the "nothing new, just refreshed"
  // case stays silent there, so the user isn't told their video finished
  // rendering only when they happen to reopen the shot.
  if (changed) { setDirty(); render(); if (completed) notify(`${completed} queued video${completed === 1 ? " is" : "s are"} ready to review.`); else if (!silent) notify("Queued video status refreshed. Save this project to retain the update."); }
}
async function saveProvider(provider, apiKey) {
  try {
    providerState = await window.storyMakerDesktop?.saveProviderKey({ provider, apiKey }) || providerState;
    render(); notify(apiKey ? "Provider connected on this PC." : "Provider disconnected.");
  } catch (error) { notify(error.message || "The provider key could not be saved."); }
}
async function verifyProvider(provider, button) {
  if (!window.storyMakerDesktop?.verifyProvider) return notify("Connection checks are available in the packaged Windows app.");
  const original = button?.textContent; if (button) { button.disabled = true; button.textContent = "Checking…"; }
  try { providerState = await window.storyMakerDesktop.verifyProvider(provider) || providerState; render(); const health = providerState.health?.[provider]; notify(health?.state === "verified" ? "Provider credential verified." : (health?.message || "Provider connection status updated.")); }
  catch (error) { await refreshProviders(); notify(error?.message || "The provider connection check failed."); }
  finally { if (button?.isConnected) { button.disabled = false; button.textContent = original; } }
}
function bind() {
  const themeHost = $(".bar-actions");
  if (themeHost && !$("#themeToggle")) { const toggle = document.createElement("button"); toggle.id = "themeToggle"; toggle.type = "button"; toggle.className = "theme-toggle"; toggle.setAttribute("aria-pressed", String(theme === "light")); toggle.innerHTML = `<i></i><span>${theme === "light" ? "Light" : "Dark"}</span>`; themeHost.prepend(toggle); }
  $("#themeToggle")?.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("storymaker-theme", theme); render(); });
  $("#themeToggleSettings")?.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("storymaker-theme", theme); render(); });
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.nav; render(); if (active === "Delivery") refreshDeliveryCapabilities(); if (active === "Model Hub") refreshProviders(); }));
  document.querySelectorAll("[data-style]").forEach((button) => button.addEventListener("click", () => chooseStyle(button.dataset.style)));
  $("#navMode")?.addEventListener("click", () => { navMode = navMode === "full" ? "compact" : navMode === "compact" ? "icons" : "full"; localStorage.setItem("storymaker-navigation", navMode); render(); });
  $("#experienceMode")?.addEventListener("click", () => { experienceMode = experienceMode === "simple" ? "studio" : "simple"; localStorage.setItem("storymaker-experience-mode", experienceMode); render(); notify(`${experienceMode === "simple" ? "Simple" : "Studio"} mode is active.`); });
  ["#newProject", "#newProjectHero", "#newProjectLibrary", "#newProjectEmpty"].forEach((id) => $(id)?.addEventListener("click", openProjectModal));
  ["#quickOpen", "#openProjectHero", "#openProjectHome"].forEach((id) => $(id)?.addEventListener("click", openProject));
  $("#importFileHero")?.addEventListener("click", () => { active = "Story Bible"; render(); importStorySource(); });
  ["#pasteScriptHero", "#pasteScriptHome"].forEach((id) => $(id)?.addEventListener("click", () => { active = "Story Bible"; render(); openPasteStoryModal(); }));
  $("#saveProject")?.addEventListener("click", () => saveProject());
  $("#addCharacter")?.addEventListener("click", addCharacter); $("#addFirstCharacter")?.addEventListener("click", addCharacter);
  $("#addScene")?.addEventListener("click", addScene); $("#addFirstScene")?.addEventListener("click", addScene);
  document.querySelectorAll("[data-generate-scene-shot]").forEach((button) => button.addEventListener("click", () => generateSceneShot(Number(button.dataset.generateSceneShot))));
  document.querySelectorAll("[data-generate-scene-video]").forEach((button) => button.addEventListener("click", () => generateSceneVideo(Number(button.dataset.generateSceneVideo))));
  $("#importMedia")?.addEventListener("click", importMedia); $("#importFirstMedia")?.addEventListener("click", importMedia);
  const importAudioHere = async () => {
    try {
      const additions = await importAssetsIntoProject();
      const audio = additions.filter((asset) => asset.kind === "audio");
      if (!audio.length) return notify(additions.length ? "Files were imported, but none were supported audio files." : "No audio file was selected.");
      render();
      notify(`${audio.length} audio file${audio.length === 1 ? "" : "s"} imported. Add a cue to place audio in the Timeline.`);
    } catch (error) { notify(error?.message || "Audio could not be imported."); }
  };
  $("#importAudioDirect")?.addEventListener("click", importAudioHere);
  $("#importFirstAudioDirect")?.addEventListener("click", importAudioHere);
  $("#importStorySource")?.addEventListener("click", importStorySource);
  $("#pasteStorySource")?.addEventListener("click", openPasteStoryModal);
  $("#runSourceOcr")?.addEventListener("click", runSourceOcr);
  $("#runBreakdown")?.addEventListener("click", runSourceBreakdown);
  $("#addTheme")?.addEventListener("click", addTheme);
  $("#themeInput")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addTheme(); } });
  $("#addLocation")?.addEventListener("click", openLocationModal);
  $("#openSourcePreview")?.addEventListener("click", () => { openSourcePreview(); const modal = $("#modalRoot .source-preview"); if (!modal || !project.ingestion?.analysis) return; const button = document.createElement("button"); button.type = "button"; button.id = "reviewImportedAnalysis"; button.className = "save-button"; button.textContent = "Review parsed analysis"; button.addEventListener("click", openImportReview); modal.insertBefore(button, modal.querySelector("pre")); });
  $("#buildStoryMap")?.addEventListener("click", buildStoryMap);
  $("#refreshContinuity")?.addEventListener("click", () => { ensureProductionShape(); render(); notify("Continuity signals refreshed."); });
  $("#buildShotPlan")?.addEventListener("click", buildShotPlan); $("#buildFirstShotPlan")?.addEventListener("click", buildShotPlan);
  $("#addAudioCue")?.addEventListener("click", openAudioCueModal); $("#addFirstAudioCue")?.addEventListener("click", openAudioCueModal);
  $("#exportProductionPackage")?.addEventListener("click", exportProductionPackage);
  $("#renderVisualPreview")?.addEventListener("click", renderVisualPreview);
  const previewCopy = active === "Delivery" ? $(".delivery-render p") : null;
  if (previewCopy && deliveryState.previewRender) previewCopy.textContent = "Build a 1080p MP4 from the real scene motion masters and generated shot videos. Storyboard stills hold for their planned durations, provider clips are normalized for a reliable cut, and Timeline audio cues are mixed into the preview.";
  document.querySelectorAll("[data-review-delivery-shot]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.reviewDeliveryShot.split(":").map(Number); reviewDeliveryShot(sceneIndex, shotIndex); }));
  document.querySelectorAll("[data-approve-delivery-shot]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.approveDeliveryShot.split(":").map(Number); approveDeliveryShot(sceneIndex, shotIndex); }));
  $("#visualizeScene")?.addEventListener("change", (event) => { selectedSceneIndex = Number(event.target.value); render(); });
  $("#sceneSize")?.addEventListener("change", (event) => { ensureSceneShape(); const scene = project.scenes[selectedSceneIndex]; if (scene) { scene.generationSize = event.target.value; setDirty(); } });
  $("#scenePrompt")?.addEventListener("input", (event) => { ensureSceneShape(); const scene = project.scenes[selectedSceneIndex]; if (scene) { scene.generationPrompt = event.target.value; setDirty(); } });
  $("#sceneModel")?.addEventListener("change", (event) => { const model = modelCatalog.find((item) => item.model === event.target.value); const button = $("#generateSceneImage"); if (button) button.disabled = !model || !providerReady(model.provider); });
  $("#generateSceneImage")?.addEventListener("click", generateSceneImage);
  $("#importSceneReferences")?.addEventListener("click", async () => { try { const additions = await importAssetsIntoProject(); if (additions.length) render(); else notify("No new media was imported."); } catch (error) { notify(error?.message || "Reference media could not be imported."); } });
  document.querySelectorAll(".visual-reference-tray [data-remove-reference-asset]").forEach((button) => button.addEventListener("click", async (event) => { event.preventDefault(); event.stopPropagation(); if (!(await removeReferenceAssetWithConfirm(button.dataset.removeReferenceAsset))) return; render(); }));
  document.querySelectorAll("[data-open-variation]").forEach((button) => button.addEventListener("click", () => openVariation(button.dataset.openVariation)));
  document.querySelectorAll("[data-approve-variation]").forEach((button) => button.addEventListener("click", () => approveVariation(button.dataset.approveVariation)));
  $("#requestLiveDirectorReview")?.addEventListener("click", requestLiveDirectorReview);
  $("#applyLiveDirectorReview")?.addEventListener("click", applyLiveDirectorReview);
  $("#requestScriptImprovements")?.addEventListener("click", requestScriptImprovements);
  $("#translateCreativeInfluence")?.addEventListener("click", translateCreativeInfluence);
  $("#recommendStyles")?.addEventListener("click", requestStyleRecommendations);
  $("#populateAllShots")?.addEventListener("click", populateAllShots);
  document.querySelectorAll("[data-toggle-field-lock]").forEach((button) => button.addEventListener("click", () => toggleFieldLock(button.dataset.toggleFieldLock)));
  document.querySelectorAll("[data-accept-suggestion]").forEach((button) => button.addEventListener("click", () => acceptScriptSuggestion(button.dataset.acceptSuggestion)));
  document.querySelectorAll("[data-reject-suggestion]").forEach((button) => button.addEventListener("click", () => rejectScriptSuggestion(button.dataset.rejectSuggestion)));
  $("#fillPrompt")?.addEventListener("click", () => { const field = $("#storyPremise"); field.value = "The price of holding on to a beautiful lie."; project.premise = field.value; setDirty(); notify("Director's prompt added."); });
  $("#themeSelect")?.addEventListener("change", (event) => { theme = event.target.value; localStorage.setItem("storymaker-theme", theme); render(); });
  $("#navSelect")?.addEventListener("change", (event) => { navMode = event.target.value; localStorage.setItem("storymaker-navigation", navMode); render(); });
  $("#experienceSelect")?.addEventListener("change", (event) => { experienceMode = event.target.value; localStorage.setItem("storymaker-experience-mode", experienceMode); render(); notify(`${experienceMode === "simple" ? "Simple" : "Studio"} mode is active.`); });
  [["#storyName", "name"], ["#storyLogline", "logline"], ["#storyPremise", "premise"], ["#storyWorld", "world"], ["#storyRules", "rules"], ["#storyRelationships", "relationships"]].forEach(([id, key]) => $(id)?.addEventListener("input", (event) => { project[key] = event.target.value; setDirty(); }));
  document.querySelectorAll("[data-edit-character]").forEach((button) => button.addEventListener("click", () => openCharacterModal(Number(button.dataset.editCharacter))));
  document.querySelectorAll("[data-open-character-lab]").forEach((button) => button.addEventListener("click", () => openCharacterLab(Number(button.dataset.openCharacterLab))));
  document.querySelectorAll("[data-remove-character]").forEach((button) => button.addEventListener("click", () => {
    ensureProductionShape(); const index = Number(button.dataset.removeCharacter); const character = project.characters[index]; if (!character) return;
    const sceneCount = project.scenes.filter((scene) => (scene.castIds || []).includes(character.id)).length;
    // Every other delete in this app confirms (Style DNA, media assets, a
    // single reference image) — this one didn't, despite destroying far more:
    // the whole production profile (appearance, wardrobe, voice, objective,
    // movement, continuity rules) plus every reference tag, permanently, in
    // one click with no undo.
    if (!confirm(`Remove "${character.name}"${sceneCount ? ` — cast in ${sceneCount} scene${sceneCount === 1 ? "" : "s"}` : ""}? This deletes their whole production profile and cannot be undone.`)) return;
    project.scenes.forEach((scene) => { scene.castIds = (scene.castIds || []).filter((id) => id !== character.id); });
    project.characters.splice(index, 1); setDirty(); render();
  }));
  $("#addSet")?.addEventListener("click", addSet); $("#addFirstSet")?.addEventListener("click", addSet);
  document.querySelectorAll("[data-edit-set]").forEach((button) => button.addEventListener("click", () => openSetModal(Number(button.dataset.editSet))));
  document.querySelectorAll("[data-open-set-lab]").forEach((button) => button.addEventListener("click", () => openSetLab(Number(button.dataset.openSetLab))));
  document.querySelectorAll("[data-assign-set]").forEach((button) => button.addEventListener("click", () => openEntitySceneAssignments("set", Number(button.dataset.assignSet))));
  document.querySelectorAll("[data-remove-set]").forEach((button) => button.addEventListener("click", () => {
    ensureProductionShape(); const index = Number(button.dataset.removeSet); const set = project.sets[index]; if (!set) return;
    const sceneCount = project.scenes.filter((scene) => (scene.setIds || []).includes(set.id)).length;
    if (!confirm(`Remove "${set.name}"${sceneCount ? ` — used in ${sceneCount} scene${sceneCount === 1 ? "" : "s"}` : ""}? This deletes its whole location profile and cannot be undone.`)) return;
    project.scenes.forEach((scene) => { scene.setIds = (scene.setIds || []).filter((id) => id !== set.id); });
    project.sets.splice(index, 1); setDirty(); render();
  }));
  // Vestigial: this used to inject the Props library right after the
  // Storyboard's inline Sets section (".design-sets"). 0.4.47 gave Locations
  // and Props & Accessories their own dedicated top-level workspaces and
  // pulled both out of the Storyboard wall — nothing renders ".design-sets"
  // anymore, so $(".design-sets") is always null and this block can never
  // run. Left dead rather than silently doing nothing was more likely to
  // mislead a future read of this function than removing it.
  $("#addProductionAsset")?.addEventListener("click", addProductionAsset); $("#addFirstProductionAsset")?.addEventListener("click", addProductionAsset);
  document.querySelectorAll("[data-edit-production-asset]").forEach((button) => button.addEventListener("click", () => openProductionAssetModal(Number(button.dataset.editProductionAsset))));
  document.querySelectorAll("[data-open-prop-lab]").forEach((button) => button.addEventListener("click", () => openPropLab(Number(button.dataset.openPropLab))));
  document.querySelectorAll("[data-assign-production-asset]").forEach((button) => button.addEventListener("click", () => openEntitySceneAssignments("prop", Number(button.dataset.assignProductionAsset))));
  document.querySelectorAll("[data-remove-production-asset]").forEach((button) => button.addEventListener("click", () => {
    ensureProductionShape(); const index = Number(button.dataset.removeProductionAsset); const item = project.props[index]; if (!item) return;
    const sceneCount = project.scenes.filter((scene) => (scene.propIds || []).includes(item.id)).length;
    if (!confirm(`Remove "${item.name}"${sceneCount ? ` — used in ${sceneCount} scene${sceneCount === 1 ? "" : "s"}` : ""}? This deletes its whole prop profile and cannot be undone.`)) return;
    project.scenes.forEach((scene) => { scene.propIds = (scene.propIds || []).filter((id) => id !== item.id); });
    project.props.splice(index, 1); setDirty(); render();
  }));
  document.querySelectorAll("[data-remove-theme]").forEach((button) => button.addEventListener("click", () => { project.themes.splice(Number(button.dataset.removeTheme), 1); setDirty(); render(); }));
  document.querySelectorAll("[data-remove-location]").forEach((button) => button.addEventListener("click", () => { project.locations.splice(Number(button.dataset.removeLocation), 1); setDirty(); render(); }));
  document.querySelectorAll("[data-media-filter]").forEach((button) => button.addEventListener("click", () => { mediaFilter = button.dataset.mediaFilter; render(); }));
  document.querySelectorAll("[data-design-filter]").forEach((button) => button.addEventListener("click", () => { designFilter = button.dataset.designFilter || "all"; render(); }));
  document.querySelectorAll("[data-attach-asset]").forEach((button) => button.addEventListener("click", () => attachMediaToScene(button.dataset.attachAsset)));
  document.querySelectorAll("[data-preview-asset]").forEach((button) => button.addEventListener("click", () => openVariation(button.dataset.previewAsset)));
  document.querySelectorAll("[data-download-asset]").forEach((button) => button.addEventListener("click", () => downloadAsset(button.dataset.downloadAsset)));
  document.querySelectorAll("[data-select-shot-take]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex, assetId] = button.dataset.selectShotTake.split(":"); selectShotTake(Number(sceneIndex), Number(shotIndex), assetId); }));
  document.querySelectorAll("[data-remove-asset]").forEach((button) => button.addEventListener("click", () => removeMedia(button.dataset.removeAsset)));
  document.querySelectorAll(".media-card").forEach((card) => { const assetId = card.querySelector("[data-remove-asset]")?.dataset.removeAsset; const actions = card.querySelector(".media-card-copy>div"); const preview = card.querySelector(".media-preview"); if (!assetId || !actions) return; if (!actions.querySelector("[data-preview-asset]")) { const previewButton = document.createElement("button"); previewButton.type = "button"; previewButton.className = "quiet-button"; previewButton.dataset.previewAsset = assetId; previewButton.textContent = "Preview"; previewButton.addEventListener("click", () => openVariation(assetId)); actions.prepend(previewButton); const downloadButton = document.createElement("button"); downloadButton.type = "button"; downloadButton.className = "quiet-button"; downloadButton.dataset.downloadAsset = assetId; downloadButton.textContent = "Download"; downloadButton.addEventListener("click", () => downloadAsset(assetId)); actions.insertBefore(downloadButton, previewButton.nextSibling); } if (preview) { preview.tabIndex = 0; preview.setAttribute("role", "button"); preview.setAttribute("aria-label", "Preview media"); preview.addEventListener("click", () => openVariation(assetId)); preview.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openVariation(assetId); } }); } });
  $("#cleanUnusedMedia")?.addEventListener("click", () => cleanUnusedMedia());
  document.querySelectorAll("[data-edit-scene]").forEach((button) => button.addEventListener("click", () => openSceneProductionModal(Number(button.dataset.editScene))));
  document.querySelectorAll("[data-view-scene-output]").forEach((button) => button.addEventListener("click", () => openVariation(button.dataset.viewSceneOutput)));
  document.querySelectorAll("[data-add-shot]").forEach((button) => button.addEventListener("click", () => addShot(Number(button.dataset.addShot))));
  document.querySelectorAll("[data-direct-shot]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.directShot.split(":").map(Number); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex); }));
  document.querySelectorAll("[data-prime-shot-image]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.primeShotImage.split(":").map(Number); primeShotImage(sceneIndex, shotIndex); }));
  document.querySelectorAll("[data-prime-shot-video]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.primeShotVideo.split(":").map(Number); primeShotVideo(sceneIndex, shotIndex); }));
  document.querySelectorAll(".shot-model-card").forEach((card) => { const target = card.querySelector("[data-direct-shot]")?.dataset.directShot; if (!target) return; const [sceneIndex, shotIndex] = target.split(":").map(Number); const scene = project.scenes?.[sceneIndex]; const shot = scene?.shots?.[shotIndex]; const asset = assetById(shot?.outputAssetId) || sceneGeneratedAsset(scene); if (!asset?.path || card.querySelector(".shot-model-visual")) return; const visual = document.createElement("button"); visual.type = "button"; visual.className = "shot-model-visual"; visual.dataset.previewAsset = asset.id; visual.title = "Preview selected take"; visual.innerHTML = asset.kind === "video" ? `<video src="${esc(fileUrl(asset))}" muted playsinline preload="metadata"></video><span>▶ VIDEO</span>` : `<img src="${esc(fileUrl(asset))}" alt="" /><span>IMAGE</span>`; visual.addEventListener("click", () => openVariation(asset.id)); const video = visual.querySelector("video"); visual.addEventListener("mouseenter", () => video?.play().catch(() => {})); visual.addEventListener("mouseleave", () => { if (video) { video.pause(); video.currentTime = 0; } }); card.querySelector("h2")?.before(visual); });
  document.querySelectorAll("[data-open-timeline-scene]").forEach((button) => button.addEventListener("click", () => { selectedSceneIndex = Number(button.dataset.openTimelineScene); active = "Motion Graphics"; render(); }));
  document.querySelectorAll("[data-direct-timeline-shot]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.directTimelineShot.split(":").map(Number); openShotDirector(sceneIndex, shotIndex); enhanceShotDirector(sceneIndex, shotIndex); }));
  document.querySelectorAll("[data-timeline-shot-duration]").forEach((field) => field.addEventListener("change", () => { const [sceneIndex, shotIndex] = field.dataset.timelineShotDuration.split(":").map(Number); const shot = project.scenes[sceneIndex]?.shots?.[shotIndex]; if (shot) { shot.duration = String(numericDuration(field.value)); setDirty(); render(); } }));
  document.querySelectorAll("[data-move-shot-up]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.moveShotUp.split(":").map(Number); moveShot(sceneIndex, shotIndex, -1); }));
  document.querySelectorAll("[data-move-shot-down]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.moveShotDown.split(":").map(Number); moveShot(sceneIndex, shotIndex, 1); }));
  document.querySelectorAll("[data-timeline-transition]").forEach((field) => field.addEventListener("change", () => { const scene = project.scenes[Number(field.dataset.timelineTransition)]; if (scene) { scene.timeline.transition = field.value; setDirty(); render(); } }));
  document.querySelectorAll("[data-timeline-transition-duration]").forEach((field) => field.addEventListener("change", () => { const scene = project.scenes[Number(field.dataset.timelineTransitionDuration)]; if (scene) { scene.timeline.transitionDuration = String(numericDuration(field.value)); setDirty(); render(); } }));
  document.querySelectorAll("[data-toggle-timeline-scene]").forEach((button) => button.addEventListener("click", () => { const scene = project.scenes[Number(button.dataset.toggleTimelineScene)]; if (scene) { scene.timeline.collapsed = !scene.timeline.collapsed; setDirty(); render(); } }));
  ["#addTimelineAudio", "#addTimelineAudioSecondary"].forEach((id) => $(id)?.addEventListener("click", () => openAudioCueModal()));
  document.querySelectorAll("[data-remove-audio-cue]").forEach((button) => button.addEventListener("click", () => removeAudioCue(button.dataset.removeAudioCue)));
  document.querySelectorAll("[data-edit-audio-cue]").forEach((button) => button.addEventListener("click", () => openAudioCueModal(button.dataset.editAudioCue)));
  document.querySelectorAll("[data-remove-shot]").forEach((button) => button.addEventListener("click", () => { const [sceneIndex, shotIndex] = button.dataset.removeShot.split(":").map(Number); removeShot(sceneIndex, shotIndex); }));
  document.querySelectorAll("[data-provider-form]").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); const key = form.querySelector("input").value.trim(); if (!key) return notify("Paste an API key first."); saveProvider(form.dataset.providerForm, key); }));
  $("#refreshLocalRuntimes")?.addEventListener("click", async (event) => { event.currentTarget.disabled = true; event.currentTarget.textContent = "Checking…"; await refreshProviders(); notify("Local engine status refreshed."); });
  document.querySelectorAll("[data-verify-provider]").forEach((button) => button.addEventListener("click", () => verifyProvider(button.dataset.verifyProvider, button)));
  document.querySelectorAll("[data-remove-provider]").forEach((button) => button.addEventListener("click", () => saveProvider(button.dataset.removeProvider, "")));
  // Visual Direction is a production control, not a hidden library feature.
  // Surface the inherited look directly on the storyboard without duplicating
  // state or introducing a second visual system.
  if (active === "Storyboard") {
    const storyActions = $(".board-workspace .workspace-heading .story-actions");
    if (storyActions && !storyActions.querySelector("[data-open-storyboard-visual-direction]")) {
      const openDirection = document.createElement("button");
      openDirection.type = "button";
      openDirection.className = "quiet-button";
      openDirection.dataset.openStoryboardVisualDirection = "true";
      openDirection.textContent = "Visual Direction";
      openDirection.addEventListener("click", () => { active = "Style Library"; render(); });
      storyActions.prepend(openDirection);
    }
    const beatline = $(".board-workspace .beatline");
    if (beatline && !$(".storyboard-visual-notice")) {
      const direction = visualDirectionSummary();
      const notice = document.createElement("section");
      notice.className = "storyboard-notice storyboard-visual-notice";
      notice.innerHTML = `<div><strong>${esc(direction.name === "Not set" ? "Visual direction needs a decision" : `Visual direction · ${direction.name}`)}</strong><span>${esc(direction.name === "Not set" ? "Set the project look before generation so every scene inherits the same lighting, camera, material, and negative-constraint rules." : "Every scene inherits this look until you deliberately override it in Shot Planner.")}</span></div><button type="button" class="${direction.name === "Not set" ? "save-button" : "quiet-button"}">${direction.name === "Not set" ? "Set visual direction" : "Review look"}</button>`;
      notice.querySelector("button").addEventListener("click", () => { active = "Style Library"; render(); });
      beatline.insertAdjacentElement("afterend", notice);
    }
    document.querySelectorAll(".scene-card").forEach((card, index) => {
      if (card.querySelector(".scene-visual-direction")) return;
      const scene = project.scenes[index]; const direction = visualDirectionSummary(scene);
      const control = document.createElement("button");
      control.type = "button"; control.className = "scene-visual-direction";
      control.innerHTML = `<small>LOOK</small><b>${esc(direction.name)}</b><span>${esc(direction.source)}</span>`;
      control.title = "Open Visual Direction";
      control.addEventListener("click", () => { active = "Style Library"; render(); });
      card.querySelector(".scene-card-actions")?.before(control);
    });
  }
  // Style Library bindings
  document.querySelectorAll("[data-help-topic]").forEach((button) => button.addEventListener("click", () => { helpTopic = button.dataset.helpTopic; render(); }));
  $("#openStyleCreator")?.addEventListener("click", () => openStyleCreator());
  $("#openStyleMixer")?.addEventListener("click", openStyleMixer);
  $("#manageMyStyles")?.addEventListener("click", openMyStylesManager);
  $("#importStylePackage")?.addEventListener("click", async () => { if (!window.storyMakerDesktop?.importUserStyle) return notify("Style import is available in the packaged desktop app."); try { const result = await window.storyMakerDesktop.importUserStyle(); if (result?.canceled || !result?.style) return; const imported = saveStyleDraft({ ...result.style, id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, source: "imported", version: 1, parentStyleId: "" }, result.style.referenceAssets || []); userStyleDnas = (await window.storyMakerDesktop.saveUserStyle(imported)).map(defaultStyleDna); render(); openStyleDetail(imported.id); notify(`Imported ${imported.name} into this project and My Styles.`); } catch (error) { notify(error?.message || "Style package could not be imported."); } });
  $("#exportProjectStyle")?.addEventListener("click", async () => { const style = project.visualDirection.projectStyle?.snapshot; if (!style || !window.storyMakerDesktop?.exportUserStyle) return notify("Choose a project style before exporting."); try { const result = await window.storyMakerDesktop.exportUserStyle(style); if (!result?.canceled) notify("Style package exported."); } catch (error) { notify(error?.message || "Style package could not be exported."); } });
  $("#visualStyleSearch")?.addEventListener("input", (event) => { visualStyleQuery = event.target.value; render(); });
  $("#clearStyleSearch")?.addEventListener("click", () => { visualStyleQuery = ""; visualStyleScope = "all"; render(); });
  document.querySelectorAll("[data-style-scope]").forEach((button) => button.addEventListener("click", () => { visualStyleScope = button.dataset.styleScope; render(); }));
  $("#styleStrength")?.addEventListener("change", (event) => { project.visualDirection.styleStrength = event.target.value; setDirty(); notify(`Style strength set to ${event.target.value}. Future prompts will use the new emphasis.`); });
  $("#modelHubSearch")?.addEventListener("input", (event) => { modelHubQuery = event.target.value; render(); requestAnimationFrame(() => { const input = $("#modelHubSearch"); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }); });
  document.querySelectorAll("[data-model-hub-filter]").forEach((button) => button.addEventListener("click", () => { modelHubFilter = button.dataset.modelHubFilter; render(); }));
  document.querySelectorAll("[data-style-detail]").forEach((button) => button.addEventListener("click", () => openStyleDetail(button.dataset.styleDetail)));
  document.querySelectorAll("[data-apply-project-style]").forEach((button) => button.addEventListener("click", () => applyProjectStyleDna(button.dataset.applyProjectStyle)));
  document.querySelectorAll("[data-toggle-style-favorite]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.toggleStyleFavorite; const favorites = project.visualDirection.favorites; const index = favorites.indexOf(id); if (index >= 0) favorites.splice(index, 1); else favorites.push(id); setDirty(); render(); }));
  document.querySelectorAll("[data-save-style-dna]").forEach((button) => button.addEventListener("click", () => openSaveStyleDnaModal(Number(button.dataset.saveStyleDna))));
  document.querySelectorAll("[data-check-scene-drift]").forEach((button) => button.addEventListener("click", () => { const sceneIndex = Number(button.dataset.checkSceneDrift); const assetId = button.dataset.assetId; triggerDriftCheck(sceneIndex, assetId); }));
  document.querySelectorAll("[data-apply-dna]").forEach((button) => button.addEventListener("click", () => openApplyDnaModal(button.dataset.applyDna)));
  document.querySelectorAll("[data-delete-dna]").forEach((button) => button.addEventListener("click", () => { if (confirm("Delete this Style DNA? This cannot be undone.")) { deleteStyleDna(button.dataset.deleteDna); render(); } }));
  $("#driftCheckForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const dnaId = $("#driftCheckDna")?.value;
    const assetId = $("#driftCheckAsset")?.value;
    if (!dnaId || !assetId) return;
    // Attribute the check to whichever scene actually generated this asset
    // (so its history lands on the right card), falling back to the
    // currently selected scene when the asset isn't a scene's current take.
    const ownerIndex = project.scenes.findIndex((scene) => sceneGeneratedAsset(scene)?.id === assetId);
    const sceneIndex = ownerIndex >= 0 ? ownerIndex : selectedSceneIndex;
    if (!project.scenes[sceneIndex]) return notify("No scene available for this check.");
    const report = await checkStyleDrift(assetId, dnaId, sceneIndex);
    if (report) openDriftReportModal(report);
  });
  $("#checkAllScenesDrift")?.addEventListener("click", checkAllScenesDrift);
}
window.storyMakerDesktop?.onCommand((command) => {
  if (command === "new") { dismissSplash(); openProjectModal(); }
  if (command === "paste-source") { dismissSplash(); importStoryFromClipboard(); }
  if (command === "open") { dismissSplash(); openProject(); }
  if (command === "save") saveProject();
  if (command === "save-as") saveProject(true);
  if (command === "save-and-close") saveProject(false, true);
  if (command === "settings") { active = "Settings"; dismissSplash(); render(); }
  if (command === "help") { active = "Help"; dismissSplash(); render(); }
});

render();
ensureLightboxDelegation();
window.storyMakerDesktop?.listUserStyles?.().then((styles) => { userStyleDnas = Array.isArray(styles) ? styles.map(defaultStyleDna) : []; if (active === "Style Library") render(); }).catch(() => { userStyleDnas = []; });
refreshProviders().then(() => { recoverCompletedGenerationAssets({ silent: true }); recoverQueuedVideoJobs({ silent: true }); });
setInterval(() => { recoverCompletedGenerationAssets({ silent: true }); recoverQueuedVideoJobs({ silent: true }); }, 60000);
refreshDeliveryCapabilities();
