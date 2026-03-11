/**
 * Shared constants used across app, lib, and features.
 * Keep API/page sizes and UI tuning in one place for consistency.
 */

/** Default page size for paginated lists (reviews, complaints, etc.). */
export const PAGE_SIZE = 10;

/** Root margin (px) for infinite-scroll IntersectionObserver. Load next page when sentinel is this far from viewport. */
export const FEED_INFINITE_SCROLL_ROOT_MARGIN = "200px";
