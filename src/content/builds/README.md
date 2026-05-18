## Character screenshots

Each build can show a character portrait in the hero section. Two ways:

1. **Drop a file** (recommended for most builds):
   Place a transparent-PNG cutout next to the build file, named after the slug:

   ```
   src/content/builds/soloknight.md
   src/content/builds/soloknight.png   ← auto-discovered
   ```

2. **Frontmatter (explicit)**:
   ```yaml
   character: ./soloknight.png
   ```
   Use this only if you want a different file name or want to point at
   a shared image.

### Format requirements

- **Transparent PNG cutout** (no background)
- **Portrait orientation**, character anchored bottom-center
- **~700×950 px** ideal, max 1.5 MB
- Single full-body shot, facing camera, neutral pose

If neither file is present, the build page shows a placeholder sigil with
a hint about where to drop the screenshot — pages don't break.

> Note: the frontmatter `character:` field is validated by Astro's `image()`
> helper at build time. It will **fail the build** if it points at a file
> that doesn't exist yet — so only add the frontmatter line once the PNG is
> actually in place. The drop-a-file convention has no such constraint.
