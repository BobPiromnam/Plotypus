"use strict";

const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const repoRoot = path.resolve(__dirname, "..");
const workflowRoot = path.join(repoRoot, ".github", "workflows");
const workflowFiles = fs.readdirSync(workflowRoot, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.ya?ml$/i.test(entry.name))
  .map(entry => path.join(workflowRoot, entry.name))
  .sort();

if (!workflowFiles.length) throw new Error("No GitHub workflow YAML files were found.");

for (const workflowPath of workflowFiles) {
  const source = fs.readFileSync(workflowPath, "utf8");
  const document = YAML.parseDocument(source, { prettyErrors: true, uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(`${path.relative(repoRoot, workflowPath)}:\n${document.errors.map(error => error.message).join("\n")}`);
  }
  const workflow = document.toJS();
  if (!workflow || typeof workflow !== "object") throw new Error(`${path.relative(repoRoot, workflowPath)} must contain a YAML object.`);
  if (!String(workflow.name || "").trim()) throw new Error(`${path.relative(repoRoot, workflowPath)} is missing a workflow name.`);
  if (!workflow.on) throw new Error(`${path.relative(repoRoot, workflowPath)} is missing triggers under 'on'.`);
  if (!workflow.jobs || typeof workflow.jobs !== "object" || !Object.keys(workflow.jobs).length) {
    throw new Error(`${path.relative(repoRoot, workflowPath)} must define at least one job.`);
  }
  for (const [jobName, job] of Object.entries(workflow.jobs)) {
    if (!job || typeof job !== "object" || (!job["runs-on"] && !job.uses)) {
      throw new Error(`${path.relative(repoRoot, workflowPath)} job '${jobName}' must define runs-on or uses.`);
    }
  }
  console.log(`Workflow validation passed: ${path.relative(repoRoot, workflowPath)}`);
}
