# Fox & Cat

A cozy little static site for reading a three-part story. Dark, warm, glass
panels, hand-drawn cat/fox lineart, drifting fireflies, and a cat and a fox
who wander the page and nap where it's warm. Every chapter has its own
weather and a looping ambient track. Built to drop straight onto GitHub
Pages, kept private.

Aoi is the cat. Luna is the fox.

- Chapter I - the cat (Aoi's POV) - a rainy night
- Chapter II - the fox (Luna's POV) - a snowy evening
- Chapter III - both - a snowy night on the mountain

The reader is scroll-driven: as you move through a chapter the wallpaper,
lighting, accent colour, weather, and sound all shift through moods tuned to
that chapter's arc. In Chapter I the rain swells to its heaviest at the
hardest moment and thins to a few last drops by the lilac dawn.

## What's cozy in here

- Hand-drawn art - the cat, fox, and the pair are the author's own lineart,
  traced to clean SVG that takes on each chapter's accent colour.
- Chosen wallpapers - each mood beat uses one of the author's own picks
  (night forests, a rainy starlit coast, a painted starry sky, a dusk
  lookout, a firefly-lit ruin, a soft pastel dawn), mapped to the story:
  Chapter I stays dark and rainy through the night and lifts into the dawn
  it ends on; II moves from an overcast afternoon into dusk; III is all
  night. They live in assets/wallpapers/.
- Weather - real rain in Chapter I (drop-size physics, wind, rain on the
  glass) and soft drifting snow in II and III. Intensity follows the scroll.
- Ambient sound - one looping track per chapter, started politely on your
  first tap/scroll, with a toggle in the bottom-right corner:
    I  -> assets/audio/rain.mp3
    II -> assets/audio/whistle.mp3
    III-> assets/audio/mountain.mp3
- Sleepy companions - a cat and a fox amble in, nap side by side, and wander
  somewhere new. They never chase anything.

Everything is self-contained (the markdown parser is vendored) - it runs
offline and phones nothing home. Fireflies, weather, nekos, and audio all
respect prefers-reduced-motion.

## Structure

```
FoxAndCat/
  index.html            landing / cover + three chapter doors
  read.html             the reader shell (reads ?ch=1|2|3)
  css/theme.css         glass + colour theming, reader layout, typography
  js/
    reader.js           the scroll mood-engine (wallpaper, weather, sound)
    landing.js          cover + chapter cards
    weather.js          rain + snow engines and a small controller
    ambient.js          per-chapter looping audio + the sound toggle
    fireflies.js        the drifting light
    neko.js             the sleepy wanderers
    art.js              the inline SVG cat / fox / paw motifs
    vendor/marked.min.js  markdown parser (vendored, no CDN needed)
  stories/
    chapter-1.md .. chapter-3.md   source text (edit these)
    stories-data.js                the .md baked into JS (what the site loads)
  assets/
    wallpapers/         the mood-beat background images
    sprites/            cat.png, fox.png (oneko-style sprite sheets)
    audio/              rain.mp3, whistle.mp3, mountain.mp3
  .nojekyll             tells Pages to serve files as-is
```

## Deploy to GitHub Pages

1. Push this folder to a repo.
2. Settings -> Pages -> Build and deployment -> Source: "Deploy from a
   branch", branch main, folder / (root).
3. Give it a minute. Your site is at https://<user>.github.io/<repo>/

.nojekyll is already here so Pages serves everything as-is. All paths are
relative, so the repo-subfolder URL just works - don't rewrite any path to
start with /.

## Run it locally

```
python3 -m http.server 8000
```

then open http://localhost:8000/. Browsers won't play the audio until you
click or scroll once - that's expected, and the sound toggle sits in the
bottom-right.

## Editing the story

The site loads stories/stories-data.js, which holds each chapter's markdown
as a string. Edit the strings directly, or edit stories/chapter-N.md and
regenerate:

```
cd stories
{
  echo 'window.STORIES = {};'
  for n in 1 2 3; do
    printf 'window.STORIES[%s] = ' "$n"
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

## Tuning the moods, weather, and sound

Each chapter's config lives in reader.js in the CH object:

- weather is 'rain' or 'snow'; audio is the track path; vol its base volume.
- Each chapter has beats - an array of { at, wall, wx, accent, top, bot }
  stops, where at is scroll progress 0..1. wall is a filename in
  assets/wallpapers/, wx is the weather intensity (0..1), accent is the
  [r,g,b] accent, and top/bot are the scrim gradient stops. Everything
  cross-fades between stops as you scroll - add or move a stop and it retimes.

To restyle a beat, drop a new image into assets/wallpapers/ and point that
beat's wall at the filename. Any wide image works; it's shown full-bleed
(background-size: cover).


Made cozy on purpose. (=^..^=)
