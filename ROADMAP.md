# Kozy ESO PvP Builds — Project Roadmap
**For Claude Code | Version 10.0**
**Owner:** Kozy | **Developer:** Claude Code
**Note:** This is both a real project and a learning experience for the owner. Claude Code must explain its decisions, not just execute them. Each task is an opportunity to build understanding.

---

## Changelog

| Version | Key changes |
|---|---|
| v1.0 | Initial roadmap |
| v2.0 | LibSets replaces ESOHub scraping; SEO/mobile moved to M0; Open Questions resolved; learning context added |
| v3.0 | LibSets abandoned; manual curation + UESP adopted; set/skill schemas enriched; filter architecture documented; og:image strategy defined; morph modeling added; accessibility moved to M0; basic data testing added to M2 |
| v4.0 | Projet renommé "Kozy ESO PvP Builds" ; palette redesignée noir & violet ; migration Astro 6 Content Layer documentée ; M0 et M1 terminés ; pré-checklist M2 partiellement complétée ; section "Modifications en cours de route" ajoutée |
| v5.0 | M2 terminé ; SetCard + SkillBar construits ; icônes auto-téléchargées via UESP API ; morphs vérifiés et corrigés ; vigor → resolving-vigor ; data integrity check ; workflow post-patch documenté |
| v6.0 | M3 terminé ; page 404 custom ; contraste text-muted #6b6585 → #7d77a0 (WCAG AA) ; preconnect Google Fonts ; SkillBar tooltips accessibles au clavier (tabindex + :focus-within) |
| v7.0 | Stats/Champion Points/Consumables sur les pages de build ; dropdown nav CSS-only avec 7 classes + Subclass ; index Builds avec pills et compteurs ; 6 builds placeholder ; "Articles" renommé "Guides" (collection, pages, layout, nav, RSS) ; 2 nouveaux guides (crit res/dmg) ; Google Fonts @import → link tag (Lighthouse 89→99) ; correction liens cassés homepage + 404 |
| v8.0 | M4 terminé : Decap CMS configuré (`/public/admin/`) ; OAuth proxy GitHub déployé sur Cloudflare Workers (`kozy-eso-oauth.simbad14100.workers.dev`) ; workflow éditorial Draft→Ready→Publish via branches PR GitHub ; Cloudflare Access Zero Trust configuré pour `/admin` (activation complète sur domaine custom) ; bugfixes TypeScript : `updatedAt` accepte `string\|Date`, champs `note/target/stats/food.alt/mundus` rendus optionnels |
| v9.0 | M5 terminé : `morph_rationale` généré et audité pour les 389 skills morph du jeu — classes, weapon, guild, armor, Alliance War, World (Vampire/Werewolf/Soul Magic) ; script `gen-morph-rationale.mjs` créé (UESP API + regex) ; 3 scripts de correction batch (214 corrections) ; audit intégrité : `morph_sibling` corrigé sur `quick-cloak` et `reverse-slice` ; classe `Armor` ajoutée au scope du générateur |
| v10.0 | M6 terminé : `skill_line_id` ajouté sur les 1208 skills + `skill-lines-index.json` (21 entrées, 7 classes × 3 lignes) ; `fetch-eso-meta.mjs` — scraper UESP wiki pour races (10), mundus stones (13), traits (27), enchants/glyphes (38) ; indices plats dans `src/data/eso/` ; migration one-shot `migrate-add-skill-line-id.mjs` (idempotente) |
| v10.1 | Race ajoutée sur les builds : collection `races` enregistrée dans `content.config.ts` (Zod) ; champ `race` optionnel dans le frontmatter builds ; section Race dans les pages de build (passives) + cellule masthead + entrée TOC ; Imperial `alliance: "Other"` supporté |

---

## 0. Project Overview

Site dédié aux builds PvP ESO. Builds optimisés, guides de rotation, et breakdowns de mécaniques pour Elder Scrolls Online. Pas un agrégateur — un espace curé où l'auteur publie ses analyses et ses choix de build avec le raisonnement derrière.

### Core identity
- **Audience:** Joueurs ESO intermédiaires qui veulent comprendre les mécaniques, pas juste copier un build
- **Language:** English (contenu) / French (collaboration Claude Code ↔ Kozy)
- **Tone:** Analytique, direct, sans rembourrage
- **Design philosophy:** Noir & Violet — moderne, épuré, gaming sans être criard

### Dual goal
L'auteur veut **à la fois** apprendre à travers ce projet **et** livrer un site sérieux en production. Claude Code doit traiter chaque décision d'implémentation comme une opportunité pédagogique.

### Non-goals (explicitly out of scope)
- Real-time stat calculator or build simulator
- User-generated content or community builds
- Live sync with any external API
- Monetization features at launch

---

## 1. Technical Decisions (Validated)

| Decision | Choice | Rationale |
|---|---|---|
| **Framework** | Astro 6 | Static site, zero server, free hosting, excellent for content-heavy sites |
| **Hosting** | Cloudflare Pages (free tier) | CD/CI from Git, instant deploys, custom domain support |
| **Content format** | Markdown + Astro Content Layer | Simple to write and maintain for non-developers |
| **Styling** | Tailwind CSS v4 | Utility-first, tokens via `@theme` dans le CSS — pas de config JS |
| **ESO data strategy** | Manual curation per build, UESP as reference | See Section 3 |
| **Build index filtering** | Server-side static filtering via Astro (no client JS) | See Section 3 note |
| **Version control** | Git + GitHub | Required for Cloudflare Pages CD |

### Why NOT WordPress
Rejected: free tier includes ads and subdomain, interactive features require paid plugins, long-term technical debt for a non-developer owner.

