#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROVINCES = Object.freeze({
  "10": { code: "NL", names: ["Newfoundland and Labrador", "Terre-Neuve-et-Labrador"] },
  "11": { code: "PE", names: ["Prince Edward Island", "Île-du-Prince-Édouard"] },
  "12": { code: "NS", names: ["Nova Scotia", "Nouvelle-Écosse"] },
  "13": { code: "NB", names: ["New Brunswick", "Nouveau-Brunswick"] },
  "24": { code: "QC", names: ["Quebec", "Québec"] },
  "35": { code: "ON", names: ["Ontario"] },
  "46": { code: "MB", names: ["Manitoba"] },
  "47": { code: "SK", names: ["Saskatchewan"] },
  "48": { code: "AB", names: ["Alberta"] },
  "59": { code: "BC", names: ["British Columbia", "Colombie-Britannique"] },
  "60": { code: "YT", names: ["Yukon"] },
  "61": { code: "NT", names: ["Northwest Territories", "Territoires du Nord-Ouest"] },
  "62": { code: "NU", names: ["Nunavut"] }
});

const CAPITALS = Object.freeze({
  "AB|edmonton": 1,
  "BC|victoria": 1,
  "MB|winnipeg": 1,
  "NB|fredericton": 1,
  "NL|st johns": 1,
  "NS|halifax": 1,
  "NT|yellowknife": 1,
  "NU|iqaluit": 1,
  "ON|ottawa": 2,
  "ON|toronto": 1,
  "PE|charlottetown": 1,
  "QC|quebec": 1,
  "SK|regina": 1,
  "YT|whitehorse": 1
});

const DISPLAY_OVERRIDES = Object.freeze({
  "ON|greater sudbury grand sudbury": { id: "ca-on-sudbury", name: "Sudbury", name_fr: "Sudbury", aliases: ["Greater Sudbury", "Grand Sudbury"] },
  "QC|quebec": { name: "Québec City", name_fr: "Ville de Québec", aliases: ["Québec", "Quebec"] },
  "QC|trois rivieres": { id: "ca-qc-trois-riv", name: "Trois-Rivières", name_fr: "Trois-Rivières", aliases: ["Three Rivers"] }
});

const CONCISE_PRIORITY = Object.freeze({
  CITY: 900,
  TOWN: 800,
  VILG: 700,
  MUN1: 650,
  MUN2: 640,
  MUN3: 630,
  HAM: 500,
  UNP: 400
});

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { help: true };
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
    values[name] = value;
    index += 1;
  }
  return {
    cgn: values.cgn,
    geosuite: values.geosuite,
    output: values.output || path.join("data", "cities.json"),
    minPopulation: Number(values["min-population"] || 1000)
  };
}

function usage() {
  return [
    "Build Plotypus's bundled Canadian city catalogue from official source CSV files.",
    "",
    "Usage:",
    "  node tools/build-cities.js --cgn <CGN CSV> --geosuite <StatCan CSD.csv> [--output data/cities.json] [--min-population 1000]",
    "",
    "Sources:",
    "  NRCan CGN: cgn_canada_csv_eng.csv from the Canada-wide pre-packaged CSV bundle",
    "  Statistics Canada: 2021 GeoSuite data package (file CSD.csv)"
  ].join("\n");
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

async function readCsv(filePath, visit, encoding = "utf-8") {
  const contents = new TextDecoder(encoding).decode(fs.readFileSync(filePath));
  const lines = contents.split(/\r?\n/);
  let headers = null;
  for (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
      continue;
    }
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] || ""; });
    visit(row);
  }
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-‐‑‒–—/]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return normalize(value).replace(/\b(city|ville)\b/g, "").replace(/\s+/g, "-").replace(/^-|-$/g, "");
}

function provinceCodeFromDguid(dguid) {
  const match = /^2021A0005(\d{2})\d{5}$/.exec(String(dguid || ""));
  return match && PROVINCES[match[1]] ? PROVINCES[match[1]].code : "";
}

function provinceCodeFromName(name) {
  const normalized = normalize(name);
  for (const province of Object.values(PROVINCES)) {
    if (province.names.some(candidate => normalize(candidate) === normalized)) return province.code;
  }
  return "";
}

