# Showroom: hero research (Nov 2026)

What the best automotive and luxury sites do in their first screen, and what we take from each for the three hero directions. Brand name: **Showroom**. Nothing from the old cream / black / gold «Beatlot» look is reused.

## Sites studied

| Site | What the first screen does | What we take |
|---|---|---|
| [Porsche](https://www.porsche.com/international/) | Full-bleed film or photo, one short model name, two quiet buttons. Rounded photo tiles below, one sans (Porsche Next) at a light weight, fluid type scale. A third-party teardown: [Porsche DESIGN.md](https://www.shadcn.io/design/porsche/raw). | **A**: let the footage carry the page, keep type light, two actions at most. **B**: soft rounded tiles, fluid `clamp()` type. |
| [Lucid Motors](https://www.lucidmotors.com/) | Slow cinematic film, very dark, huge thin headline, one warm metallic accent. Teardown: [Lucid DESIGN.md](https://www.shadcn.io/design/lucid/raw). | **A**: one accent only, used for one thing (the action and the beat). We pick a signal orange-red, not a metallic. |
| [Polestar](https://www.polestar.com/) | Strict minimalism: white or graphite, product on a plain floor, small caps labels, precise grid. The Polestar 5 site won Red Dot «Best of the Best» 2026 ([Red Dot interview](https://www.red-dot.org/magazine/interview-with-polestar), [ecomm.design](https://ecomm.design/site/polestar/), [Code and Theory case](https://www.codeandtheory.com/things-we-make/polestar)). | **B**: bright studio floor, silver, hairline grid, mono labels, a single cobalt accent. |
| [Rimac](https://www.rimac-automobili.com/) / [Nevera R](https://rimac-automobili.com/NeveraR/) | Engineering-first storytelling: dark stage, numbers as heroes, motion that reveals the car section by section ([design page](https://rimac-automobili.com/nevera/design/)). | **A**: a timecode and beat markers as the «numbers» of our product. |
| [Pagani](https://www.pagani.com/) | Near-black backdrop so the paint is the only colour; no brand colour fighting the car. Teardown: [Pagani DESIGN.md](https://www.shadcn.io/design/pagani/raw). | **A**: graphite and black around the car; the car (later: the dealer's footage) is the colour. |
| [Awwwards: automotive](https://www.awwwards.com/websites/automotive/) | Winners lean on scroll-driven film, oversized type, kinetic marquees, and a strong single idea per screen. | **C**: kinetic type and a marquee; one idea («your clips → a Reel») per screen. |
| [DesignRush: best automotive sites 2026](https://www.designrush.com/best-designs/websites/automotive) and [ColorWhistle 2025 list](https://colorwhistle.com/automotive-brand-websites/) | Dealer-group sites that convert: the main action is visible without scrolling on a phone, and social proof sits next to it. | All three: the chat action is in the first phone screen; a short proof line under it. |

Note: the brand sites themselves load heavy scripts and film; these notes come from the pages above, the third-party teardowns, and the listing sites. The teardown files on shadcn.io are reverse-engineered, not official brand documents.

## Patterns that hold across all of them
1. **One idea per screen.** A headline of 3–6 words. Everything else is quieter.
2. **The product is the colour.** Brand colour is used once, for the action.
3. **Motion has a meaning.** Film, a light sweep, or a reveal; never decorative bouncing. For us motion = **the beat**: cuts, pulses and counters keep time.
4. **Phone first.** Our dealers see the site from an Instagram bio link on a phone. The action has to sit in the first 100svh, thumb-reachable.
5. **Quiet chrome.** Thin nav, small labels, no clutter over the car.

## How this maps to the three directions
- **A, «Night shift» (dark cinematic):** Lucid / Pagani / Rimac. Full-bleed «footage» (placeholder: gradients, light sweep, road streaks, grain, letterbox), graphite and black, one signal accent `#FF4A1C`, a big quiet headline, a timecode and beat ticks.
- **B, «Studio white» (bright tech showroom):** Polestar / Porsche. White and silver floor, the car on a turntable with a reflection, hairline grid, mono spec labels, cobalt `#2450FF`, a phone showing the chat turning clips into a Reel.
- **C, «Drop» (bold, Instagram-native):** Awwwards kinetic winners and Reels UI itself. Hot gradient, huge stacked type, a Reel frame with story bars, stickers, beat-pulsing marquee. Magenta `#FF2D6F`, violet `#6B2BFF`, lime `#C8FF2E`.

## Technical rules used in all three
- GSAP 3.12.5 from cdnjs; the page is complete and readable without it (and with `prefers-reduced-motion`, motion is skipped).
- Car imagery: CSS gradients and one inline SVG silhouette (a generic coupe, no real model), ready to be swapped for a `<video>` by the local session (a commented slot marks the place).
- `overflow-x: clip`, `100svh`, `clamp()` type, tested at 360 px and 1440 px wide.
- EN / DE / FA switch in each hero (FA turns the page right-to-left with Vazirmatn).
