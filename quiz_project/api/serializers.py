from rest_framework import serializers
from .models import Player, LeaderboardEntry

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'username', 'avatar']

class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='player.username', read_only=True)
    avatar = serializers.CharField(source='player.avatar', read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = ['id', 'username', 'avatar', 'category', 'difficulty', 'score', 'total_questions', 'percentage', 'created_at']