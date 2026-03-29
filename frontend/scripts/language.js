document.addEventListener('DOMContentLoaded', () => {
	const translations = {
		ru: {
			title: 'GLDROP',
			header: 'НАШИ СБОРКИ',
			item1: 'galil',
			price1: '139₽',
			item2: 'aug',
			price2: '159₽',
			item3: 'm4a4',
			price3: '289₽',
			item4: 'ak-47',
			price4: '319₽',
			item5: 'AWP',
			price5: '369₽',
			item6: 'm4a1-s',
			price6: '399₽',
			login: 'ВОЙТИ',
			language: 'Язык'
		},
		en: {
			title: 'GLDROP',
			header: 'OUR COLLECTIONS',
			item1: 'galil',
			price1: '139₽',
			item2: 'aug',
			price2: '159₽',
			item3: 'm4a4',
			price3: '289₽',
			item4: 'ak-47',
			price4: '319₽',
			item5: 'AWP',
			price5: '369₽',
			item6: 'm4a1-s',
			price6: '399₽',
			login: 'LOGIN',
			language: 'Language'
		},
		fr: {
			title: 'GLDROP',
			header: 'NOS COLLECTIONS',
			item1: 'm4a1-s',
			price1: '€1.79',
			item2: 'm4a4',
			price2: '€2.89',
			item3: 'awp',
			price3: '€3.49',
			item4: 'ak-47',
			price4: '€2.25',
			item5: 'AWP',
			price5: '€1.29',
			item6: 'AWP',
			price6: '€1.29',
			login: 'ENTER',
			language: 'Langue'
		},
		pl: {
			title: 'GLDROP',
			header: 'NASZE KOLEKCJE',
			item1: 'm4a1-s',
			price1: '€1.79',
			item2: 'm4a4',
			price2: '€2.89',
			item3: 'awp',
			price3: '€3.49',
			item4: 'ak-47',
			price4: '€2.25',
			item5: 'AWP',
			price5: '€1.29',
			item6: 'AWP',
			price6: '€1.29',
			login: 'ZALOGUJ SIĘ',
			language: 'Język'
		},
		pt: {
			title: 'GLDROP',
			header: 'NOSSAS COLEÇÕES',
			item1: 'm4a1-s',
			price1: '€1.79',
			item2: 'm4a4',
			price2: '€2.89',
			item3: 'awp',
			price3: '€3.49',
			item4: 'ak-47',
			price4: '€2.25',
			item5: 'AWP',
			price5: '€1.29',
			item6: 'AWP',
			price6: '€1.29',
			login: 'ENTRAR',
			language: 'Idioma'
		},
		de: {
			title: 'GLDROP',
			header: 'UNSERE SAMMLUNGEN',
			item1: 'm4a1-s',
			price1: '€1.79',
			item2: 'm4a4',
			price2: '€2.89',
			item3: 'awp',
			price3: '€3.49',
			item4: 'ak-47',
			price4: '€2.25',
			item5: 'AWP',
			price5: '€1.29',
			item6: 'AWP',
			price6: '€1.29',
			login: 'EINLOGGEN',
			language: 'Sprache'
		},
		es: {
			title: 'GLDROP',
			header: 'NUESTRAS COLECCIONES',
			item1: 'm4a1-s',
			price1: '€1.79',
			item2: 'm4a4',
			price2: '€2.89',
			item3: 'awp',
			price3: '€3.49',
			item4: 'ak-47',
			price4: '€2.25',
			item5: 'AWP',
			price5: '€1.29',
			item6: 'AWP',
			price6: '€1.29',
			login: 'INICIAR SESIÓN',
			language: 'Idioma'
		}
	};

	const languageButton = document.querySelector('.language-button');
	const languageDropdown = document.querySelector('.language-dropdown');
	const languageLinks = document.querySelectorAll('.language-dropdown a');
	const arrowIcon = document.querySelector('.arrow-icon');

	const toggleDropdown = () => {
		languageDropdown.classList.toggle('show');
	};

	languageButton.addEventListener('click', toggleDropdown);
	arrowIcon.addEventListener('click', toggleDropdown);

	window.addEventListener('click', event => {
		if (
			!event.target.matches('.language-button') &&
			!event.target.matches('.arrow-icon')
		) {
			if (languageDropdown.classList.contains('show')) {
				languageDropdown.classList.remove('show');
			}
		}
	});

	languageLinks.forEach(link => {
		link.addEventListener('click', event => {
			event.preventDefault();
			const lang = event.target.getAttribute('data-lang');
			changeLanguage(lang);
		});
	});

	function changeLanguage(lang) {
		document.title = translations[lang].title;
		document.querySelector('.header h5').innerText = translations[lang].header;

		const items = document.querySelectorAll('.cases');
		items.forEach((item, index) => {
			const itemName = translations[lang][`item${index + 1}`];
			const itemPrice = translations[lang][`price${index + 1}`];
			item.querySelector('h2').innerText = itemName;
			item.querySelector('h3').innerText = itemPrice;
		});

		document.querySelector('.layer1 h4').innerText = translations[lang].login;
	}
});
