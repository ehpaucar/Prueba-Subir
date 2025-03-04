import './style.css';
import { createWordCloud } from './wordcloud.js';

// URL base para las peticiones a la API
const API_BASE_URL = 'http://localhost:8000';

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  initializeFileUploader();
  initializeChatbot();
});

// ----- COMPONENTE DE CARGA DE ARCHIVOS -----
function initializeFileUploader() {
  const fileUploaderElement = document.getElementById('file-uploader');
  if (!fileUploaderElement) return;

  // Crear la estructura HTML
  fileUploaderElement.innerHTML = `
    <div class="uploader">
      <input type="file" id="file-input" class="file-input" accept=".pdf,.xlsx,.csv,.txt">
      <label for="file-input" class="file-label">Seleccionar archivo</label>
      <span class="file-name"></span>
      <div class="upload-actions hidden">
        <button id="upload-btn" class="btn btn-primary">Subir archivo</button>
      </div>
    </div>

    <div id="upload-status" class="hidden"></div>
  `;

  // Obtener referencias a los elementos
  const fileInput = fileUploaderElement.querySelector('#file-input');
  const fileNameSpan = fileUploaderElement.querySelector('.file-name');
  const uploadActions = fileUploaderElement.querySelector('.upload-actions');
  const uploadButton = fileUploaderElement.querySelector('#upload-btn');
  const uploadStatus = fileUploaderElement.querySelector('#upload-status');
  let selectedFile = null;

  // Agregar event listeners
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      selectedFile = file;
      fileNameSpan.textContent = file.name;
      uploadActions.classList.remove('hidden');
    } else {
      resetUploader();
    }
  });

  uploadButton.addEventListener('click', async () => {
    if (!selectedFile) return;
    try {
      // Mostrar estado de carga
      uploadStatus.innerHTML = '<p>Subiendo archivo y procesando...</p>';
      uploadStatus.classList.remove('hidden');
      uploadButton.disabled = true;

      // Subir el archivo
      const response = await uploadFile(selectedFile);

      // Mostrar éxito
      uploadStatus.innerHTML = '<p class="success">¡Archivo procesado correctamente!</p>';

      // Mostrar el resumen
      if (response.resumen) {
        showSummary(response.resumen);
      }

      // Mostrar la nube de palabras frecuentes
      if (response.palabras_frecuentes) {
        showWordCloud(response.palabras_frecuentes);
      }
    } catch (error) {
      // Mostrar error
      uploadStatus.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    } finally {
      uploadButton.disabled = false;
    }
  });

  function resetUploader() {
    selectedFile = null;
    fileNameSpan.textContent = '';
    uploadActions.classList.add('hidden');
    uploadStatus.classList.add('hidden');
    fileInput.value = '';
  }
}

