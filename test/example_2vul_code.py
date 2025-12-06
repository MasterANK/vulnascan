import mysql.connector

# Connect to the database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="test_db"
)

cursor = db.cursor()

# Taking user input
username = input("Enter your username: ")
password = input("Enter your password: ")

# Vulnerable SQL query with SQL injection possibility
query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"

cursor.execute(query)
result = cursor.fetchone()

if result:
    print("Login successful!")
else:
    print("Login failed!")

cursor.close()
db.close()
