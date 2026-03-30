import random
from django.db import transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Case, ItemInstance, CaseItemChance
from .serializers import CaseSerializer, ItemInstanceSerializer, UserSerializer, CaseDetailSerializer, \
ItemInstanceSaleSerializer
from django.shortcuts import redirect
from urllib.parse import urlencode, urlparse
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth import login
from django.http import HttpResponseBadRequest, HttpResponseRedirect
from django.views import View
import requests
from .auth import CsrfExemptSessionAuthentication
import os
from dotenv import load_dotenv
load_dotenv()

User = get_user_model()
STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_KEY = os.getenv("STEAM_API_KEY")

class SteamLoginView(View):
    def get(self, request):
        # Определяем базовый URL бэкенда и фронтенда
        # Лучше вынести это в .env, но для теста можно прописать так:
        base_url = "https://api.gldrop.fan" 
        realm_url = "https://gldrop.fun" # Ваш основной домен

        params = {
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            # Возврат должен идти строго на бэкенд, который обработает данные
            "openid.return_to": f"{base_url}/api/steam/callback/", 
            # Realm должен указывать на главный сайт, которому пользователь доверяет
            "openid.realm": f"{realm_url}/",
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        }
        return redirect(f"{STEAM_OPENID_URL}?{urlencode(params)}")

class SteamCallbackView(View):
    def get(self, request):
        claimed_id = request.GET.get("openid.claimed_id")
        if not claimed_id or "steamcommunity.com/openid/id/" not in claimed_id:
            return HttpResponseBadRequest("Invalid Steam response")
        steam_id = claimed_id.split("/")[-1]
        steam_api_url = f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={STEAM_API_KEY}&steamids={steam_id}"
        response = requests.get(steam_api_url)
        data = response.json()
        player_data = data.get("response", {}).get("players", [{}])[0]
        nickname = player_data.get("personaname", "")
        avatar_url = player_data.get("avatarfull", "")
        user, created = User.objects.get_or_create(username=f"steam_{steam_id}")
        if created:
            user.steam_id = steam_id
            user.nickname = nickname
            user.avatar_url = avatar_url
            user.save()
        login(request, user)
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        redirect_url = f"https://gldrop.fun/?session={session_key}"
        return redirect(redirect_url)

class CurrentUserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

class CaseListView(generics.ListAPIView):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer

class CaseDetailView(generics.RetrieveAPIView):
    queryset = Case.objects.all()
    serializer_class = CaseDetailSerializer

class CaseOpenView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id, active=True)
        except Case.DoesNotExist:
            return Response({"error": "Кейс не найден или неактивен"}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if user.balance < case.price:
            return Response({"error": "Недостаточно средств на балансе"}, status=status.HTTP_400_BAD_REQUEST)
        case_items = CaseItemChance.objects.filter(case=case)
        if not case_items.exists():
            return Response({"error": "У этого кейса нет доступных предметов"}, status=status.HTTP_400_BAD_REQUEST)
        user.balance -= case.price
        user.save()
        items = list(case_items)
        weights = [entry.chance for entry in items]
        selected_entry = random.choices(items, weights=weights, k=1)[0]
        selected_item = selected_entry.item
        ItemInstance.objects.create(user=user, item=selected_item)
        images = selected_item.item_image.all()
        image_urls = [request.build_absolute_uri(img.image.url) for img in images]
        return Response({
            "message": "Поздравляем! Вы получили предмет.",
            "item": {
                "id": selected_item.id,
                "name": selected_item.name,
                "price": str(selected_item.price),
                "images": image_urls
            },
            "new_balance": str(user.balance)
        })

class SellItemView(generics.UpdateAPIView):
    queryset = ItemInstance.objects.all()
    serializer_class = ItemInstanceSaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, for_sale=False, sold=False)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        price = instance.item.price
        user = request.user
        user.balance += price
        user.save()
        instance.status = 'продан'
        instance.save()
        return Response({
            "message": f"Предмет продан и {price} добавлено на баланс.",
            "balance": str(user.balance)
        }, status=status.HTTP_200_OK)