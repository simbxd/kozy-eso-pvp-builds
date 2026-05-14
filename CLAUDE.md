# CLAUDE.md — Kozy ESO PvP Builds

## Règles de collaboration

- **Langue :** répondre en français, coder en anglais (fichiers, variables, commentaires, commits)
- **Pédagogie :** expliquer le *pourquoi* de chaque décision non triviale
- **Discipline :** ne pas ajouter de fonctionnalités non demandées, ne pas refactorer sans raison

---

## Projet

Site statique dédié aux builds PvP ESO. Builds optimisés, guides de rotation, breakdowns de mécaniques pour Elder Scrolls Online.

**Repo :** https://github.com/simbxd/kozy-eso-pvp-builds
**Site :** https://kozy-eso-pvp-builds.simbad14100.workers.dev
**Dossier local :** `D:\Dev\kozy-eso-pvp-builds`

---

## Stack technique

| Outil | Rôle |
|---|---|
| Astro 6 | Framework statique |
| Tailwind CSS v4 | Styles (tokens via `@theme` dans global.css) |
| Astro Content Layer | Collections Markdown + JSON avec validation Zod |
| `@astrojs/sitemap` | Génération automatique du sitemap |
| `@astrojs/rss` | Flux RSS |
| `sharp` | Conversion SVG → PNG pour les images OG |
| Cloudflare Workers | Hébergement + CD depuis GitHub |
| Cloudflare Worker proxy | `eso-status-proxy.simbad14100.workers.dev` — relay CORS statut serveurs ESO |
| Git / GitHub | Contrôle de version |

---

## Design system

### Palette (définie dans `src/styles/global.css` via `@theme`)

```css
--color-bg:          #09090f;   /* Noir pur, légère teinte violette */
--color-surface:     #101018;   /* Fond des cartes et panneaux */
--color-surface-2:   #15131f;   /* Fond légèrement plus clair — TOC sidebar */
--color-border:      #1e1c2e;   /* Bordures subtiles */
--color-border-2:    #2a2640;   /* Bordures légèrement plus visibles */
--color-text:        #ede8ff;   /* Texte principal — blanc lavande */
--color-text-muted:  #7d77a0;   /* Texte secondaire — WCAG AA (4.75:1) */
--color-accent:      #8b5cf6;   /* Violet primaire */
--color-accent-dim:  #6d28d9;   /* Violet atténué, hover states */
--color-accent-glow: rgba(139,92,246,0.18); /* Glow violet */
--color-critical:    #ef4444;   /* Rouge — warnings */
--color-mono:        #c4b5fd;   /* Violet clair — valeurs code/stats */
--color-mythic:      #d4a44a;   /* Or — sets mythiques */
--color-mythic-dim:  #6b4f1a;   /* Or atténué */
```

### Typographie
- **Display/Titres :** Cormorant Garamond (serif)
- **Corps :** Crimson Pro (serif)
- **Stats/Code :** JetBrains Mono
- **Chargement :** Google Fonts via `<link rel="stylesheet">` dans `Base.astro` (preconnect + stylesheet — pas de `@import` CSS, render-blocking)

---

## Architecture des fichiers

