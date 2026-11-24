# Tyger Ventures

The tygerventures.com site: a single dark screen with no scrolling. The tiger logo is drawn from ember particles; moving the pointer or dragging a finger stirs it, and sustained stirring builds from sparks to flames to a full blaze.

## Stack

- Next.js (App Router, TypeScript), deployed on Vercel
- Tailwind CSS v4, with tokens in `app/globals.css`
- Motion (`motion/react`) for entrance animation
- Magic UI components in `components/magicui` (Border Beam, Blur Fade)

## Layout of the code

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The home page |
| `app/layout.tsx` | Fonts (Bodoni Moda, Schibsted Grotesk) and metadata |
| `app/globals.css` | Color and font tokens, plus the few classes Tailwind utilities can't express |
| `lib/site.ts` | All copy and links: name, verse, contact link, copyright |
| `lib/ember-engine.ts` | The canvas particle engine (framework-free) |
| `components/ember-tiger.tsx` | React wrapper for the engine; its ref exposes `stir()` and `burst()` |
| `public/tiger-logo.svg` | The logo the particles are sampled from |

## Develop

```bash
npm install
npm run dev
```

`npm run build` makes the production build and `npm run lint` runs ESLint.

## Notes

- The page must fit one screen on phones and desktops. The tiger's size is derived from the space the text leaves over (`.tiger-home` in `app/globals.css`), and the three vertical gaps in the middle of the page are kept equal.
- The verse and its attribution are verbatim from the original site. Edit copy only in `lib/site.ts`.
- With "reduce motion" turned on, the tiger is drawn once and nothing animates.
