from django.urls import path
from .views import RegisterPlayerView, LeaderboardView

urlpatterns = [
    path('register/', RegisterPlayerView.as_view(), name='register_player'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]