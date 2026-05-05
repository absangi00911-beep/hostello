if __name__ == '__main__':
    import json
    from graphify.build import build_from_json
    from graphify.export import to_html
    from pathlib import Path

    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
    analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())

    G = build_from_json(extraction)
    communities = {int(k): v for k, v in analysis['communities'].items()}
    
    # Community labels based on analysis
    labels = {
        0: "Core Auth System",
        1: "Typesense Search",
        2: "Booking Workflow",
        3: "Payment Gateways",
        4: "API Routes Layer",
        5: "Utilities & Config",
        # ... auto-label the rest
    }
    for cid in communities:
        if cid not in labels:
            labels[cid] = f"Module {cid}"

    # Generate HTML
    if G.number_of_nodes() <= 5000:
        to_html(G, communities, 'graphify-out/graph.html', community_labels=labels)
        print('✓ graph.html written')
    else:
        print(f'Graph too large ({G.number_of_nodes()} nodes) for HTML')
