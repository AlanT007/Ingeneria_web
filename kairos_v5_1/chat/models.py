from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class MetricasFisicas(models.Model):
    NIVELES = [
        ('Bajo', 'Bajo'),
        ('Medio', 'Medio'),
        ('Alto', 'Alto'),
    ]
    
    OBJETIVOS = [
        ('Aumentar Músculo', 'Aumentar Músculo'),
        ('Definición', 'Definición'),
        ('Mejorar Resistencia', 'Mejorar Resistencia'),
        ('Aumentar Fuerza', 'Aumentar Fuerza'),
        ('Bienestar', 'Bienestar'),
    ]
    
    DEPORTES = [
        ('Calistenia', 'Calistenia'),
        ('Fuerza/Gimnasio', 'Fuerza/Gimnasio'),
        ('Resistencia/Cardio', 'Resistencia/Cardio'),
        ('Fitness funcional', 'Fitness funcional'),
        ('Combate/Artes Marciales', 'Combate/Artes Marciales'),
        ('Movilidad/Mente', 'Movilidad/Mente'),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    peso = models.DecimalField(max_digits=5, decimal_places=2, help_text="Peso en Kg")
    altura = models.DecimalField(max_digits=5, decimal_places=2, help_text="Altura en Metros")
    edad = models.IntegerField()
    nivel = models.CharField(max_length=30, choices=NIVELES, default='Bajo', verbose_name="Nivel de Experiencia")
    objetivo = models.CharField(max_length=30, choices=OBJETIVOS, default='Bienestar', verbose_name="Objetivo Principal")
    deporte = models.CharField(max_length=30, choices=DEPORTES, default='Fitness funcional', verbose_name="Deporte Principal")

    def __str__(self):
        return f"Métricas de {self.usuario.username}"

class Configuracion(models.Model):
    ARQUETIPOS = [
        (1, 'Empático'),
        (2, 'Técnico'),
        (3, 'Élite'),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    nivel_psico = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(9)], verbose_name="Nivel Psico")
    modo_psicologico = models.IntegerField(choices=ARQUETIPOS, default=1 , verbose_name="Modo Psicológico")
    modo_competencia = models.BooleanField(default=False, verbose_name="Modo Competencia")

    def __str__(self):
        return f"Configuración de {self.usuario.username}"

class Historial(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    mensaje_usuario = models.TextField(verbose_name="Pregunta del Usuario")
    respuesta_ia = models.TextField(verbose_name="Respuesta de KAIROS")

    def __str__(self):
        return f"Chat de {self.usuario.username} - {self.fecha.strftime('%d/%m/%Y')}"