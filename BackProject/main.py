from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from Backend.routes.analizador_route import route as analizador_route
from Backend.routes.chatbot_route import route as chatbot_route

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, limitar esto a tu dominio frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar la carpeta de templates (para HTML)
#app.mount("/templates", StaticFiles(directory="Frontend/templates"), name="templates")
# Montar la carpeta de static (para JS, CSS, imágenes)
#app.mount("/static", StaticFiles(directory="Frontend/static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    return FileResponse('frontend/index.html')

app.include_router(analizador_route)
app.include_router(chatbot_route)

