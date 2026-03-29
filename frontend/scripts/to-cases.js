function toCases(callback) {
	fetch('https://jackhanmacsgolkgame.pythonanywhere.com/cases', {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		}
	})
		.then(r => {
			if (!r.ok) {
				throw new Error(`HTTP error! Status: ${r.status}`);
			}
			return r.json();
		})
		.then(cases => callback(cases))
		.catch(error => {
			console.error('Error fetching cases:', error);
			callback(null);
		});
}