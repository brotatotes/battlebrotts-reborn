import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
let commit;
try {
  commit=JSON.parse(await readFile('SOURCE.json','utf8')).commit;
} catch {
  commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
}
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Missing valid source identity');
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','presentation.html','presentation.css','demo.html'])await copyFile(file,`dist/${file}`);
await cp('src','dist/src',{recursive:true});
await cp('media','dist/media',{recursive:true});
await writeFile('dist/build-info.json',JSON.stringify({project:'battlebrotts-reborn',commit,source:`https://github.com/brotatotes/battlebrotts-reborn/tree/${commit}`},null,2)+'\n');
console.log(`Built standalone site from ${commit}. No runtime dependencies.`);