### Why NOT Next.js (at this stage)
Deferred: over-engineered for a content site at launch. Migration path exists if interactive tools become central later.

### Why NOT scraping ESOHub
Rejected: ToS likely prohibits redistribution of structured data, database copyright applies, HTML structure fragile.

### Why NOT LibSets
Rejected after verification:
- Does not provide set bonus descriptions (the core data needed for SetCard)
- License (CC-BY-ND) prohibits derivatives
- Export workflow is not a simple JSON dump
- Wrong tool for this use case

### Why NOT client-side filtering (React/Vue Island)
Deferred: Astro is zero-JS by default. Static pre-rendered filter pages (one page per class) are sufficient and keep the site fast and simple.

### Note Astro 6 — Content Layer
En Astro 6, la configuration des Content Collections a changé :
- Fichier config : `src/content.config.ts` (plus `src/content/config.ts`)
- Chaque collection requiert un `loader` explicite (ex: `glob()`)
- `entry.slug` → `entry.id`
- `entry.render()` → `import { render } from 'astro:content'` puis `render(entry)`

---

## 2. Architecture

```
/
├── src/
│   ├── content/
│   │   ├── builds/          ← Build pages (Markdown)
│   │   ├── guides/          ← Guides et analyses (Markdown)
│   │   ├── sets/            ← ESO set data, hand-curated JSON (one file per set)
│   │   ├── skills/          ← ESO skill data, hand-curated JSON (one file per skill)
│   │   ├── races/           ← 10 races scrapées UESP (passives, alliance) ✅
│   │   ├── mundus/          ← 13 mundus stones scrapées UESP ✅
│   │   ├── traits/          ← 27 traits weapon/armor/jewelry scrapés UESP ✅
│   │   └── enchants/        ← 38 glyphes weapon/armor/jewelry scrapés UESP ✅
│   ├── components/
│   │   ├── SetCard.astro    ← Reusable set display card ✅
│   │   ├── SkillBar.astro   ← Skill display component 2-bar layout ✅
│   │   ├── Callout.astro    ← Guide annotations (formula, note, warning) ✅
│   │   ├── BuildCard.astro  ← Card for build index listing ✅
│   │   ├── StatBlock.astro  ← 3 stat cards (Health/Magicka/Stamina) ✅
│   │   ├── ChampionPoints.astro ← Grille constellations avec priorités ✅
│   │   ├── Consumables.astro ← Food / Potion / Poison ✅
│   │   ├── Header.astro     ← Dropdown CSS-only Builds + nav Guides ✅
│   │   └── Footer.astro     ✅
│   ├── layouts/
│   │   ├── Base.astro       ← Meta tags, OG, mobile, a11y ✅
│   │   ├── Guide.astro      ✅
│   │   └── Build.astro      ← Stats · Skills · Sets · Consumables · ChampionPoints ✅
│   ├── pages/
│   │   ├── index.astro      ✅
│   │   ├── builds/
│   │   │   ├── index.astro           ← Pills par classe + compteurs ✅
│   │   │   ├── [slug].astro          ✅
│   │   │   ├── class/[class].astro   ✅
│   │   │   └── subclass/index.astro  ← Placeholder ✅
│   │   ├── guides/
│   │   │   ├── index.astro           ✅
│   │   │   └── [slug].astro          ✅
│   │   └── rss.xml.ts               ✅
│   ├── styles/
│   │   └── global.css       ✅
│   └── content.config.ts    ← Schémas Zod (Astro 6) ✅
├── public/
│   ├── assets/
│   │   ├── og/              ← og-default.svg + og-default.png ✅
│   │   └── skills/          ← Icônes PNG des skills ({id}.png) ✅
│   └── robots.txt           ✅
├── scripts/
│   ├── fetch-eso-data.mjs           ← Scrape esolog API → sets + skills JSON ✅
│   ├── fetch-eso-meta.mjs           ← Scrape UESP wiki → races/mundus/traits/enchants ✅
│   ├── fetch-skill-icons.mjs        ← Télécharge les icônes PNG des skills via UESP ✅
│   └── migrate-add-skill-line-id.mjs ← Migration one-shot skill_line_id (idempotente) ✅
├── src/data/eso/
│   ├── sets-index.json              ✅
│   ├── skills-index.json            ✅  (enrichi: skill_line_id, type, icon, morph_of)
│   ├── skill-lines-index.json       ✅  (21 entrées: 7 classes × 3 lignes)
│   ├── races-index.json             ✅
│   ├── mundus-index.json            ✅
│   ├── traits-index.json            ✅
│   └── enchants-index.json          ✅
├── CLAUDE.md                ✅
├── astro.config.mjs         ✅
└── package.json
```

### URL structure
- `/` — Homepage ✅
- `/builds` — Full build index ✅
- `/builds/[slug]` — Individual build page (ex: `/builds/superstar`) ✅
- `/builds/class/dragonknight` — Pre-rendered filtered view by class ✅
- `/guides` — Guide index ✅
- `/guides/[slug]` — Individual guide ✅
- `/builds/subclass` — Index subclass builds (placeholder) ✅
- `/rss.xml` — Flux RSS ✅
- `/sitemap-index.xml` — Sitemap automatique ✅

---

## 3. ESO Data Strategy

### Why manual curation
After evaluating all options, manual curation is the correct choice for this project at this scale:
- ~2 builds/month, each using ~5 sets → ~10 set entries/month
- Skills change rarely and are hand-maintained
- UESP (uesp.net) is licensed CC-BY-SA — cleanest legal basis available
- No external runtime dependency, no fragile scraping

**Reference source:** UESP for accuracy verification. ESOHub outbound link on each SetCard.

