from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Player, LeaderboardEntry
from .serializers import PlayerSerializer, LeaderboardEntrySerializer

class RegisterPlayerView(APIView):
    def post(self, request):
        username = request.data.get('username')
        avatar = request.data.get('avatar', '')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        player, created = Player.objects.get_or_create(username=username, defaults={'avatar': avatar})
        if not created and avatar:
            player.avatar = avatar
            player.save()
        
        return Response(PlayerSerializer(player).data, status=status.HTTP_200_OK)

class LeaderboardView(APIView):
    def get(self, request):
        entries = LeaderboardEntry.objects.all()[:20]
        serializer = LeaderboardEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            player = Player.objects.get(username=username)
        except Player.DoesNotExist:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LeaderboardEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(player=player)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)