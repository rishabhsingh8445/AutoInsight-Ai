import os
from fastapi import APIRouter, Request, HTTPException
from groq import Groq

router = APIRouter()

@router.post("/groq")
async def groq_chat(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    max_tokens = data.get("max_tokens", None)
    
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY on server")
        
    client = Groq(api_key=groq_api_key)
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=max_tokens
        )
        return completion.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")
