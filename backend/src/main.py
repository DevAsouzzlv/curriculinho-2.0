import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import resume

app = FastAPI(
    title="Curriculinho 2.0 API",
    description="API inteligente de carreira com IA e NLP",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume"])

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao back-end do Curriculinho 2.0!"}
