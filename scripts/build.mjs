import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','presentation.html','presentation.css'])await copyFile(file,`dist/${file}`);
await cp('src','dist/src',{recursive:true});
await cp('media','dist/media',{recursive:true});
console.log('Built standalone site in dist. No runtime dependencies.');
