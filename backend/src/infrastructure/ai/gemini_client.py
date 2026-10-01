import os
from google import genai

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("⚠️ GEMINI_API_KEY não foi encontrada! Verifique seu arquivo .env.")
        
        self.client = genai.Client(api_key=api_key)

    def evaluate_resume(self, resume_text: str) -> str:
        prompt = f"""
        Você é um recrutador sênior de Tecnologia e Recursos Humanos.
        Avalie o currículo abaixo extraído de um PDF e forneça um feedback construtivo.

        Retorne a resposta no seguinte formato:
        - **Pontos Fortes**: (liste os pontos fortes)
        - **Pontos de Melhoria**: (o que falta, formatação, dicas)
        - **Nota Geral**: (de 0 a 10)

        Currículo:
        {resume_text}
        """

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
