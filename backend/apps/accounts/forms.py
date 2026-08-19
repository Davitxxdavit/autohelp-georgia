from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from apps.accounts.models import User


class UserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("phone", "role", "email")


class UserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"
