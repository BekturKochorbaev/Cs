from django.contrib import admin
from .models import User, Item, ItemImage, Case, CaseItemChance, ItemInstance

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'username', 'steam_id', 'balance')
    search_fields = ('nickname', 'steam_id')

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'rarity')
    search_fields = ('name',)

@admin.register(ItemImage)
class ItemImageAdmin(admin.ModelAdmin):
    list_display = ('item',)

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'active')
    search_fields = ('name',)

@admin.register(CaseItemChance)
class CaseItemChanceAdmin(admin.ModelAdmin):
    list_display = ('case', 'item', 'chance')

@admin.register(ItemInstance)
class ItemInstanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'status', 'created_at')
    list_filter = ('status',)