import os
import asyncio
from google import genai

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("[Erro] GEMINI_API_KEY não foi encontrada! Verifique seu arquivo .env.")
        
        self.client = genai.Client(api_key=api_key)

    async def _call_gemini_with_fallback(self, prompt: str) -> str:
        """Função privada que lida com as tentativas e fallback dos modelos de forma assíncrona."""
        # Corrigido para modelos oficiais e válidos
        models_to_try = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']
        max_retries = 3

        for model in models_to_try:
            for attempt in range(max_retries):
                try:
                    # Executa a chamada bloqueante de rede em uma thread separada para não travar o loop de eventos
                    response = await asyncio.to_thread(
                        self.client.models.generate_content,
                        model=model,
                        contents=prompt
                    )
                    return response.text
                except Exception as e:
                    error_msg = str(e)
                    
                    if "503" in error_msg or "UNAVAILABLE" in error_msg:
                        print(f"[Aviso - Tentativa {attempt + 1}/{max_retries}] Modelo {model} sobrecarregado (503). Retentando em 2s...")
                        await asyncio.sleep(2)
                        continue
                        
                    elif "404" in error_msg or "NOT_FOUND" in error_msg:
                        print(f"[Aviso] Modelo {model} não disponível (404). Pulando para o modelo de fallback...")
                        break
                        
                    else:
                        raise e
                        
        raise Exception("Infelizmente os servidores do Google Gemini estão instáveis no momento. Tente novamente em alguns minutos.")

    async def evaluate_resume(self, resume_text: str) -> str:
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
        return await self._call_gemini_with_fallback(prompt)

    async def evaluate_match(self, resume_text: str, job_description: str) -> str:
        prompt = f"""
        Você é um recrutador sênior de Tecnologia e Recursos Humanos e um especialista em ATS (Applicant Tracking System).
        Compare o currículo do candidato com a descrição da vaga fornecida.

        Sua tarefa é fazer o "Match" (cruzamento) de habilidades e identificar Gaps.
        Retorne a resposta EXATAMENTE no seguinte formato:
        - **Pontuação de Match**: (dê uma porcentagem de 0% a 100%)
        - **Habilidades Compatíveis**: (o que o candidato tem que a vaga pede)
        - **Habilidades Faltantes (Gaps)**: (o que a vaga pede e o candidato NÃO tem no currículo)
        - **Veredito**: (Um pequeno parágrafo dizendo se você recomendaria este candidato para entrevista)

        Vaga (Job Description):
        {job_description}

        Currículo do Candidato:
        {resume_text}
        """
        return await self._call_gemini_with_fallback(prompt)
