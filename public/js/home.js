const showBtn = document.getElementById('showBtn');
const gallery = document.getElementById('drawings');

showBtn.addEventListener('click', () => {
	$.ajax({
		type: 'POST',
		url: '/show',
		success(urls) {
			gallery.innerHTML = '';
			const br = document.createElement('br');
			const p = document.createElement('p');
			p.textContent = 'Will only display drawings saved in last 3 days';
			gallery.appendChild(br);
			gallery.appendChild(p);

			for (let i = urls.length - 1; i >= 0; i -= 1) {
				const flip = document.createElement('div');
				const rawDate = urls[i].date.replace('T', ' ').split('.')[0];
				const date = document.createTextNode(rawDate);

				flip.setAttribute('class', 'flip');
				flip.setAttribute('style', 'border:1px solid black;');
				flip.appendChild(date);

				const panel = document.createElement('div');
				panel.setAttribute('class', 'panel');
				panel.setAttribute('style', 'border:1px solid black;');

				const img = document.createElement('img');
				img.setAttribute('src', urls[i].url);
				img.setAttribute('width', '300');
				img.setAttribute('height', '300');
				img.setAttribute('style', 'border:1px solid black;');

				const btn = document.createElement('button');
				btn.setAttribute('class', 'btn btn-primary');
				btn.setAttribute('style', 'margin-top:10px;');
				btn.textContent = 'Download';

				panel.appendChild(img);
				panel.appendChild(btn);

				gallery.appendChild(flip);
				gallery.appendChild(panel);
			}

			$(() => {
				$('.flip').on('click', function () {
					$('.panel').not($(this).next('.panel')).slideUp('slow');
					$(this).next('.panel').slideToggle('slow');
				});
			});

			$('#myTab a[href="#pills-gallery"]').tab('show');
		},
	});
});
