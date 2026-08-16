#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import {
  CANONICAL_SCENARIO_IDS,
  assertValidScenario,
  createCanonicalScenario,
  runParameterSweep,
  runSelectionLifecycle,
} from "../dist/selection-lifecycle/index.js";

function usage() {
  return `Usage:
  npm run simulate:selection-lifecycle -- [options]

Options:
  --list                         List built-in scenario IDs
  --scenario <id|file.json>      Built-in ID or JSON ScenarioSpec (default: knights-tally-rope)
  --seed <text>                  Reproducible seed (default: selection-lifecycle-demo)
  --ticks <integer>              Override declared horizon
  --output <file.json>           Output path (default: tmp/selection-lifecycle/<scenario>.json)
  --sweep <pointer=v1,v2,...>    Add a safe-integer JSON-Pointer sweep axis; repeatable
  --replicates <integer>         Seeds per sweep coordinate (default: 1)
  --help                         Show this help
`;
}

function parseArguments(argv) {
  const options = {
    scenario: "knights-tally-rope",
    seed: "selection-lifecycle-demo",
    ticks: undefined,
    output: undefined,
    sweeps: [],
    replicates: 1,
    list: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`missing value after ${argument}`);
      return argv[index];
    };
    switch (argument) {
      case "--scenario":
        options.scenario = next();
        break;
      case "--seed":
        options.seed = next();
        break;
      case "--ticks":
        options.ticks = Number(next());
        break;
      case "--output":
        options.output = next();
        break;
      case "--sweep":
        options.sweeps.push(next());
        break;
      case "--replicates":
        options.replicates = Number(next());
        break;
      case "--list":
        options.list = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`unknown argument '${argument}'`);
    }
  }
  if (options.ticks !== undefined && (!Number.isSafeInteger(options.ticks) || options.ticks < 1)) {
    throw new Error("--ticks must be a positive safe integer");
  }
  if (!Number.isSafeInteger(options.replicates) || options.replicates < 1) {
    throw new Error("--replicates must be a positive safe integer");
  }
  return options;
}

async function loadScenario(reference) {
  if (CANONICAL_SCENARIO_IDS.includes(reference)) {
    return createCanonicalScenario(reference);
  }
  const input = JSON.parse(await readFile(resolve(reference), "utf8"));
  assertValidScenario(input);
  return input;
}

function parseSweepAxis(input) {
  const separator = input.indexOf("=");
  if (separator <= 0 || separator === input.length - 1) {
    throw new Error(`invalid sweep '${input}'; expected /json/pointer=1,2,3`);
  }
  const path = input.slice(0, separator);
  const values = input
    .slice(separator + 1)
    .split(",")
    .map(value => Number(value));
  if (values.some(value => !Number.isSafeInteger(value))) {
    throw new Error(`sweep '${input}' contains a non-safe-integer value`);
  }
  return { path, values };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (options.list) {
    process.stdout.write(`${CANONICAL_SCENARIO_IDS.join("\n")}\n`);
    return;
  }
  const scenario = await loadScenario(options.scenario);
  const outputPath = resolve(options.output ?? `tmp/selection-lifecycle/${scenario.id}.json`);
  let output;
  if (options.sweeps.length > 0) {
    const seeds = Array.from(
      { length: options.replicates },
      (_, index) => `${options.seed}:${index}`
    );
    output = runParameterSweep(
      scenario,
      options.sweeps.map(parseSweepAxis),
      seeds,
      options.ticks === undefined ? {} : { ticks: options.ticks }
    );
  } else {
    const run = runSelectionLifecycle(
      scenario,
      options.seed,
      options.ticks === undefined ? {} : { ticks: options.ticks }
    );
    output = { summary: run.summary, events: run.events, terminalState: run.state };
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
