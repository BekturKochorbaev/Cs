from django.contrib import admin
from django.urls import path
from gamestore.views import (
    SteamLoginView, SteamCallbackView, CurrentUserView,
    CaseListView, CaseDetailView, CaseOpenView, SellItemView
)


urlpatterns = [
    path('steam/login/', SteamLoginView.as_view(), name='steam_login'),
    path('steam/callback/', SteamCallbackView.as_view(), name='steam_callback'),

    path('user/', CurrentUserView.as_view(), name='current_user'),
    path('cases/', CaseListView.as_view(), name='case_list'),
    path('cases/<int:pk>/', CaseDetailView.as_view(), name='case_detail'),
    path('cases/<int:case_id>/open/', CaseOpenView.as_view(), name='case_open'),
    path('items/<int:id>/sell/', SellItemView.as_view(), name='sell_item'),
]

