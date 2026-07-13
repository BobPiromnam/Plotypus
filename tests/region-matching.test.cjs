const test = require("node:test");
const assert = require("node:assert/strict");
const regionMatching = require("../region-matching.js");

const lookup = regionMatching.buildRegionLookup([
  { id: "Alberta", name: "Alberta" },
  { id: "British Columbia", name: "British Columbia" },
  { id: "Manitoba", name: "Manitoba" },
  { id: "New Brunswick", name: "New Brunswick" },
  { id: "Newfoundland and Labrador", name: "Newfoundland and Labrador" },
  { id: "Northwest Territories", name: "Northwest Territories" },
  { id: "Nova Scotia", name: "Nova Scotia" },
  { id: "Nunavut", name: "Nunavut" },
  { id: "Ontario", name: "Ontario" },
  { id: "Prince Edward Island", name: "Prince Edward Island" },
  { id: "Quebec", name: "Quebec" },
  { id: "Saskatchewan", name: "Saskatchewan" },
  { id: "Yukon", name: "Yukon" }
]);

test("normalizes case, accents, punctuation, and abbreviations", () => {
  assert.equal(regionMatching.resolveRegionInput("  ONTARIO  ", lookup).id, "Ontario");
  assert.equal(regionMatching.resolveRegionInput("Quebec", lookup).id, "Quebec");
  assert.equal(regionMatching.resolveRegionInput("Québec", lookup).id, "Quebec");
  assert.equal(regionMatching.resolveRegionInput("B.C.", lookup).id, "British Columbia");
  assert.equal(regionMatching.resolveRegionInput("P.E.I.", lookup).id, "Prince Edward Island");
});

test("maps common Canadian city inputs to their province or territory", () => {
  assert.equal(regionMatching.resolveRegionInput("Toronto", lookup).id, "Ontario");
  assert.equal(regionMatching.resolveRegionInput("Montreal", lookup).id, "Quebec");
  assert.equal(regionMatching.resolveRegionInput("Calgary", lookup).id, "Alberta");
  assert.equal(regionMatching.resolveRegionInput("Iqaluit", lookup).id, "Nunavut");
});

test("accepts conservative misspellings and rejects unknown regions", () => {
  const typo = regionMatching.resolveRegionInput("Albertaa", lookup);
  assert.equal(typo.id, "Alberta");
  assert.equal(typo.confidence, "typo");
  const transposed = regionMatching.resolveRegionInput("Ontairo", lookup);
  assert.equal(transposed.id, "Ontario");
  assert.equal(transposed.confidence, "typo");
  assert.equal(regionMatching.resolveRegionInput("Narnia", lookup).status, "unmatched");
});

test("protects against ambiguous short or duplicate matches", () => {
  assert.equal(regionMatching.resolveRegionInput("N", lookup).status, "unmatched");
  const duplicateLookup = regionMatching.buildRegionLookup([
    { id: "Region A", name: "Springfield" },
    { id: "Region B", name: "Springfield" }
  ]);
  assert.equal(regionMatching.resolveRegionInput("Springfield", duplicateLookup).status, "ambiguous");
});
