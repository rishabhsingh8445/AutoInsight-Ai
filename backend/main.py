import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from the root .env file
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="AutoInsight AI Backend")

# Allow CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

from routes.auth import router as auth_router
from routes.datasets import router as datasets_router
from routes.chat import router as chat_router

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(datasets_router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
