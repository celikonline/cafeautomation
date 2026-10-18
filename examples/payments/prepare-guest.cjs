const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'cafe.js'), 'utf8');
const catalog = source.match(/const products=(\[[\s\S]*?\n\]);/);
if (catalog) fs.writeFileSync(path.join(__dirname, 'catalog.json'), JSON.stringify(require('vm').runInNewContext(catalog[1]), null, 2));
const seed = source.slice(source.indexOf('function seed(){'), source.indexOf('function readData()'));
if (seed) fs.writeFileSync(path.join(__dirname, 'seed.cjs'), "const dayKey=()=>new Date().toLocaleDateString('en-CA');\n" + seed + '\nmodule.exports=seed;\n');