```
src/
├── content/
│   ├── builds/          ← Fichiers .md (un par build)
│   ├── guides/          ← Fichiers .md (un par guide)
│   ├── sets/            ← Fichiers .json (un par set ESO)
│   ├── skills/          ← Fichiers .json (un par skill ESO)
│   ├── races/           ← Fichiers .json (10 races, scrapées UESP)
│   ├── mundus/          ← Fichiers .json (13 pierres mundus, scrapées UESP)
│   ├── traits/          ← Fichiers .json (27 traits weapon/armor/jewelry, scrapés UESP)
│   ├── enchants/        ← Fichiers .json (38 glyphes weapon/armor/jewelry, scrapés UESP)
│   └── consumables/     ← Fichiers .json (22 consommables PvP — food, potions, poisons)
├── components/
│   ├── Header.astro     ← Nav + dropdown classes + statut serveurs ESO
│   ├── Footer.astro
│   ├── BuildCard.astro  ← Carte pour l'index des builds
│   ├── Callout.astro    ← Annotations (formula/note/warning)
│   ├── SetCard.astro    ← Carte d'un set ESO avec bonus et liens
│   ├── SkillBar.astro   ← Double barre de skills avec icônes et tooltip morph
│   ├── StatBlock.astro  ← 3 cartes HP/Mag/Sta
│   ├── ChampionPoints.astro
│   └── Consumables.astro
├── layouts/
│   ├── Base.astro       ← Layout universel (SEO, OG, a11y)
│   ├── Build.astro      ← Layout page de build (masthead → TOC → sections)
│   └── Guide.astro      ← Layout page de guide
├── pages/
│   ├── index.astro
│   ├── builds/
│   │   ├── index.astro           ← Pills par classe + compteurs
│   │   ├── [slug].astro          ← Résolution IDs + assertIds()
│   │   ├── class/[class].astro   ← Filtrage statique par classe
│   │   └── subclass/index.astro  ← Placeholder
│   ├── guides/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── 404.astro
│   └── rss.xml.ts
├── styles/
│   └── global.css
└── content.config.ts    ← Schémas Zod pour toutes les collections
public/
├── assets/
│   ├── og/              ← og-default.svg + og-default.png
│   └── skills/          ← Icônes PNG des skills ({id}.png)
├── robots.txt
└── favicon.svg
scripts/
├── fetch-eso-data.mjs       ← Scrape esolog API → sets + skills JSON
├── fetch-eso-meta.mjs       ← Scrape UESP wiki → races/mundus/traits/enchants JSON
├── fetch-skill-icons.mjs    ← Télécharge les icônes PNG des skills depuis UESP
├── migrate-add-skill-line-id.mjs ← Migration one-shot : backfill skill_line_id sur 1208 fichiers
└── gen-morph-rationale.mjs  ← Génère les morph_rationale manquants
src/data/eso/
├── sets-index.json          ← Index plat des sets (id, name, type…)
├── skills-index.json        ← Index plat des skills (id, name, type, icon, morph_of…)
├── skill-lines-index.json   ← 21 lignes de skills (7 classes × 3)
├── races-index.json         ← 10 races (id, name, alliance)
├── mundus-index.json        ← 13 pierres (id, name, effect, value_base)
├── traits-index.json        ← 27 traits (id, name, category, value_range)
├── enchants-index.json      ← 38 glyphes (id, name, category, effect…)
└── cp-stars-index.json      ← Étoiles actives (slottable) CP warfare + fitness
```

---

## Content Collections — schémas

### Consumable (`src/content/consumables/*.json`)
Champs obligatoires : `id`, `name`, `type`, `patch_verified`, `uesp_url`, `effects[]`, `crafted`

Champs optionnels : `duration_seconds`, `reagents[]`

`effects` = tableau d'union discriminante :
- Food/drink : `{ "stat": "Maximum Health", "value": 4620 }` (stat + valeur numérique)
- Potions/poisons UESP : `{ "description": "Grants Major Brutality…" }` (texte libre depuis uesp)

`type` valides : `food | drink | potion | poison`

**Dans les builds**, les consommables sont référencés par ID :
```yaml
consumables:
  food:   { id: bewitched-sugar-skulls, note: "..." }
  potion: { id: essence-of-weapon-power, note: "..." }
  poison: { id: drain-health-poison-ix }
  mundus: { stone: The Lady, effect: "...", note: "..." }   # texte libre, pas dans la collection
```
`[slug].astro` résout les IDs → données complètes avant de passer à `Build.astro`.

**Lacunes connues :** `Cloudy Damage Health Poison IX` n'existe pas sur UESP et semble être un item inexistant — omis du dataset.

### Build (`src/content/builds/*.md`)
Champs obligatoires : `title`, `class`, `role`, `resource`, `gamemode`, `patch`, `difficulty`, `featured`, `sets[]`, `skills.bar1[]`, `skills.bar2[]`, `summary`

Champs optionnels : `author` (défaut "Kozy"), `publishedDate`, `updatedAt`, `pullquote`, `og_image`, `race`, `gear{}`, `stats{}`, `champion_points{}`, `consumables{}`

Classes valides : `Dragonknight | Sorcerer | Nightblade | Templar | Warden | Necromancer | Arcanist`
Rôles : `DPS | Healer | Tank` — Resources : `Stamina | Magicka | Hybrid` — Gamemodes : `PvP | PvE | Both` — Difficultés : `Beginner | Intermediate | Advanced`

### Set (`src/content/sets/*.json`)
Types valides : `Light Armor | Medium Armor | Heavy Armor | Jewelry | Weapon | Mixed | Monster | Mythic`
Acquisitions : `Overland | Dungeon | Trial | PvP | Crafted | Mythic | Monster | Arena`

### Skill (`src/content/skills/*.json`)
Classes valides : idem builds + `Guild | World | Alliance War | Craft | Racial`
Types : `Active | Passive | Ultimate`
`morph_of` / `morph_sibling` acceptent `null` (skills non documentés sur UESP post-patch)

---

## Points techniques importants

### Astro / Content Layer
- Config dans `src/content.config.ts`, utiliser `glob()` loader, `entry.id` (plus `entry.slug`), `render()` importé depuis `astro:content`
- `[slug].astro` appelle `assertIds()` au build time — si un ID dans `sets[]` ou `skills.bar1/bar2` n'a pas de JSON correspondant, le build échoue avec un message explicite
- Filtre par classe : pages pré-rendues statiquement via `getStaticPaths()` dans `builds/class/[class].astro` — aucun JS client

