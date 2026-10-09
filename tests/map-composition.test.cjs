"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const composition = require("../src/map-composition.js");

test("sample composition candidates scale to the canvas without changing project data", () => {
  const row = { rowId: "stable", name: "Grays Bay Road and Port", lon: -108.4, lat: 68.5 };
  const original = { ...row };
  const large = composition.sampleCandidates(row, { width: 1000, height: 700 });
  const small = composition.sampleCandidates(row, { width: 500, height: 350 });
  assert.ok(large.length > 1);
  assert.deepEqual(row, original);
  large.forEach((point, index) => {
    assert.equal(point.side, small[index].side);
    assert.equal(point.x, small[index].x * 2);
    assert.equal(point.y, small[index].y * 2);
  });
  assert.deepEqual(composition.sampleCandidates({ name: "Unrelated project" }, { width: 500, height: 350 }), []);
  assert.deepEqual(composition.sampleCandidates({ ...row, labelStyle: "rich" }, { width: 500, height: 350 }), []);
});

test("regional briefing groups all thirteen provinces and territories and retains bilingual editable content", () => {
  assert.equal(Object.keys(composition.regionFills()).length, 13);
  const rows = composition.createRegionalRows();
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map(row => row.rowId)).size, 6);
  rows.forEach(row => {
    assert.ok(row.name && row.nameFr && Number.isFinite(row.lon) && Number.isFinite(row.lat));
    assert.equal(row.labelStyle, "rich");
    assert.ok(row.content[0].items.every(item => item.en && item.fr));
    assert.match(row.leaderLineColour, /^#[a-f0-9]{6}$/);
  });
  const positions = composition.regionalPositions(720, 540);
  assert.deepEqual(Object.keys(positions).sort(), rows.map(row => "row:" + row.rowId).sort());
  rows.forEach(row => {
    const candidate = composition.regionalCandidates(row, { width: 720, height: 540 })[0];
    assert.deepEqual({ x: candidate.x, y: candidate.y, side: candidate.side }, positions["row:" + row.rowId]);
  });
  assert.deepEqual(composition.regionalCandidates({ ...rows[0], rowId: "unrelated" }, { width: 720, height: 540 }), []);
});

test("bundled example artwork is self-contained and image descriptions do not become visible captions", () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(require.resolve("../assets/illustrations/regional-briefing/artwork.js"), "utf8"), context);
  const rows = composition.createRegionalRows(context.window.PLOTYPUS_BRIEFING_ARTWORK);
  rows.forEach(row => {
    const image = row.content.find(block => block.type === "image");
    assert.match(image.assetRef, /^data:image\/png;base64,/);
    const png = Buffer.from(image.assetRef.split(",")[1], "base64");
    assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), image.naturalWidth);
    assert.equal(png.readUInt32BE(20), image.naturalHeight);
    assert.ok(image.alt.en && image.alt.fr);
    assert.deepEqual(image.caption, { en: "", fr: "" });
  });
});
