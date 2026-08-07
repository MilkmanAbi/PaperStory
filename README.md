# Fox &amp; Cat

A cozy little static site for reading a three-part story. Dark, warm, glass
panels, drifting fireflies, and a cat and a fox who wander the page and nap
where it's warm. Built to be dropped straight onto GitHub Pages, kept private.

Aoi is the cat. Luna is the fox.

- Chapter I - the cat (Aoi's POV)
- Chapter II - the fox (Luna's POV)
- Chapter III - both

The reader is scroll-driven: as you move through a chapter the wallpaper,
lighting, and accent colour cross-fade through a set of moods tuned to that
chapter's arc - night into a lilac dawn for I, a warm domestic dusk for II,
and a rose-gold hearth for III.

## Structure

```
FoxAndCat/
  index.html            landing / cover + three chapter doors
  read.html             the reader shell (reads ?ch=1|2|3)
  css/
    theme.css           glass + colour theming, reader layout, typography
  js/
    reader.js           the scroll mood-engine + markdown rendering
    landing.js          cover + chapter cards
    fireflies.js        window.Fireflies.init(...) - the drifting light
    neko.js             window.spawnNekos(...) - the sleepy wanderers
    art.js              window.ART - the inline SVG cat / fox / paw motifs
    vendor/marked.min.js  markdown parser (vendored, no CDN needed)
  stories/
    chapter-1.md        source text (edit these)
    chapter-2.md
    chapter-3.md
    stories-data.js     the .md files baked into JS (what the site loads)
  assets/
    wallpapers/         the mood backgrounds
    sprites/            cat.png, fox.png (oneko-style sprite sheets)
  .nojekyll             tells Pages to serve files as-is
```

## Deploy to GitHub Pages

1. Push this folder to a repo (a private repo is fine - Pages still works on
   it if your plan allows, otherwise keep the repo private and just run it
   locally; nothing here phones home).
2. Repo Settings -> Pages -> Build and deployment -> Source: "Deploy from a
   branch", branch `main`, folder `/ (root)`.
3. Give it a minute. Your site is at `https://<user>.github.io/<repo>/`.

The `.nojekyll` file is already here so Pages won't try to process anything.

## Run it locally

Any static server works, for example:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`. Opening `index.html` straight off disk
(`file://`) mostly works too, since the story text is baked into
`stories/stories-data.js` rather than fetched.

## Editing the story

The site loads `stories/stories-data.js`, which holds each chapter's markdown
as a string. Two ways to edit:

- Quick: edit the strings in `stories/stories-data.js` directly.
- Tidy: edit `stories/chapter-1.md` (etc.), then regenerate the data file.
  A tiny regenerator:

```
cd stories
{
  echo 'window.STORIES = {};'
  for n in 1 2 3; do
    printf 'window.STORIES[%s] = ' "$n"
    # strip the leading "# Chapter N" heading + first --- rule, then JSON-encode
    python3 - "$n" << 'PY'
import json,sys,re
n=sys.argv[1]
t=open(f"chapter-{n}.md",encoding="utf-8").read()
t=re.sub(r'^\s*#.*\n','',t,count=1)
t=re.sub(r'^\s*---\s*\n','',t,count=1)
print(json.dumps(t.strip())+';')
PY
  done
} > stories-data.js
```

## Tuning the moods

Each chapter's mood beats live in `reader.js` in the `CH` config - an array of
`{ at, wall, accent, scrimTop, scrimBot }` stops, where `at` is scroll
progress from 0 to 1. Add or move a stop and the cross-fade retimes itself.
Wallpapers are just files in `assets/wallpapers/`; swap the filenames to
restyle a beat.

## Credits

- The wandering sleepy companions are built on the classic **oneko** idea; the
  cat sprite sheet comes from the oneko.js lineage, and the fox is a recolour
  of it. Sprite-set layout follows the **lots-o-nekos** project.
- Glass-and-colour theming and the markdown reading style are lifted from my
  own **PaperNotes**.
- The firefly swarm is adapted from the effect in my **Sage-Playground**.
- Markdown rendered with **marked**.

Made cozy on purpose. (=^..^=)