### CSS / Layout
- **Tailwind v4 :** tokens définis avec `@theme {}` dans le CSS, pas de `tailwind.config.js`
- **Build layout :** `display: grid; grid-template-columns: 1fr 220px` — grid strict, ne pas passer en flex. Ne pas mettre `overflow: clip` sur `.build-content` (coupe le contenu des cartes)
- **CSS scoping :** les règles de layout (`.build-layout`, `.build-content`, `.build-toc`) sont dans `<style is:global>` dans `Build.astro`. Les styles visuels restent dans `<style>` scopé
- **SetCard :** ne pas remettre `white-space: nowrap` sur `.bonus__val` — les longues valeurs doivent pouvoir wrapper (ex : Markyn Ring)

### Déploiement / Runtime
- **Hébergement :** Cloudflare Workers (pas Pages)
- **Statut serveurs ESO :** `Header.astro` fetch `eso-status-proxy.simbad14100.workers.dev` toutes les 60s. Structure JSON : `data.zos_platform_response.response["The Elder Scrolls Online (EU/NA/PTS)"]`. Worker dédié nécessaire (API ESO sans CORS)
- **Image OG :** SVG source dans `public/assets/og/og-default.svg`, PNG généré via `node -e "require('sharp')..."`
- **Icônes de skills :** dans `public/assets/skills/{id}.png`, téléchargées depuis UESP via `node scripts/fetch-skill-icons.mjs`

### TOC / Navigation
- **Sticky TOC desktop :** `position: sticky; top: 80px; align-self: start` dans la colonne grid
- **Mobile :** TOC caché (`display: none`) à ≤1024px, FAB + drawer à la place
- **IntersectionObserver :** `rootMargin: '-10% 0px -75% 0px'` pour l'état actif
- **Dropdown nav :** CSS-only sur "Builds" — `opacity 0→1` + `pointer-events` sur `:hover`/`:focus-within`. Pseudo-élément `::after` sur le wrapper pour combler le gap entre trigger et panneau

> **Note UESP :** UESP peut être en retard de 1-2 semaines après un patch majeur. En cas de doute, faire confiance au jeu.

---

## Workflow auteur

### Publier un guide
1. Créer `src/content/guides/mon-guide.md` avec : `title`, `category`, `tags`, `published`, `summary`
2. Push → Cloudflare déploie, le guide apparaît sur `/guides` et dans le flux RSS

### Publier un build
1. Créer `src/content/builds/mon-build.md` avec le frontmatter complet
2. S'assurer que tous les IDs dans `sets[]` et `skills.bar1/bar2[]` ont un fichier JSON correspondant
3. Push → déploie en ~30s

### Ajouter un set
1. Créer `src/content/sets/nom-du-set.json` (référencer UESP pour les bonus)
2. Ajouter l'ID dans le frontmatter du build concerné

### Ajouter un skill
1. Créer `src/content/skills/nom-du-skill.json`
2. Ajouter l'ID dans `skills.bar1` ou `skills.bar2`
3. Lancer `node scripts/fetch-skill-icons.mjs` pour télécharger l'icône depuis UESP
4. Push

### Après un patch ESO
1. Consulter patch notes ESO + UESP pour les changements
2. Mettre à jour les JSON concernés et `patch_verified`
3. Si un skill est renommé : renommer le JSON ET mettre à jour l'ID dans le build `.md`
4. Relancer `node scripts/fetch-skill-icons.mjs` si des icônes ont changé
5. `npm run build` localement pour vérifier l'integrity check
6. Push

---

## État du projet

**Dernière session :** 2026-05-14
**Milestone actuel :** v10.4 — SEO enrichi : H1 contextuel, dates visibles, auteur, JSON-LD Article + BreadcrumbList

