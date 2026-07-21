import os

# Load .env variables manually for local development without dependencies
for env_path in [".env", os.path.join(os.path.dirname(__file__), "../.env")]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()
import random
import string
import sqlite3
import json
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from pymongo import MongoClient
import firebase_admin
from firebase_admin import credentials, firestore
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "voltverse_secret_fallback_key")

cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

MONGO_URI = os.environ.get("MONGO_URI")
USING_MONGODB = MONGO_URI is not None

def hash_password(password, salt=None):
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${hashed}"

def verify_password(stored_password, provided_password):
    try:
        salt, hashed = stored_password.split('$')
        new_hashed = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return hashed == new_hashed
    except Exception:
        return False

def send_registration_email(to_email, name):
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_password:
        print(f"[MOCK EMAIL] Registration success email would be sent to: {to_email}")
        print(f"[MOCK EMAIL] Welcome to Voltverse Technologies, {name}!")
        return True
        
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    try:
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    except:
        smtp_port = 587
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to Voltverse Technologies!"
        msg["From"] = f"Voltverse Technologies <{smtp_email}>"
        msg["To"] = to_email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #070d14; color: #eef4f2; padding: 20px; text-align: center;">
            <div style="max-width: 600px; margin: auto; background: #0c1926; border: 1px solid #1f3a52; border-radius: 12px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #1f3a52; padding-bottom: 15px;">Registration Successful!</h2>
              <p style="font-size: 16px; line-height: 1.6; text-align: left;">Dear <strong>{name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6; text-align: left;">Welcome to Voltverse Technologies! Your registration was completed successfully. You can now log in to your account, explore our courses, and order IoT sensors, embedded boards, robotics kits, and more.</p>
              <div style="margin: 30px 0;">
                <a href="{request.host_url}login.html" style="background: linear-gradient(135deg, #3b82f6 0%, #7c3AED 100%); color: #ffffff; padding: 12px 30px; border-radius: 30px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">Access Your Account</a>
              </div>
              <p style="font-size: 14px; color: #a1a1aa; border-top: 1px solid #1f3a52; padding-top: 15px; margin-top: 30px; text-align: left;">Best regards,<br>The Voltverse Technologies Team</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(smtp_email, to_email, msg.as_string())
        server.quit()
        print(f"Welcome email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

def verify_google_token(token):
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not google_client_id:
        print("GOOGLE_CLIENT_ID not set. Performing mock token parsing for development.")
        if token.startswith("mock_token_"):
            parts = token.split("_")
            email = parts[2] if len(parts) > 2 else "demo@gmail.com"
            name = parts[3] if len(parts) > 3 else "Google User"
            sub = parts[4] if len(parts) > 4 else "1234567890"
            return {
                "email": email,
                "name": name,
                "sub": sub,
                "picture": "https://lh3.googleusercontent.com/a/default-user"
            }
        raise ValueError("GOOGLE_CLIENT_ID is not configured in .env file.")
        
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), google_client_id)
        return idinfo
    except Exception as e:
        print(f"Google token verification failed: {e}")
        return None

# SQLite setup for fallback
if "VERCEL" in os.environ:
    SQLITE_DB = '/tmp/shop.db'
else:
    SQLITE_DB = 'shop.db'

def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    return conn

def get_mongo_db():
    client = MongoClient(MONGO_URI)
    return client["Voltverse_Technologies_shop"]

