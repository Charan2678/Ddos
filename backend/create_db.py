import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    # Connect to the default postgres database to issue CREATE DATABASE
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='charan',
        host='localhost',
        port='5432'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'ddos_shield'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute("CREATE DATABASE ddos_shield")
        print("Database 'ddos_shield' created successfully!")
    else:
        print("Database 'ddos_shield' already exists.")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