### Set data schema (one JSON file per set in `src/content/sets/`)
```json
{
  "id": "mothers-sorrow",
  "name": "Mother's Sorrow",
  "type": "Light Armor",
  "acquisition": "Overland",
  "location": "Deshaan",
  "dlc": "Base Game",
  "pieces": 5,
  "slots": ["head", "shoulders", "chest", "hands", "waist", "legs", "feet", "ring", "necklace"],
  "patch_verified": "Gold Road (Q2 2024)",
  "bonuses": [
    { "count": 2, "stat": "Max Magicka", "value": 1096 },
    { "count": 3, "stat": "Spell Damage", "value": 129 },
    { "count": 4, "stat": "Max Magicka", "value": 1096 },
    { "count": 5, "stat": "Spell Critical", "value": "12%" }
  ],
  "uesp_url": "https://en.uesp.net/wiki/Online:Mother%27s_Sorrow",
  "esohub_url": "https://eso-hub.com/en/sets/mothers-sorrow"
}
```

**Types valides :** `Light Armor` | `Medium Armor` | `Heavy Armor` | `Jewelry` | `Weapon` | `Mixed` | `Monster` | `Mythic`
**Acquisition types:** `Overland` | `Dungeon` | `Trial` | `PvP` | `Crafted` | `Mythic` | `Monster` | `Arena`

**Note lecture captures in-game :** couleur du nom du slot = poids de la pièce (rouge = Heavy, vert = Medium, bleu = Light).

### Skill data schema (one JSON file per skill in `src/content/skills/`)
```json
{
  "id": "incapacitating-strike",
  "name": "Incapacitating Strike",
  "base_skill": "Death Stroke",
  "morph_of": "death-stroke",
  "morph_sibling": "soul-harvest",
  "morph_rationale": "Preferred over Soul Harvest for the Major Defile application.",
  "class": "Nightblade",
  "skill_line": "Assassination",
  "type": "Ultimate",
  "resource": "Ultimate",
  "icon": "/assets/skills/incapacitating-strike.png",
  "patch_verified": "Gold Road (Q2 2024)",
  "esohub_url": "https://eso-hub.com/en/skills/nightblade/assassination/incapacitating-strike",
  "uesp_url": "https://en.uesp.net/wiki/Online:Incapacitating_Strike"
}
```

**Note :** `morph_of` et `morph_sibling` acceptent `null` pour les skills récents non encore documentés sur UESP (ex: `soul-of-flame` post-U49). Dans ce cas le tooltip morph n'est pas affiché.

**Classes valides :** `Dragonknight` | `Sorcerer` | `Nightblade` | `Templar` | `Warden` | `Necromancer` | `Arcanist` | `Guild` | `World` | `Alliance War` | `Craft` | `Racial`

### Skill icons
Icônes stockées dans `public/assets/skills/{id}.png`. Pour télécharger automatiquement toutes les icônes manquantes depuis UESP :
```
node scripts/fetch-skill-icons.mjs
```
Le script interroge l'API MediaWiki UESP avec la convention de nommage `ON-icon-skill-{SkillLine}-{SkillName}.png`. Si un skill n'est pas trouvé (skill récent non encore documenté), il affiche `NOT FOUND` et continue.

### Note UESP lag
UESP peut être en retard de 1-2 semaines après un patch majeur (ex: Update 49). En cas de doute, faire confiance au jeu plutôt qu'à UESP. Les morphs incorrects sur UESP doivent être corrigés manuellement dans les JSON.

### og:image strategy
1. **M0 ✅ :** Global fallback `og-default.png` — SVG converti en PNG via `sharp`
2. **M1 ✅ :** Champ `og_image` optionnel en frontmatter — fallback vers global si absent
3. **Post-launch (optionnel) :** Génération automatique via Satori — déferré

---

## 4. Design System

### Color palette (noir & violet — remplace la palette or d'origine)
```css
--color-bg:          #09090f;   /* Noir pur, légère teinte violette */
--color-surface:     #101018;   /* Fond des cartes et panneaux */
--color-border:      #1e1c2e;   /* Bordures subtiles */
--color-text:        #ede8ff;   /* Texte principal — blanc lavande */
--color-text-muted:  #7d77a0;   /* Texte secondaire, métadonnées — corrigé WCAG AA (4.75:1) */
--color-accent:      #8b5cf6;   /* Violet primaire */
--color-accent-dim:  #6d28d9;   /* Violet atténué, hover states */
--color-critical:    #ef4444;   /* Rouge — warnings */
--color-mono:        #c4b5fd;   /* Violet clair — valeurs code/stats */
```

### Typography
- **Display/Headings:** Cormorant Garamond (serif)
- **Body text:** Crimson Pro (serif)
- **Stats/values/code:** JetBrains Mono
- **Load via:** Google Fonts — `<link rel="stylesheet">` dans `Base.astro` (preconnect + stylesheet). Ne plus utiliser `@import` CSS (render-blocking, coûtait 2 460 ms au Lighthouse)

### Component conventions
- **SetCard:** Surface sombre, nom en display font, badge type coloré par catégorie, lignes de bonus en JetBrains Mono, liens UESP + ESOHub
- **SkillBar:** Deux barres (front/back), icône 36px avec bordure colorée par classe, badge "R" sur ultimate, tooltip morph au hover (caché si morph_of est null)
- **Callouts:** `formula` (bleu/violet) | `note` (violet accent) | `warning` (rouge)
- **Header:** Logo carré "K" avec gradient violet, backdrop-filter blur, nav pills
- **Boutons:** Border-radius 8px, gradient sur primaire, hover avec translateY(-1px)

