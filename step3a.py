import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

if __name__ == '__main__':
    code_files = []
    detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text())

    # Collect code files from detect output
    for f in detect.get('files', {}).get('code', []):
        fpath = Path(f)
        if fpath.is_dir():
            code_files.extend(collect_files(fpath))
        else:
            code_files.append(fpath)

    if code_files:
        result = extract(code_files)
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
        print(f'AST: {len(result.get("nodes", []))} nodes, {len(result.get("edges", []))} edges')
    else:
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
        print('No code files detected')
