import google.generativeai as genai
import os

# 1. PEGA TU CLAVE AQUÍ (La que sí sirve jajaja)
genai.configure(api_key="AIzaSyBmAPbLg1-P47D-6RNume9Qolz2Z4sfwQM") 

# 2. Función para cargar tu documento
def cargar_contexto():
    nombre_archivo = "contexto.txt"
    if not os.path.exists(nombre_archivo):
        print(f"⚠️ OJO: No encontré el archivo '{nombre_archivo}'.")
        print("Crea un archivo de texto con ese nombre y pega ahí la info de tu Google Doc.")
        return ""
    
    with open(nombre_archivo, "r", encoding="utf-8") as f:
        return f.read()

def chat_kairos():
    print("--- Iniciando KAIROS  ---")
    
    # Cargamos la info de las 4 páginas
    info_escuela = cargar_contexto()
    
    if not info_escuela:
        return # Si no hay archivo, nos salimos

    try:
        # 3. Configuramos el modelo ELEGIDO de tu lista
        # Usamos la versión 2.5 Flash que es rápida y potente
        model = genai.GenerativeModel(
            model_name='models/gemini-2.5-flash',
            system_instruction=f"Eres el asistente virtual del proyecto Kairos. Tu conocimiento se basa estrictamente en este texto: {info_escuela}. Si te preguntan algo que no está en el texto, di que no tienes esa información."
        )

        # 4. Loop de chat (para que puedas hacer varias preguntas)
        chat = model.start_chat(history=[])
        
        print("\nKairos funciona. Escribe 'salir' para terminar.\n")
        
        while True:
            pregunta = input("Tú: ")
            if pregunta.lower() in ['salir', 'exit']:
                break
            
            response = chat.send_message(pregunta)
            print(f"Kairos: {response.text}")
            print("-" * 20)

    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    chat_kairos()