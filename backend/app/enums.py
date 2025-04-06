# -*- coding: utf-8 -*-
import enum

class PropertyTypeEnum(str, enum.Enum):
    apartment = "квартира"
    house = "дом"
    new_building = "новостройка"
    plot = "участок"

# Добавляем недостающий Enum
class DealTypeEnum(str, enum.Enum):  
    SALE = "sale"
    RENT = "rent"