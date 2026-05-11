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
| `@astrojs/rss` | Flux RSS des articles |
| `sharp` | Conversion SVG → PNG pour les images OG |
| Cloudflare Workers | Hébergement + CD depuis GitHub (via `wrangler` / dashboard) |
| Cloudflare Worker proxy | `eso-status-proxy.simbad14100.workers.dev` — relay CORS pour le statut des serveurs ESO |
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
- **Chargement :** Google Fonts via `<link rel="stylesheet">` dans `Base.astro` (preconnect + stylesheet, plus de `@import` CSS)

---

## Architecture des fichiers

```
src/
├── content/
│   ├── builds/          ← Fichiers .md (un par build)
│   ├── guides/          ← Fichiers .md (un par guide)
│   ├── sets/            ← Fichiers .json (un par set ESO)
│   └── skills/          ← Fichiers .json (un par skill ESO)
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── BuildCard.astro  ← Carte pour l'index des builds
│   ├── Callout.astro    ← Annotations (formula/note/warning)
│   ├── SetCard.astro    ← Carte d'un set ESO avec bonus et liens
│   └── SkillBar.astro   ← Double barre de skills avec icônes et tooltip morph
├── layouts/
│   ├── Base.astro       ← Layout universel (SEO, OG, a11y)
│   ├── Build.astro      ← Layout page de build
│   └── Guide.astro      ← Layout page de guide
├── pages/
│   ├── index.astro
│   ├── builds/
│   │   ├── index.astro
│   │   ├── [slug].astro
│   │   └── class/[class].astro
│   ├── guides/
│   │   ├── index.astro
│   │   └── [slug].astro
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
└── fetch-skill-icons.mjs ← Script UESP API pour télécharger les icônes
```

---

## Content Collections — schémas

### Build (`src/content/builds/*.md`)
Champs obligatoires : `title`, `class`, `role`, `resource`, `gamemode`, `patch`, `difficulty`, `featured`, `sets[]`, `skills.bar1[]`, `skills.bar2[]`, `summary`

Classes valides : `Dragonknight | Sorcerer | Nightblade | Templar | Warden | Necromancer | Arcanist`
Rôles : `DPS | Healer | Tank`
Resources : `Stamina | Magicka | Hybrid`
Gamemodes : `PvP | PvE | Both`
Difficultés : `Beginner | Intermediate | Advanced`

### Set (`src/content/sets/*.json`)
Types valides : `Light Armor | Medium Armor | Heavy Armor | Jewelry | Weapon | Mixed | Monster | Mythic`
Acquisitions : `Overland | Dungeon | Trial | PvP | Crafted | Mythic | Monster | Arena`

### Skill (`src/content/skills/*.json`)
Classes valides : idem builds + `Guild | World | Alliance War | Craft | Racial`
Types : `Active | Passive | Ultimate`

---

## Workflow auteur

### Publier un guide
1. Créer `src/content/guides/mon-guide.md` avec le frontmatter : `title`, `category`, `tags`, `published`, `summary`
2. Push → Cloudflare Pages déploie, le guide apparaît sur `/guides` et dans le flux RSS

### Publier un build
1. Créer `src/content/builds/mon-build.md` avec le frontmatter complet
2. S'assurer que tous les IDs dans `sets[]` et `skills.bar1/bar2[]` ont un fichier JSON correspondant
3. `git add . && git commit -m "..." && git push` → Cloudflare Pages déploie en ~30s

### Ajouter un set
1. Créer `src/content/sets/nom-du-set.json` (référencer UESP pour les bonus)
2. Ajouter l'ID dans le frontmatter du build concerné
3. Push

### Ajouter un skill
1. Créer `src/content/skills/nom-du-skill.json`
2. Ajouter l'ID dans `skills.bar1` ou `skills.bar2` du build
3. Lancer `node scripts/fetch-skill-icons.mjs` pour télécharger l'icône automatiquement depuis UESP
4. Push

### Après un patch ESO
1. Consulter les patch notes officielles (ESO site) et UESP pour les changements de sets/skills
2. Pour chaque build affecté :
   - Mettre à jour les valeurs dans les JSON `src/content/sets/` et `src/content/skills/` concernés
   - Mettre à jour `patch_verified` sur chaque fichier modifié
   - Si un skill est renommé : renommer le fichier JSON ET mettre à jour l'ID dans le build `.md`
3. Pour les skills dont l'icône a changé : relancer `node scripts/fetch-skill-icons.mjs`
4. Lancer `npm run build` localement pour vérifier qu'aucun ID n'est cassé
5. Push

> **Note UESP :** UESP est parfois en retard de 1-2 semaines sur les patches récents (ex : Update 49). En cas de doute, faire confiance au jeu plutôt qu'à UESP.

---

## Points techniques importants

