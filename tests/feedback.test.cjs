const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const feedback = require("../feedback.js");

const style = fs.readFileSync(path.resolve(__dirname, "..", "style.css"), "utf8");

function cssToken(name) {
  const match = style.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  return match ? match[1].trim() : "";
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  const linear = channels.map(channel => channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

const environment = {
  appVersion: "2026.07.14",
  protocol: "https:",
  hostname: "internal.example.gc.ca",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  browserLanguage: "en-CA"
};

test("feedback email uses the shared mailbox, Plotypus maintainer CC, and Plotypus copy", () => {
  const url = new URL(feedback.buildFeedbackEmailUrl(environment, {
    type: "problem",
    title: "Map does not render",
    details: "The preview remains empty."
  }));

  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "web@fin.gc.ca");
  assert.equal(url.searchParams.get("cc"), "itthiphol.piromnam@fin.gc.ca");
  assert.equal(url.searchParams.get("subject"), "Plotypus feedback: Map does not render");
  assert.match(url.searchParams.get("body"), /Hello Plotypus team/);
  assert.match(url.searchParams.get("body"), /Plotypus version: 2026\.07\.14/);
});

test("problem feedback targets the Plotypus bug form with privacy-safe details", () => {
  const url = new URL(feedback.buildBugReportUrl(environment, {
    title: "Map does not render",
    details: "The preview remains empty."
  }));

  assert.equal(url.origin + url.pathname, "https://github.com/BobPiromnam/Plotypus/issues/new");
  assert.equal(url.searchParams.get("template"), "bug_report.yml");
  assert.equal(url.searchParams.get("title"), "Map does not render");
  assert.equal(url.searchParams.get("details"), "The preview remains empty.");
  assert.match(url.searchParams.get("environment"), /Microsoft Edge 140\.0\.0\.0/);
  assert.doesNotMatch(url.searchParams.get("environment"), /internal\.example/);
  assert.doesNotMatch(url.searchParams.get("environment"), /Mozilla\/5\.0/);
});

test("suggestion feedback selects the Plotypus feature form", () => {
  const url = new URL(feedback.buildFeatureRequestUrl(environment, {
    type: "improvement",
    title: "Add another baselayer",
    details: "Let me select a municipal baselayer."
  }));

  assert.equal(url.searchParams.get("template"), "feature_request.yml");
  assert.equal(url.searchParams.get("title"), "Add another baselayer");
  assert.equal(url.searchParams.get("details"), "Let me select a municipal baselayer.");
});

test("environment helpers recognize portable Safari and reject arbitrary language text", () => {
  const safari = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_7) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15";

  assert.equal(feedback.detectFeedbackDistribution({ protocol: "file:" }), "Portable or local-file version");
  assert.equal(feedback.detectFeedbackDistribution({ protocol: "http:", hostname: "localhost" }), "Development or local web server");
  assert.equal(feedback.detectFeedbackBrowser(safari), "Safari 18.6");
  assert.equal(feedback.detectFeedbackOperatingSystem(safari), "macOS 15.7.7");
  assert.equal(feedback.normalizeFeedbackLanguage("fr-CA"), "fr-CA");
  assert.equal(feedback.normalizeFeedbackLanguage("private details"), "Not detected");
});

test("Plotypus issue forms accept the prefilled details and environment fields", () => {
  const templateDirectory = path.resolve(__dirname, "..", ".github", "ISSUE_TEMPLATE");
  const bugTemplate = fs.readFileSync(path.join(templateDirectory, "bug_report.yml"), "utf8");
  const suggestionTemplate = fs.readFileSync(path.join(templateDirectory, "feature_request.yml"), "utf8");
  const config = fs.readFileSync(path.join(templateDirectory, "config.yml"), "utf8");

  [bugTemplate, suggestionTemplate].forEach(template => {
    assert.match(template, /id: details/);
    assert.match(template, /id: environment/);
    assert.match(template, /Do not include map or project content/);
  });
  assert.match(bugTemplate, /name: Report a problem/);
  assert.match(suggestionTemplate, /name: Suggest an improvement/);
  assert.match(config, /blank_issues_enabled: false/);
});

test("Send feedback is a high-contrast secondary command", () => {
  const background = cssToken("feedback-action-background");
  const border = cssToken("feedback-action-border");
  const ink = cssToken("feedback-action-ink");
  const hoverBackground = cssToken("feedback-action-hover-background");
  const appBackground = cssToken("app-background");

  assert.ok(contrastRatio(ink, background) >= 7, `default text contrast: ${contrastRatio(ink, background).toFixed(2)}`);
  assert.ok(contrastRatio(ink, hoverBackground) >= 7, `hover text contrast: ${contrastRatio(ink, hoverBackground).toFixed(2)}`);
  assert.ok(contrastRatio(border, appBackground) >= 3, `button boundary contrast: ${contrastRatio(border, appBackground).toFixed(2)}`);
  assert.match(style, /\.feedback-header-button \.button-icon\s*\{[^}]*color:\s*inherit/s);
});
