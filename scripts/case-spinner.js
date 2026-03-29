/**
 * CaseSpinner - Современная версия спиннера для кейсов с гибкой конфигурацией
 * @version 2.5.4
 */
class CaseSpinner {
	static DEFAULT_CONFIG = {
		animation: {
			minDuration: 9000,
			maxDuration: 12000,
			initialVelocity: 600,
			friction: 0.992,
			minVelocity: 2,
			easing: 'power4.out',
			centerAnimationDuration: 500
		},
		layout: {
			itemWidth: 170,
			repeats: 5,
			targetRepeatIndex: 3,
			centerOffset: 0
		},
		ui: {
			spinnerId: 'caseSpinner',
			itemsContainerId: 'spinnerItems',
			spinButtonId: 'spinButton',
			resultContainerId: 'resultContainer',
			resultItemId: 'resultItem',
			winModalId: 'winModal',
			winItemImageId: 'winItemImage',
			winItemNameId: 'winItemName',
			closeModalButtonId: 'closeModalButton'
		},
		api: {
			openCaseEndpoint:
				'https://jackhanmacsgolkgame.pythonanywhere.com/en/cases/{caseId}/open/',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		}
	};

	constructor(caseData, items, headers = {}, customConfig = {}) {
		this.config = { ...CaseSpinner.DEFAULT_CONFIG, ...customConfig };
		this.case = caseData;
		this.items = items.map(item => ({
			id: item.id,
			name: item.name,
			image: this.normalizeImageUrl(
				item.images && item.images.length > 0 ? item.images : item.image
			),
			price: item.price,
			rarityClass: this.getRarityClass(item.price)
		}));
		this.headers = headers;

		this.adjustLayoutBasedOnItems();

		this.isSpinning = false;
		this.animationId = null;
		this.currentPosition = 0;
		this.velocity = 0;
		this.targetPosition = 0;
		this.winningIndex = 0;
		this.startTime = 0;
		this.duration = 0;
		this.winningItem = null;

		this.initDOMElements();
	}

	normalizeImageUrl(image) {
		if (!image) {
			console.warn('Изображение отсутствует, используется default-weapon.png');
			return 'default-weapon.png';
		}
		if (typeof image === 'string') return image;
		if (Array.isArray(image) && image.length > 0) {
			if (typeof image[0] === 'string') return image[0];
			if (image[0] && image[0].image) return image[0].image;
		}
		if (image && typeof image === 'object' && image.image) return image.image;
		console.warn('Невалидный формат изображения, используется default-weapon.png');
		return 'default-weapon.png';
	}

	getRarityClass(price) {
		const priceValue = parseFloat(price);
		if (priceValue >= 5000) return 'legendary';
		if (priceValue >= 1000) return 'epic';
		if (priceValue >= 500) return 'rare';
		return 'common';
	}

	initDOMElements() {
		const uiConfig = this.config.ui;
		this.spinnerEl = document.getElementById(uiConfig.spinnerId);
		this.itemsEl = document.getElementById(uiConfig.itemsContainerId);
		this.spinButton = document.getElementById(uiConfig.spinButtonId);
		this.resultContainer = document.getElementById(uiConfig.resultContainerId);
		this.resultItem = document.getElementById(uiConfig.resultItemId);
		this.winModal = document.getElementById(uiConfig.winModalId);
		this.winItemImage = document.getElementById(uiConfig.winItemImageId);
		this.winItemName = document.getElementById(uiConfig.winItemNameId);
		this.closeModalButton = document.getElementById(
			uiConfig.closeModalButtonId
		);

		if (!this.spinnerEl || !this.itemsEl) {
			console.error('Не найдены элементы спиннера:', { spinnerEl: this.spinnerEl, itemsEl: this.itemsEl });
		}
	}

	init() {
		this.attachEventListeners();
		this.resetPosition();
	}

