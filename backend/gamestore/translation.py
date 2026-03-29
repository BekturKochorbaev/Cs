from .models import *
from modeltranslation.translator import TranslationOptions,register


@register(Case)
class CaseTranslationOptions(TranslationOptions):
    fields = ('name',)


@register(Item)
class CaseTranslationOptions(TranslationOptions):
    fields = ('name',)