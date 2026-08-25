const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveLocationHierarchy } = require("../src/location-hierarchy.js");

test("exact coordinates override city and region without deleting their fallback data", () => {
  const resolved = resolveLocationHierarchy({
    exactLon: -75.7,
    exactLat: 45.4,
    cityId: "ca-on-toronto",
    cityLon: -79.38,
    cityLat: 43.65,
    region: "Ontario"
  });

  assert.equal(resolved.source, "coordinates");
  assert.equal(resolved.anchor, "coord");
  assert.equal(resolved.lon, -75.7);
  assert.equal(resolved.lat, 45.4);
  assert.equal(resolved.locationIssue, false);
});

test("city coordinates override a province or territory when exact coordinates are absent", () => {
  const resolved = resolveLocationHierarchy({
    cityId: "ca-on-toronto",
    cityLon: -79.38,
    cityLat: 43.65,
    region: "Ontario"
  });

  assert.equal(resolved.source, "city");
  assert.equal(resolved.anchor, "city");
  assert.equal(resolved.lon, -79.38);
  assert.equal(resolved.lat, 43.65);
});

test("province or territory remains a valid broad fallback", () => {
  const resolved = resolveLocationHierarchy({ region: "Ontario" });

  assert.equal(resolved.source, "region");
  assert.equal(resolved.anchor, "region");
  assert.equal(resolved.hasLocation, true);
  assert.equal(resolved.lon, "");
  assert.equal(resolved.lat, "");
});

test("partial exact coordinates surface an issue while retaining a valid city fallback", () => {
  const resolved = resolveLocationHierarchy({
    exactLon: -75.7,
    exactLat: "",
    cityId: "ca-on-toronto",
    cityLon: -79.38,
    cityLat: 43.65,
    region: "Ontario"
  });

  assert.equal(resolved.source, "city");
  assert.equal(resolved.hasLocation, true);
  assert.equal(resolved.locationIssue, true);
  assert.equal(resolved.hasPartialExactCoordinates, true);
});

test("an unlocated marker is distinct from an incomplete location", () => {
  assert.deepEqual(
    resolveLocationHierarchy({}).source,
    "unlocated"
  );
  assert.equal(resolveLocationHierarchy({ exactLon: -75.7 }).locationIssue, true);
});
