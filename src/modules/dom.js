import weather from './weather'

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
    // RENDER EVERY 3 HOURS WEATHER DATA
    weather.getWeatherEvery3H(lat, lon)
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
    temperatureMain.textContent = Math.round(temperature)
    descriptionMain.textContent = description

    console.log(sunriseTime, currentTime, sunsetTime)
    if (
      (currentTime < sunriseTime || currentTime > sunsetTime) &&
      (description === 'Clear' || description === 'Clouds')
    )
      displayWeatherBackground('space')
    else displayWeatherBackground(description)

    temperatureMinMain.textContent = temperatureMin
    temperatureMaxMain.textContent = temperatureMax
  }

  function displayWeatherBackground(description) {
    const video = document.getElementById('background-video')
    const fileName = video.src.substring(video.src.lastIndexOf('/') + 1)
    const newFileName = `${description.toLowerCase()}.mp4`
    console.log(fileName)
    console.log(newFileName)
    if (newFileName === fileName) return
    video.src = newFileName
  }

  return { loadContent }
})()

export default dom