	generateItems(winningItem) {
		if (!this.itemsEl) {
			console.error('itemsEl не определен, не могу сгенерировать элементы');
			return;
		}
		this.itemsEl.innerHTML = '';
		const fragment = document.createDocumentFragment();
		const repeats = this.config.layout.repeats;
		const targetIndex = this.config.layout.targetRepeatIndex * this.items.length;

		const spinnerItems = [];
		for (let repeat = 0; repeat < repeats; repeat++) {
			const shuffledItems = [...this.items].sort(() => Math.random() - 0.5);
			spinnerItems.push(...shuffledItems);
		}

		if (winningItem) {
			const imageUrl = this.normalizeImageUrl(winningItem.item_image || winningItem.image || winningItem.images);
			spinnerItems[targetIndex] = {
				id: winningItem.id,
				name: winningItem.name,
				image: imageUrl,
				price: winningItem.price,
				rarityClass: this.getRarityClass(winningItem.price)
			};
			console.log('Winning item:', { id: winningItem.id, name: winningItem.name, image: imageUrl });
		}

		spinnerItems.forEach((item, index) => {
			const itemEl = this.createItemElement(item, Math.floor(index / this.items.length), index % this.items.length);
			fragment.appendChild(itemEl);
		});

		this.itemsEl.appendChild(fragment);
	}

	createItemElement(item, repeatIndex, itemIndex) {
		const itemEl = document.createElement('div');
		itemEl.className = `spinner-item ${item.rarityClass}`;
		itemEl.setAttribute('data-item-id', item.id);
		itemEl.setAttribute('data-repeat', repeatIndex);
		itemEl.setAttribute('data-index', itemIndex);

		const imageContainer = document.createElement('div');
		imageContainer.className = 'item-image-container';

		const img = document.createElement('img');
		img.classList.add('item-image');
		img.src = item.image || 'default-weapon.png';
		img.alt = item.name;
		img.loading = 'lazy';

		if (!item.image) {
			console.warn(
				`Нет изображения для предмета id=${item.id}, name=${item.name}, используется default-weapon.png`
			);
		}

		imageContainer.appendChild(img);
		itemEl.appendChild(imageContainer);
		return itemEl;
	}

