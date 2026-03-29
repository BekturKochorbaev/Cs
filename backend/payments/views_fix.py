from django.contrib.auth.models import AnonymousUser
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from payments.models import Deposit
from payments.serializers import DepositSerializer

class DepositDetailAPIView(generics.ListAPIView):
    queryset = Deposit.objects.all()
    serializer_class = DepositSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Deposit.objects.none()
        if isinstance(self.request.user, AnonymousUser):
            return Deposit.objects.none()
        return super().get_queryset().filter(user=self.request.user)

# Фикс для drf-yasg
DepositDetailAPIView = type('DepositDetailAPIView', (DepositDetailAPIView,), {
    'swagger_fake_view': True,
    'request': type('Request', (), {'user': AnonymousUser()})
})

