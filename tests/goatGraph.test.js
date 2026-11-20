// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGoatGraph, looksLikeId, goatIdFrom } from "../lib/goatGraph.js";

// A small invented family:
//   granny (doe) + grandpa (buck) -> mama (doe)
//   mama + outside buck "papa"    -> kid-doe, kid-buck (twins)
//   papa also sired "half" with a plain-name dam
const family = () => [
  { id: "granny", name: "Granny", sex: "doe" },
  { id: "grandpa", name: "Grandpa", sex: "buck" },
  { id: "mama", name: "Mama", sex: "doe", dam: "granny", sire: "grandpa", birth_date: "2020-03-01" },
  { id: "papa", name: "Papa", sex: "buck", status: "reference", dam: "Hill Farm Rose", sire: "" },
  { id: "kid-buck", name: "Kid Buck", sex: "buck", dam: "mama", sire: "papa", birth_date: "2025-04-10" },
  { id: "kid-doe", name: "Kid Doe", sex: "doe", dam: "mama", sire: "papa", birth_date: "2025-04-10" },
  { id: "half", name: "Half", sex: "wether", dam: "Somebody Else", sire: "papa", birth_date: "2026-02-01" },
];

test("offspring are found from the kids' dam and sire fields", () => {
  const { goats } = buildGoatGraph(family());
  assert.deepEqual([...goats.mama.offspring].sort(), ["kid-buck", "kid-doe"]);
  assert.deepEqual(goats.granny.offspring, ["mama"]);
  assert.deepEqual(goats.grandpa.offspring, ["mama"]);
  assert.deepEqual(goats["kid-doe"].offspring, []);
});

test("a buck's daughters come first, then newest first", () => {
  const { goats } = buildGoatGraph(family());
  assert.deepEqual(goats.papa.offspring, ["kid-doe", "half", "kid-buck"]);
});

test("a doe's offspring are newest first", () => {
  const goats = buildGoatGraph([
    { id: "mom", name: "Mom", sex: "doe" },
    { id: "old", name: "Old", sex: "doe", dam: "mom", birth_date: "2021-01-01" },
    { id: "new", name: "New", sex: "buck", dam: "mom", birth_date: "2024-01-01" },
  ]).goats;
  assert.deepEqual(goats.mom.offspring, ["new", "old"]);
});

test("parents link to goat files when they exist, plain text otherwise", () => {
  const { goats } = buildGoatGraph(family());
  assert.deepEqual(goats["kid-doe"].dam, { id: "mama", name: "Mama", found: true });
  assert.deepEqual(goats.papa.dam, { id: null, name: "Hill Farm Rose", found: false });
  assert.equal(goats.papa.sire, null);
});

test("grandparents are the parents' parents", () => {
  const { goats } = buildGoatGraph(family());
  const gp = goats["kid-doe"].grandparents;
  assert.equal(gp.damDam.id, "granny");
  assert.equal(gp.damSire.id, "grandpa");
  assert.equal(gp.sireDam.name, "Hill Farm Rose");
  assert.equal(gp.sireDam.found, false);
  assert.equal(gp.sireSire, null);
});

test("full siblings share both parents; half siblings don't count", () => {
  const { goats } = buildGoatGraph(family());
  assert.deepEqual(goats["kid-doe"].siblings, ["kid-buck"]);
  assert.deepEqual(goats["kid-buck"].siblings, ["kid-doe"]);
  assert.deepEqual(goats.half.siblings, []);
});

test("twins by a plain-name sire are still full siblings", () => {
  const { goats } = buildGoatGraph([
    { id: "mom", name: "Mom", sex: "doe" },
    { id: "a", name: "A", sex: "doe", dam: "mom", sire: "Copper Hill Ranger" },
    { id: "b", name: "B", sex: "buck", dam: "mom", sire: "Copper Hill Ranger" },
    { id: "c", name: "C", sex: "buck", dam: "mom", sire: "Other Buck" },
  ]);
  assert.deepEqual(goats.a.siblings, ["b"]);
  assert.deepEqual(goats.c.siblings, []);
});

test("a clean herd gives no warnings", () => {
  assert.deepEqual(buildGoatGraph(family()).warnings, []);
});

test("a missing parent id is shown as text and warned about", () => {
  const { goats, warnings } = buildGoatGraph([
    { id: "solo", name: "Solo", sex: "doe", dam: "ls-typo" },
  ]);
  assert.deepEqual(goats.solo.dam, { id: null, name: "ls-typo", found: false });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /dam "ls-typo" has no goat file/);
});

