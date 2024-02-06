'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); //❗️should NEVER create ids on our own

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; //arr: [lat, lng]
    this.distance = distance; //in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance; //min/km
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this.speed;
  }
}

///////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workoutArr = [];

  constructor() {
    this._getPosition(); //get current position from Browser

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    /*
    🟢 Using the ✨Geolocation API (a Browser API) to get User's current coordinates
      👉 Test if Browser support ✨Geolocation API
    */
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could NOT get your position! 🙅');
        }
      );
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    //🟢 Display a Map using ✨Leaflet Library
    this.#map = L.map('map').setView(coords, 13); //13 is the zoom level

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //👉 handling click event on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    // console.log(mapE);
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validateInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const isAllPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // const { lat, lng } = this.#mapEvent.latlng;

    // get data inputs from form & store them into object data:
    const dataInput = {
      type: inputType.value,
      distance: +inputDistance.value,
      duration: +inputDuration.value,
      lat: this.#mapEvent.latlng.lat,
      lng: this.#mapEvent.latlng.lng,
    };
    let workout;

    switch (dataInput.type) {
      // If workout running, create running object
      case 'running':
        dataInput.cadence = +inputCadence.value;

        if (
          !validateInputs(
            dataInput.distance,
            dataInput.duration,
            dataInput.cadence
          ) ||
          !isAllPositive(
            dataInput.distance,
            dataInput.duration,
            dataInput.cadence
          )
        )
          return alert('Inputs have to be positive numbers & NOT empty!');

        workout = new Running(
          [dataInput.lat, dataInput.lng],
          dataInput.distance,
          dataInput.duration,
          dataInput.cadence
        );
        break;
      // If workout cycling, create cycling object
      case 'cycling':
        dataInput.elevation = +inputElevation.value;

        if (
          !validateInputs(
            dataInput.distance,
            dataInput.duration,
            dataInput.elevation
          ) ||
          !isAllPositive(
            dataInput.distance,
            dataInput.duration,
            dataInput.elevation
          )
        )
          return alert('Inputs have to be positive numbers & NOT empty!');

        workout = new Cycling(
          [dataInput.lat, dataInput.lng],
          dataInput.distance,
          dataInput.duration,
          dataInput.elevation
        );
    }

    // Add new object to workout array:
    this.#workoutArr.push(workout);

    // Render workout on map as marker:
    this._renderWorkoutMarker(workout);

    // Render workout on list:

    // Hide form + clear input fields:
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  // Set local storage to all workouts:

  _renderWorkoutMarker(curWorkout) {
    //👉 display a marker upon submitting a form with a location selected from the map
    L.marker(curWorkout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${curWorkout.type}-popup`,
        })
      )
      .setPopupContent(`${curWorkout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}`)
      .openPopup();
  }
}

const app = new App();
