/**
 * Taxonomy feature — reference-data types (student epic #40).
 *
 * Mirror the public taxonomy DTOs of the backend (`GET /api/v1/categories`,
 * `/subjects`, `/districts`, `/languages`). These lists drive the search filter
 * options and the home-screen categories, so they are shared read-only data — no
 * feature owns them, the taxonomy feature does.
 */

/** A top-level subject grouping, e.g. "Languages", "Sciences". */
export type Category = {
  id: string;
  name: string;
  slug: string;
};

/** A teachable subject, optionally nested under a category. */
export type Subject = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
};

/** A city grouping districts for the cascading city → district picker. */
export type City = {
  id: string;
  name: string;
  slug: string;
};

/** A geographic district a tutor teaches in, scoped to one city. */
export type District = {
  id: string;
  name: string;
  slug: string;
  cityId: string;
};

/** A language of instruction. `code` is an ISO-639-style code. */
export type Language = {
  id: string;
  name: string;
  code: string;
};
