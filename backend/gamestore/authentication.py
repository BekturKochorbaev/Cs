from rest_framework.authentication import BaseAuthentication
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model

User = get_user_model()

class SessionIdHeaderAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None  # Нет header → пробуем другие authentication-классы

        if not auth_header.startswith('Session '):
            return None  # Не наша схема → пробуем другие

        session_key = auth_header[len('Session '):].strip()

        try:
            session = Session.objects.get(session_key=session_key)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            if not user_id:
                return None
            try:
                user = User.objects.get(id=user_id)
                return (user, None)
            except User.DoesNotExist:
                return None
        except Session.DoesNotExist:
            return None

        return None