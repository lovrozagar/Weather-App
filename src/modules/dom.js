import weather from './weather'

// TODO: display hourly cont
const dom = (() => {
  async function loadContent() {
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
    const searchButton = document.getElementById('search-button')
    searchButton.addEventListener('click', (e) => {
      e.preventDefault()
      displayWeatherContent(locationInput.value)
    })
  }

  async function displayWeatherContent(cityName) {
    const weatherData = await weather.getWeatherData(cityName)
    console.log(weatherData)
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
  }

  // MAIN CONTENT
  function displayMainContent(weatherData) {
    const locationMain = document.getElementById('location')
    const temperatureMain = document.getElementById('temperature')
    const descriptionMain = document.getElementById('description')
    const temperatureMinMain = document.getElementById('temperature-min')
    const temperatureMaxMain = document.getElementById('temperature-max')

    locationMain.textContent = getLocationNameMain(weatherData)
    temperatureMain.textContent = getTemperatureMain(weatherData)
    descriptionMain.textContent = getDescriptionMain(weatherData)
    temperatureMinMain.textContent = getTemperatureMinMain(weatherData)
    temperatureMaxMain.textContent = getTemperatureMaxMain(weatherData)
  }

  function getLocationNameMain(weatherData) {
    return weatherData.name
  }
  function getTemperatureMain(weatherData) {
    return Math.round(weatherData.current.temp)
  }
  function getDescriptionMain(weatherData) {
    return weatherData.current.weather[0].description
  }
  function getTemperatureMinMain(weatherData) {
    return `L : ${Math.round(weatherData.minTemp)}`
  }
  function getTemperatureMaxMain(weatherData) {
    return `H : ${Math.round(weatherData.maxTemp)}`
  }
  function getWeatherState(weatherData) {
    return weatherData.current.weather[0].main
  }

  // HOURLY CONTENT
  function displayHourlyContent(weatherData) {
    const hourlyContainer = document.getElementById('hourly-container')
    clearContent(hourlyContainer)

    const hours = getNext24Hours(weatherData)
    const timezoneOffset = weatherData.timezone_offset
    let hourIndex = 0

    hours.forEach((hour) => {
      const seconds = hour.dt + timezoneOffset
      const date = secondsToHour(seconds)
      console.log(date)
      displayHourItem()
      hourIndex += 1
    })
  }
  function clearContent(el) {
    el.replaceChildren('')
  }
  function getNext24Hours(weatherData) {
    return weatherData.hourly.slice(0, 24)
  }
  function displayHourItem() {}

  function secondsToHour(seconds) {
    let date = new Date(null)
    date.setSeconds(seconds)
    date = date.toString().slice(16, 18)
    return date
  }

  // BACKGROUND VIDEO
  function displayBackgroundVideo(weatherData) {
    const video = document.getElementById('background-video')
    let state = getWeatherState(weatherData).toLowerCase()
    if (state === 'haze') state = 'fog'
    video.src = `${state}.mp4`
  }

  return { loadContent }
})()

export default dom
