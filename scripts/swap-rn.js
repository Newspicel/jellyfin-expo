#!/usr/bin/env node
/**
 * Swap react-native package between standard and TV versions.
 *
 * Usage:
 *   node scripts/swap-rn.js web   - Use standard react-native (for web dev)
 *   node scripts/swap-rn.js tv    - Use react-native-tvos (for TV dev)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const mode = process.argv[2];

if (!mode || !['web', 'tv'].includes(mode)) {
  console.error('Usage: node scripts/swap-rn.js <web|tv>');
  process.exit(1);
}

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const webVersion = '0.81.0';
const tvVersion = 'npm:react-native-tvos@0.81.5-0';

if (mode === 'web') {
  console.log('Switching to standard react-native for web development...');
  pkg.dependencies['react-native'] = webVersion;
} else {
  console.log('Switching to react-native-tvos for TV development...');
  pkg.dependencies['react-native'] = tvVersion;
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('Running bun install...');
execFileSync('bun', ['install'], { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log(`\nSwitched to ${mode === 'web' ? 'standard react-native' : 'react-native-tvos'}`);
console.log(mode === 'web'
  ? 'Run "bun run web:restore" when done with web development.'
  : 'Ready for TV development!');
