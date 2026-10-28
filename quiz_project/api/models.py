from django.db import models
class Player(models.Model):
    username = models.CharField(max_length=50, unique=True)
    avatar = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

class LeaderboardEntry(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='scores')
    category = models.CharField(max_length=50)
    difficulty = models.CharField(max_length=20)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    percentage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-percentage', '-created_at']
