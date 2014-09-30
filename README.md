jQuery плагин flashSlider.
--------------------------

Отображает в UI dialog слайдер флеш объектов.

Пример использования:

```
$('.panogallery a').flashSlider({dialog: "#pano-dialog"});
```

Для объединения роликов используется атрибут **rel** ссылок.

Возможные свойства объекта параметров:

* dialog string селектор виджета UI Dialog (обязательный параметр)
* width int ширина flash контейнера
* height int высота flash контейнера
* version string версия плеера
* flashBlId string идентификатор блока для вставки flash
* setTitle bool устанавливать ли заголовок из атрибута title ссылки
* fromText string текст между текищим номером слайда и общим количеством
* useCarousel bool использовать ли карусель