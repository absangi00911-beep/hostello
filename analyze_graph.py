import sqlite3

db = sqlite3.connect('.code-review-graph/graph.db')
db.row_factory = sqlite3.Row
cursor = db.cursor()

print("=" * 80)
print("HOSTELLO CODEBASE KNOWLEDGE GRAPH ANALYSIS")
print("=" * 80)

# Get database statistics
cursor.execute("SELECT COUNT(*) as count FROM nodes")
num_nodes = cursor.fetchone()['count']
cursor.execute("SELECT COUNT(*) as count FROM edges")
num_edges = cursor.fetchone()['count']
print(f"\n📊 Graph Statistics: {num_nodes} nodes, {num_edges} edges")

# Get communities
print("\n🏘️  CODE COMMUNITIES:")
cursor.execute("""
    SELECT community_id, COUNT(*) as node_count 
    FROM nodes 
    WHERE community_id IS NOT NULL 
    GROUP BY community_id 
    ORDER BY node_count DESC 
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"   Community {row['community_id']}: {row['node_count']} nodes")

# Get top node kinds
print("\n🏗️  NODE TYPES:")
cursor.execute("""
    SELECT kind, COUNT(*) as count
    FROM nodes 
    GROUP BY kind
    ORDER BY count DESC
""")
for row in cursor.fetchall():
    print(f"   {row['kind']}: {row['count']}")

# Get top-level files
print("\n📁 TOP-LEVEL FILES:")
cursor.execute("""
    SELECT DISTINCT file_path, COUNT(*) as nodes_in_file
    FROM nodes 
    WHERE kind = 'file'
    GROUP BY file_path
    ORDER BY nodes_in_file DESC
    LIMIT 20
""")
for row in cursor.fetchall():
    print(f"   {row['file_path']}: {row['nodes_in_file']} nodes")

# Get most connected nodes by looking at edge frequency
print("\n⭐ MOST CONNECTED (by edge appearances):")
cursor.execute("""
    SELECT source_qualified as name, COUNT(*) as edges FROM edges
    GROUP BY source_qualified
    UNION ALL
    SELECT target_qualified as name, COUNT(*) as edges FROM edges
    GROUP BY target_qualified
""")
edge_counts = {}
for row in cursor.fetchall():
    edge_counts[row['name']] = edge_counts.get(row['name'], 0) + row['edges']

for name, count in sorted(edge_counts.items(), key=lambda x: x[1], reverse=True)[:15]:
    print(f"   {name}: {count} edge references")

# Get API routes
print("\n🔌 API ROUTES:")
cursor.execute("""
    SELECT DISTINCT file_path
    FROM nodes 
    WHERE file_path LIKE '%/api/%/route.ts'
    ORDER BY file_path
""")
api_routes = [row['file_path'] for row in cursor.fetchall()]
for route in api_routes:
    print(f"   {route}")

# Get custom hooks
print("\n🪝 REACT CUSTOM HOOKS:")
cursor.execute("""
    SELECT DISTINCT name
    FROM nodes 
    WHERE name LIKE 'use%' AND kind IN ('function', 'export')
    ORDER BY name
""")
hooks = [row['name'] for row in cursor.fetchall()]
for hook in hooks[:15]:
    print(f"   {hook}")

# Edge kind analysis (relationships)
print("\n🔗 RELATIONSHIP TYPES (Top):")
cursor.execute("""
    SELECT kind, COUNT(*) as count
    FROM edges 
    GROUP BY kind
    ORDER BY count DESC
""")
for row in cursor.fetchall():
    print(f"   {row['kind']}: {row['count']}")

db.close()

print("\n" + "=" * 80)
print("✅ Graph analysis complete. Use code-review-graph tools for deeper exploration.")
print("=" * 80)