test("bad data is warned about without breaking the build", () => {
  const { goats, warnings } = buildGoatGraph([
    { id: "selfie", name: "Selfie", sex: "doe", dam: "selfie" },
    { id: "billy", name: "Billy", sex: "buck" },
    { id: "nanny", name: "Nanny", sex: "doe" },
    { id: "mixed", name: "Mixed", sex: "doe", dam: "billy", sire: "nanny" },
  ]);
  assert.ok(warnings.some((w) => /selfie: lists itself as its own dam/.test(w)));
  assert.ok(warnings.some((w) => /mixed: dam "billy" is a buck, not a doe/.test(w)));
  assert.ok(warnings.some((w) => /mixed: sire "nanny" is a doe, not a buck/.test(w)));
  assert.deepEqual(goats.selfie.offspring, [], "a goat is never its own offspring");
});

test("missing id, duplicate id and bad sex are reported", () => {
  const { ids, warnings } = buildGoatGraph([
    { name: "No Id", sex: "doe", _file: "goats/no-id.md" },
    { id: "twin", name: "First", sex: "doe" },
    { id: "twin", name: "Second", sex: "doe", _file: "goats/twin-2.md" },
    { id: "odd", name: "Odd", sex: "nanny" },
  ]);
  assert.deepEqual(ids, ["twin", "odd"]);
  assert.ok(warnings.some((w) => /no-id\.md: missing "id"/.test(w)));
  assert.ok(warnings.some((w) => /twin-2\.md: id "twin" is used by more than one goat/.test(w)));
  assert.ok(warnings.some((w) => /odd: "sex" should be doe, buck or wether/.test(w)));
});

test("looksLikeId tells ids from plain names", () => {
  assert.ok(looksLikeId("ls-clover"));
  assert.ok(looksLikeId("outside-buck-thunder"));
  assert.ok(!looksLikeId("Willow Creek Hazel"));
  assert.ok(!looksLikeId("LS-Clover"));
});

test("parents picked in the web editor (saved as file paths) link up", () => {
  const { goats, warnings } = buildGoatGraph([
    { id: "mom", name: "Mom", sex: "doe" },
    { id: "kid", name: "Kid", sex: "doe", dam: "src/goats/mom.md", sire: "", sire_name: "Neighbor's Buck" },
  ]);
  assert.equal(goats.kid.dam.id, "mom");
  assert.deepEqual(goats.kid.sire, { id: null, name: "Neighbor's Buck", found: false });
  assert.deepEqual(goats.mom.offspring, ["kid"]);
  assert.deepEqual(warnings, []);
});

test("goatIdFrom handles paths, ids and names", () => {
  assert.equal(goatIdFrom("src/goats/ls-clover.md"), "ls-clover");
  assert.equal(goatIdFrom("ls-clover"), "ls-clover");
  assert.equal(goatIdFrom(" Willow Creek Hazel "), "Willow Creek Hazel");
  assert.equal(goatIdFrom(undefined), "");
});

test("grandparents typed from papers fill in for outside parents", () => {
  const { goats } = buildGoatGraph([
    { id: "mama", name: "Mama", sex: "doe", dam: "granny-file", sire: "Old Buck" },
    { id: "granny-file", name: "Granny", sex: "doe" },
    {
      id: "kola", name: "Kola", sex: "doe",
      dam_name: "Sweet River Emerald", sire_name: "Still Meadow Basil",
      dam_dam_name: "River Birch Farms Cinder 1*M", dam_sire_name: "Sweet River Irish Whiskey",
      sire_dam_name: "Pricker Patch Farm Salt & Pepper 1*M", sire_sire_name: "Still Meadow Dante",
    },
    // Dam has her own page, so her parents win over anything typed.
    { id: "kid", name: "Kid", sex: "doe", dam: "mama", dam_dam_name: "Ignored", sire_sire_name: "Typed Grandsire" },
  ]);
  const k = goats.kola.grandparents;
  assert.equal(k.damDam.name, "River Birch Farms Cinder 1*M");
  assert.equal(k.sireDam.name, "Pricker Patch Farm Salt & Pepper 1*M");
  assert.equal(k.sireSire.found, false);
  const kid = goats.kid.grandparents;
  assert.equal(kid.damDam.id, "granny-file");
  assert.equal(kid.damSire.name, "Old Buck");
  assert.equal(kid.sireSire.name, "Typed Grandsire");
});
