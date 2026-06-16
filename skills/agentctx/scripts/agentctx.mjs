#!/usr/bin/env node
import {
  VERSION,
  parseArgs,
  scanRepo,
  renderScan,
  generateContextFiles,
  writeRepoMap,
  doctor,
  renderDoctor,
  createTaskPack,
  printHelp,
  symbol
} from './core.mjs';

function rootOf(args) {
  return args.root || process.cwd();
}

function logGenerate(result, args) {
  console.log('AgentCtx Generate\n');
  for (const item of result.results) {
    if (item.status === 'created') console.log(`✅ Created ${item.path}`);
    if (item.status === 'skipped') console.log(`⚠️ Skipped ${item.path} because it ${item.reason}. Use --force to overwrite.`);
    if (item.status === 'dry-run') {
      console.log(`📝 Would create ${item.path}`);
      if (args.stdout) console.log(`\n--- ${item.path} ---\n${item.content}`);
    }
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const noColor = Boolean(args['no-color']);

  if (!command || command === '--help' || command === 'help') {
    console.log(printHelp());
    return;
  }
  if (command === '--version' || command === 'version') {
    console.log(VERSION);
    return;
  }

  try {
    if (command === 'scan') {
      const facts = scanRepo(rootOf(args));
      console.log(args.json ? JSON.stringify(facts, null, 2) : renderScan(facts, { noColor }));
      return;
    }

    if (command === 'generate' || command === 'init') {
      const result = generateContextFiles(rootOf(args), {
        target: args.target,
        all: args.all,
        dryRun: Boolean(args['dry-run']),
        force: Boolean(args.force)
      });
      logGenerate(result, args);
      return;
    }

    if (command === 'map') {
      const result = writeRepoMap(rootOf(args), { stdout: Boolean(args.stdout) });
      if (args.json) console.log(result.jsonText);
      else if (args.stdout) console.log(result.mdText);
      else console.log('✅ Created .repoctx/repo-map.json\n✅ Created .repoctx/repo-map.md');
      return;
    }

    if (command === 'doctor') {
      const report = doctor(rootOf(args));
      if (args.json) console.log(JSON.stringify(report, null, 2));
      else console.log(renderDoctor(report, { noColor }));
      const hasCritical = report.checks.some(c => c.level === 'critical');
      if (args.ci && (report.score < 70 || hasCritical)) process.exitCode = 1;
      return;
    }

    if (command === 'pack') {
      const task = args._.join(' ').trim();
      if (!task) {
        console.error('❌ Missing task. Example: agentctx pack "add login with Google OAuth"');
        process.exitCode = 1;
        return;
      }
      const result = createTaskPack(rootOf(args), task, { stdout: Boolean(args.stdout) });
      if (args.stdout) console.log(result.content);
      else console.log(`✅ Created ${result.path}`);
      return;
    }

    console.error(`${symbol('error')} Unknown command: ${command}\n`);
    console.log(printHelp());
    process.exitCode = 1;
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  }
}

main();