	attachEventListeners() {
		if (this.spinButton) {
			this.spinButton.addEventListener('click', () => this.spin());
		}
		if (this.closeModalButton) {
			this.closeModalButton.addEventListener('click', () => this.closeModal());
		}

		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				if (!this.isSpinning) {
					this.resetPosition();
				}
			}, 250);
		});
	}

	resetPosition() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}

		if (this.itemsEl) {
			this.itemsEl.style.transition = 'none';
			this.itemsEl.style.transform = 'translateX(0px)';
			this.currentPosition = 0;
			this.velocity = 0;
		}

		const previousWinner = this.itemsEl?.querySelector('.winner');
		if (previousWinner) {
			previousWinner.classList.remove('winner');
		}

		if (this.resultContainer) {
			this.resultContainer.classList.remove('show');
		}
	}

	async spin() {
		if (this.isSpinning) return;

		this.isSpinning = true;
		if (this.spinButton) {
			this.spinButton.disabled = true;
		}
		if (this.resultContainer) {
			this.resultContainer.classList.remove('show');
		}
		this.resetPosition();

		const totalCost = window.casePrice || 0;

		// === СПИСАНИЕ СРАЗУ ===
		this.animateDeduction(totalCost);
		this.deductBalanceVisually(totalCost);

		try {
			const winningItem = await this.fetchWinningItem();
			this.winningItem = winningItem;
			this.generateItems(winningItem);
			this.setupAnimation(winningItem);
			this.startAnimation();
		} catch (error) {
			console.error('Ошибка при открытия кейса:', error);
			const errorMessage = error.message.includes('Не удалось получить инвентарь бота')
				? 'Ошибка при открытии кейса. Пожалуйста, попробуйте снова.'
				: error.message || 'Не удалось открыть кейс';
			alert(errorMessage);
			this.revertVisualDeduction(totalCost);
			this.stopSpinning();
		}
	}

	async fetchWinningItem() {
		const caseId = getCaseId();
		if (!caseId) throw new Error('ID кейса не найден');

		const endpoint = this.config.api.openCaseEndpoint.replace(
			'{caseId}',
			caseId
		);
		const response = await fetch(endpoint, {
			method: 'POST',
			credentials: this.config.api.credentials,
			headers: {
				...this.config.api.headers,
				...this.headers
			}
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.detail || data.error || 'Не удалось открыть кейс');
		}

		console.log('API response for winning item:', data.item);
		return data.item;
	}

	setupAnimation(winningItem) {
		const itemIndex = this.config.layout.targetRepeatIndex * this.items.length;
		this.winningIndex = itemIndex;

		const spinnerRect = this.spinnerEl?.getBoundingClientRect();
		const spinnerCenter = spinnerRect ? spinnerRect.width / 2 : 0;

		this.targetPosition =
			-(this.winningIndex * this.config.layout.itemWidth) +
			spinnerCenter -
			this.config.layout.itemWidth / 2 +
			this.config.layout.centerOffset;

		const offset = (Math.random() * 0.8 - 0.4) * this.config.layout.itemWidth;
		this.targetPosition += offset;

		this.duration = this.getRandomDuration();
		this.velocity = this.config.animation.initialVelocity;
		this.startTime = performance.now();
	}

	startAnimation() {
		this.animationId = requestAnimationFrame(this.animate.bind(this));
	}

	animate(currentTime) {
		const elapsed = currentTime - this.startTime;
		const progress = Math.min(elapsed / this.duration, 1);

		this.animateMainPhase(progress);
		this.updatePosition();

		if (progress < 1) {
			this.animationId = requestAnimationFrame(this.animate.bind(this));
		} else {
			this.finishAnimation();
		}
	}

	animateMainPhase(progress) {
		const easedProgress = this.applyEasing(
			progress,
			this.config.animation.easing
		);
		this.currentPosition = this.targetPosition * easedProgress;
	}

	applyEasing(t, type = 'power4.out') {
		switch (type) {
			case 'power4.out':
				return 1 - Math.pow(1 - t, 4.5);
			case 'power3.out':
				return 1 - Math.pow(1 - t, 3);
			case 'linear':
				return t;
			default:
				return 1 - Math.pow(1 - t, 4.5);
		}
	}

	updatePosition() {
		if (this.itemsEl) {
			this.itemsEl.style.transform = `translate3d(${Math.round(
				this.currentPosition
			)}px, 0, 0)`;
		}
	}

	finishAnimation() {
		if (!this.itemsEl || !this.spinnerEl) {
			console.error('Не найдены элементы для анимации:', { itemsEl: this.itemsEl, spinnerEl: this.spinnerEl });
			this.stopSpinning();
			return;
		}

		this.currentPosition = this.targetPosition;
		this.updatePosition();

		const spinnerRect = this.spinnerEl.getBoundingClientRect();
		const spinnerCenter = spinnerRect.width / 2;
		const idealPosition =
			-(this.winningIndex * this.config.layout.itemWidth) +
			spinnerCenter -
			this.config.layout.itemWidth / 2 +
			this.config.layout.centerOffset;

		this.itemsEl.style.transition = `transform ${this.config.animation.centerAnimationDuration}ms ease-out`;
		this.currentPosition = idealPosition;
		this.updatePosition();

		setTimeout(() => {
			this.highlightWinner();
			setTimeout(() => {
				this.showWinModal();
				this.updateUserBalance();
			}, 800);
		}, this.config.animation.centerAnimationDuration);

		this.stopSpinning();
	}

	highlightWinner() {
		const allItems = this.itemsEl?.querySelectorAll('.spinner-item');
		if (!allItems || !allItems[this.winningIndex]) {
			console.error('Winner item not found at index:', this.winningIndex);
			return;
		}

		const winnerItem = allItems[this.winningIndex];
		winnerItem.classList.add('winner');
		if (this.resultItem) {
			const itemId = winnerItem.getAttribute('data-item-id');
			const item = this.items.find(i => i.id == itemId);
			this.resultItem.textContent = item?.name || 'Неизвестный предмет';
		}
	}

	showWinModal() {
		if (!this.winModal || !this.winItemImage || !this.winItemName) {
			console.warn('Модальное окно или его элементы не найдены');
			return;
		}

		if (this.winningItem) {
			const image = this.normalizeImageUrl(this.winningItem.item_image || this.winningItem.image || this.winningItem.images);
			if (!image) {
				console.warn(
					`Нет изображения для выигранного предмета id=${this.winningItem.id}, name=${this.winningItem.name}, используется default-weapon.png`
				);
			}
			this.winItemImage.src = image || 'default-weapon.png';
			this.winItemImage.alt = this.winningItem.name;
			this.winItemName.textContent = this.winningItem.name;

			// Добавляем цену в модальное окно
			const priceElement = document.getElementById('winItemPrice');
			if (priceElement) {
				const price = parseFloat(this.winningItem.price || 0);
				priceElement.textContent = price > 0 ? `${price.toFixed(2)} ₽` : '0.00 ₽';
			} else {
				console.warn('Элемент #winItemPrice не найден в DOM');
			}

			this.winModal.classList.add('show');

			const modalContent = this.winModal.querySelector('.modal-content');
			if (modalContent) {
				modalContent.classList.add('animate-content');
			}
		} else {
			console.error('Выигрышный предмет не определен');
		}
	}

	closeModal() {
		if (this.winModal) {
			this.winModal.classList.remove('show');
			const modalContent = this.winModal.querySelector('.modal-content');
			if (modalContent) {
				modalContent.classList.remove('animate-content');
			}
		}
		this.resetPosition();

		const caseHeader = document.getElementById('caseHeader');
		const caseNameElement = document.getElementById('caseName');
		const caseImageContainer = document.getElementById('caseImageContainer');
		const controls = document.getElementById('controls');
		const caseSpinnerContainer = document.getElementById('caseSpinnerContainer');
		const resultContainer = document.getElementById('resultContainer');

		if (caseHeader) {
			caseHeader.classList.remove('hidden');
		}
		if (caseNameElement && this.case && this.case.name) {
			caseNameElement.textContent = this.case.name;
			console.log('Восстановлено название кейса:', this.case.name);
		} else {
			console.warn('Не удалось восстановить название кейса:', { caseName: this.case?.name, caseNameElement });
		}
		if (caseImageContainer) {
			caseImageContainer.classList.remove('hidden');
			const caseImage = document.getElementById('caseImage');
			if (caseImage && caseImage.src) {
				console.log('Восстановлено отображение изображения кейса:', caseImage.src);
			} else {
				console.warn('Изображение кейса не задано или не найдено:', caseImage?.src);
			}
		}
		if (controls) {
			controls.classList.remove('hidden');
		}
		if (caseSpinnerContainer) {
			caseSpinnerContainer.classList.add('hidden');
		}
		if (resultContainer) {
			resultContainer.classList.add('hidden');
		}

		if (this.spinButton) {
			this.spinButton.textContent = `Открыть ${window.casePrice}₽`;
		}
	}

	stopSpinning() {
		this.isSpinning = false;
		if (this.spinButton) {
			this.spinButton.disabled = false;
		}
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	updateUserBalance() {
		if (typeof toUser === 'function') {
			toUser((user, headers) => {
				if (user) {
					const balanceElement = document.getElementById('user-balance');
					if (balanceElement && user.balance !== undefined) {
						balanceElement.textContent = `${user.balance}₽`;
					}
				}
			});
		}
	}
	

	// === АНИМАЦИЯ СПИСАНИЯ ===
	animateDeduction(amount) {
		const anim = document.getElementById('balanceAnimation');
		if (!anim) return;
		anim.textContent = `-${amount}₽`;
		anim.classList.remove('show');
		void anim.offsetWidth;
		anim.classList.add('show');
	}

	deductBalanceVisually(amount) {
		const el = document.getElementById('user-balance');
		if (!el) return;
		const cur = parseFloat(el.textContent.replace('₽', '')) || 0;
		el.textContent = `${Math.max(0, cur - amount).toFixed(2)}₽`;
	}

	revertVisualDeduction(amount) {
		const el = document.getElementById('user-balance');
		if (!el) return;
		const cur = parseFloat(el.textContent.replace('₽', '')) || 0;
		el.textContent = `${(cur + amount).toFixed(2)}₽`;
	}

	adjustLayoutBasedOnItems() {
		const itemCount = this.items.length;
		if (itemCount < 10) {
			this.config.layout.repeats = 18;
			this.config.layout.targetRepeatIndex = 9;
			this.config.animation.initialVelocity = 400;
		} else if (itemCount < 15) {
			this.config.layout.repeats = 14;
			this.config.layout.targetRepeatIndex = 7;
			this.config.animation.initialVelocity = 300;
		} else if (itemCount < 20) {
			this.config.layout.repeats = 10;
			this.config.layout.targetRepeatIndex = 5;
			this.config.animation.initialVelocity = 200;
		} else {
			this.config.layout.repeats = 2;
			this.config.layout.targetRepeatIndex = 1;
			this.config.animation.initialVelocity = 100;
		}
	}

	getRandomDuration() {
		const { minDuration, maxDuration } = this.config.animation;
		return minDuration + Math.random() * (maxDuration - minDuration);
	}
}