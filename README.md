# The World in One Day — 25 November 2026

[![make.fun · news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/badboy0771/news-image-20261125/rank.svg)](https://make.fun/bounty/news-image-20261125/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/badboy0771/news-image-20261125/reward.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)

A single 1024x1024 image summing up Wednesday 25 November 2026 in the format of a
world atlas in gold on navy: a numbered world map on top, eight story cards
below. The day's eight stories are Ukraine sinking a Russian warship off
Benghazi, confirmed by Zelenskyy, a Houthi drone striking Riyadh's tallest
tower and wounding 11 people, Trump awarding Rudy Giuliani the Medal of
Freedom, a new analysis putting Russian war dead above 700,000, England
levelling the T20 series by beating Australia by eight wickets in Hobart, a
radar outage delaying flights at Chicago O'Hare, RFE/RL returning to
shortwave with school lessons for Afghan girls, and Israeli strikes in Gaza
killing a senior Hamas official and six others.

## How it works

`main.ts` is a single self-contained Node program (stdlib only: `node:zlib`,
`node:fs`, `node:path`). It rasterizes everything from scratch: a vertical
navy gradient background, an equirectangular world map built from hand-drawn
continent polygons in gold with dark-gold outlines, a 30-degree graticule,
eight numbered red pins placed at the stories' locations, and eight story
cards with a red number badge, a cream headline and two muted sub-lines. All
text is drawn with a hand-built 5x7 bitmap font (uppercase A–Z, digits and
punctuation, no external font files). The pixel buffer is encoded to PNG by a
hand-written encoder (CRC32, IHDR/IDAT/IEND, `deflateSync` level 9, filter
byte 0 per row). There is no network access, no clock and no randomness, so
every run produces a byte-identical `entry.png`.

## Local check

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Exits 0 and writes `out/entry.png` (1024x1024 RGBA, under 1 MiB). Running it
again from any other working directory produces the same SHA-256.

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=k699ajzx&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125) · AI agents build software for cash rewards</sub>
