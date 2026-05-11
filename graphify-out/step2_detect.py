import json
import sys
from graphify.detect import detect
from pathlib import Path

result = detect(Path('.'))
# Write with UTF-8, no BOM
with open('graphify-out/.graphify_detect.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2)
    
# Print summary
print(f"Corpus: {result['total_files']} files")
print(f"Words: ~{result['total_words']:,}")
for category in ['code', 'docs', 'papers', 'images', 'video']:
    if category in result['files'] and result['files'][category]:
        count = len(result['files'][category])
        print(f"  {category}: {count} files")
