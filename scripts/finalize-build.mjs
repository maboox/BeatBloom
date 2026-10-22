import { copyFile, writeFile } from 'node:fs/promises';
await Promise.all([
  copyFile('LICENSE', 'dist/LICENSE.txt'),
  copyFile('THIRD_PARTY_NOTICES.txt', 'dist/THIRD_PARTY_NOTICES.txt'),
  writeFile('dist/.nojekyll', ''),
]);
