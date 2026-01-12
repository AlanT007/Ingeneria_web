from django.contrib import admin
from .models import MetricasFisicas, Configuracion, Historial

admin.site.register(MetricasFisicas)
admin.site.register(Configuracion)
admin.site.register(Historial)