### What to avoid
- Pure `#000000` (utiliser `#09090f`)
- Fonts gothiques ou blackletter pour le body
- Overuse de violet — accent seulement
- Generic sans-serif (pas d'Inter, pas de Roboto)

---

## 5. Content Schema

### Build page frontmatter
```yaml
---
title: "SUPERSTAR — Magicka Dragonknight PvP"
class: Dragonknight
role: DPS
resource: Magicka
gamemode: PvP
patch: "Gold Road (Q2 2024)"
difficulty: Advanced
featured: true
og_image: ""   # optional — falls back to global if empty
sets:
  - mighty-chudan
  - rallying-cry
  - two-fanged-snake
  - markyn-ring-of-majesty
  - armor-of-the-trainee
skills:
  bar1:
    - molten-whip
    - disintegrating-dragonfire
    - shattering-rocks
    - soul-of-flame
    - incinerate
    - take-flight
  bar2:
    - heart-and-home
    - resolving-vigor
    - blood-of-the-elder-dragon
    - igneous-weapons
    - shatterspike-mantle
    - temporal-guard
summary: "Magicka Dragonknight build orienté survie et pression soutenue en PvP."
---
```

### Guide page frontmatter
```yaml
---
title: "Penetration Caps Explained — And Why Most Guides Get It Wrong"
category: Mechanics
tags: [penetration, damage, math, PvP]
published: 2024-03-15
og_image: ""   # optional
summary: "A mathematical breakdown of how armor penetration actually interacts with resistances in ESO."
---
```

### Build frontmatter — champs optionnels ajoutés (M3+)
```yaml
updatedAt: "2025-05-11"          # date de mise à jour affichée en haut du build
stats:
  health:  { target: 30000, note: "priorité absolue" }
  magicka: { target: 50000, note: "via CP + food" }
  stamina: { target: 15000, note: "pour les breaks" }
champion_points:
  warfare:
    - { star: "Deadly Aim", points: 50, priority: 1 }
  fitness:
    - { star: "Boundless Vitality", points: 50, priority: 1 }
consumables:
  food:   { name: "Bewitched Sugar Skulls", stats: "+4621 HP / +4250 Mag / +4250 Stam", note: "BiS survivability", alt: "Artaeum Pickled Fish Bowl" }
  potion: { name: "Essence of Spell Power", ingredients: ["Cornflower", "Ladys Smock", "Water Hyacinth"], note: "Major Sorcery + Prophecy + restore Mag" }
  poison: { name: "Drain Health Poison", note: "optionnel" }   # optionnel, omissible
```

---

## 6. Roadmap — Milestones

### ✅ Milestone 0 — Project Setup & Foundation
**Goal:** Working Astro project on Cloudflare Pages with design system, SEO, accessibility base, and mobile-first layout.
**Completed:** 2026-05-10

Tasks:
- [x] Init Astro project with Tailwind CSS
- [x] Configure GitHub repo (`github.com/simbxd/kozy-eso-pvp-builds`) and Cloudflare Pages auto-deploy
- [x] Implement design tokens (CSS variables) — palette noir & violet
- [x] Set up Google Fonts (Cormorant Garamond, Crimson Pro, JetBrains Mono)
- [x] Create `Base.astro` layout :
  - [x] Mobile-first viewport meta
  - [x] SEO meta tags avec defaults
  - [x] Open Graph tags + fallback og:image global
  - [x] Canonical URL handling
  - [x] `lang="en"` sur `<html>`
  - [x] Semantic landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`)
  - [x] Focus-visible styles (keyboard navigation)
  - [x] Skip-link accessibilité
- [x] Générer `og-default.svg` + `og-default.png` (via sharp)
- [x] Créer Header et Footer
- [x] Homepage placeholder
- [x] Installation Node.js 24.15.0 (absent du système — installé via winget)

Deliverable: `kozy-eso-pvp-builds.pages.dev` live ✅

---

### ✅ Milestone 1 — Content Infrastructure
**Goal:** Author can write and publish builds and articles end-to-end without developer involvement.
**Completed:** 2026-05-10

Tasks:
- [x] Configurer Astro Content Collections (Astro 6 Content Layer) — `src/content.config.ts` avec `glob()` loaders
- [x] Schémas Zod pour `builds`, `articles`, `sets`, `skills`
- [x] Créer `Build.astro` layout
- [x] Créer `Article.astro` layout
- [x] Construire `Callout.astro` (formula / note / warning)
- [x] Construire `BuildCard.astro` pour l'index
- [x] Pages index (`/builds`, `/articles`)
- [x] Pages filtrées par classe (`/builds/class/[class]`) — statiques, sans JS client
- [x] Support `og_image` par article (frontmatter, fallback global)
- [x] Sitemap (`@astrojs/sitemap`)
- [x] Flux RSS (`@astrojs/rss`)
- [x] `robots.txt`
- [x] Test end-to-end : Markdown → push → page live sur Cloudflare Pages ✅

Deliverable: Auteur peut publier builds et articles indépendamment ✅

---

### ✅ Milestone 2 — ESO Data Integration
**Goal:** SetCard et SkillBar fonctionnels sur les pages de build avec données réelles.
**Completed:** 2026-05-10

Pre-milestone checklist :
- [x] Curate JSON pour tous les sets du premier build (vérifiés sur UESP)
  - [x] `mighty-chudan.json`
  - [x] `rallying-cry.json`
  - [x] `two-fanged-snake.json`
  - [x] `markyn-ring-of-majesty.json`
  - [x] `armor-of-the-trainee.json`
- [x] Curate JSON pour tous les skills du premier build (avec morph data)
  - [x] `molten-whip.json`, `disintegrating-dragonfire.json`, `shattering-rocks.json`, `soul-of-flame.json`, `incinerate.json`, `take-flight.json`
  - [x] `heart-and-home.json`, `resolving-vigor.json`, `blood-of-the-elder-dragon.json`, `igneous-weapons.json`, `shatterspike-mantle.json`, `temporal-guard.json`
- [x] Premier vrai build publié : SUPERSTAR (MagDK PvP)
- [x] Sourcer les icônes de skills via UESP MediaWiki API — script automatisé

Tasks :
- [x] Construire `SetCard.astro` — bonus, type d'acquisition, DLC, liens UESP + ESOHub
- [x] Construire `SkillBar.astro` — 2 barres, icônes, tooltip morph au hover
- [x] Intégrer les composants dans `Build.astro` via résolution des IDs → objets JSON au build time
- [x] Vérifier les `base_skill` et `morph_sibling` de tous les skills via API UESP — corrigés pour 7 skills
- [x] Data integrity check : `assertIds()` dans `[slug].astro` — fail le build si un ID n'a pas de JSON
- [x] Documenter le process "mise à jour post-patch" pour l'auteur (CLAUDE.md)

Deliverable: Première vraie page de build avec SetCards, SkillBars et liens outbound ✅

---

### ✅ Milestone 3 — Polish & Production Readiness
**Goal:** Site publicly launchable.
**Completed:** 2026-05-11

Tasks:
- [x] Audit performance (Lighthouse > 90 sur toutes les pages) — **Perf 99 · A11y 95 · Best Practices 100 · SEO 100**
- [x] Google Fonts : `@import` CSS → `<link rel="stylesheet">` dans `Base.astro` — Lighthouse Perf 89 → 99 (élimine 2 460 ms de render-blocking)
- [x] Page 404 custom (`src/pages/404.astro`) — on-brand, liens /builds /guides /
- [x] Optimisation images — skill icons déjà `loading="lazy"` + `width`/`height` depuis M2
- [ ] Custom domain — décision de l'auteur (non bloquant pour le lancement)
- [x] QA cross-browser et mobile — responsive depuis M0, SkillBar tooltip flippe à droite < 900px
- [x] Audit accessibilité complet :
  - [x] Navigation clavier — `focus-visible` ring + skip-link (M0) + `tabindex="0"` sur SkillBar slots (M3)
  - [x] SkillBar tooltips accessibles au clavier (`:focus-within` — M3)
  - [x] Screen reader — ARIA landmarks, `aria-label`, `aria-current`, `role="tooltip"`, `<time datetime>` (M0/M1)
  - [x] Contraste — `--color-text-muted` #6b6585 → #7d77a0 (3.6:1 → 4.75:1, passe WCAG AA — M3)
- [x] Stats/Champion Points/Consumables sur les pages de build — composants `StatBlock.astro`, `ChampionPoints.astro`, `Consumables.astro`
- [x] Dropdown nav CSS-only sur "Builds" — 7 classes + Subclass, gap bridgé par `::after` (no JS)
- [x] Index `/builds` refait avec pills cliquables par classe + badge de compteur
- [x] Page `/builds/subclass` placeholder
- [x] 6 builds placeholder (Sorcerer, Nightblade, Templar, Warden, Necromancer, Arcanist)
- [x] "Articles" renommé "Guides" — collection, layout (`Guide.astro`), pages `/guides`, RSS, nav, homepage, 404
- [x] 2 guides publiés : *Penetration Caps Explained* + *Critical Resistance & Critical Damage in PvP*

---

### ✅ Milestone 5 — Skills Data Completeness
**Goal:** Tous les skills morph du jeu ont un `morph_rationale` précis, mécanique et différenciant.
**Completed:** 2026-05-13

Tasks:
- [x] Créer `scripts/gen-morph-rationale.mjs` — génération automatique via UESP `exportJson.php?table=playerSkills` + regex patterns (buff nommés, CC, AoE, DoT, Stamina/Magicka, Summon)
- [x] Générer les rationales pour 375 skills (classes, weapon, guild)
- [x] Ajouter la classe `Armor` au `TARGET_CLASSES` du générateur — 6 skills Armor couverts
- [x] Audit multi-passes : doublon exacts, mauvais labels ressource, textes vagues "increasing your effectiveness", fallbacks "Offensive morph" incorrects
- [x] Script `fix-morph-rationale.mjs` — 64 corrections (labels erronés, fallbacks génériques, skills non-dommage mal catégorisés)
- [x] Script `fix-morph-rationale-2.mjs` — 103 corrections (paires miroir identiques, doublons exacts)
- [x] Script `fix-morph-rationale-3.mjs` — 47 corrections (Alliance War, World/Vampire/Werewolf/Soul Magic)
- [x] Intégrité `morph_sibling` : `quick-cloak` sibling manquant ajouté, `reverse-slice` référence cassée nullifiée
- [x] 0 morph sans rationale, 0 doublon exact, 0 texte vague en fin d'audit

Deliverable: Base de données skills complète — chaque morph explique sa mécanique clé et sa justification vs son sibling ✅

---

### ✅ Milestone 4 — Contributor Support
**Goal:** Allow occasional guest contributors without technical knowledge.

**Solution choisie : Decap CMS** (web UI Git-based pour Markdown)

- [x] `/public/admin/index.html` — panneau admin Decap CMS
- [x] `/public/admin/config.yml` — configuration CMS (collections builds + guides, workflow éditorial)
- [x] OAuth proxy déployé sur Cloudflare Workers (`kozy-eso-oauth.simbad14100.workers.dev`) — authentification GitHub
- [x] `wrangler.toml` créé pour le déploiement du Worker
- [x] Workflow éditorial activé : **Draft → Ready → Publish** (branches PR GitHub automatiques)
- [x] Cloudflare Access (Zero Trust) configuré pour protéger `/admin` par email/OTP
  - ⚠️ Activation complète sur domaine custom uniquement (pas disponible sur `*.workers.dev`)

**État :** Fonctionnel — Save Draft crée une branche PR, Publish merge → déploiement automatique.

---

### ✅ Milestone 6 — Infrastructure données ESO complète
**Goal:** Toutes les meta-données ESO nécessaires aux pages de build sont disponibles en JSON, scrapées et versionnées.
**Completed:** 2026-05-13

Tasks:
- [x] Ajouter `skill_line_id` (slug de la ligne de compétence) à `normaliseToCurated` dans `fetch-eso-data.mjs`
- [x] Enrichir `skills-index.json` avec `skill_line_id`, `type`, `icon`, `morph_of`
- [x] Générer `skill-lines-index.json` — 21 entrées (7 classes × 3 skill lines) avec détection de collision
- [x] Écrire `scripts/migrate-add-skill-line-id.mjs` — backfill idempotent des 1208 fichiers skills existants
- [x] Écrire `scripts/fetch-eso-meta.mjs` — scraper UESP wiki (cheerio) pour 4 types de données :
  - [x] **Races** (10) : passives max-rank (parsing rowspan), alliance, UESP URL
  - [x] **Mundus stones** (13) : valeur base + full-Divines, URL individuelle
  - [x] **Traits** (27, 9/catégorie) : weapon/armor/jewelry, ranges 1H/2H pour weapon, slugs composites pour Training/Infused/Nirnhoned
  - [x] **Enchants/glyphes** (38) : weapon/armor/jewelry, essence rune prefix
- [x] Canaries de validation : Imperial, The Apprentice, Divines (armor), Glyph of Magicka
- [x] Flags d'exécution : `DRY_RUN=1`, `SAMPLE=N`, `SKIP_VALIDATION=1`
- [x] Comportement curated-safe : fichiers existants toujours skippés
- [x] Indices plats dans `src/data/eso/` : races, mundus, traits, enchants
- [x] Tous les fichiers marqués `patch_verified: "U49"`

Deliverable: Base de données ESO complète — skills, races, mundus, traits, enchants — versionnée et prête pour les composants UI ✅

---

## 7. Modifications en cours de route

Décisions prises pendant le développement, hors roadmap initiale.

### Renommage complet du projet
**Décision :** "ESO Theorycraft" → **"Kozy ESO PvP Builds"**
**Raison :** L'auteur a voulu personnaliser le nom et préciser le focus PvP avant tout déploiement public.
**Impact :** Mise à jour de tous les fichiers sources, dossier renommé, image OG régénérée, mémoire Claude mise à jour.

### Refonte complète de la palette de couleurs
**Décision :** Palette "Scholarly Dark" (or sur noir chaud) abandonnée au profit de **noir & violet**.
**Raison :** Après visualisation du site live, l'auteur a trouvé la palette or trop classique — souhait d'un rendu plus moderne et gaming.
**Impact :** Tous les tokens CSS remplacés, Header redesigné (blur, logo carré, pills), hero homepage redesigné (lueur radiale, bouton gradient), image OG régénérée.

### Modernisation du Header
**Décision :** Header statique → Header avec **backdrop-filter blur** + **logo carré "K"** + **navigation en pills**.
**Raison :** Demande de design "plus moderne et épuré" lors de la session de polish M1.
**Impact :** `Header.astro` entièrement réécrit.

### Analyse de captures in-game pour extraction de données
**Décision :** Analyse de screenshots ESO pour extraire les sets et skills du build SUPERSTAR.
**Raison :** Workflow naturel pour l'auteur — plus rapide que de saisir les données manuellement.
**Limitation découverte :** Les icônes de skills sont trop petites pour être identifiées avec certitude depuis une capture. Les noms de skills doivent être fournis à l'écrit. Les sets sont lisibles. La couleur des slots indique le poids d'armure (rouge=Heavy, vert=Medium, bleu=Light).

### Extension du schéma `type` des sets
**Décision :** Ajout de `Monster` et `Mythic` à l'enum `type` du schéma Zod.
**Raison :** Oubli initial — ces types sont nécessaires pour Mighty Chudan et Markyn Ring of Majesty.

### Identification du set "Gallant Chain"
**Décision :** "Gallant Chain" n'est pas un set ESO — c'est le nom d'une pièce de l'**Armor of the Trainee**.
**Découverte :** Le "Set: 1/3" en jeu est normal — le Trainee donne un bonus dès 1 pièce portée (sur un max de 3 pièces du set).

### CLAUDE.md créé dans le projet
**Décision :** Création de `CLAUDE.md` à la racine du projet pour documenter l'état réel, l'architecture, les conventions et le workflow auteur.
**Raison :** Non prévu en roadmap mais essentiel pour la continuité entre sessions Claude Code.

### Icônes de skills — script automatisé UESP
**Décision :** Au lieu de télécharger les icônes manuellement, création de `scripts/fetch-skill-icons.mjs` qui interroge l'API MediaWiki UESP.
**Raison :** 12 icônes en quelques secondes au lieu de 12 téléchargements manuels — et réutilisable pour tous les futurs skills.
**Fonctionnement :** Le script lit tous les JSON de `src/content/skills/`, construit le nom de fichier UESP (`ON-icon-skill-{SkillLine}-{SkillName}.png`), récupère l'URL via l'API, et télécharge le PNG dans `public/assets/skills/{id}.png`.

### Corrections de morphs via API UESP (M2)
**Décision :** Vérification systématique de tous les morph chains via l'API UESP, avec correction des 7 skills incorrects.
**Découvertes :**
- `molten-whip` : base = **Lava Whip** (pas Flame Lash), sibling = **Flame Lash**
- `disintegrating-dragonfire` : base = **Dragonfire Breath**, sibling = **Engulfing Dragonfire**
- `shattering-rocks` : base = **Petrify** (pas Stonefist), sibling = **Fossilize**
- `incinerate` : base = **Inferno** (pas Searing Strike), sibling = **Cauterize**
- `blood-of-the-elder-dragon` : base = **Dragon Blood**, sibling = **Blood of the Green Dragon**
- `shatterspike-mantle` : skill_line = **Earthen Heart** (pas Draconic Power), base = **Earthspike Mantle**
- `heart-and-home` : nom = **Hearth and Home**, skill_line = **Ardent Flame** (pas Draconic Power)
- `soul-of-flame` : skill U49 non encore documenté sur UESP → morph chain `null`, tooltip désactivé

### Vigor → Resolving Vigor
**Décision :** Le skill `vigor` dans le build SUPERSTAR était en réalité **Resolving Vigor** (le morph), pas la base Vigor.
**Impact :** JSON renommé, icône corrigée (l'ancienne était celle de la base Vigor dans la mauvaise skill line), ID mis à jour dans le build.

### Schéma Zod — morph_of/morph_sibling nullable
**Décision :** `morph_of` et `morph_sibling` passent de `z.string()` à `z.string().nullable()`.
**Raison :** Nécessaire pour les skills récents (post-U49) non encore documentés sur UESP, où on ne peut pas confirmer la chaîne de morph avec certitude.

### Stats / Champion Points / Consumables (M3+)
**Décision :** Ajout de trois sections optionnelles sur les pages de build, chacune dans un composant dédié.
**Raison :** L'auteur voulait que les pages de build affichent les stats cibles, le répartition de CP et les consommables recommandés — données essentielles pour reproduire un build.
**Composants :** `StatBlock.astro` (3 cartes colorées Health/Magicka/Stamina), `ChampionPoints.astro` (grille Warfare/Fitness avec badge priorité), `Consumables.astro` (Food/Potion/Poison, Poison optionnel).
**Schéma :** Trois champs optionnels ajoutés dans `content.config.ts` — les builds sans ces données continuent à fonctionner.

### Dropdown nav CSS-only (M3+)
**Décision :** Le lien "Builds" dans le header ouvre un dropdown avec les 7 classes + Subclass.
**Raison :** Accès direct aux builds filtrés par classe sans passer par la page index.
**Technique :** CSS-only — `opacity 0 → 1` + `pointer-events` sur `:hover`/`:focus-within`. Un pseudo-élément `::after` sur le wrapper comble le gap de 0.5rem entre le trigger et le panneau pour éviter que le menu disparaisse quand la souris traverse l'espace.

### Index Builds avec pills (M3+)
**Décision :** La page `/builds` affiche des pills cliquables pour chaque classe (7 classes + Subclass) avec un compteur de builds.
**Raison :** Navigation visuelle plus claire que la liste plate précédente.
**Note :** Les classes sont hardcodées (pas dérivées des builds publiés) pour que les 7 classes apparaissent même si certaines n'ont pas encore de build.

### Builds placeholder (M3+)
**Décision :** 6 builds placeholder créés (Sorcerer, Nightblade, Templar, Warden, Necromancer, Arcanist) avec `sets: []` et `skills: { bar1: [], bar2: [] }`.
**Raison :** Permettre de visualiser le rendu de l'index et des pages de classe avant que les vrais builds soient rédigés.
**À faire :** Remplacer par de vrais builds avant tout lancement public.

### Génération automatique des morph_rationale (M5)
**Décision :** Création de `scripts/gen-morph-rationale.mjs` pour générer les `morph_rationale` en masse via l'API UESP, plutôt que de les écrire à la main skill par skill.
**Raison :** 389 morphs à couvrir — l'écriture manuelle aurait été prohibitive.
**Fonctionnement :** Fetch de `esolog.uesp.net/exportJson.php?table=playerSkills`, matching par `name::skillLine`, puis passage dans un pipeline de règles regex ordonnées (conversion ressource → buffs nommés → CC → AoE → DoT → summon → fallback).
**Limites identifiées :** 5 causes d'erreurs systématiques — regex `summon` déclenchant sur des skills non-companion, détection buff avant conversion ressource, paires de siblings avec le même pattern → texte identique, fallback "increasing your effectiveness" sur buffs non mappés, fallback "Offensive morph" sur des skills non-offensifs.
**Résolution :** 3 scripts de corrections batch (`fix-morph-rationale.mjs`, `-2.mjs`, `-3.mjs`) couvrant 214 corrections au total.

### Audit intégrité morph_sibling (M5)
**Décision :** Vérification systématique de la cohérence des champs `morph_sibling` sur l'ensemble des 389 morphs.
**Découvertes :**
- `quick-cloak` : sibling `deadly-cloak` manquant (référence unidirectionnelle) → ajouté
- `reverse-slice` : `morph_sibling: "executioner"` pointait vers le passif Nightblade (collision de slug) et non vers le morph Two-Handed → nullifié
**Résultat :** 0 référence cassée ou asymétrique restante.

### Renommage Articles → Guides (M3+)
**Décision :** La section "Articles" devient "Guides" partout (collection, layout, pages, nav, RSS, homepage, 404).
**Raison :** "Guides" est plus précis pour le contenu prévu (mécaniques, breakdowns, théorie PvP).
**Impact :** Collection Astro renommée, `Article.astro` → `Guide.astro`, `/articles` → `/guides`, RSS mis à jour, liens homepage et 404 corrigés, CLAUDE.md et ROADMAP.md mis à jour.

### Scraper UESP wiki pour les meta-données ESO (M6)
**Décision :** Création de `scripts/fetch-eso-meta.mjs` — scraper HTML cheerio pour 4 pages UESP (Races, Mundus_Stone, Traits, Glyphs) — plutôt que de curating les données à la main.
**Raison :** Races/mundus/traits/enchants sont des données stables, exhaustives et structurées sur UESP. La curation manuelle de ~90 entrées aurait pris plusieurs heures et introduit des erreurs de saisie.
**Complexités résolues :**
- Races : passives multi-rangs via `rowspan` HTML → détection par nombre de `<td>` (≥4 = nouveau passif, 3 = continuation) pour ne stocker que la description max-rank
- Traits : sous-lignes 1H/2H sur les traits d'arme (`rowspan="2"` sur `<th>`) → format `"1H: X / 2H: Y"` ; Triune jewelry dual-stat → format `"X / Y"` sans label ; colonne "Material Source" en plus sur le tableau bijoux → extraction par filtre (dernier `<td>` non-img, non-esoqc, longueur > 3)
- Traits multi-catégories : Training/Infused/Nirnhoned existent en weapon ET armor (ET jewelry pour Infused/Nirnhoned) → slugs composites (`infused-weapon`, `infused-armor`, `infused-jewelry`) générés en post-processing, uniquement pour les noms en collision
- WebFetch (outil Claude) bloqué par UESP sans User-Agent valide → analyse HTML via `curl` + bash ; scripts node exécutés directement sans passer par /tmp (filesystem Windows)
**Conventions :** `patch_verified: "U49"`, `existsSync` pour skip les fichiers curated, `Promise.all` pour les fetches parallèles, canaries de validation pour détecter les changements de structure UESP.

### Google Fonts render-blocking (M3+)
**Décision :** Le `@import url(...)` Google Fonts dans `global.css` a été supprimé et remplacé par `<link rel="preconnect">` + `<link rel="stylesheet">` dans `Base.astro`.
**Raison :** L'`@import` CSS est render-blocking — le navigateur doit d'abord télécharger et parser le CSS avant de commencer le fetch des fonts. Lighthouse mesurait 2 460 ms bloqués. Avec un `<link>` en `<head>`, le fetch démarre en parallèle avec le reste du parsing HTML.
**Résultat :** Lighthouse Performance 89 → 99.

---

## 8. Resolved Decisions

| Question | Resolution |
|---|---|
| ESO data source | Manual curation, UESP as reference (CC-BY-SA) |
| LibSets | Rejected — does not provide set bonuses; license restrictive; export complex |
| ESOHub scraping | Rejected — ToS, copyright, fragility |
| Set bonus source | Author-curated from UESP, verified in-game |
| Skill icons | Script automatisé UESP MediaWiki API (`scripts/fetch-skill-icons.mjs`) ✅ |
| Build index filtering | Pre-rendered static pages per class — no client JS at launch |
| og:image strategy | Global fallback (M0 ✅) → per-article (M1 ✅) → auto-generated per build (post-launch) |
| SEO / mobile / a11y | All in M0 ✅ — built into Base layout from day one |
| Morph modeling | Supported in skill schema (`morph_of`, `morph_sibling`, `morph_rationale`), nullable pour U49+ ✅ |
| Custom domain | Author decides; site fonctionne sur Cloudflare Pages subdomain |
| Analytics | Deferred — consider Plausible post-launch |
| Comment system | Out of scope for launch |
| Palette couleurs | Noir & violet (décision prise session 1 après visualisation live) |
| Nom du projet | "Kozy ESO PvP Builds" (décision prise session 1) |
| Astro version | Astro 6 — Content Layer API requise (migration documentée) |

---

## 9. Conventions for Claude Code

### Code style
- Astro components: `.astro`
- Utilities: TypeScript (`.ts`)
- Tailwind utility classes over custom CSS (sauf design tokens dans `@theme`)
- No inline styles
- Code en anglais, réponses en français

### Teaching obligation
Pour chaque décision non triviale, expliquer le *pourquoi*. L'auteur doit comprendre ce qui est construit, pas juste recevoir des fichiers.

### Developer obligations
- Signaler la dette technique ou la complexité inutile **avant** d'implémenter
- Proposer des alternatives avec justification quand l'architecture entre en conflit avec les bonnes pratiques
- Maintenir cette roadmap : statut des tâches, décisions émergentes, sections "modifications en cours de route"

### Author's content workflow
**Publier un build ou un guide :**
1. Créer `.md` dans `src/content/builds/` ou `src/content/guides/`
2. Remplir le frontmatter (Section 5)
3. Écrire le body en Markdown
4. `git add . && git commit -m "..." && git push` → Cloudflare Pages déploie en ~30s

**Ajouter un set ou un skill :**
1. Créer le JSON dans `src/content/sets/` ou `src/content/skills/`
2. Référencer l'ID dans le frontmatter du build
3. Pour les skills : lancer `node scripts/fetch-skill-icons.mjs` pour télécharger l'icône
4. Push

**Après un patch ESO majeur :**
1. Consulter les patch notes officielles et UESP pour les changements de sets/skills
2. Mettre à jour les JSON concernés et `patch_verified`
3. Si un skill est renommé : renommer le JSON ET mettre à jour l'ID dans le build `.md`
4. Pour les icônes modifiées : relancer `node scripts/fetch-skill-icons.mjs`
5. Lancer `npm run build` localement pour vérifier que l'integrity check passe
6. Push

---

*Document version: 10.1*
*Last updated by: Claude Code — après session 7 (2026-05-13)*
*Next update: Claude Code, après intégration UI des autres données meta ESO (mundus, traits, enchants)*
