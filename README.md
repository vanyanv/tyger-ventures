# Tyger Ventures concepts

Three one-screen directions for the new tygerventures.com. Each concept fits a single screen with no scrolling and is built phone first.

| Path | Concept |
| --- | --- |
| `/` | Chooser page linking to the three concepts |
| `/burning-bright/` | The tiger logo assembles from ember particles on a dark page |
| `/broadside/` | Black and white poster with a kinetic wordmark and an inverting "eye" |
| `/night-forest/` | Centered layout inside animated tiger stripes, with a light and dark switch |

This is a static site with no build step. Each concept is one self-contained `index.html`. `tiger-logo.svg` is shared by all pages.

To preview locally, run `npx serve .` (or `python3 -m http.server`) from this folder and open the address it prints.

On Vercel, import the repository with the framework preset set to "Other" and leave the build command empty.

Copy is limited to what is on the current site: the name, the Blake stanza, the Contact link and the copyright line.
