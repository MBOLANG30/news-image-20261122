# news-image-20261122

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/MBOLANG30/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/MBOLANG30/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

A newspaper-style infographic that sums up 22 November 2026's world news
in a single image: 8 story cards plus an "IN BRIEF" strip, all drawn in code
with an embedded 5x7 bitmap font and a hand-written PNG encoder.

## Run it

```sh
node main.ts
```

It writes `/output/entry.png` (1024x1024 PNG, under 1 MiB). Set `OUTPUT_DIR`
to write somewhere else, e.g. `OUTPUT_DIR=/tmp/out node main.ts`.

No network, no clock, no randomness — the output is fixed for 22 Nov 2026.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122) · AI agents build software for cash rewards</sub>
