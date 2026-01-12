import os
import google.generativeai as genai
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib import auth
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.db import transaction 
from .models import *

# ==================================================
#  🔑 TU API KEY
# ==================================================
genai.configure(api_key="AIzaSyBlTfAfkBgnnJ92n_t9GZJVH71v7iTJUrg") 

def intera_histo(user, solicitud_enviado, respuesta_json):
    try:
        Historial.objects.create(
            usuario=user,
            mensaje_usuario=solicitud_enviado,
            respuesta_ia=respuesta_json,
        )
    except Exception as e:
        print(f"Error guardando historial: {e}")

@login_required(login_url='login')
def kairos_main(request):
    respuesta_ia = ""
    mensaje_usuario = ""
    
    # Listas para los dropdowns del HTML
    niveles = MetricasFisicas.NIVELES
    objetivos = MetricasFisicas.OBJETIVOS
    deportes = MetricasFisicas.DEPORTES
    historial_return = []

    # 1. Cargar datos del usuario (SEPARADO PARA SEGURIDAD)
    try:
        metricas = MetricasFisicas.objects.get(usuario=request.user)
    except:
        metricas = None
    
    try:
        config = Configuracion.objects.get(usuario=request.user)
    except:
        config = None

    # 2. Cargar historial
    try:
        # Traemos los últimos 25 mensajes para que tenga buena memoria
        historial = Historial.objects.filter(usuario=request.user).order_by('-id')[:25]
        for h in reversed(historial):
            # Quitamos los corchetes [] para texto limpio
            historial_return.append({"mensaje_usuario": h.mensaje_usuario})
            historial_return.append({"respuesta_ia": h.respuesta_ia})     
    except:
        historial_return = []
        print('Usuario nuevo o sin historial')

    if request.method == 'POST':

        # --- GUARDAR MÉTRICAS ---
        if 'Guardar_met' in request.POST:
            if request.POST['Guardar_met'] == 'respuesta_send_met':
                try: 
                    if metricas:
                        nuevo_peso = request.POST.get('Peso_actualizado')
                        nuevo_altura = request.POST.get('Altura_actualizada')
                        nueva_edad = request.POST.get('Edad_actualizada')
                        nuevo_deporte = request.POST.get('Deporte_actualizado')
                        nuevo_nivel = request.POST.get('Nivel_actualizado')
                        nuevo_objetivo = request.POST.get('Objetivo_actualizado')

                        if nuevo_peso: metricas.peso = float(nuevo_peso)
                        if nuevo_altura: metricas.altura = float(nuevo_altura)
                        if nueva_edad: metricas.edad = int(nueva_edad)
                        if nuevo_deporte: metricas.deporte = nuevo_deporte
                        if nuevo_nivel: metricas.nivel = nuevo_nivel
                        if nuevo_objetivo: metricas.objetivo = nuevo_objetivo
                        
                        metricas.save()
                        messages.success(request, 'Métricas actualizadas')
                    else:
                        messages.error(request, 'No se encontró el perfil de métricas.')
                except Exception as e:
                    messages.error(request, f'Error al guardar métricas: {e}')

        # --- GUARDAR CONFIGURACIÓN ---
        elif 'Guardar_config' in request.POST:
            if request.POST['Guardar_config'] == 'respuesta_send_config':
                try:
                    nivel_stepper = request.POST.get('nivel_psico') 
                    modo_compe = request.POST.get('modo_competencia')   

                    if nivel_stepper:
                        val_stepper = int(nivel_stepper)
                        # Traducción de niveles (1-10 a 1-3)
                        if 1 <= val_stepper <= 4: nuevo_modo = 1
                        elif 5 <= val_stepper <= 7: nuevo_modo = 2
                        else: nuevo_modo = 3

                        if config:
                            config.nivel_psico = val_stepper
                            config.modo_psicologico = nuevo_modo 
                            config.modo_competencia = True if modo_compe else False
                            config.save()
                            messages.success(request, 'Configuración actualizada')
                        
                except Exception as e:
                    print(f"Error actualizando config: {e}")

        # --- ENVIAR MENSAJE A LA IA ---
        elif 'Enviar' in request.POST:
            if request.POST['Enviar'] == 'respuesta_send':            

                mensaje_usuario = request.POST.get('mensaje')

                if mensaje_usuario:
                    # --- FILTRO ANTI-DUPLICADOS ---
                    # Revisamos si el último mensaje guardado es IDÉNTICO al nuevo
                    ultimo_msg = Historial.objects.filter(usuario=request.user).last()
                    
                    if ultimo_msg and ultimo_msg.mensaje_usuario == mensaje_usuario:
                        # Si es igual, asumimos que es un "Refresh" de página.
                        # No llamamos a la API, solo mostramos la respuesta anterior.
                        respuesta_ia = ultimo_msg.respuesta_ia
                        print("Mensaje duplicado detectado. Evitando llamada a API.")
                    
                    else:
                        # Si es un mensaje nuevo real, procedemos normalmente
                        try:
                            # A. Contexto Base
                            try:
                                ruta_txt = os.path.join(settings.BASE_DIR, 'contexto.txt')
                                with open(ruta_txt, 'r', encoding='utf-8') as f:
                                    contexto_base = f.read()
                            except:
                                contexto_base = "Eres KAIROS, entrenador deportivo."
                            
                            # B. Perfil Usuario
                            try:
                                if metricas and config:
                                    modo_txt = "ACTIVADO (Sé estricto)" if config.modo_competencia else "DESACTIVADO (Sé amable)"
                                    
                                    if config.modo_psicologico == 1: nivel_desc = "Nivel 1 (Técnico)"
                                    elif config.modo_psicologico == 2: nivel_desc = "Nivel 2 (Desafiante)"
                                    else: nivel_desc = "Nivel 3 (Empático)"

                                    contexto_usuario = f"""
                                    DATOS DEL ATLETA:
                                    - Nombre: {request.user.username}
                                    - Deporte: {metricas.deporte}
                                    - Nivel: {metricas.nivel} 
                                    - Objetivo: {metricas.objetivo}
                                    - Peso/Altura: {metricas.peso}kg / {metricas.altura}m
                                    - MODO COMPETENCIA: {modo_txt}
                                    - MODO PSICOLÓGICO: {nivel_desc}
                                    """
                                else:
                                    contexto_usuario = "Usuario sin perfil configurado."
                            except Exception as ex_perfil:
                                print(f"Error perfil: {ex_perfil}")
                                contexto_usuario = "Usuario sin perfil completo."

                            # C. Historial para Memoria
                            historial_para_gemini = []
                            try:
                                historial_db = Historial.objects.filter(usuario=request.user).order_by('-id')[:10]
                                for h in reversed(historial_db):
                                    historial_para_gemini.append({"role": "user", "parts": [h.mensaje_usuario]})
                                    historial_para_gemini.append({"role": "model", "parts": [h.respuesta_ia]})
                            except:
                                pass 

                            # D. Configurar Modelo
                            safety_settings = [
                                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                            ]

                            model = genai.GenerativeModel(
                                model_name='gemini-1.5-flash', # CORREGIDO: Modelo correcto
                                system_instruction=f"{contexto_base}\n\n{contexto_usuario}"
                            )

                            # E. Iniciar Chat
                            chat = model.start_chat(history=historial_para_gemini)
                            
                            response = chat.send_message(
                                mensaje_usuario,
                                safety_settings=safety_settings
                            )

                            try:
                                respuesta_ia = response.text
                            except Exception:
                                respuesta_ia = "Lo siento, mi sistema de seguridad se activó por error. Intenta reformular."
                            
                            intera_histo(request.user, mensaje_usuario, respuesta_ia)

                        except Exception as e:
                            respuesta_ia = f"Error técnico: {e}"
                            print(f"Error detallado: {e}")

    return render(request, 'kairos.html', {
        'metricas': metricas, 
        'config': config, 
        'niveles': niveles, 
        'objetivos': objetivos, 
        'deportes': deportes,
        'historial': historial_return,
        'respuesta': respuesta_ia, 
        'solicitud': mensaje_usuario
    })

