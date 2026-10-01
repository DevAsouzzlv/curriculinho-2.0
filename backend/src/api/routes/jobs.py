from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import pdfplumber
import io

from infrastructure.ai.gemini_client import GeminiClient

router = APIRouter()

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
        extracted_text = ""
        
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        # Chama a IA para a Análise de Gaps (Match)
        gemini = GeminiClient()
        match_result = gemini.evaluate_match(extracted_text, job_description)
        
        return {
            "filename": file.filename,
            "match_analysis": match_result
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante o Match: {str(e)}")
