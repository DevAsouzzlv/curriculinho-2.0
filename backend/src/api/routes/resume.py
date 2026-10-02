from fastapi import APIRouter, File, UploadFile, HTTPException
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

@router.post("/extract-text")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")
    
    try:
        contents = await file.read()
        
        # Limite de tamanho de 5MB
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="O arquivo excede o limite de 5MB.")
            
        # Extração em threadpool para não bloquear o event loop (PERF-01)
        extracted_text = await asyncio.to_thread(extract_pdf_text_sync, contents)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="O PDF parece estar vazio ou é uma imagem rasterizada sem texto extraível.")
            
        return {"text": extracted_text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o PDF: {str(e)}")


@router.post("/evaluate")
async def evaluate_resume_pdf(file: UploadFile = File(...)):
    """
    Extrai o texto do PDF e envia para o Gemini avaliar.
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
        
        # Chama a IA de forma assíncrona
        gemini = GeminiClient()
        feedback = await gemini.evaluate_resume(extracted_text)
        
        return {
            "filename": file.filename,
            "feedback": feedback
        }
        
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante a avaliação: {str(e)}")
