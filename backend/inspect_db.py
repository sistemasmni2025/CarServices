import sqlite3
import os

db_path = "c:/Users/SISTEMAS/Documents/Antigravity Projects/MultillantasNieto/backend/sql_app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(usuario)")
    columns = cursor.fetchall()
    print("Columns in 'usuario' table:")
    for col in columns:
        print(col)
    
    cursor.execute("SELECT * FROM usuario")
    rows = cursor.fetchall()
    print("\nRows in 'usuario' table:")
    for row in rows:
        print(row)
    conn.close()
else:
    print(f"Database not found at {db_path}")
