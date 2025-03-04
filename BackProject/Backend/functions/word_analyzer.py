# word_analyzer.py
import re
from collections import Counter
import nltk
from nltk.corpus import stopwords
import spacy

# Descargar stopwords si no están disponibles
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Cargar modelo de español para NLP
try:
    nlp = spacy.load("es_core_news_sm")
except:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "es_core_news_sm"])
    nlp = spacy.load("es_core_news_sm")

def extraer_palabras_frecuentes(texto, max_palabras=50, min_longitud=3):
    """
    Extrae las palabras más frecuentes de un texto, dando prioridad a sustantivos y entidades.
    Args:
        texto: El texto a analizar
        max_palabras: Número máximo de palabras a retornar
        min_longitud: Longitud mínima de palabras a considerar
    Returns:
        Una lista de diccionarios con formato {text: palabra, value: frecuencia}
    """
    # Convertir a texto si es un dataframe u otro objeto
    if hasattr(texto, 'to_string'):
        texto = texto.to_string()
    
    # Procesar el texto con spaCy para identificar entidades y sustantivos
    doc = nlp(texto)
    
    # Extraer entidades nombradas (personas, organizaciones, lugares, etc.)
    entidades = [ent.text.lower() for ent in doc.ents]
    
    # Extraer sustantivos
    sustantivos = [token.text.lower() for token in doc if token.pos_ in ["NOUN", "PROPN"]]
    
    # Combinar entidades y sustantivos, dándoles más peso
    palabras_importantes = entidades + sustantivos
    
    # Limpiar el texto: convertir a minúsculas y eliminar caracteres especiales
    texto = texto.lower()
    texto = re.sub(r'[^\w\s]', ' ', texto)
    
    # Dividir en palabras
    palabras = texto.split()
    
    # Filtrar stopwords (en español e inglés) y palabras cortas
    stop_words_es = set(stopwords.words('spanish'))
    stop_words_en = set(stopwords.words('english'))
    stop_words = stop_words_es.union(stop_words_en)
    palabras_filtradas = [palabra for palabra in palabras
                         if palabra not in stop_words
                         and len(palabra) >= min_longitud
                         and palabra.isalpha()]
    
    # Contar frecuencias
    contador = Counter(palabras_filtradas)
    
    # Dar más peso a las palabras importantes identificadas por spaCy
    for palabra in palabras_importantes:
        if palabra in contador:
            # Multiplicar la frecuencia de palabras importantes
            contador[palabra] *= 2
    
    # Obtener las palabras más frecuentes
    palabras_frecuentes = contador.most_common(max_palabras)
    
    # Formatear para la nube de tags (formato que espera el frontend)
    resultado = [{"text": palabra, "value": frecuencia}
                for palabra, frecuencia in palabras_frecuentes]
    
    return resultado