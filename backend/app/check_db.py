import sqlite3, os
db = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'chroma_db', 'chroma.sqlite3')
db = os.path.abspath(db)
print("DB path:", db, "| exists:", os.path.exists(db))
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM [{t}]")
    print(f"  {t}: {cur.fetchone()[0]} rows")
conn.close()
