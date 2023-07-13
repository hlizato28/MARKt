'use strict';

class Shop {
  id = (Date.now() + '').slice(-10);

  constructor(coords, shop, price) {
    this.coords = coords;
    this.shop = shop;
    this.price = price;
  }
}

class Meat extends Shop {
  type = 'meat';

  constructor(coords, meat, shop, price, weight) {
    super(coords, shop, price);
    this.meat = meat;
    this.weight = weight;
    this.calcPricePerGram();
  }

  calcPricePerGram() {
    this.ppg = this.price / this.weight;
    return this.ppg;
  }
}

class Veggies extends Shop {
  type = 'veggies';

  constructor(coords, veggies, shop, price, piece) {
    super(coords, shop, price);
    this.veggies = veggies;
    this.piece = piece;
    this.calcPricePerPiece();
  }

  calcPricePerPiece() {
    this.ppp = this.price / this.piece;
    return this.ppp;
  }
}

const form = document.querySelector('.form');
const containerShops = document.querySelector('.shops');
const inputMeat = document.querySelector('.form__input--meat');
const inputVeggies = document.querySelector('.form__input--veggies');
const inputType = document.querySelector('.form__input--type');
const inputShop = document.querySelector('.form__input--shop');
const inputPrice = document.querySelector('.form__input--price');
const inputWeight = document.querySelector('.form__input--weight');
const inputPiece = document.querySelector('.form__input--piece');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #buys = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newShop.bind(this));

    inputType.addEventListener('change', this._toggleVeggiesField);

    containerShops.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputMeat.focus();
    inputVeggies.focus();
  }

  _hideForm() {
    inputShop.value =
      inputPrice.value =
      inputMeat.value =
      inputVeggies.value =
      inputWeight.value =
      inputPiece.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleVeggiesField() {
    inputVeggies.closest('.form__row').classList.toggle('form__row--hidden');
    inputPiece.closest('.form__row').classList.toggle('form__row--hidden');
    inputMeat.closest('.form__row').classList.toggle('form__row--hidden');
    inputWeight.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newShop(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    e.preventDefault();

    const type = inputType.value;
    const shop = inputShop.value;
    const price = +inputPrice.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let buy;

    if (type === 'meat') {
      const meat = inputMeat.value;
      const weight = +inputWeight.value;
      if (
        !Number.isFinite(price) ||
        !Number.isFinite(weight) ||
        price < 0 ||
        weight < 0
      )
        return alert('Inputs have to be positive numbers!');

      buy = new Meat([lat, lng], meat, shop, price, weight);
    }

    if (type === 'veggies') {
      const veggies = inputVeggies.value;
      const piece = +inputPiece.value;
      if (
        !Number.isFinite(price) ||
        !Number.isFinite(piece) ||
        price < 0 ||
        piece < 0
      )
        return alert('Inputs have to be positive numbers!');

      buy = new Veggies([lat, lng], veggies, shop, price, piece);
    }

    this.#buys.push(buy);
    console.log(buy);

    this._renderShopMarker(buy);

    this._renderShop(buy);

    this._hideForm();
  }

  _renderShopMarker(shop) {
    L.marker(shop.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${shop.type}-popup`,
        })
      )

      .setPopupContent(
        `${shop.type === 'meat' ? `🥩 ${shop.meat}` : `🥬 ${shop.veggies}`}`
      )
      .openPopup();
  }

  _renderShop(shop) {
    let html = `<li class="shop shop--${shop.type}" data-id="${shop.id}">
    `;

    if (shop.type === 'meat')
      html += `
      <h2 class="shop__title">🥩 ${shop.meat}</h2>
        <div class="shop__details">
          <span class="shop__icon">💰</span>
          <span class="shop__value">${shop.ppg.toFixed(2)}</span>
          <span class="shop__unit">€/gram</span>
        </div>
        <div class="shop__details">
            <span class="shop__icon">🏪</span>
            <span class="shop__value">${shop.shop}</span>
        </div>
      </li>
      `;

    if (shop.type === 'veggies')
      html += `
      <h2 class="shop__title">🥬 ${shop.veggies}</h2>
        <div class="shop__details">
        <div class="shop__details">
          <span class="shop__icon">💰</span>
          <span class="shop__value">${shop.ppp.toFixed(2)}</span>
          <span class="shop__unit">€/piece</span>
        </div>
        <div class="shop__details">
            <span class="shop__icon">🏪</span>
            <span class="shop__value">${shop.shop}</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const shopEl = e.target.closest('.shop');

    if (!shopEl) return;

    const shop = this.#buys.find(shop => shop.id === shopEl.dataset.id);

    this.#map.setView(shop.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }
}

const app = new App();
