# can you find the secret?

A short, rainy-Thursday text adventure set on the UCSC campus. Wake up in Kresge, wander down through the colleges in search of a rumored secret garden behind Oakes. Slightly eerie, mostly normal on the surface.

Built on Adam Smith's StoryGraph engine for CMPM 120.

## Play

Start a local web server in the project root and open `index.html`:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Features

- **Draggable backpack inventory** — the pack follows your cursor on first load, drop it anywhere, then click to open your inventory.
- **Mini-map** on the left with a pulsating indicator for your current location.
- **Descriptive action log** — hover a past choice to see what you did.
- **Locked paths** — the garden gate behind Oakes needs a key. You'll know it when you see it.
- **Coffee easter egg** — three drinks at Perk Coffee earns you something.
- **Win condition** — reach the secret garden to trigger the ending card and toast. Wander off to Beyond without it and the story asks whether you ever really found it.

## Project layout

- `index.html` — entry point
- `engine.js` — StoryGraph engine (author: Adam Smith), extended with inventory UI, mini-map, action-echo log, auto-scroll, and win toast
- `rules.js` — `Start` / `Location` / `End` scenes + the `PerksBarista` custom scene for the coffee arc
- `myStory.json` — story data: locations, choices, items, win flag
- `style.css` — ink-navy theme with ivory choice buttons and a walking stick-figure hover animation
- `images/` — location art and item icons

## Credits

**Engine** — Adam Smith (amsmith@ucsc.edu)
**Game** — Bruce Ning, with special thanks to Sammy the Slug and PvZ for the inspiration.

### Image sources

- `evil_sammy.jpeg` — https://www.instagram.com/fuckucsc/
- `VistaA.jpeg` — https://www.pinterest.com/italianmom69/uc-santa-cruz/
- `Coffee-Bean.webp` — https://www.pinterest.com/italianmom69/uc-santa-cruz/
- `secret-garden.jpeg` — https://beautifulboundarieslawn.com/10-tips-creating-beautiful-garden/
