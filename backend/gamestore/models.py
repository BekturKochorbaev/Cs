from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    steam_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    nickname = models.CharField(max_length=100, blank=True)
    avatar_url = models.URLField(blank=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    def __str__(self):
        return self.nickname or self.username

class Item(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rarity = models.CharField(max_length=50, blank=True)
    def __str__(self):
        return self.name

class ItemImage(models.Model):
    item = models.ForeignKey(Item, related_name='item_image', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='items/')
    def __str__(self):
        return f'Image for {self.item.name}'

class Case(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='cases/', blank=True, null=True)
    active = models.BooleanField(default=True)
    def __str__(self):
        return self.name

class CaseItemChance(models.Model):
    case = models.ForeignKey(Case, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    chance = models.FloatField(help_text='Вес для random.choices (например, 1.0 = 1%)')
    class Meta:
        unique_together = ('case', 'item')
    def __str__(self):
        return f'{self.item.name} in {self.case.name} ({self.chance})'

class ItemInstance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory', verbose_name='Пользователь')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name='Предмет')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата получения')
    for_sale = models.BooleanField(default=False)
    sold = models.BooleanField(default=False)
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=52, choices=[(1, 'в продаже')], null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f'{self.item.name}'
    class Meta:
        verbose_name = 'Полученный предмет'
        verbose_name_plural = 'Полученные предметы'