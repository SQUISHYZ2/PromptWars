import backdropWebp from '@/assets/backdrop-study.webp'

/**
 * Fixed, full-viewport study-desk backdrop. Uses `position: fixed` (not an
 * absolutely-positioned element inside the scrolling page) so it always
 * covers exactly the viewport regardless of how tall the page content grows —
 * an in-flow layer here previously stretched to the full document height and
 * blew up any 3D content sized relative to it.
 */
export function Backdrop() {
  return (
    <div
      className="app-backdrop"
      style={{ backgroundImage: `url(${backdropWebp})` }}
      aria-hidden="true"
    />
  )
}
