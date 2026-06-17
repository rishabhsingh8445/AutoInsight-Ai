import io
import datetime
from fastapi import APIRouter, Request, UploadFile, File, HTTPException
import pandas as pd
from core.supabase import get_supabase

router = APIRouter()

def get_user_id(request: Request) -> str:
    token = request.cookies.get("sb-access-token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        user = get_supabase().auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload")
async def upload_dataset(request: Request, file: UploadFile = File(...)):
    user_id = get_user_id(request)
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    columns = df.columns.tolist()
    row_count = len(df)
    
    # Generate basic report structure matching what frontend expects
    report = {
        "fileName": file.filename,
        "rowCount": row_count,
        "colCount": len(columns),
        "columns": [{"name": c, "type": str(df[c].dtype), "missing": int(df[c].isna().sum())} for c in columns],
        "summary": "Parsed via Python Pandas"
    }

    # Upload to Supabase Storage
    supabase = get_supabase()
    timestamp = int(datetime.datetime.now().timestamp())
    safe_name = file.filename.replace(" ", "_")
    storage_path = f"{user_id}/{timestamp}_{safe_name}"
    
    res = supabase.storage.from_("datasets").upload(
        path=storage_path, 
        file=contents,
        file_options={"content-type": file.content_type}
    )
    
    if hasattr(res, "error") and res.error:
        print(f"Storage upload error: {res.error}")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {res.error}")

    try:
        # Insert metadata to DB
        db_res = supabase.table("datasets").insert({
            "user_id": user_id,
            "file_name": file.filename,
            "storage_path": storage_path,
            "row_count": row_count,
            "column_count": len(columns),
            "columns": columns
        }).execute()
        
        if len(db_res.data) == 0:
            raise HTTPException(status_code=500, detail="DB insert failed: No data returned")
    except Exception as e:
        print(f"DB insert error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"DB insert failed: {str(e)}")

    # Return the first 500 rows for preview
    preview_df = df.head(500).fillna("")
    rows = preview_df.to_dict(orient="records")

    return {
        "record": db_res.data[0],
        "columns": columns,
        "rows": rows,
        "report": report
    }

@router.get("/fetch")
def fetch_datasets(request: Request):
    user_id = get_user_id(request)
    supabase = get_supabase()
    
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    res = supabase.table("datasets").select("*").eq("user_id", user_id).gt("expires_at", now).order("uploaded_at", desc=True).execute()
    
    return {"datasets": res.data}

@router.post("/delete")
async def delete_dataset(request: Request):
    user_id = get_user_id(request)
    data = await request.json()
    dataset_id = data.get("id")
    storage_path = data.get("storagePath")
    
    if not dataset_id or not storage_path:
        raise HTTPException(status_code=400, detail="Missing id or storagePath")
        
    supabase = get_supabase()
    
    supabase.table("datasets").delete().eq("id", dataset_id).eq("user_id", user_id).execute()
    supabase.storage.from_("datasets").remove([storage_path])
    
    return {"success": True}

@router.post("/download")
async def download_dataset(request: Request):
    user_id = get_user_id(request)
    data = await request.json()
    storage_path = data.get("storagePath")
    
    supabase = get_supabase()
    res = supabase.storage.from_("datasets").download(storage_path)
    
    import base64
    base64_data = base64.b64encode(res).decode("utf-8")
    
    return {"base64Data": base64_data}
