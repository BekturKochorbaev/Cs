from rest_framework import serializers
from .models import User, Item, Case, CaseItemChance, ItemInstance, ItemImage


class SteamUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'steam_id']


class ItemImageSerializers(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = ['image']


class ItemSerializer(serializers.ModelSerializer):
    item_image = ItemImageSerializers(read_only=True, many=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'price', 'item_image']


class ItemSimpleSerializer(serializers.ModelSerializer):
    item_image = ItemImageSerializers(read_only=True, many=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'item_image']


class CaseItemChanceSerializer(serializers.ModelSerializer):
    item = ItemSerializer()

    class Meta:
        model = CaseItemChance
        fields = ['item']


class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ['id', 'name', 'image', 'price', 'active']


class CaseDetailSerializer(serializers.ModelSerializer):
    items = CaseItemChanceSerializer(required=True, many=True)

    class Meta:
        model = Case
        fields = ['id', 'name', 'image', 'price', 'active', 'items']


class ItemInstanceSerializer(serializers.ModelSerializer):
    item = ItemSimpleSerializer(read_only=True)


    class Meta:
        model = ItemInstance
        fields = ['id', 'item', 'status', 'created_at']



class ItemInstanceSaleSerializer(serializers.ModelSerializer):

    class Meta:
        model = ItemInstance
        fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    inventory = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'steam_id', 'nickname', 'avatar_url', 'balance', 'inventory']

    def get_inventory(self, obj):
        return ItemInstanceSerializer(
            ItemInstance.objects.filter(user=obj, sold=False), many=True
        ).data