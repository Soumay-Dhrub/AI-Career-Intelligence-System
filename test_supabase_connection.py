#!/usr/bin/env python3
"""Diagnostic script to check Supabase connection status."""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def check_env_file():
    """Check if .env file exists."""
    env_path = Path(".env")
    print(f"✓ Checking for .env file...")
    if env_path.exists():
        print(f"  ✅ .env file found at {env_path}")
        return True
    else:
        print(f"  ❌ .env file NOT found at {env_path}")
        print(f"     Create a .env file with the required variables")
        return False


def check_env_variables():
    """Check if required environment variables are set."""
    print(f"\n✓ Checking environment variables...")
    
    env_vars = {
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_JWT_SECRET": "Supabase JWT signing secret",
        "DATABASE_URL": "PostgreSQL connection string",
    }
    
    results = {}
    for var, desc in env_vars.items():
        value = os.getenv(var, "")
        results[var] = bool(value)
        status = "✅" if value else "❌"
        print(f"  {status} {var}: {desc}")
        if value:
            # Mask sensitive values
            if "password" in var.lower() or "secret" in var.lower():
                print(f"      Value: {value[:20]}...***")
            elif var == "SUPABASE_URL":
                print(f"      Value: {value}")
    
    return results


def check_config():
    """Check configuration from Pydantic settings."""
    print(f"\n✓ Checking Pydantic configuration...")
    
    from backend.core.config import settings
    
    config_items = {
        "SUPABASE_URL": settings.SUPABASE_URL,
        "DATABASE_URL": settings.DATABASE_URL,
        "SUPABASE_JWT_SECRET": settings.SUPABASE_JWT_SECRET,
    }
    
    for key, value in config_items.items():
        is_set = bool(value) and value != ""
        # Check if it's a placeholder
        is_placeholder = (
            value == "your-secret-key-change-in-production" or
            "user:password@localhost" in (value or "")
        )
        
        status = "⚠️" if is_placeholder else ("✅" if is_set else "❌")
        print(f"  {status} {key}: {is_set}")
        
        if is_placeholder:
            print(f"      ⚠️  Contains placeholder values - needs configuration")
        elif is_set:
            if "password" in key.lower() or "secret" in key.lower():
                print(f"      Value: {value[:20]}...***")
            else:
                print(f"      Value: {value}")


def check_database_connection():
    """Test database connection."""
    print(f"\n✓ Testing database connection...")
    
    try:
        from backend.database.models import SessionLocal
        
        db = SessionLocal()
        # Try a simple query
        db.execute("SELECT 1")
        db.close()
        print(f"  ✅ Database connection successful")
        return True
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False


def check_supabase_jwt():
    """Check if Supabase JWT secret is available."""
    print(f"\n✓ Checking Supabase JWT configuration...")
    
    from backend.core.config import settings
    
    if settings.SUPABASE_JWT_SECRET:
        print(f"  ✅ SUPABASE_JWT_SECRET is set")
        print(f"     Length: {len(settings.SUPABASE_JWT_SECRET)} characters")
        return True
    else:
        print(f"  ❌ SUPABASE_JWT_SECRET is empty")
        print(f"     Get this from: Supabase Dashboard → Project Settings → API → JWT Secret")
        return False


def main():
    """Run all checks."""
    print("=" * 70)
    print("SUPABASE & DATABASE CONNECTION DIAGNOSTIC")
    print("=" * 70)
    
    # Run checks
    has_env_file = check_env_file()
    env_vars = check_env_variables()
    check_config()
    jwt_ok = check_supabase_jwt()
    
    # Try database connection (it might fail, that's ok)
    try:
        db_ok = check_database_connection()
    except Exception as e:
        print(f"\n✓ Database check skipped (dependencies may not be installed)")
        db_ok = False
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if not has_env_file:
        print("❌ No .env file found - CRITICAL: Create .env with Supabase credentials")
    
    all_env_set = all(env_vars.values()) if env_vars else False
    if not all_env_set:
        print("❌ Missing environment variables - Set all required variables in .env")
    
    if jwt_ok and all_env_set:
        print("✅ Supabase configuration appears complete")
    else:
        print("⚠️  Supabase is NOT fully configured")
    
    if db_ok:
        print("✅ Database connection is working")
    else:
        print("⚠️  Database connection failed or not tested")
    
    print("\n" + "=" * 70)
    print("REQUIRED SETUP STEPS")
    print("=" * 70)
    print("""
1. Create .env file in project root:
   copy .env.example .env  (if available)

2. Get Supabase credentials from:
   - Go to https://app.supabase.com
   - Select your project
   - Settings → API → Copy the values:
     * Project URL → SUPABASE_URL
     * JWT Secret → SUPABASE_JWT_SECRET
     * PostgreSQL Connection String → DATABASE_URL

3. Get Google OAuth credentials:
   - Go to https://console.cloud.google.com
   - Create OAuth 2.0 credentials
   - Copy Client ID → GOOGLE_CLIENT_ID

4. Set .env file with all credentials

5. Run this test again to verify
""")


if __name__ == "__main__":
    main()
