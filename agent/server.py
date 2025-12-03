"""
Custom routes to extend the LangGraph API server.

This mounts a /generated route for serving generated images.
Configure in langgraph.json via http.app setting.
"""
import shutil
import uuid
import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Create the generated images directory
GENERATED_DIR = Path(__file__).parent / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

# Custom FastAPI app to mount alongside LangGraph routes
app = FastAPI(title="Custom Routes")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for generated images
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")

def get_agent_url() -> str:
    """Get the agent's base URL for serving static files."""
    return os.getenv("AGENT_URL", "http://127.0.0.1:8123")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the generated directory."""
    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = GENERATED_DIR / filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"{get_agent_url()}/generated/{filename}"}
