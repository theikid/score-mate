const fs = require('fs');
const path = require('path');

// Lire la version depuis package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);
const version = packageJson.version;

// Lire le template du Service Worker
const templatePath = path.join(__dirname, '../public/sw.template.js');
const template = fs.readFileSync(templatePath, 'utf8');

// Remplacer __VERSION__ par la version actuelle
const swContent = template.replace(/__VERSION__/g, version);

// Écrire le fichier sw.js généré
const outputPath = path.join(__dirname, '../public/sw.js');
fs.writeFileSync(outputPath, swContent, 'utf8');

console.log(`✅ Service Worker généré avec succès : score-mate-v${version}`);
