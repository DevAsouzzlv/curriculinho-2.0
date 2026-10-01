from fastapi import APIRouter, File, UploadFile, HTTPException
import pdfplumber
import io

from infrastructure.ai.gemini_client import GeminiClient

router = APIRouter()

@router.post("/extract-text")
async def extract_text_from_pdf(file: UploadFile = File(...)):
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
                    
        return {"text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o PDF: {str(e)}")


@router.post("/evaluate")
async def evaluate_resume_pdf(file: UploadFile = File(...)):
    """
    Extrai o texto do PDF e envia para o Gemini avaliar.
    """
    # Reutilizando a lógica de extração
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
        
        # Chama a IA
        gemini = GeminiClient()
        feedback = gemini.evaluate_resume(extracted_text)
        
        return {
            "filename": file.filename,
            "feedback": feedback
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante a avaliação: {str(e)}")
