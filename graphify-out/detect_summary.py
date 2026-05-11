import json
from pathlib import Path

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
print(f"Corpus: {detect['total_files']} files · ~{detect['total_words']:,} words")
for category in ['code', 'docs', 'papers', 'images', 'video']:
    if category in detect['files'] and detect['files'][category]:
        count = len(detect['files'][category])
        print(f'  {category:10s}: {count:3d} files')
if detect.get('skipped_sensitive'):
    print(f"  (skipped {len(detect['skipped_sensitive'])} sensitive files)")
