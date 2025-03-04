# chatbot.py
from fastapi import HTTPException, Request
from groq import Groq
from Backend.schemas.schema_question import QueryRequest
from Backend.utils.config import GROQ_API_KEY
from Backend.functions.data import data

qclient = Groq(api_key=GROQ_API_KEY)

def responderPreguntas(request: QueryRequest):
    resumen = data.get("resumen", "")
    if not resumen:
        return "Aún no se ha cargado ningún documento. Por favor, carga un documento primero."
    
    question = request.question
    prompt = (
        f"Basándote únicamente en este resumen: \"{resumen}\", "
        f"responde a la siguiente pregunta de manera concisa y precisa: {question}. "
        f"Si la información no se encuentra en el resumen, indica claramente que no puedes responder "
        f"basado en la información disponible."
    )

    try:
        response = qclient.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        respuesta = response.choices[0].message.content.strip()
        return respuesta
    except Exception as e:
        print("Error en la llamada a Groq:", str(e))
        raise HTTPException(status_code=500, detail="Error en la llamada a la API de Groq")