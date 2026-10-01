from fastapi import APIRouter, File, UploadFile, HTTPException
import pdfplumber
import io

router = APIRouter()

@router.post("/extract-text")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    """
    Recebe um currículo em formato PDF e retorna o texto extraído.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")
    
    try:
        # Lê o conteúdo do arquivo em memória
        contents = await file.read()
        
        # Extrai o texto usando pdfplumber
        extracted_text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
                    
        return {
            "filename": file.filename,
            "text": extracted_text,
            "message": "Texto extraído com sucesso"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o PDF: {str(e)}")
