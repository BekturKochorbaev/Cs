import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Deposit(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "В ожидании"
        SUCCEEDED = "succeeded", "Успешно"
        CANCELED = "canceled", "Отменён"
        FAILED = "failed", "Ошибка"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("100.00"))],
        verbose_name="Сумма"
    )
    payment_id = models.CharField(max_length=128, null=True, blank=True, db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=32, null=True, blank=True)  # card/sbp/yoomoney/qiwi (для истории)
    raw = models.JSONField(default=dict, blank=True)  # сырой ответ ЮKassa (для отладки/аудита)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Deposit {self.id} {self.amount} RUB [{self.status}]"