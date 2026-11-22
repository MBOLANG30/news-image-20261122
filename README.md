# The World in One Day — Sunday 22 November 2026

A newspaper-style infographic that sums up 22 November 2026's world news
in a single image: 8 story cards plus an "IN BRIEF" strip, all drawn in code
with an embedded 5x7 bitmap font and a hand-written PNG encoder.

## Run

```sh
node main.ts
```

It writes `/output/entry.png` (1024x1024 PNG, under 1 MiB). Set `OUTPUT_DIR`
to write somewhere else, e.g. `OUTPUT_DIR=/tmp/out node main.ts`.

No network, no clock, no randomness — the output is fixed for 22 Nov 2026.
