#!/usr/bin/env node
import { parseArgs, scanRepo, renderScan } from './core.mjs';
const args = parseArgs();
const facts = scanRepo(args.root || process.cwd());
console.log(args.json ? JSON.stringify(facts, null, 2) : renderScan(facts, { noColor: args['no-color'] }));
