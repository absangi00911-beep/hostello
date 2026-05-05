if __name__ == '__main__':
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
    print(f'Semantic: {len(all_nodes)} nodes, {len(all_edges)} edges')

    # Merge AST + semantic
    ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())

    seen = {n['id'] for n in ast['nodes']}
    merged_nodes = list(ast['nodes'])
    for n in semantic['nodes']:
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = ast['edges'] + semantic['edges']
    merged_hyperedges = semantic.get('hyperedges', [])
    merged = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': merged_hyperedges,
        'input_tokens': semantic.get('input_tokens', 0),
        'output_tokens': semantic.get('output_tokens', 0),
    }
    Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2))
    print(f'Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges ({len(ast["nodes"])} AST + {len(semantic["nodes"])} semantic)')
