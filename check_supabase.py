#!/usr/bin/env python3
"""Quick Supabase connection test using simple approach."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env_loaded():
    """Check if .env was loaded."""
    print("=" * 70)
    print("SUPABASE CONNECTION STATUS")
    print("=" * 70)
    
    required_vars = {
        "DATABASE_URL": "PostgreSQL Connection",
        "SUPABASE_URL": "Supabase Project URL",
        "SUPABASE_JWT_SECRET": "JWT Secret",
        "GOOGLE_CLIENT_ID": "Google OAuth ID"
    }
    
    print("\n📋 Environment Variables Loaded:\n")
    all_set = True
    for var, desc in required_vars.items():
        value = os.getenv(var, "")
        is_set = bool(value)
        status = "✅" if is_set else "❌"
        print(f"{status} {var}: {desc}")
        
        if is_set:
            if "password" in var.lower() or "secret" in var.lower():
                # Mask sensitive info
                visible = value[:15] + "..." if len(value) > 15 else value
                print(f"   └─ Value: {visible}")
            elif var == "DATABASE_URL":
                # Extract host info
                if "@" in value:
                    host_part = value.split("@")[1].split("/")[0]
                    print(f"   └─ Host: {host_part}")
            elif var == "SUPABASE_URL":
                print(f"   └─ URL: {value}")
        else:
            all_set = False
    
    return all_set

def test_database_import():
    """Test if we can import and create database connection."""
    print("\n🔌 Database Configuration Test:\n")
    
    try:
        from backend.core.config import settings
        
        print(f"✅ Configuration loaded")
        print(f"   └─ Database: Supabase PostgreSQL")
        print(f"   └─ URL: {settings.SUPABASE_URL}")
        
        # Check if it's actually using Supabase
        is_supabase = "supabase" in settings.DATABASE_URL.lower()
        if is_supabase:
            print(f"✅ Using Supabase PostgreSQL database")
        else:
            print(f"⚠️  Database is not on Supabase: {settings.DATABASE_URL[:50]}...")
        
        return True
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection to database."""
    print("\n🗄️  Database Connection Test:\n")
    
    try:
        from sqlalchemy import text, create_engine
        from backend.core.config import settings
        
        # Create engine
        engine = create_engine(settings.DATABASE_URL, echo=False)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            value = result.scalar()
        
        print(f"✅ Successfully connected to Supabase PostgreSQL")
        print(f"   └─ Connection verified")
        engine.dispose()
        return True
        
    except TimeoutError:
        print(f"❌ Connection timeout - Supabase server may be unreachable")
        return False
    except Exception as e:
        error_msg = str(e)
        if "password" in error_msg.lower() or "auth" in error_msg.lower():
            print(f"❌ Authentication failed - check DATABASE_URL credentials in .env")
            print(f"   └─ Error: {error_msg[:100]}...")
        elif "connection" in error_msg.lower() or "resolve" in error_msg.lower():
            print(f"❌ Network error - cannot reach database server")
            print(f"   └─ Error: {error_msg[:100]}...")
        else:
            print(f"❌ Database connection failed")
            print(f"   └─ Error: {error_msg[:100]}...")
        return False

def test_jwt_secret():
    """Test if JWT secret is properly configured."""
    print("\n🔐 JWT Configuration Test:\n")
    
    try:
        from backend.core.supabase import _JWT_SECRET
        
        if _JWT_SECRET:
            print(f"✅ Supabase JWT Secret is configured")
            print(f"   └─ Length: {len(_JWT_SECRET)} characters")
            print(f"   └─ Can be used for token verification")
            return True
        else:
            print(f"❌ JWT Secret is empty")
            return False
    except Exception as e:
        print(f"❌ Failed to load JWT secret: {e}")
        return False

def main():
    """Run all tests."""
    print("\n")
    
    # Test 1: Environment variables
    env_ok = test_env_loaded()
    
    # Test 2: Configuration
    config_ok = test_database_import()
    
    # Test 3: JWT
    jwt_ok = test_jwt_secret()
    
    # Test 4: Database connection
    db_ok = test_sqlalchemy_connection()
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    tests = {
        "Environment Variables": env_ok,
        "Configuration": config_ok,
        "JWT Secret": jwt_ok,
        "Database Connection": db_ok
    }
    
    passed = sum(1 for v in tests.values() if v)
    total = len(tests)
    
    for test_name, result in tests.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\nResult: {passed}/{total} tests passed\n")
    
    if db_ok and env_ok and jwt_ok:
        print("🎉 Supabase is FULLY CONNECTED and WORKING!\n")
    elif config_ok and jwt_ok:
        print("⚠️  Supabase configuration is set but database connection failed.")
        print("   Check your internet connection and database credentials.\n")
    else:
        print("❌ Supabase is NOT properly configured.\n")


if __name__ == "__main__":
    main()