### Milestones
- ✅ M0 — Fondations (Astro, Tailwind, deploy Cloudflare)
- ✅ M1 — Infrastructure contenu (Content Layer, schémas Zod)
- ✅ M2 — Composants (SetCard, SkillBar, icônes UESP)
- ✅ M3 — Polish & SEO (404, contraste WCAG, TOC sticky, Lighthouse 99)
- ✅ M4 — Decap CMS (`/admin`, OAuth proxy Worker, workflow Draft→Publish, Cloudflare Access)
- ✅ M5 — Données skills complètes (389 morphs avec `morph_rationale`, audit intégrité)
- ✅ M6 — Données meta ESO scrapées (races, mundus, traits, enchants + skill_line_id)
- ✅ v10.1 — Collection `races` enregistrée Zod ; champ `race` optionnel dans builds ; Race UI (masthead + section passives + TOC)
- ✅ v10.2 — Champion Points actifs : `cp-stars-index.json` (16 warfare + 16 fitness) ; dropdown Decap CMS sur le champ `star` ; `gen-decap-config.mjs` mis à jour
- ✅ v10.3 — Collection `consumables` (22 items) : `fetch-consumables.mjs` (esolog API + UESP alchemy pages) ; build schema migré vers IDs ; `Build.astro` enrichi (effets structurés, réactifs, durée, ingrédients)
- ✅ v10.4 — SEO builds : H1 `{title} — {resource} {class} {gamemode} Build` ; champ `author` (schéma + Decap + masthead) ; `publishedDate` + `updatedAt` affichés en mono sous le H1 ; JSON-LD `Article` + `BreadcrumbList` injectés via `<slot name="head">` dans `Base.astro` ; URLs canoniques depuis `Astro.site`

### Contenu publié
- **1 build :** Solo Knight (Hybrid DK PvP, `soloknight.md`) — seul build complet, sert de template. Race `dunmer` définie — à confirmer par l'auteur.
- **2 guides :** Penetration Caps Explained · Critical Resistance & Critical Damage in PvP
- **6 builds placeholder :** Sorcerer, Nightblade, Templar, Warden, Necromancer, Arcanist (à remplacer avant lancement public)
- **713 sets** — base exhaustive, 707 vérifiés U49, 6 encore en "Gold Road (Q2 2024)" (Mighty Chudan, Rallying Cry, Two-Fanged Snake, Markyn Ring of Majesty, Armor of the Trainee, Mother's Sorrow) — à re-vérifier contre U49
- **1208 skills** avec `morph_rationale` complet + `skill_line_id` — toutes classes, Alliance War, World (Vampire/Werewolf/Soul Magic)
- **10 races** — passives max-rank, alliance, UESP URL — vérifiées U49
- **13 mundus stones** — valeur base + full-Divines — vérifiées U49
- **27 traits** (9/catégorie weapon/armor/jewelry) — composite slugs pour Training/Infused/Nirnhoned — vérifiés U49
- **38 enchants** (glyphes weapon/armor/jewelry) — essence rune prefix — vérifiés U49

### Decap CMS
- Panel : `https://kozy-eso-pvp-builds.simbad14100.workers.dev/admin/`
- OAuth proxy : `kozy-eso-oauth.simbad14100.workers.dev`
- Auth : GitHub login → branche PR créée à chaque "Save Draft", merge auto à "Publish"
- Protection `/admin` : Cloudflare Access (email/OTP) — activation complète sur domaine custom

### Scripts disponibles
| npm script | Fichier | Rôle |
|---|---|---|
| `fetch:eso` | `scripts/fetch-eso-data.mjs` | Scrape esolog API → sets + skills JSON |
| `fetch:meta` | `scripts/fetch-eso-meta.mjs` | Scrape UESP wiki → races/mundus/traits/enchants JSON |
| `fetch:icons` | `scripts/fetch-skill-icons.mjs` | Télécharge les icônes PNG des skills depuis UESP |
| `fetch:consumables` | `scripts/fetch-consumables.mjs` | Scrape esolog API + UESP alchemy pages → consumables JSON dans `src/content/consumables/` |
| `migrate:skill-line-id` | `scripts/migrate-add-skill-line-id.mjs` | Backfill `skill_line_id` sur les fichiers skills existants (idempotent) |
| `gen:decap` | `scripts/gen-decap-config.mjs` | Génère la config Decap CMS |
| — | `scripts/gen-morph-rationale.mjs` | Génère les `morph_rationale` manquants via UESP API |
| — | `scripts/fix-morph-rationale.mjs` | Corrections batch #1 — 64 rationales |
| — | `scripts/fix-morph-rationale-2.mjs` | Corrections batch #2 — 103 rationales |
| — | `scripts/fix-morph-rationale-3.mjs` | Corrections batch #3 — 47 rationales |

### Conventions `fetch-eso-meta.mjs`
- `DRY_RUN=1` — fetch + log, aucune écriture
- `SAMPLE=N` — écrit seulement les N premiers par catégorie
- `SKIP_VALIDATION=1` — ignore les canaries de validation
- Fichiers existants toujours skippés (curated-safe)
- Canaries : Imperial (races), The Apprentice (mundus), Divines/armor (traits), Glyph of Magicka (enchants)

### Prochaine étape
- Remplir les `publishedDate` dans les frontmatters des builds existants (TODO laissé dans `soloknight.md`)
- Continuer l'intégration UI des données meta ESO : mundus (déjà dans `consumables`), traits, enchants dans les pages de build
