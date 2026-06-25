/* core/aliases.jsx — the per-file React.useState aliases, defined ONCE here for the
   whole app. Each demo screen historically did its own `const { useState: useX } = React`
   (to avoid redeclaring `useState`, since the build globalises every top-level binding).
   The core toolkit + the live screens reuse those same names, so they must live in the
   shared engine — otherwise live would depend on a demo file just for `useHS`/`useP`/…
   Loaded first among core/, before any kit or screen that calls them. */
const { useState: useHomeState } = React; // was screens/home.jsx
const { useState: useHS } = React;        // was screens/habits.jsx
const { useState: useCS } = React;        // was screens/community.jsx
const { useState: useP } = React;         // was screens/profile.jsx
const { useState: useM } = React;         // was screens/extra.jsx
