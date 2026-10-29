# Faisal Karim — Portfolio

Static portfolio site (plain HTML/CSS/JS + three.js from CDN). No build step.

- `site/` — everything that gets deployed
- `site/assets/electrical.glb` — the five Blender models (exported from `blender/electrical_assets.blend`)
- `blender/` — source `.blend` file (not deployed)

## Run locally

Any static server works. From the repo root:

```
python -m http.server 8080 -d site
```

Then open http://localhost:8080.

## Deploy to Cloudflare Pages (via GitHub)

1. Push this repo to GitHub (the whole thing, including `site/` and `wrangler.toml`).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`site`**
4. Deploy. The site is served at `https://<project-name>.pages.dev`.

Every push to the production branch redeploys automatically.

## Re-exporting the 3D models

In Blender, select all five root objects (`RailSignal`, `Transformer`, `Tower`, `Switchgear`, `SolarArray`) and export glTF 2.0 as `site/assets/electrical.glb` with "Selected Objects" ticked. `main.js` looks the objects up by those names.
