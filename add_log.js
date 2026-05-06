const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// evita duplicar
if (code.includes('MODEL SLUG:')) {
  console.log("⚠️ Já tem o log. Abortando.");
  process.exit(0);
}

// adiciona o log dentro da função handleFinishSammyTraining
code = code.replace(
  'const handleFinishSammyTraining = async () => {',
  `const handleFinishSammyTraining = async () => {
    console.log("MODEL SLUG:", modelSlug);`
);

fs.writeFileSync(path, code);
console.log("✅ Log inserido com sucesso!");
