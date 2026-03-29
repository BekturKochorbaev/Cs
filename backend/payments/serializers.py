from decimal import Decimal
from rest_framework import serializers
from payments.models import Deposit


class CreateDepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=["card", "sbp", "yoomoney", "qiwi"])
    # опционально — фронт может передать return_url (иначе возьмём из настроек):
    return_url = serializers.URLField(required=False)

    def validate_amount(self, v: Decimal) -> Decimal:
        if v < Decimal("100.00"):
            raise serializers.ValidationError("Минимальная сумма пополнения — 100 ₽.")
        # на всякий — округление до копеек
        return v.quantize(Decimal("0.01"))


class DepositDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ["id", "amount", "status", "payment_id", "created_at", "updated_at"]