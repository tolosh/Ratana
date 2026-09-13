# Public home page and deployment

## What I’ll build
- Move the existing synthetic Lantern product experience from `/` to `/demo` without changing its workflows.
- Build a new public home page at `/` using the supplied copy and required sections: problem, platform, five-step workflow, demo, trust and governance, and final call to action.
- Keep the existing Rātana/Lantern design system: Newsreader and IBM Plex typography, Harbour blue, reserved clinical signal colours, Iris only for machine-generated content, restrained borders and motion.
- Use a real capture of the current Network Command screen as the main product visual, showing 5,000 active monitored patients and 100% virtual-bed occupancy.
- Add a compact mobile menu and ensure every “Take it for a run” action opens `/demo`.
- Add the required page-specific search and social metadata, precise synthetic-data boundaries, and accessible semantic structure.

## Verification and release
- Check desktop and mobile layouts, navigation anchors, all demo links, image readability, keyboard focus, and browser console errors.
- Confirm the production build is healthy, then publish the updated app to the existing live URL.

## Technical details
- Add a focused home-page component and a `/demo` route while retaining TanStack routing.
- Keep styling token-based and reuse the existing Button component.
- Use a bundled screenshot asset; no stock imagery or external image dependency.
