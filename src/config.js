// Loads the YAML config + resolves the project root.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

// src/ -> project root is one level up
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readYaml(rel) {
  return yaml.load(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

export function loadConfig() {
  return {
    accounts: readYaml('config/accounts.yaml'),
    topics: readYaml('config/topics.yaml'),
    scoring: readYaml('config/scoring.yaml'),
  };
}
