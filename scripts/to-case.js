function toCase(callback) {
	toUser((user, headers) => {
		const caseId = getCaseId();

		fetch(`https://jackhanmacsgolkgame.pythonanywhere.com/cases/${caseId}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				...headers,
				'Content-Type': 'application/json'
			}
		})
			.then(r => {
				if (!r.ok) {
					throw new Error(`HTTP error! Status: ${r.status}`);
				}
				return r.json();
			})
			.then(_case => {
				const items = _case.items.map(({ item }) => ({
					id: item.id,
					name: item.name,
					image: item.item_image[0].image,
					price: item.price
				}));
				callback(_case, items, headers);
			})
			.catch(error => {
				console.error('Ошибка при получении данных кейса:', error);
				const itemsGrid = document.getElementById('caseItemsGrid');
				if (itemsGrid) {
					itemsGrid.innerHTML =
						'<div class="error-message">Ошибка при загрузке предметов</div>';
				}
			});
	});
}
