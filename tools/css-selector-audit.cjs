#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const nestedRuleAtRules = new Set(["@media", "@container", "@supports", "@layer", "@scope", "@document"]);

function normalizePrelude(prelude) {
  return prelude
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .trim();
}

function findToken(source, start, end, tokens) {
  let quote = "";
  let comment = false;
  let parens = 0;
  let brackets = 0;
  for (let index = start; index < end; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") parens += 1;
    else if (char === ")") parens = Math.max(0, parens - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (!parens && !brackets && tokens.has(char)) return index;
  }
  return -1;
}

function findClosingBrace(source, openIndex, end) {
  let depth = 1;
  let quote = "";
  let comment = false;
  for (let index = openIndex + 1; index < end; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return index;
  }
  throw new Error(`Unclosed CSS block starting at ${openIndex}`);
}

function parseLevel(source, context = "root") {
  const nodes = [];
  let cursor = 0;
  while (cursor < source.length) {
    const tokenIndex = findToken(source, cursor, source.length, new Set(["{", ";"]));
    if (tokenIndex < 0) break;
    const rawPrelude = source.slice(cursor, tokenIndex);
    const leadingMatch = rawPrelude.match(/^[\s\S]*?(?=\S(?:[\s\S]*$))/);
    const leadingLength = leadingMatch ? leadingMatch[0].length : 0;
    const preludeStart = cursor + leadingLength;
    const prelude = source.slice(preludeStart, tokenIndex).trim();
    if (!prelude) {
      cursor = tokenIndex + 1;
      continue;
    }
    if (source[tokenIndex] === ";") {
      cursor = tokenIndex + 1;
      continue;
    }
    const closeIndex = findClosingBrace(source, tokenIndex, source.length);
    const normalizedPrelude = normalizePrelude(prelude);
    const atName = normalizedPrelude.startsWith("@")
      ? (normalizedPrelude.match(/^@[\w-]+/) || [""])[0].toLowerCase()
      : "";
    const nested = nestedRuleAtRules.has(atName);
    nodes.push({
      start: preludeStart,
      open: tokenIndex,
      close: closeIndex,
      prelude,
      key: atName ? (nested ? normalizedPrelude : "") : normalizedPrelude,
      nested,
      context
    });
    cursor = closeIndex + 1;
  }
  return nodes;
}

function transformLevel(source, context = "root", write = false, duplicates = []) {
  const nodes = parseLevel(source, context);
  const groups = new Map();
  nodes.forEach(node => {
    if (!node.key) return;
    const list = groups.get(node.key) || [];
    list.push(node);
    groups.set(node.key, list);
  });
  groups.forEach((nodesForKey, key) => {
    if (nodesForKey.length > 1) duplicates.push({ context, selector: key, count: nodesForKey.length });
  });
  if (!write && !nodes.some(node => node.nested)) return { css: source, duplicates };

  const replacement = new Map();
  if (write) {
    groups.forEach(nodesForKey => {
      if (nodesForKey.length < 2) return;
      const last = nodesForKey[nodesForKey.length - 1];
      const declarations = nodesForKey.map(node => source.slice(node.open + 1, node.close).trim()).filter(Boolean);
      nodesForKey.slice(0, -1).forEach(node => replacement.set(node, ""));
      replacement.set(last, `${last.prelude} {\n${declarations.join("\n")}\n}`);
    });
  }

  let output = "";
  let cursor = 0;
  nodes.forEach((node, index) => {
    output += source.slice(cursor, node.start);
    if (replacement.has(node)) {
      output += replacement.get(node);
    } else if (node.nested) {
      const inner = source.slice(node.open + 1, node.close);
      const nestedContext = `${context} > ${normalizePrelude(node.prelude)}`;
      const transformed = transformLevel(inner, nestedContext, write, duplicates);
      output += `${node.prelude} {${transformed.css}}`;
    } else {
      output += source.slice(node.start, node.close + 1);
    }
    cursor = node.close + 1;
  });
  output += source.slice(cursor);
  return { css: output, duplicates };
}

function auditCss(source) {
  return transformLevel(source, "root", false, []).duplicates;
}

function declarationEntries(block) {
  const entries = [];
  let start = 0;
  let quote = "";
  let comment = false;
  let parens = 0;
  for (let index = 0; index <= block.length; index += 1) {
    const char = block[index] || ";";
    const next = block[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") parens += 1;
    else if (char === ")") parens = Math.max(0, parens - 1);
    else if (char === ";" && !parens) {
      const declaration = block.slice(start, index);
      const match = declaration.match(/^((?:\s|\/\*[\s\S]*?\*\/)*)(--[\w-]+|[a-zA-Z][\w-]*)\s*:/);
      if (match) {
        entries.push({
          name: match[2].toLowerCase(),
          propertyStart: start + match[1].length,
          end: Math.min(index + 1, block.length)
        });
      }
      start = index + 1;
    }
  }
  return entries;
}

function declarationNames(block) {
  return declarationEntries(block).map(entry => entry.name);
}

function auditDuplicateDeclarations(source, context = "root", findings = []) {
  parseLevel(source, context).forEach(node => {
    const body = source.slice(node.open + 1, node.close);
    if (node.nested) {
      auditDuplicateDeclarations(body, `${context} > ${normalizePrelude(node.prelude)}`, findings);
      return;
    }
    if (node.prelude.startsWith("@")) return;
    const seen = new Set();
    const duplicates = new Set();
    declarationNames(body).forEach(name => {
      if (seen.has(name)) duplicates.add(name);
      seen.add(name);
    });
    if (duplicates.size) {
      findings.push({
        context,
        selector: normalizePrelude(node.prelude),
        properties: [...duplicates]
      });
    }
  });
  return findings;
}

function auditImportantWithoutComments(source, context = "root", findings = []) {
  parseLevel(source, context).forEach(node => {
    const body = source.slice(node.open + 1, node.close);
    if (node.nested) {
      auditImportantWithoutComments(body, `${context} > ${normalizePrelude(node.prelude)}`, findings);
      return;
    }
    if (!body.includes("!important") || node.prelude.startsWith("@")) return;
    if (!/\/\*[\s\S]*?\*\//.test(node.prelude)) {
      findings.push({ context, selector: normalizePrelude(node.prelude) });
    }
  });
  return findings;
}

function auditImportantOutsideAllowlist(source, allowedSelectors = new Set(), context = "root", findings = []) {
  parseLevel(source, context).forEach(node => {
    const body = source.slice(node.open + 1, node.close);
    if (node.nested) {
      auditImportantOutsideAllowlist(body, allowedSelectors, `${context} > ${normalizePrelude(node.prelude)}`, findings);
      return;
    }
    if (!body.includes("!important") || node.prelude.startsWith("@")) return;
    const selector = normalizePrelude(node.prelude);
    if (!allowedSelectors.has(selector)) findings.push({ context, selector });
  });
  return findings;
}

function auditIdTypography(source, context = "root", findings = []) {
  const typographyProperties = new Set([
    "font",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "line-height",
    "text-transform"
  ]);
  parseLevel(source, context).forEach(node => {
    const body = source.slice(node.open + 1, node.close);
    if (node.nested) {
      auditIdTypography(body, `${context} > ${normalizePrelude(node.prelude)}`, findings);
      return;
    }
    const selector = normalizePrelude(node.prelude);
    const properties = declarationNames(body).filter(property => typographyProperties.has(property));
    if (selector.includes("#") && properties.length) findings.push({ context, selector, properties });
  });
  return findings;
}

function auditSemanticTypographyOverrides(source, context = "root", findings = []) {
  const semanticClass = /\.(?:type|t)-(?:display|page-title|dialog-title|panel-title|card-title|summary-heading|eyebrow|control-label|control|body|supporting|caption|data|metric|table-heading|editable-text|numeric-data|status-badge)\b/;
  const standaloneSemanticClass = /^\.(?:type|t)-(?:display|page-title|dialog-title|panel-title|card-title|summary-heading|eyebrow|control-label|control|body|supporting|caption|data|metric|table-heading|editable-text|numeric-data|status-badge)$/;
  const typographyProperties = new Set([
    "font",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "line-height",
    "text-transform"
  ]);
  parseLevel(source, context).forEach(node => {
    const body = source.slice(node.open + 1, node.close);
    if (node.nested) {
      auditSemanticTypographyOverrides(body, `${context} > ${normalizePrelude(node.prelude)}`, findings);
      return;
    }
    const selector = normalizePrelude(node.prelude);
    const properties = declarationNames(body).filter(property => typographyProperties.has(property));
    if (!properties.length) return;
    const contextualParts = selector.split(",").filter(part => semanticClass.test(part) && !standaloneSemanticClass.test(part));
    if (contextualParts.length) findings.push({ context, selector, properties });
  });
  return findings;
}

function removeDuplicateDeclarationsFromBlock(block) {
  const entries = declarationEntries(block);
  const lastIndexByName = new Map();
  entries.forEach((entry, index) => lastIndexByName.set(entry.name, index));
  const removals = entries
    .map((entry, index) => ({ ...entry, index }))
    .filter(entry => lastIndexByName.get(entry.name) !== entry.index)
    .sort((a, b) => b.propertyStart - a.propertyStart);
  return removals.reduce((output, entry) => (
    output.slice(0, entry.propertyStart) + output.slice(entry.end)
  ), block);
}

function cleanDuplicateDeclarations(source, context = "root") {
  const nodes = parseLevel(source, context);
  let output = "";
  let cursor = 0;
  nodes.forEach(node => {
    output += source.slice(cursor, node.open + 1);
    const body = source.slice(node.open + 1, node.close);
    output += node.nested
      ? cleanDuplicateDeclarations(body, `${context} > ${normalizePrelude(node.prelude)}`)
      : node.prelude.startsWith("@")
        ? body
        : removeDuplicateDeclarationsFromBlock(body);
    output += "}";
    cursor = node.close + 1;
  });
  return output + source.slice(cursor);
}

function braceDelta(line, state) {
  let delta = 0;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (state.comment) {
      if (char === "*" && next === "/") {
        state.comment = false;
        index += 1;
      }
      continue;
    }
    if (state.quote) {
      if (char === "\\") index += 1;
      else if (char === state.quote) state.quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      state.comment = true;
      index += 1;
    } else if (char === '"' || char === "'") {
      state.quote = char;
    } else if (char === "{") {
      delta += 1;
    } else if (char === "}") {
      delta -= 1;
    }
  }
  return delta;
}

function formatCssWhitespace(source) {
  const output = [];
  const state = { comment: false, quote: "" };
  let depth = 0;
  let pendingBlank = false;
  source.split(/\r?\n/).forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) {
      pendingBlank = depth === 0 && output.length > 0;
      return;
    }
    if (pendingBlank && output[output.length - 1] !== "") output.push("");
    pendingBlank = false;
    const lineDepth = Math.max(0, depth - (line.startsWith("}") ? 1 : 0));
    output.push(`${"  ".repeat(lineDepth)}${line}`);
    depth = Math.max(0, depth + braceDelta(line, state));
  });
  while (output[output.length - 1] === "") output.pop();
  return `${output.join("\n")}\n`;
}

