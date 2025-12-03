"""
Custom routes to extend the LangGraph API server.

This mounts a /generated route for serving generated images.
Configure in langgraph.json via http.app setting.
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Create the generated images directory
GENERATED_DIR = Path(__file__).parent / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

# Custom FastAPI app to mount alongside LangGraph routes
app = FastAPI(title="Custom Routes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for generated images
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")