- **Astro 6 Content Layer :** config dans `src/content.config.ts` (pas dans `src/content/`), utiliser `glob()` loader, `entry.id` au lieu de `entry.slug`, `render()` importé depuis `astro:content`
- **Tailwind v4 :** tokens définis avec `@theme {}` dans le CSS, pas de `tailwind.config.js`
- **Google Fonts :** le `@import url(...)` doit être placé **avant** `@import "tailwindcss"` dans global.css
- **Image OG :** SVG source dans `public/assets/og/og-default.svg`, PNG généré via `node -e "require('sharp')..."` avec le script dans ce fichier
- **Filtre par classe :** pages pré-rendues statiquement via `getStaticPaths()` dans `builds/class/[class].astro` — aucun JS client
- **Data integrity :** `[slug].astro` appelle `assertIds()` au build time — si un ID dans `sets[]` ou `skills.bar1/bar2` n'a pas de JSON correspondant, le build échoue avec un message explicite
- **Icônes de skills :** stockées dans `public/assets/skills/{id}.png`, récupérées depuis UESP via `node scripts/fetch-skill-icons.mjs`
- **CSS scoping Astro :** les règles de layout critiques (`.build-layout`, `.build-content`, `.build-toc`) sont dans `<style is:global>` dans `Build.astro` pour éviter les edge cases de scoping. Les styles visuels restent dans `<style>` scopé.
- **Build layout :** `display: grid; grid-template-columns: 1fr 220px` — grid strict pour que le contenu ne puisse jamais déborder dans la colonne TOC. Ne pas utiliser `overflow: clip` sur `.build-content` (coupe le contenu des cartes).
- **SetCard overflow :** ne pas remettre `white-space: nowrap` sur `.bonus__val` — les longues valeurs de bonus (ex : Markyn Ring) doivent pouvoir wrapper.
- **ESO server status :** `Header.astro` fetch `eso-status-proxy.simbad14100.workers.dev` (Worker dédié, nécessaire car l'API ESO n'a pas de headers CORS). Structure JSON : `data.zos_platform_response.response["The Elder Scrolls Online (EU/NA/PTS)"]`. Refresh toutes les 60s.
- **Sticky TOC :** `position: sticky; top: 80px; align-self: start` dans la colonne grid. Mobile : TOC caché (`display: none`) à ≤1024px, FAB + drawer à la place. IntersectionObserver pour l'état actif (`rootMargin: '-10% 0px -75% 0px'`).

---

## État du projet

**Dernière session :** 2026-05-11
**Milestone actuel :** Polish SUPERSTAR — template canonique avant de créer d'autres builds

### Contenu publié
- 1 build : SUPERSTAR (MagDK PvP)
- 2 guides : Penetration Caps Explained, Critical Resistance & Critical Damage in PvP
- 5 sets : Mighty Chudan, Rallying Cry, Two-Fanged Snake, Markyn Ring of Majesty, Armor of the Trainee
- 12 skills : barre offensive + défensive du build SUPERSTAR (icônes PNG depuis UESP)

### M2 — Terminé (2026-05-10)
- `SetCard.astro` : bonus colorés, badge type, acquisition, DLC, liens UESP/ESOHub, grille 2 colonnes
- `SkillBar.astro` : double barre, icône 36px avec bordure colorée par classe, badge R sur ultimate, tooltip morph au hover
- `[slug].astro` : résolution des IDs → objets JSON au build time (plus de strings bruts dans le layout)
- `scripts/fetch-skill-icons.mjs` : script UESP MediaWiki API, télécharge toutes les icônes en une commande
- `assertIds()` : data integrity check — build échoue avec message explicite si un ID n'a pas de JSON
- Morphs vérifiés et corrigés pour 7 skills ; `soul-of-flame` U49 = morph chain null
- Schéma Zod : `morph_of` / `morph_sibling` acceptent `null`

### M3 — Terminé (2026-05-11)
- `src/pages/404.astro` : page 404 custom on-brand
- `--color-text-muted` : #6b6585 → #7d77a0 (WCAG AA)
- `Base.astro` : preconnect Google Fonts
- `SkillBar.astro` : `tabindex="0"` + `:focus-within` — tooltips accessibles au clavier

### Session 2026-05-11 (suite) — Polish template SUPERSTAR
- **Consumables** : Bewitched Sugar Skulls, Essence of Weapon Power (Dragonthorn + Blessed Thistle + Water Hyacinth/Wormwood), Mundus Stone (The Lady / alt: The Warrior)
- **Champion Points** : Warfare (Cleansing Revival, Master-at-Arms, Ironclad, Fighting Finesse) + Fitness (Celerity, Slippery, Fortified, Pain's Refuge)
- **Skills** : `morph_rationale` ajouté pour quick-cloak, race-against-time, heart-of-flame ; heart-of-flame corrigé (base = Core of Flame, sibling = soul-of-flame)
- **Header** : masthead rail réduit à `KOZY · ESO PvP` ; statut serveurs ESO (EU/NA/PTS) en temps réel via Worker proxy
- **SkillBar** : tabs `01/02` → `I/II`
- **Gear sheet** : police slot → body 14px ; légende couleurs (Heavy/Medium/Light)
- **TOC sidebar** : sticky, CSS grid 2 colonnes, IntersectionObserver, FAB mobile + drawer
- **Layout fix** : `<style is:global>` pour les règles de layout ; `display: grid` (pas flex) pour `.build-layout` ; `white-space: nowrap` retiré de `.bonus__val` dans SetCard
- **Déploiement** : Cloudflare Workers (pas Pages) ; proxy ESO status = Worker séparé `eso-status-proxy.simbad14100.workers.dev`

### Prochaine étape
SUPERSTAR est le template canonique — le perfectionner avant de créer d'autres builds.