def init_db():
    if USING_MONGODB:
        try:
            db = get_mongo_db()
            db["users"].create_index("email", unique=True)
            products_col = db["products"]
            if products_col.count_documents({}) == 0:
                seed_products = [
                    {
                        "name": "WORK STATION (For Kids)",
                        "price": 1000.00,
                        "icon": "fas fa-briefcase",
                        "tag": "Electronics Kit",
                        "description": "A fun and educational workshop organizer specifically designed for kids. It helps children learn the basics of assembly, organization, and safety when working on small electronics and robotics projects.",
                        "features": ["Built-in tool storage slots and compartments", "Sturdy, child-safe structural material", "Perfect companion for DIY electronics projects"],
                        "image_url": "images/WhatsApp Image 2026-07-13 at 1.22.24 PM.jpeg"
                    },
                    {
                        "name": "IOT Trainer Kit",
                        "price": 5299.00,
                        "icon": "fas fa-microchip",
                        "tag": "IoT Development",
                        "description": "A comprehensive educational trainer kit for learning IoT concepts and cloud integrations. Equipped with development boards and a wide array of sensors.",
                        "features": ["ESP32 core development board with Wi-Fi & Bluetooth", "Sensors: Temperature, Humidity, Soil Moisture, and Ultrasonic", "128x64 OLED Display and dynamic RGB LED controls", "Full guide and code templates included"],
                        "image_url": "images/IOT Trainer Kit.png"
                    },
                    {
                        "name": "AUDAPS — Underwater Platform",
                        "price": 12000.00,
                        "icon": "fas fa-water",
                        "tag": "Marine Technology",
                        "description": "Our premier autonomous data collection platform designed for sub-surface monitoring. Configurable with custom scientific sensor payloads.",
                        "features": ["IP68 rated modular structural body", "Sensors: Water Temperature, Turbidity, and pH levels", "Continuous data logging to internal flash memory", "Wireless data transmission when surfaced"],
                        "image_url": "images/AUDAPS 3.png"
                    },
                    {
                        "name": "Robotic Dog Kit",
                        "price": 1000.00,
                        "icon": "fas fa-dog",
                        "tag": "Robotics Kit",
                        "description": "An interactive, quadruped robot kit that teaches servo control, motor alignment, and basic walk cycle coding.",
                        "features": ["4-legged chassis with SG90 micro servos", "Ultrasonic sensor for obstacle avoidance", "Programmable walk, sit, and dance sequences", "Easy assembly with screw-together parts"],
                        "image_url": "images/Robotic dog.png"
                    }
                ]
                products_col.insert_many(seed_products)
        except Exception as e:
            print("MongoDB initialization error:", e)
    else:
        # SQLite initialization
        db_dir = os.path.dirname(SQLITE_DB)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        conn = get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                price REAL,
                icon TEXT,
                tag TEXT,
                description TEXT,
                features TEXT,
                image_url TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE,
                items TEXT,
                total_price REAL,
                user_email TEXT,
                address TEXT,
                phone TEXT,
                payment_method TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                google_id TEXT,
                avatar TEXT,
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Run schema migrations for existing database
        cursor.execute("PRAGMA table_info(orders)")
        order_cols = [row[1] for row in cursor.fetchall()]
        if "user_email" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN user_email TEXT")
        if "address" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN address TEXT")
        if "phone" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN phone TEXT")
        if "payment_method" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT")
            
        cursor.execute("PRAGMA table_info(users)")
        user_cols = [row[1] for row in cursor.fetchall()]
        if "phone" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
            
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM products")
        if cursor.fetchone()[0] == 0:
            seed_products = [
                (
                    "WORK STATION (For Kids)",
                    1000.00,
                    "fas fa-briefcase",
                    "Electronics Kit",
                    "A fun and educational workshop organizer specifically designed for kids. It helps children learn the basics of assembly, organization, and safety when working on small electronics and robotics projects.",
                    "Built-in tool storage slots and compartments|Sturdy, child-safe structural material|Perfect companion for DIY electronics projects",
                    "images/WhatsApp Image 2026-07-13 at 1.22.24 PM.jpeg"
                ),
                (
                    "IOT Trainer Kit",
                    5299.00,
                    "fas fa-microchip",
                    "IoT Development",
                    "A comprehensive educational trainer kit for learning IoT concepts and cloud integrations. Equipped with development boards and a wide array of sensors.",
                    "ESP32 core development board with Wi-Fi & Bluetooth|Sensors: Temperature, Humidity, Soil Moisture, and Ultrasonic|128x64 OLED Display and dynamic RGB LED controls|Full guide and code templates included",
                    "images/IOT Trainer Kit.png"
                ),
                (
                    "AUDAPS — Underwater Platform",
                    12000.00,
                    "fas fa-water",
                    "Marine Technology",
                    "Our premier autonomous data collection platform designed for sub-surface monitoring. Configurable with custom scientific sensor payloads.",
                    "IP68 rated modular structural body|Sensors: Water Temperature, Turbidity, and pH levels|Continuous data logging to internal flash memory|Wireless data transmission when surfaced",
                    "images/AUDAPS 3.png"
                ),
                (
                    "Robotic Dog Kit",
                    1000.00,
                    "fas fa-dog",
                    "Robotics Kit",
                    "An interactive, quadruped robot kit that teaches servo control, motor alignment, and basic walk cycle coding.",
                    "4-legged chassis with SG90 micro servos|Ultrasonic sensor for obstacle avoidance|Programmable walk, sit, and dance sequences|Easy assembly with screw-together parts",
                    "images/Robotic dog.png"
                )
            ]
            cursor.executemany('''
                INSERT INTO products (name, price, icon, tag, description, features, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', seed_products)
            conn.commit()
        conn.close()

db_initialized = False

def ensure_db_initialized():
    global db_initialized
    if not db_initialized:
        init_db()
        db_initialized = True

@app.route("/")
def home():
    return send_from_directory("../", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("../", filename)


@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory("../images", filename)

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        ensure_db_initialized()
        if USING_MONGODB:
            db = get_mongo_db()
            rows = db["products"].find({}, {"_id": 0})
            products = list(rows)
            return jsonify(products)
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM products")
            rows = cursor.fetchall()
            products = []
            for row in rows:
                products.append({
                    'id': row['id'],
                    'name': row['name'],
                    'price': row['price'],
                    'icon': row['icon'],
                    'tag': row['tag'],
                    'description': row['description'],
                    'features': row['features'].split('|') if row['features'] else [],
                    'image_url': row['image_url']
                })
            conn.close()
            return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        ensure_db_initialized()
        data = request.json
        if not data or 'items' not in data or 'address' not in data or 'phone' not in data or 'payment_method' not in data:
            return jsonify({'error': 'All checkout fields are required.'}), 400
            
        items = data['items']
        address = data['address']
        phone = data['phone']
        payment_method = data['payment_method']
        total_price = sum(item.get('price', 0) * item.get('qty', 1) for item in items)
        
        user_email = session.get('user', {}).get('email')
        
        digits = ''.join(random.choices(string.digits, k=6))
        order_id = f"ORY-{digits}"
        
        if USING_MONGODB:
            from datetime import datetime
            db = get_mongo_db()
            orders_col = db["orders"]
            orders_col.insert_one({
                "order_id": order_id,
                "items": items,
                "total_price": total_price,
                "user_email": user_email,
                "address": address,
                "phone": phone,
                "payment_method": payment_method,
                "created_at": datetime.utcnow()
            })
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO orders (order_id, items, total_price, user_email, address, phone, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (order_id, json.dumps(items), total_price, user_email, address, phone, payment_method))
            conn.commit()
            conn.close()
            
        return jsonify({
            'success': True,
            'order_id': order_id,
            'total_price': total_price
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        ensure_db_initialized()
        user_email = session.get('user', {}).get('email')
        if not user_email:
            return jsonify({'error': 'Unauthorized. Please sign in.'}), 401
            
        orders = []
        if USING_MONGODB:
            db = get_mongo_db()
            cursor = db["orders"].find({'user_email': user_email}).sort('created_at', -1)
            for doc in cursor:
                orders.append({
                    'order_id': doc['order_id'],
                    'items': doc['items'],
                    'total_price': doc['total_price'],
                    'address': doc.get('address'),
                    'phone': doc.get('phone'),
                    'payment_method': doc.get('payment_method'),
                    'created_at': doc.get('created_at').strftime('%Y-%m-%d %H:%M:%S') if doc.get('created_at') else None
                })
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC", (user_email,))
            rows = cursor.fetchall()
            for row in rows:
                orders.append({
                    'order_id': row['order_id'],
                    'items': json.loads(row['items']) if row['items'] else [],
                    'total_price': row['total_price'],
                    'address': row['address'],
                    'phone': row['phone'],
                    'payment_method': row['payment_method'],
                    'created_at': row['created_at']
                })
            conn.close()
            
        return jsonify({'success': True, 'orders': orders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================= AUTHENTICATION ENDPOINTS =================

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    try:
        ensure_db_initialized()
        data = request.json
        if not data or not data.get('email') or not data.get('password') or not data.get('name') or not data.get('phone'):
            return jsonify({'error': 'All fields are required.'}), 400
            
        email = data['email'].strip().lower()
        password = data['password']
        name = data['name'].strip()
        phone = data['phone'].strip()
        
        hashed = hash_password(password)
        
        if USING_MONGODB:
            db = get_mongo_db()
            users_col = db["users"]
            if users_col.find_one({'email': email}):
                return jsonify({'error': 'Email address already registered.'}), 400
            users_col.insert_one({
                'name': name,
                'email': email,
                'password': hashed,
                'phone': phone,
                'google_id': None,
                'avatar': None
            })
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return jsonify({'error': 'Email address already registered.'}), 400
            cursor.execute(
                "INSERT INTO users (name, email, password, phone, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?)",
                (name, email, hashed, phone, None, None)
            )
            conn.commit()
            conn.close()
            
        # Send welcome email
        send_registration_email(email, name)
        
        return jsonify({'success': True, 'message': 'Registration successful!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    try:
        ensure_db_initialized()
        data = request.json
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required.'}), 400
            
        email = data['email'].strip().lower()
        password = data['password']
        
        user = None
        if USING_MONGODB:
            db = get_mongo_db()
            user = db["users"].find_one({'email': email})
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                user = {
                    'name': row['name'],
                    'email': row['email'],
                    'password': row['password'],
                    'phone': row['phone'],
                    'avatar': row['avatar']
                }
            conn.close()
            
        if not user or not user.get('password'):
            return jsonify({'error': 'Invalid email or password.'}), 401
            
        if not verify_password(user['password'], password):
            return jsonify({'error': 'Invalid email or password.'}), 401
            
        # Set session
        session['user'] = {
            'name': user['name'],
            'email': user['email'],
            'phone': user.get('phone'),
            'avatar': user.get('avatar')
        }
        
        return jsonify({'success': True, 'user': session['user']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/google', methods=['POST'])
def auth_google():
    try:
        ensure_db_initialized()
        data = request.json
        if not data or not data.get('credential'):
            return jsonify({'error': 'Credential token is required.'}), 400
            
        token = data['credential']
        idinfo = verify_google_token(token)
        if not idinfo:
            return jsonify({'error': 'Invalid Google ID token.'}), 400
            
        email = idinfo['email'].strip().lower()
        name = idinfo.get('name', 'Google User').strip()
        google_id = idinfo['sub']
        avatar = idinfo.get('picture')
        
        user = None
        if USING_MONGODB:
            db = get_mongo_db()
            users_col = db["users"]
            user = users_col.find_one({'email': email})
            if not user:
                users_col.insert_one({
                    'name': name,
                    'email': email,
                    'password': None,
                    'phone': None,
                    'google_id': google_id,
                    'avatar': avatar
                })
                user = users_col.find_one({'email': email})
                send_registration_email(email, name)
            elif not user.get('google_id'):
                users_col.update_one({'email': email}, {'$set': {'google_id': google_id, 'avatar': avatar}})
        else:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO users (name, email, password, phone, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?)",
                    (name, email, None, None, google_id, avatar)
                )
                conn.commit()
                cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
                row = cursor.fetchone()
                send_registration_email(email, name)
            elif not row['google_id']:
                cursor.execute(
                    "UPDATE users SET google_id = ?, avatar = ? WHERE email = ?",
                    (google_id, avatar, email)
                )
                conn.commit()
            
            user = {
                'name': row['name'] if row else name,
                'email': email,
                'phone': row['phone'] if row else None,
                'avatar': row['avatar'] if row else avatar
            }
            conn.close()
            
        session['user'] = {
            'name': user.get('name', name) if isinstance(user, dict) else name,
            'email': email,
            'phone': user.get('phone') if isinstance(user, dict) else None,
            'avatar': user.get('avatar', avatar) if isinstance(user, dict) else avatar
        }
        
        return jsonify({'success': True, 'user': session['user']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['GET', 'POST'])
def auth_logout():
    session.pop('user', None)
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    if 'user' in session:
        return jsonify({'success': True, 'user': session['user']})
    return jsonify({'success': False, 'message': 'Not authenticated.'})

@app.route('/api/auth/google-config', methods=['GET'])
def auth_google_config():
    return jsonify({
        'google_client_id': os.environ.get("GOOGLE_CLIENT_ID")
    })
