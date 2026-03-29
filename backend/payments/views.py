import uuid
import json
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.db.models import F
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from yookassa import Configuration, Payment
from rest_framework.generics import RetrieveAPIView

from payments.models import Deposit
from payments.serializers import CreateDepositSerializer, DepositDetailSerializer


def configure_yookassa():
    # Один раз на запрос — настроим SDK:
    Configuration.account_id = settings.YOOKASSA_SHOP_ID
    Configuration.secret_key = settings.YOOKASSA_SECRET_KEY


class CreateDepositAPIView(APIView):
    """
    POST /api/payments/deposits/
    body: { "amount": 500, "payment_method": "card", "return_url": "https://..."? }
    resp: { "deposit_id": "...", "confirmation_url": "https://yookassa.ru/..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateDepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        amount: Decimal = data["amount"]
        payment_method: str = data["payment_method"]
        return_url = data.get("return_url") or settings.FRONTEND_RETURN_URL

        # 1) Создаём локальную запись депозита
        deposit = Deposit.objects.create(
            user=request.user,
            amount=amount,
            payment_method=payment_method,
            status=Deposit.Status.PENDING,
        )

        # 2) Создаём платёж в ЮKassa
        configure_yookassa()

        payload = {
            "amount": {"value": str(amount), "currency": "RUB"},
            "confirmation": {"type": "redirect", "return_url": f"{return_url}?deposit_id={deposit.id}"},
            "capture": True,
            "description": f"Пополнение баланса пользователя {request.user.id} (deposit {deposit.id})",
            "metadata": {
                "deposit_id": str(deposit.id),
                "user_id": request.user.id,
                "amount": str(amount),
            },
        }

        idem_key = str(uuid.uuid4())
        payment = Payment.create(payload, idempotency_key=idem_key)

        # 3) Сохраняем payment_id и сырой ответ
        deposit.payment_id = payment.id
        try:
            deposit.raw = payment.json()
        except Exception:
            pass
        deposit.save(update_fields=["payment_id", "raw", "updated_at"])

        confirmation_url = payment.confirmation.confirmation_url

        return Response(
            {"deposit_id": str(deposit.id), "confirmation_url": confirmation_url},
            status=status.HTTP_201_CREATED
        )

from django.contrib.auth import get_user_model
import logging
User = get_user_model()
logger = logging.getLogger(__name__)

class YooKassaWebhookAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        raw_body = request.body.decode("utf-8")
        logger.info(f"📩 Raw YooKassa webhook body: {raw_body}")

        data = json.loads(raw_body)
        event = data.get("event")
        obj = data.get("object", {})

        if event == "payment.succeeded":
            metadata = obj.get("metadata", {})
            deposit_id = metadata.get("deposit_id")
            user_id = metadata.get("user_id")

            try:
                with transaction.atomic():
                    deposit_uuid = uuid.UUID(deposit_id)
                    deposit = Deposit.objects.select_for_update().get(id=deposit_uuid)

                    if deposit.status != Deposit.Status.SUCCEEDED:
                        deposit.status = Deposit.Status.SUCCEEDED
                        deposit.raw = raw_body

                        # Назначаем пользователя, если ещё не назначен
                        if deposit.user is None and user_id:
                            try:
                                user = User.objects.get(id=user_id)
                                deposit.user = user
                            except User.DoesNotExist:
                                logger.warning(f"❌ User {user_id} не найден")

                        deposit.save(update_fields=["status", "raw", "updated_at", "user"])

                        # Пополняем баланс
                        if deposit.user:
                            deposit.user.balance += Decimal(obj["amount"]["value"])
                            deposit.user.save(update_fields=["balance"])
                            logger.info(f"✅ Deposit {deposit_id} succeeded, user {deposit.user.id} balance updated")

            except Deposit.DoesNotExist:
                logger.warning(f"❌ Deposit {deposit_id} не найден")

        return Response({"ok": True}, status=200)
class DepositDetailAPIView(RetrieveAPIView):
    """
    GET /api/payments/deposits/<uuid:pk>/
    """
    queryset = Deposit.objects.all()
    serializer_class = DepositDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # безопасность: показываем только свои депозиты
        return super().get_queryset().filter(user=self.request.user)