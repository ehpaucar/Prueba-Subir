from fastapi import APIRouter, HTTPException
from Backend.schemas.schema_question import QueryRequest
from Backend.functions.chatbot import responderPreguntas

route = APIRouter()

@route.post("/ask")
async def ask_bot(request: QueryRequest):
    try:
              
        # Llama a la función que procesa la pregunta
        respuesta = responderPreguntas(request)  # Pasa el prompt completo
        return {"respuesta": respuesta}  # Devuelve la respuesta como JSON
    except Exception as e:
        # Captura cualquier error y lo devuelve de forma clara
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")
