from django.urls import path
from payments.views import CreateDepositAPIView, YooKassaWebhookAPIView, DepositDetailAPIView

urlpatterns = [
    path("deposits/", CreateDepositAPIView.as_view(), name="create-deposit"),
    path("deposits/<uuid:pk>/", DepositDetailAPIView.as_view(), name="deposit-detail"),
    path("yookassa/webhook/", YooKassaWebhookAPIView.as_view(), name="yookassa-webhook"),
]
