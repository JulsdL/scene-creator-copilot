"""
Custom routes to extend the LangGraph API server.

This mounts a /generated route for serving generated images.
Configure in langgraph.json via http.app setting.
"""
import shutil
import uuid
import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
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

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the generated directory."""

    # Validate content type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    # Validate file size
    # Check if the file is spooled to disk or in memory
    try:
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
    except Exception:
        # Fallback for streams that don't support seek (though UploadFile usually does)
        # In this case we might not be able to check size efficiently without reading
        pass
    else:
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )

    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = GENERATED_DIR / filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        await file.close()

    return {"url": f"{get_agent_url()}/generated/{filename}"}
