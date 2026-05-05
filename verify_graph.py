#!/usr/bin/env python3
import json
from pathlib import Path

outputs = {}

# Check extract
if Path('graphify-out/.graphify_extract.json').exists():
    data = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
    outputs['extract'] = {'nodes': len(data['nodes']), 'edges': len(data['edges'])}

# Check analysis
if Path('graphify-out/.graphify_analysis.json').exists():
    data = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())
    outputs['analysis'] = {
        'communities': len(data['communities']),
        'god_nodes': len(data['gods']),
        'surprises': len(data['surprises']),
        'questions': len(data['questions'])
    }

# Check graph
if Path('graphify-out/graph.json').exists():
    data = json.loads(Path('graphify-out/graph.json').read_text())
    outputs['graph'] = {'nodes': len(data.get('nodes', [])), 'edges': len(data.get('edges', []))}

# Check files
files = {
    'graph.html': Path('graphify-out/graph.html').exists(),
    'GRAPH_REPORT.md': Path('graphify-out/GRAPH_REPORT.md').exists(),
}

# Display
print('GRAPHIFY VERIFICATION')
print('=' * 60)
print('\nJSON Outputs:')
for key, val in outputs.items():
    print(f'  ✓ {key}: {val}')

print('\nVisualization & Report:')
for f, exists in files.items():
    status = '✓' if exists else '✗'
    size = f'({Path(f"graphify-out/{f}").stat().st_size} bytes)' if exists else ''
    print(f'  {status} {f} {size}')

print('\n' + '=' * 60)
if all(files.values()) and outputs:
    print('✓ ALL OUTPUTS VERIFIED ✓')
else:
    print('⚠ MISSING OUTPUTS')
