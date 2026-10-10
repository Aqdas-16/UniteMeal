import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    content = content.replace(/bg-slate-50 dark:bg-\[?[#]?[0-9a-fA-FA-Z]+\]?/g, 'bg-theme-bg');
    content = content.replace(/bg-white dark:bg-\[?[#]?[0-9a-fA-FA-Z]+\]?/g, 'bg-theme-surface');
    content = content.replace(/dark:bg-slate-950/g, 'dark:bg-theme-bg');
    content = content.replace(/bg-white/g, 'bg-theme-surface');
    content = content.replace(/bg-slate-50/g, 'bg-theme-surface-2');
    content = content.replace(/text-slate-900 dark:text-slate-100/g, 'text-theme-text');
    content = content.replace(/text-slate-900/g, 'text-theme-text');
    content = content.replace(/text-slate-100/g, 'text-theme-text');
    content = content.replace(/text-slate-500/g, 'text-theme-text-secondary');
    content = content.replace(/text-slate-600/g, 'text-theme-text-secondary');
    content = content.replace(/dark:text-white/g, '');
    content = content.replace(/dark:text-slate-400/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
