/**
 * goatGraph — works out every family relationship in the herd.
 *
 * Each goat file only says who its `dam` (mother) and `sire` (father) are.
 * This module turns that one-way information into everything the site shows:
 * offspring, grandparents, full siblings, and a list of data problems.
 *
 * It is a plain function with no Eleventy code in it, so it can be tested on
 * its own (see tests/goatGraph.test.js). src/_data/goatGraph.js reads the goat
 * files and hands them to buildGoatGraph().
 *
 * How a `dam` or `sire` value is read:
 *   - matches another goat's id         -> linked to that goat's page
 *   - looks like an id (lowercase-and-hyphens) but no goat has it
 *                                        -> shown as plain text, with a build
 *                                           warning (probably a typo or a
 *                                           goat file not added yet)
 *   - anything else, e.g. "Willow Creek Hazel"
 *                                        -> shown as plain text, no warning.
 *                                           Handy for distant ancestors you
 *                                           don't want to make a file for.
 *   - blank                              -> "unknown"
 *
 * The web editor saves a parent picked from the goat list as a file path,
 * e.g. "src/goats/ls-clover.md"; goatIdFrom() turns that into "ls-clover".
 * It also has a separate box for a parent that isn't in the list
 * (`dam_name` / `sire_name`), used when `dam` / `sire` is empty.
 * Grandparents come from the parent's own page when it has one, otherwise
 * from `dam_dam_name`, `dam_sire_name`, `sire_dam_name`, `sire_sire_name`.
 */

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True if a value is written like a goat id (e.g. "ls-clover"). */
export function looksLikeId(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/**
 * Normalise a goat link: "src/goats/ls-clover.md" or "ls-clover.md" -> "ls-clover".
 * Anything else (an id or a plain name) is returned trimmed.
 */
export function goatIdFrom(value) {
  if (value === undefined || value === null) return "";
  const v = String(value).trim();
  const m = v.match(/(?:^|\/)([^/]+)\.md$/i);
  return m ? m[1] : v;
}

/** Turn a dam/sire value into a reference the templates can show. */
function parentRef(value, byId) {
  value = goatIdFrom(value);
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const raw = String(value).trim();
  if (byId.has(raw)) {
    return { id: raw, name: byId.get(raw).name, found: true };
  }
  return { id: null, name: raw, found: false };
}

/** Birth date as a sortable number; goats with no date sort last. */
function birthTime(goat) {
  const t = goat.birth_date ? new Date(goat.birth_date).getTime() : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Sort offspring newest first. For a buck, daughters come before sons, because
 * buyers judge a buck largely by his daughters.
 */
export function sortOffspring(kids, parentSex) {
  return [...kids].sort((a, b) => {
    if (parentSex === "buck") {
      const aDoe = a.sex === "doe" ? 0 : 1;
      const bDoe = b.sex === "doe" ? 0 : 1;
      if (aDoe !== bDoe) return aDoe - bDoe;
    }
    return birthTime(b) - birthTime(a) || a.name.localeCompare(b.name);
  });
}

/**
 * Build the family graph.
 *
 * @param {Array<object>} goats  one object per goat file (front matter fields;
 *                               `description` may hold the Markdown body)
 * @returns {{ goats: Object<string, object>, ids: string[], warnings: string[] }}
 *   `goats` is keyed by id. Each entry is the original goat plus:
 *     dam, sire           parent reference {id, name, found} or null
 *     grandparents        {damDam, damSire, sireDam, sireSire}, each a ref or null
 *     offspring           array of ids, sorted (see sortOffspring)
 *     siblings            array of full-sibling ids, oldest first
 *   Relationships are stored as ids (not nested objects) so the data has no
 *   loops; templates look each id up in `goats`.
 */
export function buildGoatGraph(goats) {
  const warnings = [];
  const byId = new Map();

  // 1. Index every goat by id, skipping files that can't be used.
  for (const goat of goats) {
    const label = goat._file || goat.name || "a goat file";
    if (!goat.id) {
      warnings.push(`${label}: missing "id", so it was skipped.`);
      continue;
    }
    if (!looksLikeId(goat.id)) {
      warnings.push(
        `${label}: id "${goat.id}" should be lowercase letters, numbers and hyphens only (e.g. "ls-clover").`
      );
    }
    if (byId.has(goat.id)) {
      warnings.push(`${label}: id "${goat.id}" is used by more than one goat; only the first was kept.`);
      continue;
    }
    if (!goat.name) warnings.push(`${goat.id}: missing "name".`);
    if (!["doe", "buck", "wether"].includes(goat.sex)) {
      warnings.push(`${goat.id}: "sex" should be doe, buck or wether (found "${goat.sex ?? ""}").`);
    }
    byId.set(goat.id, { ...goat, name: goat.name || goat.id });
  }

  // 2. Resolve each goat's parents and check them.
  const result = {};
  for (const goat of byId.values()) {
    const dam = parentRef(goatIdFrom(goat.dam) || goat.dam_name, byId);
    const sire = parentRef(goatIdFrom(goat.sire) || goat.sire_name, byId);

    for (const [field, ref, expectedSex] of [
      ["dam", dam, "doe"],
      ["sire", sire, "buck"],
    ]) {
      if (!ref) continue;
      if (ref.found && ref.id === goat.id) {
        warnings.push(`${goat.id}: lists itself as its own ${field}.`);
      } else if (ref.found && byId.get(ref.id).sex !== expectedSex) {
        warnings.push(
          `${goat.id}: ${field} "${ref.id}" is a ${byId.get(ref.id).sex || "goat with no sex set"}, not a ${expectedSex}.`
        );
      } else if (!ref.found && looksLikeId(ref.name)) {
        warnings.push(`${goat.id}: ${field} "${ref.name}" has no goat file; shown as plain text.`);
      }
    }

    result[goat.id] = { ...goat, dam, sire, offspring: [], siblings: [] };
  }

  // A parent is only usable for further lookups if it isn't the goat itself.
  const usableParent = (goat, field) => {
    const ref = goat[field];
    return ref && ref.found && ref.id !== goat.id ? result[ref.id] : null;
  };

  // 3. Grandparents: the parents' parents.
  for (const goat of Object.values(result)) {
    const d = usableParent(goat, "dam");
    const s = usableParent(goat, "sire");
    // A parent with its own page supplies its parents; otherwise use the
    // names typed in from the registration papers (dam_dam_name, etc.).
    const typed = (field) => parentRef(goat[field], byId);
    goat.grandparents = {
      damDam: d ? d.dam : typed("dam_dam_name"),
      damSire: d ? d.sire : typed("dam_sire_name"),
      sireDam: s ? s.dam : typed("sire_dam_name"),
      sireSire: s ? s.sire : typed("sire_sire_name"),
    };
  }

  // 4. Offspring: every goat whose dam or sire is this goat.
  const kidsOf = new Map();
  for (const goat of Object.values(result)) {
    for (const field of ["dam", "sire"]) {
      const parent = usableParent(goat, field);
      if (!parent) continue;
      if (!kidsOf.has(parent.id)) kidsOf.set(parent.id, []);
      kidsOf.get(parent.id).push(goat);
    }
  }
  for (const [parentId, kids] of kidsOf) {
    const parent = result[parentId];
    // A goat listed as both dam and sire of one kid (bad data) appears once.
    const unique = [...new Map(kids.map((k) => [k.id, k])).values()];
    parent.offspring = sortOffspring(unique, parent.sex).map((k) => k.id);
  }

  // 5. Full siblings: same dam AND same sire. The dam must be a goat file
  //    (we find siblings through her offspring list); the sire can be a goat
  //    file or the same plain-text name, e.g. an outside buck with no file.
  const sireKey = (g) => (g.sire ? (g.sire.found ? `id:${g.sire.id}` : `name:${g.sire.name}`) : null);
  for (const goat of Object.values(result)) {
    const d = usableParent(goat, "dam");
    const key = sireKey(goat);
    if (!d || !key) continue;
    goat.siblings = d.offspring
      .filter((id) => id !== goat.id && sireKey(result[id]) === key)
      .sort((a, b) => birthTime(result[a]) - birthTime(result[b]));
  }

  return { goats: result, ids: Object.keys(result), warnings };
}
