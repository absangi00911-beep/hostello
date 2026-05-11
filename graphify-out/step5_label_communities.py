import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path

def main():
    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
    detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
    analysis   = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())

    G = build_from_json(extraction)
    communities = {int(k): v for k, v in analysis['communities'].items()}
    cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

    # LABELS - descriptive names for each community
    labels = {
        0: "User Auth & Profiles",
        1: "Email Notifications",
        2: "Auth & Registration",
        3: "Hostel Search & Indexing",
        4: "EasyPaisa Payment",
        5: "Types & Session",
        6: "Notifications & Reviews",
        7: "API Client Utilities",
        8: "Middleware & Environment",
        9: "Safepay Payment",
        10: "Validation Schemas",
        11: "Support & Contact",
        12: "SMS & OTP",
        13: "Scheduled Tasks",
        14: "Performance Optimization",
        15: "Mobile Auth Services",
        16: "Amenities Config",
        17: "Styling Constants",
        18: "File Upload",
        19: "Auth Context",
        20: "Hostel Types",
        21: "Filter Modal",
        22: "Search Bar",
        23: "University Config",
        24: "Root Layout",
        25: "Routes Manifest",
        26: "Error Handler",
        27: "Global Error Handler",
        28: "Shared Exports"
    }

    # Regenerate questions with real community labels
    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}))
    print('Report updated with community labels')

if __name__ == '__main__':
    main()