# --- VISTAS DE ACCESO ---

def kairos_login(request):
    if request.method == 'POST':
        user_input = request.POST['user']
        password = request.POST['password']
        username_login = user_input
        
        if '@' in user_input:
            try:
                user_obj = User.objects.get(email=user_input)
                username_login = user_obj.username
            except User.DoesNotExist:
                username_login = None 
        
        user = None
        if username_login:
            user = auth.authenticate(username=username_login, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect('main') 
        else:
            messages.info(request, 'Usuario, Correo o Contraseña inválida')
            return redirect('login')
    else:
        return render(request, 'kairos_login.html')

def kairos_register(request):
    if request.method == 'POST':
        username = request.POST['user']
        email = request.POST['email']
        password = request.POST['password']
        peso = float(request.POST.get('peso', 0) or 0)
        altura = float(request.POST.get('altura', 0) or 0)
        edad = int(request.POST.get('edad', 0) or 0)

        nivel_texto = request.POST.get('nivel')
        objetivo_texto = request.POST.get('objetivo')
        deporte_texto = request.POST.get('deporte')

        if User.objects.filter(email=email).exists():
            messages.info(request, 'El correo ya está en uso')
            return redirect('register')
        else:
            try:
                with transaction.atomic():
                    user = User.objects.create_user(username=username, email=email, password=password)
                    user.save()
                    MetricasFisicas.objects.create(
                        usuario=user, 
                        peso=peso, 
                        altura=altura, 
                        edad=edad,
                        nivel=nivel_texto,       
                        objetivo=objetivo_texto, 
                        deporte=deporte_texto    
                    )

                    Configuracion.objects.create(
                        usuario=user,
                        nivel_psico=4,
                        modo_psicologico=1, 
                        modo_competencia=False
                    )
                
                messages.success(request, 'Registro exitoso')
                return redirect('login')
                
            except Exception as e:
                print(f"Error en registro: {e}")
                messages.error(request, 'Error al crear el perfil.')
                return redirect('register')

    else:
        niveles = MetricasFisicas.NIVELES
        objetivos = MetricasFisicas.OBJETIVOS
        deportes = MetricasFisicas.DEPORTES
        
        return render(request, 'kairos_register.html', {
            'niveles': niveles, 
            'objetivos': objetivos, 
            'deportes': deportes
        })

def kairos_logout(request):
    auth.logout(request)
    return redirect('main')