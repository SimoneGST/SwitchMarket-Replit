import fs from 'fs';
import path from 'path';

const clientDir = path.join(process.cwd(),'client');
const distAssetsDir = path.join(process.cwd(),'dist','public','attached_assets');

function walk(dir, exts){
  const files = [];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full = path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...walk(full, exts));
    else if(exts.includes(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const files = walk(clientDir,['.tsx','.ts','.jsx','.js','.html']);
// capture until a quote or ) to include spaces in filenames
const regex = /\/attached_assets\/([^\"'\)]+)/g;
const refs = new Set();
for(const f of files){
  const txt = fs.readFileSync(f,'utf8');
  let m;
  while((m = regex.exec(txt)) !== null){
    refs.add(m[1]);
  }
}

const localAssets = new Set(fs.existsSync(distAssetsDir) ? fs.readdirSync(distAssetsDir) : []);

(async ()=>{
  console.log('Found', refs.size, 'unique references');
  const results = [];
  for(const name of refs){
    const local = localAssets.has(name);
    const url = 'https://switchmarket-pro.web.app/attached_assets/' + encodeURIComponent(name);
    let code = 'ERR';
    try{
      const res = await fetch(url,{method:'HEAD'});
      code = res.status;
    }catch(e){ code = 'FETCH_ERR' }
    results.push({name, local, code, url});
    console.log(name, local ? 'LOCAL' : 'MISSING', code);
  }

  // Attempt auto-fix for missing short references by fuzzy matching
  const missing = results.filter(r => !r.local).map(r => r.name);
  const filesToPatch = files;
  const patches = [];
  for(const missingName of missing){
    // find candidates where local filename lower includes the missingName lower
    const candidates = [...localAssets].filter(a => a.toLowerCase().includes(missingName.toLowerCase()));
    if(candidates.length === 1){
      const chosen = candidates[0];
      console.log(`Auto-fix: will replace references of '${missingName}' with '${chosen}'`);
      // apply replace across source files
      for(const f of filesToPatch){
        let txt = fs.readFileSync(f,'utf8');
        const orig = txt;
        const pattern = new RegExp('/attached_assets/' + missingName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        txt = txt.replace(pattern, '/attached_assets/' + chosen);
        if(txt !== orig){
          fs.writeFileSync(f, txt, 'utf8');
          patches.push({file: f, missingName, chosen});
        }
      }
    } else if(candidates.length > 1){
      console.log(`Multiple matches for '${missingName}': ${candidates.join(', ')} - skipping auto-fix`);
    } else {
      console.log(`No local candidate found for '${missingName}'`);
    }
  }

  if(patches.length > 0){
    console.log('Applied patches:');
    for(const p of patches) console.log('-', p.file, p.missingName, '->', p.chosen);
  }
  fs.writeFileSync('asset_check_results.json', JSON.stringify(results,null,2));
  console.log('Wrote asset_check_results.json');
})();
