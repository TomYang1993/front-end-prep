const fs = require('fs');
const glob = require('glob');

const cssContent = fs.readFileSync('styles/globals.css', 'utf-8');
const classRegex = /\.([a-zA-Z0-9_-]+)(?![\w:_-])/g;
const uniqueClasses = new Set();
let match;
while ((match = classRegex.exec(cssContent)) !== null) {
  uniqueClasses.add(match[1]);
}

const allTsxFiles = glob.sync('**/*.tsx', { ignore: ['node_modules/**', '.next/**'] });
// Gather all TSX class usage
let usedClasses = new Set();
allTsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  // Match standard class names in TSX (className="something") somewhat simplistically
  const wordRegex = /[a-zA-Z0-9_-]+/g;
  let wordMatch;
  while ((wordMatch = wordRegex.exec(content)) !== null) {
    usedClasses.add(wordMatch[0]);
  }
});

const unused = [];
for (const cls of uniqueClasses) {
  if (!usedClasses.has(cls)) {
    unused.push(cls);
  }
}

console.log("Found " + unused.length + " unused classes out of " + uniqueClasses.size + " total defined in globals.css.");
// We will output a few examples just to confirm
console.log("Examples of unused classes:");
console.log(unused.slice(0, 50).join(', '));
