const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

async function generateIcons() {
  const svgPath = path.join(__dirname, '../app/icon.svg');
  const outputDir = path.join(__dirname, '../public');

  if (!fs.existsSync(svgPath)) {
    console.error('❌ Fichier icon.svg non trouvé');
    process.exit(1);
  }

  let svgContent = fs.readFileSync(svgPath, 'utf-8');

  for (const { name, size, maskable } of sizes) {
    try {
      let workingSvg = svgContent;

      // Pour les icônes maskable, ajouter du padding (safe zone)
      if (maskable) {
        const padding = size * 0.1; // 10% de padding
        const newSize = size + padding * 2;
        workingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${newSize} ${newSize}">
          <g transform="translate(${padding}, ${padding})">
            ${svgContent.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
          </g>
        </svg>`;
      }

      // Convertir SVG en PNG avec resvg
      const resvg = new Resvg(workingSvg, {
        fitTo: {
          mode: 'width',
          value: size,
        },
      });

      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      // Écrire le fichier
      const outputPath = path.join(outputDir, name);
      fs.writeFileSync(outputPath, pngBuffer);

      console.log(`✅ ${name} généré (${size}x${size}px)`);
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de ${name}:`, error.message);
    }
  }

  console.log('\n✨ Toutes les icônes ont été générées !');
}

generateIcons().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
