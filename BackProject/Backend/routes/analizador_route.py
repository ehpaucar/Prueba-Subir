# analizador_route.py
from fastapi import File, UploadFile
from fastapi import APIRouter
from Backend.functions.extraerInformacion import upload, generarResumen, extraerKeywords
from Backend.functions.word_analyzer import extraer_palabras_frecuentes
from Backend.functions.data import data

route = APIRouter()

@route.post("/resumen")
async def upload_file(file: UploadFile = File(...)):
    datos = await upload(file)
    resumen = generarResumen(datos)
    print("RUTARESUMEN", resumen)
    
    # Extraer palabras clave del resumen
    palabras_clave = extraerKeywords(resumen)
    
    # Guardar en el estado compartido
    data["datos"] = datos
    data["resumen"] = resumen
    data["palabras_frecuentes"] = palabras_clave
    
    return {
        "resumen": resumen,
        "palabras_frecuentes": palabras_clave
    }

@route.get("/palabras-frecuentes")
async def get_palabras_frecuentes():
    return {
        "palabras_frecuentes": data["palabras_frecuentes"]
    }