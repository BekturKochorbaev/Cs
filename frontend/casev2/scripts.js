function load(authHeaders) {
	// Асинхронная функция для получения выигранного предмета
	async function fetchWinningItem() {
		const caseId = getCaseId();
		if (!caseId) throw new Error('ID кейса не найден');

		const endpoint = `https://jackhanmacsgolkgame.pythonanywhere.com/en/cases/${caseId}/open/`;

		const response = await fetch(endpoint, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...authHeaders
			}
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.detail || data.error || 'Не удалось открыть кейс');
		}

		return data.item;
	}

	// Функция для заполнения ленты случайными изображениями
	function populateBoxes() {
		if (!window.imageDict || Object.keys(window.imageDict).length === 0) {
			console.warn('window.imageDict не инициализирован');
			return;
		}

		var boxes = $('#boxes');
		boxes.empty();
		var randomImages = getRandomImages(7);
		for (var i = 0; i < randomImages.length; i++) {
			boxes.append(
				`<li class='tape'><img src='${randomImages[i].image}' alt='${randomImages[i].id}' class='tape-img'></li>`
			);
		}
	}

	// Функция для получения случайных изображений из window.imageDict
	function getRandomImages(count) {
		if (!window.imageDict) {
			console.warn('window.imageDict не определён');
			return [];
		}
		var keys = Object.keys(window.imageDict); // Получаем ключи объекта
		var randomImages = [];
		while (randomImages.length < count && keys.length > 0) {
			var randomIndex = Math.floor(Math.random() * keys.length);
			var randomKey = keys.splice(randomIndex, 1)[0];
			randomImages.push({
				id: window.imageDict[randomKey].id,
				image: window.imageDict[randomKey].image
			});
		}
		return randomImages;
	}

	// Основная функция анимации
	async function start() {
		var boxed = 3;
		var righ = 0;
		var speed = Math.floor(Math.random() * -4) + 25;
		var delbox = 164;

		$('button').css('opacity', '0.5');
		$('.mainbutt').prop('disabled', true);

		try {
			const winningItem = await fetchWinningItem();

			// Проверяем, есть ли images в winningItem
			if (!winningItem.images || !winningItem.images[0]) {
				throw new Error('Изображение для выигранного предмета не найдено');
			}

			function animated() {
				var child3 = $('.tape:nth-child(3) img');
				var firS = $('.tape:first-child');
				var cons = righ - delbox;

				if (righ >= delbox) {
					firS.remove();
					// Используем images[0] из winningItem
					$('#boxes').append(
						`<li class='tape'><img src='${winningItem.images[0]}' alt='${winningItem.id}' class='tape-img'></li>`
					);
					righ = cons + speed;
					$('.tape').css('right', righ + 'px');
					boxed++;
				} else {
					if (speed > 12) {
						speed -= 0.1;
					} else if (speed > 7) {
						speed -= 0.02;
					} else {
						speed -= 0.01;
					}
					righ += speed;
					$('.tape').css('right', righ + 'px');
				}

				if (speed <= 0) {
					$('.tape').animate({ right: '95px' }, 2400);
					setTimeout(
						() =>
							swi({
								...winningItem,
								image: winningItem.images[0]
							}),
						2500
					);
				} else {
					requestAnimationFrame(animated);
				}
			}

			requestAnimationFrame(animated);
		} catch (error) {
			console.error('Ошибка при открытии кейса:', error);
			alert('Произошла ошибка при открытии кейса: ' + error.message);
			$('button').css('opacity', '1');
			$('.mainbutt').prop('disabled', false);
		}
	}

	// Функция для отображения модального окна с выигранным предметом
	function swi(winData) {
		$('#loadingSpinner').hide();
		$('#loadingText').hide();

		if (winData) {
			$('#winImage').attr('src', winData.image);
			$('#winText').html(
				`<strong>${winData.name}</strong><br>Цена: ${winData.price}₽`
			);

			$('#overlay').fadeIn();
			$('#winModal').fadeIn();
		}
		$('#closeWinBtn').on('click', function () {
			$('#overlay').fadeOut();
			$('#winModal').fadeOut();
		});
		$('#restartButton').prop('disabled', false).css('opacity', '1').show();
	}

	// Функция для запуска игры
	function startGame() {
		$('#startImage').hide();
		$('#main').show();

		$('#startButton').hide();
		$('#restartButton').hide();
		$('#loadingSpinner').show();
		$('#loadingText').show();

		start();
	}

	// Инициализация при загрузке
	$(function () {
		$('span').click(function () {
			$('.opn').toggle(300);
		});
		$('.close,.winbutt').click(function () {
			$('.blscreen').toggle(400);
		});
		populateBoxes();
	});

	// Привязка событий к кнопкам
	$('#startButton').click(startGame);
	$('#restartButton').click(startGame);
}
