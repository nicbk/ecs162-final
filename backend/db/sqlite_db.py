import sqlite3
import bcrypt
import uuid
import yaml
import os
import subprocess
from typing import Optional, Dict, List

class SQLiteUserDB:
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self._create_tables()
    
    def _create_tables(self):
        """Create the users table if it doesn't exist"""
        # First, check if the table exists and what columns it has
        self.cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in self.cursor.fetchall()]
        
        if not columns:
            # Table doesn't exist, create it
            self.cursor.execute('''
            CREATE TABLE users (
                uuid TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                password_plain TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
        else:
            # Add missing columns if needed
            if 'password_hash' not in columns and 'password_hash_sha256' not in columns:
                self.cursor.execute('ALTER TABLE users ADD COLUMN password_hash TEXT')
            if 'password_plain' not in columns:
                self.cursor.execute('ALTER TABLE users ADD COLUMN password_plain TEXT')
        
        self.conn.commit()
    
    def create_user(self, username: str, email: str, password: str) -> str:
        """Create a new user and return their UUID"""
        user_uuid = str(uuid.uuid4())
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        try:
            # Check which password columns exist
            self.cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in self.cursor.fetchall()]
            
            if 'password_plain' in columns:
                # New schema with both hash and plain
                query = '''
                INSERT INTO users (uuid, username, email, password_hash, password_plain)
                VALUES (?, ?, ?, ?, ?)
                '''
                self.cursor.execute(query, (user_uuid, username, email, password_hash, password))
            else:
                # Legacy schema - determine which hash column to use
                if 'password_hash' in columns:
                    password_column = 'password_hash'
                elif 'password_hash_sha256' in columns:
                    password_column = 'password_hash_sha256'
                else:
                    raise Exception("No password column found in users table")
                
                query = f'''
                INSERT INTO users (uuid, username, email, {password_column})
                VALUES (?, ?, ?, ?)
                '''
                self.cursor.execute(query, (user_uuid, username, email, password_hash))
            
            self.conn.commit()
            return user_uuid
        except sqlite3.IntegrityError as e:
            if 'username' in str(e):
                raise Exception("Username already exists")
            elif 'email' in str(e):
                raise Exception("Email already exists")
            else:
                raise Exception("User creation failed")
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        self.cursor.execute('''
        SELECT uuid, username, email FROM users WHERE username = ?
        ''', (username,))
        user = self.cursor.fetchone()
        
        if user:
            return {
                'uuid': user[0],
                'username': user[1],
                'email': user[2]
            }
        return None
    
    def get_all_users(self) -> List[Dict]:
        """Get all users (without passwords) for basic queries"""
        self.cursor.execute('SELECT uuid, username, email FROM users')
        users = self.cursor.fetchall()
        return [
            {
                'uuid': user[0],
                'username': user[1],
                'email': user[2]
            }
            for user in users
        ]
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        self.cursor.execute('''
        SELECT uuid, username, email FROM users WHERE email = ?
        ''', (email,))
        user = self.cursor.fetchone()
        
        if user:
            return {
                'uuid': user[0],
                'username': user[1],
                'email': user[2]
            }
        return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate a user by username and password"""
        # Check which password column exists
        self.cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in self.cursor.fetchall()]
        
        if 'password_hash' in columns:
            password_column = 'password_hash'
        elif 'password_hash_sha256' in columns:
            password_column = 'password_hash_sha256'
        else:
            return None
        
        query = f'''
        SELECT uuid, username, email, {password_column}
        FROM users WHERE username = ?
        '''
        self.cursor.execute(query, (username,))
        user = self.cursor.fetchone()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
            return {
                'uuid': user[0],
                'username': user[1],
                'email': user[2]
            }
        return None
    
    def get_all_users_with_passwords(self) -> List[Dict]:
        """Get all users with their plain text passwords for Dex sync"""
        self.cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in self.cursor.fetchall()]
        
        if 'password_plain' in columns:
            self.cursor.execute('SELECT uuid, username, email, password_plain FROM users')
            users = self.cursor.fetchall()
            result = []
            for user in users:
                if user[3] is not None and user[3] != '':
                    # User has a plain text password
                    result.append({
                        'uuid': user[0],
                        'username': user[1],
                        'email': user[2],
                        'password': user[3]
                    })
                else:
                    # User doesn't have plain text password, use default
                    print(f"Warning: User {user[1]} has no plain text password, using default")
                    result.append({
                        'uuid': user[0],
                        'username': user[1],
                        'email': user[2],
                        'password': 'password123'  # Default password for legacy users
                    })
            return result
        else:
            # Fallback for legacy users - use default password
            users = self.get_all_users()
            for user in users:
                user['password'] = 'password123'  # Default password for existing users
            return users
    
    def fix_users_without_plain_passwords(self, default_password: str = "password123"):
        """Fix existing users that don't have plain text passwords stored"""
        try:
            self.cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in self.cursor.fetchall()]
            
            if 'password_plain' not in columns:
                print("password_plain column doesn't exist, users need to be migrated")
                return False
            
            # Find users without plain text passwords
            self.cursor.execute("SELECT uuid, username, email FROM users WHERE password_plain IS NULL OR password_plain = ''")
            users_without_plain = self.cursor.fetchall()
            
            if not users_without_plain:
                print("All users already have plain text passwords")
                return True
            
            print(f"Fixing {len(users_without_plain)} users without plain text passwords")
            
            for user in users_without_plain:
                uuid, username, email = user
                print(f"  Setting default password for {username}: {default_password}")
                self.cursor.execute(
                    "UPDATE users SET password_plain = ? WHERE uuid = ?",
                    (default_password, uuid)
                )
            
            self.conn.commit()
            print(f"✅ Updated {len(users_without_plain)} users with default password: {default_password}")
            return True
            
        except Exception as e:
            print(f"Error fixing users: {e}")
            return False
    
    def create_dex_users_file(self):
        """Create a separate YAML file for dynamic users that can be included in main dex config"""
        try:
            users_with_passwords = self.get_all_users_with_passwords()
            
            # Create the dynamic users file path
            dex_users_path = "/app/dex-config/dex_users.yaml"
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(dex_users_path), exist_ok=True)
            
            # Convert users to Dex format
            static_passwords = []
            for user in users_with_passwords:
                # Hash the password for Dex (using bcrypt)
                dex_hash = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                static_passwords.append({
                    'email': user['email'],
                    'hash': dex_hash,
                    'username': user['username'],
                    'userID': user['uuid']
                })
            
            # Create the users config structure
            users_config = {
                'staticPasswords': static_passwords
            }
            
            # Write to the separate users file
            with open(dex_users_path, 'w') as f:
                yaml.dump(users_config, f, default_flow_style=False)
            
            print(f"Created dex_users.yaml with {len(static_passwords)} users")
            return dex_users_path
            
        except Exception as e:
            print(f"Error creating Dex users file: {e}")
            raise e
    
    def sync_to_dex(self):
        """Append SQLite users to existing dex_final.yaml without overriding"""
        try:
            # Get all users from SQLite
            users_with_passwords = self.get_all_users_with_passwords()
            
            if not users_with_passwords:
                print("No users to sync")
                return
            
            # Path to the final dex config file
            dex_final_path = "/app/dex-config/dex_final.yaml"
            
            if not os.path.exists(dex_final_path):
                print(f"dex_final.yaml not found at {dex_final_path}")
                return
            
            # Read existing file content as text (not YAML) to preserve formatting
            with open(dex_final_path, 'r') as f:
                existing_content = f.read()
            
            # Check which users are already in the file to avoid duplicates
            existing_user_ids = set()
            for user in users_with_passwords:
                if user['uuid'] in existing_content:
                    existing_user_ids.add(user['uuid'])
            
            # Filter out users that already exist
            new_users = [user for user in users_with_passwords if user['uuid'] not in existing_user_ids]
            
            if not new_users:
                print("No new users to add - all users already exist in dex_final.yaml")
                return
            
            # Create the dynamic users section
            dynamic_section = "\n# Dynamically registered users from SQLite\n"
            
            for user in new_users:
                # Hash the password for Dex
                dex_hash = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                dynamic_section += f"  - email: {user['email']}\n"
                dynamic_section += f"    hash: \"{dex_hash}\"\n"
                dynamic_section += f"    # password = \"{user['password']}\"\n"
                dynamic_section += f"    username: {user['username']}\n"
                dynamic_section += f"    userID: \"{user['uuid']}\"\n"
                dynamic_section += "\n"
            
            # Append to existing file
            with open(dex_final_path, 'a') as f:
                f.write(dynamic_section)
            
            print(f"Successfully appended {len(new_users)} new users to dex_final.yaml")
            
            # Also create the separate users file for reference
            self.create_dex_users_file()
            
            # Restart Dex container to pick up new config
            self._restart_dex_container()
            
        except Exception as e:
            print(f"Error syncing to Dex: {e}")
            raise e

    
    def _restart_dex_container(self):
        """Restart the Dex container to pick up config changes"""
        try:
            # Try multiple docker restart approaches
            restart_commands = [
                ['docker', 'restart', 'dex'],                    # Direct container name
                ['docker', 'restart', 'foodie-dex-1'],           # Compose naming pattern 1
                ['docker', 'restart', 'foodie_dex_1'],           # Compose naming pattern 2
                ['docker-compose', 'restart', 'dex'],            # Docker compose restart
                ['docker', 'container', 'restart', 'dex'],       # Full docker command
            ]
            
            for cmd in restart_commands:
                try:
                    result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
                    print(f"Successfully restarted Dex container with command: {' '.join(cmd)}")
                    return
                except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
                    continue
            
            print("Warning: Could not restart Dex container automatically. Please restart manually with: docker restart dex")
            
        except Exception as e:
            print(f"Error restarting Dex container: {e}")
            # Don't raise exception, just log the error
    
    def create_user_with_dex_sync(self, username: str, email: str, password: str) -> str:
        """Create user in SQLite and automatically sync to Dex"""
        # Create user in SQLite first
        user_uuid = self.create_user(username, email, password)
        
        # Sync to Dex configuration
        try:
            self.sync_to_dex()
            print(f"User {username} created and synced to Dex successfully")
        except Exception as e:
            print(f"User created but Dex sync failed: {e}")
            # Don't fail the user creation if Dex sync fails
        
        return user_uuid
    
    def get_debug_info(self) -> Dict:
        """Get debug information about the database and Dex sync"""
        try:
            users = self.get_all_users()
            users_with_passwords = self.get_all_users_with_passwords()
            
            # Check file paths
            paths_to_check = [
                "/app/dex-config/dex.yaml",
                "/app/dex-config/dex_final.yaml", 
                "/app/dex-config/dex_users.yaml"
            ]
            
            path_results = {}
            for path in paths_to_check:
                path_results[path] = {
                    'exists': os.path.exists(path),
                    'size': os.path.getsize(path) if os.path.exists(path) else 0
                }
            
            # Check directory contents
            dex_config_dir = "/app/dex-config"
            if os.path.exists(dex_config_dir):
                files_in_dir = os.listdir(dex_config_dir)
            else:
                files_in_dir = "Directory doesn't exist"
            
            # Read current dex_final.yaml if it exists
            dex_final_content = None
            if os.path.exists("/app/dex-config/dex_final.yaml"):
                try:
                    with open("/app/dex-config/dex_final.yaml", 'r') as f:
                        dex_final_content = yaml.safe_load(f)
                except Exception as e:
                    dex_final_content = f"Error reading file: {e}"
            
            return {
                "sqlite_users": users,
                "sqlite_users_with_passwords_count": len(users_with_passwords),
                "path_results": path_results,
                "dex_config_directory_contents": files_in_dir,
                "dex_final_content": dex_final_content
            }
        except Exception as e:
            return {"error": str(e)}
    
    def close(self):
        """Close the database connection"""
        self.conn.close()