function reorderCanonicalMedia(source) {
  const order = [
    "@media (max-width: 1280px)",
    "@media (max-width: 1080px)",
    "@media (max-width: 840px)",
    "@media (max-width: 620px)"
  ];
  const orderSet = new Set(order);
  const nodes = parseLevel(source, "root").filter(node => orderSet.has(normalizePrelude(node.prelude)));
  if (nodes.length !== order.length) return source;
  const blocks = new Map(nodes.map(node => [normalizePrelude(node.prelude), source.slice(node.start, node.close + 1)]));
  let output = "";
  let cursor = 0;
  nodes.forEach((slot, index) => {
    output += source.slice(cursor, slot.start);
    output += blocks.get(order[index]);
    cursor = slot.close + 1;
  });
  return output + source.slice(cursor);
}

function consolidateCss(source) {
  return reorderCanonicalMedia(transformLevel(source, "root", true, []).css);
}

if (require.main === module) {
  const write = process.argv.includes("--write");
  const fixDeclarations = process.argv.includes("--fix-declarations");
  const format = process.argv.includes("--format");
  const path = process.argv.filter(argument => !["--write", "--fix-declarations", "--format"].includes(argument))[2] || "styles/app.css";
  const source = fs.readFileSync(path, "utf8");
  if (write) fs.writeFileSync(path, consolidateCss(source));
  if (fixDeclarations) fs.writeFileSync(path, cleanDuplicateDeclarations(write ? fs.readFileSync(path, "utf8") : source));
  if (format) fs.writeFileSync(path, formatCssWhitespace(write || fixDeclarations ? fs.readFileSync(path, "utf8") : source));
  const auditedSource = write || fixDeclarations || format ? fs.readFileSync(path, "utf8") : source;
  const duplicates = auditCss(auditedSource);
  const duplicateDeclarations = auditDuplicateDeclarations(auditedSource);
  const uncommentedImportantRules = auditImportantWithoutComments(auditedSource);
  if (duplicates.length) {
    duplicates.forEach(item => process.stderr.write(`${item.context}: ${item.selector} (${item.count})\n`));
    process.exitCode = 1;
  }
  if (duplicateDeclarations.length) {
    duplicateDeclarations.forEach(item => process.stderr.write(
      `${item.context}: ${item.selector} repeats ${item.properties.join(", ")}\n`
    ));
    process.exitCode = 1;
  }
  if (uncommentedImportantRules.length) {
    uncommentedImportantRules.forEach(item => process.stderr.write(
      `${item.context}: ${item.selector} uses !important without an explanatory comment\n`
    ));
    process.exitCode = 1;
  }
}

module.exports = {
  auditCss,
  auditDuplicateDeclarations,
  auditIdTypography,
  auditImportantOutsideAllowlist,
  auditImportantWithoutComments,
  auditSemanticTypographyOverrides,
  cleanDuplicateDeclarations,
  consolidateCss,
  declarationNames,
  formatCssWhitespace,
  normalizePrelude,
  parseLevel
};