function candidateScore(candidate) {
  const concise = CONCISE_PRIORITY[candidate.concise] || 0;
  const scale = Number(candidate.scale || 0);
  const language = ["eng", "fra", "und"].includes(candidate.language) ? 25 : 0;
  return concise * 100000000 + scale + language;
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(5));
}

async function loadPopulationRows(filePath, minPopulation) {
  const rows = [];
  await readCsv(filePath, row => {
    const dguid = row.CSDdguid;
    const provinceEntry = PROVINCES[String(row.PRuid || "")];
    const province = provinceEntry ? provinceEntry.code : provinceCodeFromDguid(dguid);
    const population = Number(row.CSDpop_2021);
    const lat = Number(row.CSDrplat);
    const lon = Number(row.CSDrplong);
    if (!province || !Number.isFinite(population) || population < minPopulation) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const name = String(row.CSDname || "").trim();
    const key = `${province}|${normalize(name)}`;
    rows.push({ dguid, name, prov: province, pop: population, lat, lon, key, type: String(row.CSDtype || "") });
  }, "windows-1252");
  return rows;
}

async function loadCgnCandidates(filePath, targetKeys) {
  const candidates = new Map();
  await readCsv(filePath, row => {
    if (row["Generic Category"] !== "Populated Place") return;
    const prov = provinceCodeFromName(row["Province - Territory"]);
    if (!prov) return;
    const key = `${prov}|${normalize(row["Geographical Name"])}`;
    if (!targetKeys.has(key)) return;
    const lat = Number(row.Latitude);
    const lon = Number(row.Longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const candidate = {
      name: String(row["Geographical Name"] || "").trim(),
      prov,
      lat,
      lon,
      concise: String(row["Concise Code"] || ""),
      scale: Number(row["Relevance at Scale"] || 0),
      language: String(row["ISO Language Code"] || "")
    };
    const existing = candidates.get(key);
    if (!existing || candidateScore(candidate) > candidateScore(existing)) candidates.set(key, candidate);
  }, "windows-1252");
  return candidates;
}

function createCity(population, candidate, usedIds) {
  const override = DISPLAY_OVERRIDES[population.key] || {};
  const name = override.name || (candidate && candidate.name) || population.name;
  let id = override.id || `ca-${population.prov.toLowerCase()}-${slug(name)}`;
  if (usedIds.has(id)) id = `${id}-${population.dguid.slice(-7)}`;
  usedIds.add(id);
  const capital = CAPITALS[population.key] || 0;
  const city = {
    id,
    name,
    name_fr: override.name_fr || name,
    prov: population.prov,
    lat: roundCoordinate(candidate ? candidate.lat : population.lat),
    lon: roundCoordinate(candidate ? candidate.lon : population.lon),
    pop: population.pop
  };
  if (capital) city.capital = capital;
  if (Array.isArray(override.aliases) && override.aliases.length) city.aliases = override.aliases;
  return city;
}

async function build(options) {
  if (!options.cgn || !options.geosuite) throw new Error("Both --cgn and --geosuite are required.");
  if (!Number.isFinite(options.minPopulation) || options.minPopulation < 1) throw new Error("--min-population must be a positive number.");
  [options.cgn, options.geosuite].forEach(filePath => {
    if (!fs.existsSync(filePath)) throw new Error(`Source file not found: ${filePath}`);
  });

  const population = await loadPopulationRows(options.geosuite, options.minPopulation);
  const targetKeys = new Set(population.map(row => row.key));
  const candidates = await loadCgnCandidates(options.cgn, targetKeys);
  const usedIds = new Set();
  const cities = population
    .slice()
    .sort((left, right) => right.pop - left.pop || left.name.localeCompare(right.name, "en-CA"))
    .map(row => createCity(row, candidates.get(row.key), usedIds))
    .sort((left, right) => right.pop - left.pop || left.name.localeCompare(right.name, "en-CA"));

  if (cities.length < 1000) {
    throw new Error(`Only ${cities.length} cities matched official coordinates; refusing to replace the catalogue.`);
  }
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(cities, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${cities.length} cities to ${options.output}.\n`);
  const directMatches = population.filter(row => candidates.has(row.key)).length;
  process.stdout.write(`${directMatches} use an exact CGN populated-place coordinate; ${population.length - directMatches} use the official GeoSuite census-subdivision representative point.\n`);
}

(async () => {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    await build(options);
  } catch (error) {
    fail(error && error.message || String(error));
  }
})();
