# CLAUDE.md — Kozy ESO PvP Builds

## Règles de collaboration

- **Langue :** répondre en français, coder en anglais (fichiers, variables, commentaires, commits)
- **Pédagogie :** expliquer le *pourquoi* de chaque décision non triviale
- **Discipline :** ne pas ajouter de fonctionnalités non demandées, ne pas refactorer sans raison

---

## Projet

Site statique dédié aux builds PvP ESO. Builds optimisés, guides de rotation, breakdowns de mécaniques pour Elder Scrolls Online.

**Repo :** https://github.com/simbxd/kozy-eso-pvp-builds
**Site :** https://kozy-eso-pvp-builds.netlify.app
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
| Netlify | Hébergement + CD depuis GitHub |
| Git / GitHub | Contrôle de version |

---

## Design system

### Palette (définie dans `src/styles/global.css` via `@theme`)

```css
--color-bg:          #09090f;   /* Noir pur, légère teinte violette */
--color-surface:     #101018;   /* Fond des cartes et panneaux */
--color-border:      #1e1c2e;   /* Bordures subtiles */
--color-text:        #ede8ff;   /* Texte principal — blanc lavande */
--color-text-muted:  #6b6585;   /* Texte secondaire, métadonnées */
--color-accent:      #8b5cf6;   /* Violet primaire */
--color-accent-dim:  #6d28d9;   /* Violet atténué, hover states */
--color-critical:    #ef4444;   /* Rouge — warnings */
--color-mono:        #c4b5fd;   /* Violet clair — valeurs code/stats */
```

### Typographie
- **Display/Titres :** Cormorant Garamond (serif)
- **Corps :** Crimson Pro (serif)
- **Stats/Code :** JetBrains Mono
- **Chargement :** Google Fonts via `@import` CSS (doit être en premier dans global.css)

---

## Architecture des fichiers

```
src/
├── content/
│   ├── builds/          ← Fichiers .md (un par build)
│   ├── articles/        ← Fichiers .md (un par article)
│   ├── sets/            ← Fichiers .json (un par set ESO)
│   └── skills/          ← Fichiers .json (un par skill ESO)
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── BuildCard.astro  ← Carte pour l'index des builds
│   └── Callout.astro    ← Annotations (formula/note/warning)
├── layouts/
│   ├── Base.astro       ← Layout universel (SEO, OG, a11y)
│   ├── Build.astro      ← Layout page de build
│   └── Article.astro    ← Layout page d'article
├── pages/
│   ├── index.astro
│   ├── builds/
│   │   ├── index.astro
│   │   ├── [slug].astro
│   │   └── class/[class].astro
│   ├── articles/
│   │   ├── index.astro
│   │   └── [slug].astro
│   └── rss.xml.ts
├── styles/
│   └── global.css
└── content.config.ts    ← Schémas Zod pour toutes les collections
public/
├── assets/og/           ← og-default.svg + og-default.png
├── robots.txt
└── favicon.svg
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

### Publier un build
1. Créer `src/content/builds/mon-build.md` avec le frontmatter complet
2. S'assurer que tous les IDs dans `sets[]` et `skills.bar1/bar2[]` ont un fichier JSON correspondant
3. `git add . && git commit -m "..." && git push` → Netlify déploie en ~30s

### Ajouter un set
1. Créer `src/content/sets/nom-du-set.json` (référencer UESP pour les bonus)
2. Ajouter l'ID dans le frontmatter du build concerné
3. Push

### Ajouter un skill
1. Créer `src/content/skills/nom-du-skill.json`
2. Ajouter l'ID dans `skills.bar1` ou `skills.bar2` du build
3. Push

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

---

## État du projet

**Dernière session :** 2026-05-10
**Milestone actuel :** M3 — Polish & Performance

### Contenu publié
- 1 build : SUPERSTAR (MagDK PvP)
- 1 article : Penetration Caps Explained
- 5 sets : Mighty Chudan, Rallying Cry, Two-Fanged Snake, Markyn Ring of Majesty, Armor of the Trainee
- 12 skills : barre offensive + défensive du build SUPERSTAR (avec icônes PNG)

### M2 — Terminé
- `SetCard.astro` : affichage des bonus de set, type coloré, acquisition, DLC, liens UESP/ESOHub
- `SkillBar.astro` : double barre avec icône, skill line, tooltip morph au hover
- Icônes récupérées automatiquement via `scripts/fetch-skill-icons.mjs` (UESP API)
- Data integrity check au build time via `assertIds()` dans `[slug].astro`

### Prochaine étape (M3)
Lighthouse audit, page 404 custom, QA mobile, accessibilité.
