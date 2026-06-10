from django.urls import path
from . import views

app_name = 'cars'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('inventory/', views.inventory, name='inventory'),
    path('car/<int:pk>/', views.car_detail, name='car_detail'),
    path('analytics/', views.analytics, name='analytics'),
]
