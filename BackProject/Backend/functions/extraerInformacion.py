from io import BytesIO
from fastapi import File, UploadFile, HTTPException
from Backend.utils.config import GROQ_API_KEY
from groq import Groq
import pandas as pd
import pdfplumber

qclient = Groq(api_key=GROQ_API_KEY)

async def upload(file: UploadFile = File(...)):
    file_content = await file.read() 
    file_in_memory = BytesIO(file_content) 
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension == "xlsx":
        text = pd.read_excel(file_in_memory)
    elif file_extension == "csv":
        text = pd.read_csv(file_in_memory)
    elif file_extension == "txt":
        text = file_content.decode("utf-8")
    elif file_extension == "pdf":
        text = ""
        with pdfplumber.open(file_in_memory) as pdf:
            for pagina in pdf.pages:
                text += pagina.extract_text() + "\n"
    else:
        raise HTTPException(status_code=415, detail="Tipo de archivo no soportado")

    # Si text es una cadena de texto, convertirlo en un dict.
    text_dict = {"content": text}
    return text_dict

'''def generarResumen(text_dict):
    prompt = (f"Analiza el siguiente texto y haz un resumen claro y fácil de entender para cualquier persona que no haya revisado el contenido. "
          f"El texto tiene mucha información, por lo que el resumen debe enfocarse en los puntos más importantes. "
          f"Este resumen debe ser entendible y explicar de manera sencilla lo más relevante, destacando datos y nombres claves. "
          f"Texto: {text_dict}\n\n"
          f"Resumen: ")'''

def generarResumen(text_dict):
    prompt = (f"Analiza el siguiente texto y haz un resumen claro y fácil de entender para cualquier persona que no haya revisado el contenido. "
          f"El texto tiene mucha información, por lo que el resumen debe enfocarse en los puntos más importantes. "
          f"Este resumen debe ser entendible y explicar de manera sencilla lo más relevante, destacando datos y nombres claves. "
          f"Texto: {text_dict}\n\n"
          f"Resumen: ")

    try:
        response = qclient.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
        )

        resumen = response.choices[0].message.content.strip()
        print("RESUMEN", resumen)

        return resumen

    except Exception as e:
        print(f"Error al obtener el resumen del texto: {e}")
        return "Error"

# extraerInformacion.py
# Añadir esta función en el archivo actual

def extraerKeywords(resumen_texto):
    """
    Extrae palabras clave del resumen generado usando Groq
    """
    prompt = (
        f"Analiza el siguiente resumen y extrae las 25 palabras clave más importantes, "
        f"incluyendo nombres propios, términos técnicos y conceptos relevantes. "
        f"Para cada palabra, asigna un valor numérico de importancia entre 10 y 100 "
        f"basado en su relevancia en el texto. "
        f"Devuelve solo un array de objetos JSON con formato {{\"text\": \"palabra\", \"value\": número}}. "
        f"Resumen: {resumen_texto}"
    )
    
    try:
        response = qclient.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
        )
        
        keywords_json = response.choices[0].message.content.strip()
        
        # Extraer solo el array JSON de la respuesta (por si acaso el modelo devuelve texto adicional)
        import json
        import re
        
        # Buscar patrón de array JSON
        json_pattern = r'\[\s*\{.*\}\s*\]'
        match = re.search(json_pattern, keywords_json, re.DOTALL)
        
        if match:
            keywords_json = match.group(0)
            
        try:
            # Intentar parsear el JSON
            keywords = json.loads(keywords_json)
            return keywords
        except json.JSONDecodeError:
            # Si hay error en el formato JSON, devolver un formato básico
            print("Error al decodificar JSON de palabras clave")
            return [{"text": "error", "value": 10}]
            
    except Exception as e:
        print(f"Error al extraer palabras clave: {e}")
        return [{"text": "error", "value": 10}]