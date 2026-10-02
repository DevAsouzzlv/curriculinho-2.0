from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import pdfplumber
import io
import asyncio

from infrastructure.ai.gemini_client import GeminiClient

router = APIRouter()

def extract_pdf_text_sync(contents: bytes) -> str:
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(contents)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
    return extracted_text

@router.post("/match")
async def match_resume_to_job(
    file: UploadFile = File(...),
    job_description: str = Form(..., description="Cole aqui a descrição da vaga (Job Description)")
):
    """
    Fase 3: Recebe um PDF de currículo e a descrição de uma vaga.
    O sistema cruza as informações e retorna o Match (Score), Compatibilidades e Gaps.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")
    
    try:
        contents = await file.read()
        
        # Limite de tamanho de 5MB
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="O arquivo excede o limite de 5MB.")
            
        # Extração em threadpool
        extracted_text = await asyncio.to_thread(extract_pdf_text_sync, contents)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="O PDF parece estar vazio ou é uma imagem rasterizada sem texto extraível.")
        
        # Chama a IA para a Análise de Gaps (Match) assincronamente
        gemini = GeminiClient()
        match_result = await gemini.evaluate_match(extracted_text, job_description)
        
        return {
            "filename": file.filename,
            "match_analysis": match_result
        }
        
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante o Match: {str(e)}")
