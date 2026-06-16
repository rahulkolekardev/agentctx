#!/usr/bin/env node
import { parseArgs, doctor, renderDoctor } from './core.mjs';
const args = parseArgs();
const report = doctor(args.root || process.cwd());
console.log(args.json ? JSON.stringify(report, null, 2) : renderDoctor(report, { noColor: args['no-color'] }));
if (args.ci && (report.score < 70 || report.checks.some(c => c.level === 'critical'))) process.exitCode = 1;
