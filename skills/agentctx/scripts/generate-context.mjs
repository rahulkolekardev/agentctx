#!/usr/bin/env node
import { parseArgs, generateContextFiles } from './core.mjs';
const args = parseArgs();
const result = generateContextFiles(args.root || process.cwd(), { target: args.target, all: args.all, dryRun: args['dry-run'], force: args.force });
console.log('AgentCtx Generate\n');
for (const item of result.results) {
  if (item.status === 'created') console.log(`✅ Created ${item.path}`);
  if (item.status === 'skipped') console.log(`⚠️ Skipped ${item.path} because it ${item.reason}. Use --force to overwrite.`);
  if (item.status === 'dry-run') console.log(`📝 Would create ${item.path}`);
}