// ----- COMPONENTE DEL CHATBOT -----
function initializeChatbot() {
  const chatbotElement = document.getElementById('chatbot-container');
  if (!chatbotElement) return;

  // Crear la estructura HTML
  chatbotElement.innerHTML = `
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input">
      <input type="text" id="question-input" placeholder="Escribe tu pregunta aquí...">
      <button id="send-btn" class="btn">Enviar</button>
    </div>
  `;

  // Obtener referencias a los elementos
  const messagesContainer = chatbotElement.querySelector('#chat-messages');
  const questionInput = chatbotElement.querySelector('#question-input');
  const sendButton = chatbotElement.querySelector('#send-btn');
  const messages = [];

  // Agregar event listeners
  sendButton.addEventListener('click', handleSendQuestion);
  questionInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSendQuestion();
    }
  });

  // Agregar mensaje de bienvenida
  addBotMessage('Hola, soy tu asistente. Puedes hacerme preguntas sobre el documento que has subido.');

  async function handleSendQuestion() {
    const question = questionInput.value.trim();
    if (!question) {
      return;
    }

    // Agregar la pregunta del usuario al chat
    addUserMessage(question);

    // Limpiar el input
    questionInput.value = '';

    try {
      // Mostrar que el bot está "escribiendo"
      const typingId = addBotTypingIndicator();

      // Enviar la pregunta al servidor
      const response = await askQuestion(question);

      // Eliminar el indicador de escritura
      removeMessage(typingId);

      // Mostrar la respuesta del bot
      if (response && response.respuesta) {
        addBotMessage(response.respuesta);
      } else {
        addBotMessage('Lo siento, no pude obtener una respuesta. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      addBotMessage(`Error: ${error.message}. Por favor, intenta de nuevo.`);
    }
  }

  function addUserMessage(text) {
    const messageId = Date.now().toString();
    messages.push({
      id: messageId,
      text,
      sender: 'user'
    });

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.setAttribute('data-id', messageId);
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    return messageId;
  }

  function addBotMessage(text) {
    const messageId = Date.now().toString();
    messages.push({
      id: messageId,
      text,
      sender: 'bot'
    });

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.setAttribute('data-id', messageId);
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    return messageId;
  }

  function addBotTypingIndicator() {
    const messageId = 'typing-' + Date.now().toString();
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message', 'typing');
    messageElement.setAttribute('data-id', messageId);
    messageElement.textContent = 'Escribiendo...';
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    return messageId;
  }

  function removeMessage(messageId) {
    const messageElement = messagesContainer.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// ----- FUNCIONES DE API -----
/**
 * Sube un archivo al servidor para su análisis
 * @param {File} file - El archivo a subir
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/resumen`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en la petición de subida:', error);
    throw error;
  }
}

/**
 * Envía una pregunta al chatbot
 * @param {string} question - La pregunta a realizar
 * @returns {Promise} - Promesa con la respuesta del chatbot
 */
async function askQuestion(question) {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Error al hacer la pregunta: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en la petición al chatbot:', error);
    throw error;
  }
}

// ----- FUNCIONES AUXILIARES -----
/**
 * Muestra el resumen del documento
 * @param {string} resumen - El resumen generado
 */
function showSummary(resumen) {
  // Mostrar la sección del resumen
  const summarySection = document.getElementById('summary-section');
  const summaryContent = document.getElementById('summary-content');

  if (summarySection && summaryContent) {
    summaryContent.innerHTML = `<p>${resumen}</p>`;
    summarySection.classList.remove('hidden');
  }

  // Mostrar la sección del chatbot
  const chatbotSection = document.getElementById('chatbot-section');
  if (chatbotSection) {
    chatbotSection.classList.remove('hidden');
  }

  // Mostrar la sección de la nube de palabras
  const wordCloudSection = document.getElementById('wordcloud-section');
  if (wordCloudSection) {
    wordCloudSection.classList.remove('hidden');
  }
}

/**
 * Muestra la nube de palabras frecuentes
 * @param {Array} palabrasFrecuentes - Lista de palabras frecuentes con su frecuencia
 */
// main.js - Modificar la función showWordCloud
function showWordCloud(palabrasFrecuentes) {
  const wordCloudSection = document.getElementById('wordcloud-section');
  const wordCloudContainer = document.getElementById('wordcloud-container');
  
  if (wordCloudSection && wordCloudContainer) {
      // Asegurarse de que la sección esté visible
      wordCloudSection.classList.remove('hidden');
      
      // Calcular un tamaño apropiado para la nube
      const containerWidth = wordCloudContainer.clientWidth || 500;
      
      // Mostrar indicador de carga
      wordCloudContainer.innerHTML = '<div class="loading-cloud">Cargando nube de palabras...</div>';
      
      // Crear la nube de palabras después de un pequeño retraso para que se muestre la carga
      setTimeout(() => {
          createWordCloud('wordcloud-container', palabrasFrecuentes, {
              width: containerWidth,
              height: 300,
              rotate: true
          });
          
          // Añadir título con contador de palabras
          const countElement = document.querySelector('.word-count-badge');
          if (countElement) {
              countElement.textContent = `${palabrasFrecuentes.length} palabras`;
          } else {
              const titleDiv = document.querySelector('.section-title-with-count');
              if (titleDiv) {
                  const countBadge = document.createElement('span');
                  countBadge.className = 'word-count-badge';
                  countBadge.textContent = `${palabrasFrecuentes.length} palabras`;
                  titleDiv.appendChild(countBadge);
              }
          }
      }, 300);
  }
}
