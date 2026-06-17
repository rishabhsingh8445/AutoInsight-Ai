import os
from supabase import create_client, Client

def get_supabase() -> Client:
    # Ensure these match the variables in the .env file (you can use VITE_ or non-VITE_)
    url: str = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL or Key is not configured correctly.")
        
    return create_client(url, key)
