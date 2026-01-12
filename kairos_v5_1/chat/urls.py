from django.urls import path
from chat import views

urlpatterns = [
    # Ruta principal (vacía)
    path('', views.kairos_main, name='main'), 
    
    # --- AGREGA LA / AL FINAL AQUÍ ---
    path('login/', views.kairos_login, name='login'),       # <--- Antes era 'login'
    path('register/', views.kairos_register, name='register'), # <--- Antes era 'register'
    path('logout/', views.kairos_logout, name='logout'),    # <--- Antes era 'logout'
]