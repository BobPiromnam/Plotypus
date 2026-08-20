"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const markerColour = require("../src/marker-colour.js");

function pixels(values) {
  return { data: Uint8ClampedArray.from(values.flat()) };
}

test("marker colour module exports a frozen public API", () => {
  assert.equal(Object.isFrozen(markerColour), true);
  assert.deepEqual(Object.keys(markerColour).sort(), ["detectDominantColour", "resolveLeaderLineColour"]);
});

test("dominant colour ignores transparent pixels and keeps a solid icon colour", () => {
  const colour = markerColour.detectDominantColour(pixels([
    [255, 0, 0, 0],
    [18, 104, 213, 255],
    [18, 104, 213, 255],
    [18, 104, 213, 255]
  ]));
  assert.equal(colour, "#1268d5");
});

test("dominant colour alpha-weights anti-aliased edge pixels", () => {
  const colour = markerColour.detectDominantColour(pixels([
    [20, 110, 210, 255],
    [20, 110, 210, 255],
    [28, 118, 218, 64],
    [240, 240, 240, 8]
  ]));
  assert.equal(colour, "#156fd3");
});

test("dominant colour returns blank when the image has no visible pixels", () => {
  assert.equal(markerColour.detectDominantColour(pixels([[10, 20, 30, 0]])), "");
});

test("leader line colour preserves point, category icon, then document precedence", () => {
  const category = {
    customIcon: {
      matchLeaderLines: true,
      leaderColour: "#20a060"
    }
  };
  assert.equal(markerColour.resolveLeaderLineColour({ leaderLineColour: "#c02020" }, category, "#404040"), "#c02020");
  assert.equal(markerColour.resolveLeaderLineColour({}, category, "#404040"), "#20a060");
  category.customIcon.matchLeaderLines = false;
  assert.equal(markerColour.resolveLeaderLineColour({}, category, "#404040"), "#404040");
  assert.equal(markerColour.resolveLeaderLineColour({}, null, "invalid"), "#333333");
});
