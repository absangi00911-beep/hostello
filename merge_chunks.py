import json, glob
from pathlib import Path

# Merge chunks into semantic extraction
chunks = sorted(glob.glob('graphify-out/.graphify_chunk_*.json'))
all_nodes, all_edges, all_hyperedges = [], [], []
total_in, total_out = 0, 0

for c in chunks:
    d = json.loads(Path(c).read_text())
    all_nodes += d.get('nodes', [])
    all_edges += d.get('edges', [])
    all_hyperedges += d.get('hyperedges', [])
    total_in += d.get('input_tokens', 0)
    total_out += d.get('output_tokens', 0)

semantic = {
    'nodes': all_nodes,
    'edges': all_edges,
    'hyperedges': all_hyperedges,
    'input_tokens': total_in,
    'output_tokens': total_out,
}
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(semantic, indent=2))
print(f'Semantic extraction: {len(all_nodes)} nodes, {len(all_edges)} edges from {len(chunks)} chunk(s)')
