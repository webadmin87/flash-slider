/**
 * jQuery плагин flashSlider.
 * При необходимости использовать карусель необходимо подключить jCarousel v0.3 и установить параметр useCarousel в true.
 * UI dialog должен быть инициализирован.
 *
 * @param Object params объект настроек, содержит следующие свойства:
 * dialog селектор виджета UI Dialog
 * width ширина flash контейнера
 * height: высота flash контейнера
 * version версия плеера
 * flashBlId идентификатор блока для вставки flash
 * setTitle устанавливать ли заголовок из атрибута title ссылки
 * fromText текст между текищим номером слайда и общим количеством
 * useCarousel использовать ли карусель
 * carouselWrapperClass дополнительный класс обертки карусели
 * Пример использования $('.panogallery a').flashSlider({dialog: "#pano-dialog"});
 */
(function($){

	/**
	 * Конструктор
	 * @param params объект параметров
	 * @constructor
	 */

	var FlashSlider = function(params) {

		// Очередь
		this.queue = [];

		// Ссылка по которой произошел клик
		this.elem = false;

		// Текущий индекс в очереди
		this.current = 0;

		// Параметры
		this.params = params;

		// jQuery объект ссылки назад
		this.prevControl = false;

		// jQuery объект ссылки вперед
		this.nextControl = false;

		// jQuery объект отображающий общее количестве объектов в очереди
		this.countersAll = 0;

		// jQuery объект отображающий номер текущего объекта
		this.countersCurrent = 0;

		// jQuery объект карусели
		this.carousel = false;

		// Произошла ли инициализация плагина
		this.isInit = false;

		// Карта классов
		this.classMap = {

			controlDisabled: 'pano-control-disabled',
			controlPrev: 'pano-control-prev',
			controlNext: 'pano-control-next',
			uiContent: 'ui-dialog-content',
			flashContent: 'pano-flash-content',
			uiTitle: 'ui-dialog-title',
			counters: 'pano-counters',
			countersCurrent: 'pano-counters-current',
			countersAll: 'pano-counters-all',
			carouselWrapper: 'jcarousel-wrapper',
			carousel: 'jcarousel',
			carouselPrev: 'jcarousel-control-prev',
			carouselNext: 'jcarousel-control-next',
			carouselActive: 'jcarousel-item-active'
		}

	}

	/**
	 * Инициализация слайдера. Перестройка DOM.
	 */

	FlashSlider.prototype.init = function(){

			var panoBl = $("<div id="+this.params.flashBlId+"></div>");

			var uiContent =$(this.params.dialog).dialog('widget').find('.'+this.classMap.uiContent);

			var flashContent = $('<div class="'+this.classMap.flashContent+'"></div>');

			uiContent.append(flashContent);

			flashContent.append(panoBl);

			this.prevControl = $('<div class="'+this.classMap.controlPrev+'"></div>');

			this.nextControl = $('<div class="'+this.classMap.controlNext+'"></div>');

			flashContent.append(this.prevControl).append(this.nextControl);

			var counters = $('<div class="'+this.classMap.counters+'"></div>');

			flashContent.append(counters);

			this.countersAll = $('<div class="'+this.classMap.countersAll+'"></div>');

			this.countersCurrent = $('<div class="'+this.classMap.countersCurrent+'"></div>');

			counters.append(this.countersCurrent).append("<span>"+this.params.fromText+"</span>").append(this.countersAll);

			// Создаем контейнер для карусели

			if(this.params.useCarousel) {

				var carouselWrapper = $("<div></div>");

				carouselWrapper.addClass(this.classMap.carouselWrapper);

				if(this.params.carouselWrapperClass)
					carouselWrapper.addClass(this.params.carouselWrapperClass);

				uiContent.append(carouselWrapper);

				this.carousel = $("<div></div>");

				this.carousel.addClass(this.classMap.carousel);

				carouselWrapper.append(this.carousel);

				this.carousel.append('<ul></ul>');

				carouselWrapper.append('<a href="#" class="'+this.classMap.carouselPrev+'"></a>').append('<a href="#" class="'+this.classMap.carouselNext+'"></a>');

			}

			this.isInit = true;

	}

	/**
	 * Заполнение карусели
	 * @returns {boolean}
	 */

	FlashSlider.prototype.fillCarousel = function() {

		if(!this.carousel)
			return false;

		var ul = this.carousel.find('ul');

		ul.empty();

		var self = this;

		for(var k in this.queue) {

			var a = this.queue[k];

			var img = $(a).find('img');

			if(img) {

				var src = img.attr("src");

				var a = $('<a href=""></a>').append('<img src="'+src+'" alt="" />');

				(function(index) {


					a.on('click', function(e){

						e.preventDefault();

						self.moveTo(parseInt(index));

					});

				})(k);

				var li = $('<li></li>').append(a);

				ul.append(li);

			}

		}

	}

	/**
	 * Инициализация карусели
	 */

	FlashSlider.prototype.initCarousel = function() {

		if(this.carousel.data('jcarousel')) {
			this.carousel.jcarousel('reload');
			return;
		}

		this.carousel.jcarousel();

		this.carousel.parent().find('.'+this.classMap.carouselPrev).jcarouselControl({
				target: '-=1'
			});

		this.carousel.parent().find('.'+this.classMap.carouselNext).jcarouselControl({
				target: '+=1'
			});

	}

	/**
	 * Начало показа
	 * @param elem объект ссылки по которой произошел клик
	 */

	FlashSlider.prototype.start = function(elem) {

		if(!this.isInit)
			this.init();

		var self = this;

		this.elem = elem;

		this.initQueue(elem);

		$(this.params.dialog).dialog('open');

		this.prevControl.off('click');

		this.nextControl.off('click');

		if(this.queue.length>1) {

			this.prevControl.on('click', function(){ self.prev() });

			this.nextControl.on('click',  function(){ self.next() });

		}

		if(this.params.useCarousel) {

			this.fillCarousel();

			this.initCarousel();

		}

		this.moveTo(this.current);

		this.checkControlsVisible();

		this.updateCounters();

	}

	/**
	 * Формирование очереди для листалки. Формируется по значению атрибута rel ссылки
	 * @param rel значение атрибута rel ссылки
	 */

	FlashSlider.prototype.initQueue = function(elem) {

		this.queue = [];
		this.current = 0;

		var rel = $(elem).attr("rel")

		if(!rel) {
			this.queue.push(elem);
			return;
		}

		var i = 0;

		var self = this;

		$("a[rel='"+rel+"']").each(function(k, v){

			self.queue.push(v);

			if(v == self.elem)
				self.current = i;

			i++;

		});

		return;

	}

	/**
	 * Обновляет счетчики
	 */

	FlashSlider.prototype.updateCounters = function() {

		this.countersAll.html(this.queue.length);

		this.countersCurrent.html(this.current+1);

	}

	/**
	 * Управление видимостью ссылок вперед/назад
	 */

	FlashSlider.prototype.checkControlsVisible = function() {

		var num = this.queue.length - 1;

		if(this.current == num)
			this.nextControl.addClass(this.classMap.controlDisabled);
		else
			this.nextControl.removeClass(this.classMap.controlDisabled);

		if(this.current == 0)
			this.prevControl.addClass(this.classMap.controlDisabled);
		else
			this.prevControl.removeClass(this.classMap.controlDisabled);

	}

	/**
	 * Переход к предыдущему слайду
	 */

	FlashSlider.prototype.prev = function () {

		var k = this.current - 1;

		this.moveTo(k);

	}

	/**
	 * Переход к следующему слайду
	 */

	FlashSlider.prototype.next = function () {

		var k = this.current + 1;

		this.moveTo(k);

	}

	/**
	 * Переход к слайду по индексу в очереди
	 * @param k индекс
	 */

	FlashSlider.prototype.moveTo = function(k) {

		if(this.queue[k]) {

			this.insertPano($(this.queue[k]));

			this.current = k;

			if(this.carousel) {


				this.carousel.find('li').removeClass(this.classMap.carouselActive);
				this.carousel.find('li:eq('+k+')').addClass(this.classMap.carouselActive);

				this.carousel.jcarousel('scroll', k);

			}


			this.checkControlsVisible();

			this.updateCounters();

		}

	}

	/**
	 * Инициализация Flash
	 * @param elem объект ссылки
	 */

	FlashSlider.prototype.insertPano = function insertPano(elem) {

		var href = $(elem).attr("href");

		var title = $(elem).attr("title");

		if(href) {

			var	attrs = {wmode:"opaque"};

			swfobject.embedSWF(href, this.params.flashBlId, this.params.width, this.params.height, this.params.version, null, null, attrs);

		}

		if(title && this.params.setTitle) {

			$(this.params.dialog).dialog('widget').find('.'+this.classMap.uiTitle).html(title);

		}

	}

	/**
	 * Плагин. Установка обработчиков событий
	 * @param params объект параметров
	 * @returns {*|each}
	 */

	$.fn.flashSlider = function(params) {

		var params = $.extend({

			width: 800,
			height: 600,
			version: '9.0.0',
			flashBlId: 'pano-bl',
			setTitle: true,
			fromText: 'из',
			useCarousel: true

		}, params);

		if(!params.dialog)
			throw new Error('Не задан селектор компонента диалога (params.dialog)');

		if(!arguments.callee.instance)
			arguments.callee.instance =  new FlashSlider(params);

		var slider = arguments.callee.instance;

		return this.each(function(){

			if(this.flashSlider)
				return;

			this.flashSlider = slider;

			$(this).on('click', function(e){

				e.preventDefault();

				slider.start(this);

			});

		});

	}

})(jQuery);