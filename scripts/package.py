#!/usr/bin/env python3
"""Reproducible source and built-site archive using only Python's standard library."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tarfile
import zipfile

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'release'
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
if subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], cwd=root, text=True).strip():
    raise SystemExit('Refusing package from modified tracked source')
subprocess.run(['node', 'scripts/build.mjs'], cwd=root, check=True)
identity = json.loads((root / 'dist/build-info.json').read_text())
assert identity['commit'] == commit
files = {}
raw = subprocess.check_output(['git', 'archive', '--format=tar', commit], cwd=root)
with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
    for item in archive.getmembers():
        if item.isfile():
            files[item.name] = archive.extractfile(item).read()
for path in sorted((root / 'dist').rglob('*')):
    if path.is_file():
        files[str(path.relative_to(root))] = path.read_bytes()
files['SOURCE.json'] = (json.dumps(identity, indent=2) + '\n').encode()
files['SHA256SUMS.txt'] = ''.join(hashlib.sha256(data).hexdigest() + '  ' + name + '\n' for name, data in sorted(files.items())).encode()
out.mkdir(parents=True, exist_ok=True)
version = json.loads((root / 'package.json').read_text())['version']
if not all(part.isdigit() for part in version.split('.')) or len(version.split('.')) != 3:
    raise SystemExit('Invalid release version')
path = out / ('battlebrotts-reborn-v' + version + '.zip')
with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo('battlebrotts-reborn/' + name, (2026, 9, 15, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data)
digest = hashlib.sha256(path.read_bytes()).hexdigest()
(out / 'SHA256SUMS.txt').write_text(digest + '  ' + path.name + '\n')
print(json.dumps({'archive': str(path), 'sha256': digest, 'commit': commit, 'files': len(files)}, indent=2))
