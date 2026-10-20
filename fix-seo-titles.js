// fix-seo-titles.js
// Ejecutar una vez: node fix-seo-titles.js
// Elimina "| Recambio Directo" del title de cada página
// porque el template del layout.tsx ya lo añade automáticamente.

const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "app");

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Match title strings that end with " | Recambio Directo" (inside metadata)
  const regex = /(title:\s*["'])(.+?)(\s*\|\s*Recambio Directo)(["'])/g;

  if (!regex.test(content)) return false;

  const fixed = content.replace(
    /(title:\s*["'])(.+?)(\s*\|\s*Recambio Directo)(["'])/g,
    "$1$2$4"
  );

  fs.writeFileSync(filePath, fixed, "utf8");
  return true;
}

function walkDir(dir) {
  let fixed = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (["node_modules", ".next", ".git", "api", "dashboard", "components", "lib"].includes(entry.name)) continue;
      fixed += walkDir(fullPath);
    } else if (entry.name === "page.tsx") {
      if (fixFile(fullPath)) {
        console.log("✅ Fixed:", path.relative(appDir, fullPath));
        fixed++;
      }
    }
  }

  return fixed;
}

const total = walkDir(appDir);
console.log(`\nTotal: ${total} archivos corregidos.`);
console.log("Ahora haz deploy: git add -A && git commit -m 'fix: remove duplicate brand in titles' && git push");
