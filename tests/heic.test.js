import { test } from "node:test";
import assert from "node:assert/strict";
import { photoUrl, isHeic } from "../lib/heic.js";

test("HEIC photo links point at their JPEG copies", () => {
  assert.equal(photoUrl("/images/goats/IMG_1234.HEIC"), "/images/_converted/goats/IMG_1234.jpg");
  assert.equal(photoUrl("/images/reports/cae.heif"), "/images/_converted/reports/cae.jpg");
});

test("other files are left alone", () => {
  assert.equal(photoUrl("/images/goats/a.jpg"), "/images/goats/a.jpg");
  assert.equal(photoUrl("/images/reports/cae.pdf"), "/images/reports/cae.pdf");
  assert.equal(photoUrl(""), "");
  assert.ok(isHeic("x.HeIc"));
  assert.ok(!isHeic("x.jpg"));
});
