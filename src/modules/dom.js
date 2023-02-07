import weather from './weather'

// TODO: render weather every 3H
// TODO: celsius to farrenheit
const dom = (() => {
  function loadContent() {
    displayWeatherContent('Zagreb')
    initLocationSearch()
  }

  function initLocationSearch() {
    const locationInput = document.getElementById('location-input')
    const form = document.getElementById('location-form')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      displayWeatherContent(locationInput.value)
    })
    const searchButton = document.getElementById('form-submit-button')
    searchButton.addEventListener('click', (e) => {
      e.preventDefault()
      displayWeatherContent(locationInput.value)
    })
  }

  async function displayWeatherContent(location) {
    // GET DATA MAIN DATA OBJ
    const weatherData = await weather.getWeather(location)
    // GET LOCATION COORDINATES
    const { lat, lon } = weatherData
    // RENDER MAIN WEATHER DATA
    renderLocationInfoMain(weatherData)
    // GET EVERY 3 HOURS WEATHER DATA
    const weatherData3H = await weather.getWeatherEvery3H(lat, lon)
    // DISPLAY WEATHER DATA EVERY 3 HOURS
    displayWeather3H(weatherData3H)
  }

  async function renderLocationInfoMain(weatherData) {
    const locationMain = document.getElementById('location')
    const temperatureMain = document.getElementById('temperature')
    const descriptionMain = document.getElementById('description')
    const temperatureMinMain = document.getElementById('temperature-min')
    const temperatureMaxMain = document.getElementById('temperature-max')

    if (!weatherData) return
    const {
      name,
      temperature,
      description,
      temperatureMin,
      temperatureMax,
      currentTime,
      sunriseTime,
      sunsetTime,
    } = weatherData

    locationMain.textContent = name

    if (temperature >= 0)
      temperatureMain.textContent = `${Math.round(temperature)}`
    else temperatureMain.textContent = `${Math.round(temperature)}`

    descriptionMain.textContent = description

    if (
      (currentTime < sunriseTime || currentTime > sunsetTime) &&
      (description === 'Clear' || description === 'Clouds')
    )
      setWeatherBackground('space')
    else setWeatherBackground(description)

    temperatureMinMain.textContent = `H: ${Math.round(temperatureMin)}\u00B0`
    temperatureMaxMain.textContent = `L: ${Math.round(temperatureMax)}\u00B0`
  }

  function setWeatherBackground(description) {
    const video = document.getElementById('background-video')
    const fileName = video.src.substring(video.src.lastIndexOf('/') + 1)
    const newFileName = `${description.toLowerCase()}.mp4`
    console.log(fileName)
    console.log(newFileName)
    if (newFileName === fileName) return
    video.src = newFileName
  }

  function displayWeather3H(weatherData) {
    clear3HCards()
    const now = getCardHour(weatherData, 0)
    let i = 0
    console.log(now)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dateTime = weatherData.list[i].dt_txt
      const time = dateTime.substring(dateTime.indexOf(' ') + 1)
      const hour = time.substring(0, time.indexOf(':'))
      let { temp } = weatherData.list[i].main
      temp = Math.round(temp)
      console.log(hour)
      // BREAK IF NEXT DAY
      if (i !== 0 && hour === now) {
        break
      }

      display3HCard(hour, temp)

      i += 1
    }
  }

  function display3HCard(hour, temp) {
    const hourEl = document.createElement('p')
    hourEl.textContent = hour

    const tempEl = document.createElement('p')
    tempEl.textContent = temp

    const card3H = document.createElement('div')
    card3H.classList.add('item-3-h')
    card3H.appendChild(hourEl)
    card3H.appendChild(tempEl)

    const cardContainer = document.getElementById('weather-3-hours-container')
    cardContainer.appendChild(card3H)
  }

  function clear3HCards() {
    const cardContainer = document.getElementById('weather-3-hours-container')
    cardContainer.replaceChildren('')
  }

  function getCardHour(weatherData, listItem) {
    const dateTime = weatherData.list[listItem].dt_txt
    const time = dateTime.substring(dateTime.indexOf(' ') + 1)
    const hour = time.substring(0, time.indexOf(':'))
    return hour
  }

  return { loadContent }
})()

export default dom
