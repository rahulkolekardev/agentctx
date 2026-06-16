#!/usr/bin/env node
import { parseArgs, createTaskPack } from './core.mjs';
const args = parseArgs();
const task = args._.join(' ').trim();
if (!task) {
  console.error('❌ Missing task. Example: create-pack.mjs "add login with Google OAuth" --root .');
  process.exit(1);
}
const result = createTaskPack(args.root || process.cwd(), task, { stdout: args.stdout });
if (args.stdout) console.log(result.content);
else console.log(`✅ Created ${result.path}`);
