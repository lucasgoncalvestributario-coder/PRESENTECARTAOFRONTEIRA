import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function entryResolverPlugin(): Plugin {
  return {
    name: 'entry-resolver-plugin',
    resolveId(id) {
      if (
        id === '/src/main.tsx' ||
        id === './src/main.tsx' ||
        id === 'src/main.tsx' ||
        id === '/src/Main.tsx' ||
        id === './src/Main.tsx' ||
        id.endsWith('/main.tsx') ||
        id === 'main.tsx'
      ) {
        const candidates = [
          path.resolve(process.cwd(), 'src/main.tsx'),
          path.resolve(process.cwd(), 'src/Main.tsx'),
          path.resolve(process.cwd(), 'Src/main.tsx'),
          path.resolve(process.cwd(), 'Src/Main.tsx'),
          path.resolve(process.cwd(), 'src/index.tsx'),
          path.resolve(process.cwd(), 'main.tsx'),
          path.resolve(__dirname, 'src/main.tsx'),
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }

        // Subdirectory check (e.g. if code was placed inside a nested folder on GitHub)
        try {
          const items = fs.readdirSync(process.cwd(), { withFileTypes: true });
          for (const item of items) {
            if (item.isDirectory() && !['node_modules', '.git', 'dist', 'public'].includes(item.name)) {
              const subCandidate = path.resolve(process.cwd(), item.name, 'src/main.tsx');
              if (fs.existsSync(subCandidate)) {
                console.log(`[Vite] Entrada encontrada em subpasta: ${subCandidate}`);
                return subCandidate;
              }
            }
          }
        } catch (_) {}

        // If file is really missing from the repository, output clear diagnostic to Netlify build log
        console.error('\n' + '='.repeat(65));
        console.error('❌ [ERRO DE DEPLOY NO NETLIFY]');
        console.error("O arquivo 'src/main.tsx' não foi encontrado na pasta clonada pelo Netlify.");
        console.error(`Diretório de build atual: ${process.cwd()}`);
        try {
          const files = fs.readdirSync(process.cwd());
          console.error(`Arquivos encontrados na raiz do repositório: ${JSON.stringify(files)}`);
          if (fs.existsSync(path.resolve(process.cwd(), 'src'))) {
            const srcFiles = fs.readdirSync(path.resolve(process.cwd(), 'src'));
            console.error(`Arquivos encontrados dentro de 'src/': ${JSON.stringify(srcFiles)}`);
          } else {
            console.error("⚠️ A pasta 'src' NÃO EXISTE na raiz do repositório no GitHub!");
          }
        } catch (err) {
          console.error('Erro ao ler arquivos:', err);
        }
        console.error('='.repeat(65) + '\n');
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [entryResolverPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
