import weather from './weather'

// TODO: display hourly cont
// TODO: convert hour hour to number
const dom = (() => {
  async function loadContent() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.classList.add('active')
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
    displayDailyContent(weatherData)
  }

  // MAIN WEATHER CONTENT
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

  // HOURLY FORECAST CONTENT
  function displayHourlyContent(weatherData) {
    const hoursContainer = document.getElementById('hours-container')
    clearContent(hoursContainer)
    const hours = getNext24Hours(weatherData)
    const timezoneOffset = weatherData.timezone_offset

    hours.forEach((hour) => {
      displayHourItem(hour, timezoneOffset, weatherData)
    })
  }
  function displayHourItem(hour, timezoneOffset, weatherData) {
    const seconds = hour.dt + timezoneOffset
    const itemHour = secondsToHour(seconds)
    // GET WEATHER LOGO SRC
    let mainDesc = `${hour.weather[0].main.toLowerCase()}.svg`
    const secondsNoOffset = hour.dt
    const sunriseSeconds = weatherData.daily[1].sunrise
    const sunsetSeconds = weatherData.current.sunset
    // IF SUN NOT VISIBLE GET NIGHT LOGO SRC
    if (
      secondsNoOffset > sunsetSeconds &&
      secondsNoOffset < sunriseSeconds &&
      (mainDesc === 'clear.svg' || mainDesc === 'clouds.svg')
    )
      mainDesc = `night_${mainDesc}`
    // GET HOURS ITEM TEMP
    const itemTemp = Math.round(hour.temp)
    loadHourItem(itemHour, mainDesc, itemTemp)
  }
  function loadHourItem(hour, mainDesc, temp) {
    const hourEl = document.createElement('p')
    hourEl.textContent = hour
    hourEl.classList.add('hour-hour')

    const logoEl = document.createElement('img')
    logoEl.src = mainDesc
    logoEl.classList.add('hour-logo')

    const tempEl = document.createElement('p')
    tempEl.textContent = temp
    tempEl.classList.add('hour-temp')

    const hourItemEl = document.createElement('div')
    hourItemEl.classList.add('hour-item')
    hourItemEl.appendChild(hourEl)
    hourItemEl.appendChild(logoEl)
    hourItemEl.appendChild(tempEl)

    const cardContainer = document.getElementById('hours-container')
    cardContainer.appendChild(hourItemEl)
  }
  function clearContent(el) {
    el.replaceChildren('')
  }
  function getNext24Hours(weatherData) {
    return weatherData.hourly.slice(0, 24)
  }
  function secondsToHour(seconds) {
    let date = new Date(null)
    date.setSeconds(seconds)
    date = date.toString().slice(16, 18)
    return date
  }

  // DAILY FORECAST CONTENT
  function displayDailyContent(weatherData) {
    const daysContainer = document.getElementById('days-container')
    clearContent(daysContainer)

    const timezoneOffset = weatherData.timezone_offset
    const days = weatherData.daily
    let dayIndex = 0
    days.forEach((day) => {
      const seconds = day.dt + timezoneOffset
      loadDayItem(day, seconds, dayIndex)
      dayIndex += 1
    })
  }

  function loadDayItem(day, seconds, dayIndex) {
    const weekDayEl = document.createElement('p')
    weekDayEl.textContent = secondsToWeekDay(seconds, dayIndex)
    weekDayEl.classList.add('week-day')

    const logoEl = document.createElement('img')
    logoEl.src = `${day.weather[0].main.toLowerCase()}.svg`
    logoEl.classList.add('day-item-logo')

    const tempMinEl = document.createElement('p')
    tempMinEl.textContent = Math.round(day.temp.min)
    tempMinEl.classList.add('day-temp-min')

    const tempMaxEl = document.createElement('p')
    tempMaxEl.textContent = Math.round(day.temp.max)
    tempMaxEl.classList.add('day-temp-max')

    const meterEl = document.createElement('div')
    meterEl.classList.add('meter')
    styleMeter(meterEl, +tempMinEl.textContent, +tempMaxEl.textContent)

    const dayItem = document.createElement('div')
    dayItem.classList.add('day-item')
    dayItem.appendChild(weekDayEl)
    dayItem.appendChild(logoEl)
    dayItem.appendChild(tempMinEl)
    dayItem.appendChild(meterEl)
    dayItem.appendChild(tempMaxEl)

    const daysContainer = document.getElementById('days-container')
    daysContainer.appendChild(dayItem)
  }

  function secondsToWeekDay(seconds, dayIndex) {
    if (dayIndex === 0) return 'Today'
    let weekDay = new Date(null)
    weekDay.setSeconds(seconds)
    weekDay = weekDay.toString().slice(0, 3)
    return weekDay
  }

  function styleMeter(meter, tempMin, tempMax) {
    // <= 16 VERY COLD, -15 <= -1 COLD, 0 <= 14 WARM, 15 <= 29 VERY WARM, HOT >= 30
    // VERY COLD
    const isVeryColdToWarm =
      tempMin < tempMax &&
      tempMin <= -16 &&
      (tempMin <= tempMax - 15 || tempMax >= 0)
    const isVeryColdToCold =
      tempMin < tempMax &&
      tempMin <= -16 &&
      (tempMin <= tempMax - 5 || tempMax >= -15)
    const isVeryCold = tempMin <= -16
    // COLD
    const isColdToVeryWarm =
      tempMin < tempMax &&
      tempMin <= -1 &&
      (tempMin <= tempMax - 15 || tempMax >= 15)
    const isColdToWarm =
      tempMin < tempMax &&
      tempMin <= -1 &&
      (tempMin <= tempMax - 5 || tempMax >= 0)
    const isCold = tempMin <= -1
    // WARM
    const isWarmToHot =
      tempMin < tempMax &&
      tempMin <= 14 &&
      (tempMin <= tempMax - 15 || tempMax >= 30)
    const isWarmToVeryWarm =
      tempMin < tempMax &&
      tempMin <= 14 &&
      (tempMin <= tempMax - 5 || tempMax >= 15)
    const isWarm = tempMin <= 14
    // VERY WARM
    const isVeryWarmToHot =
      tempMin < tempMax &&
      tempMin <= 29 &&
      (tempMin <= tempMax - 5 || tempMax >= 30)
    const isVeryWarm = tempMin <= 29

    switch (true) {
      // VERY COLD
      case isVeryColdToWarm:
        meter.classList.add('very-cold-to-warm')
        break
      case isVeryColdToCold:
        meter.classList.add('very-cold-to-cold')
        break
      case isVeryCold:
        meter.classList.add('very-cold')
        break
      // COLD
      case isColdToVeryWarm:
        meter.classList.add('cold-to-very-warm')
        break
      case isColdToWarm:
        meter.classList.add('cold-to-warm')
        break
      case isCold:
        meter.classList.add('cold')
        break
      // WARM
      case isWarmToHot:
        meter.classList.add('warm-to-hot')
        break
      case isWarmToVeryWarm:
        meter.classList.add('warm-to-very-warm')
        break
      case isWarm:
        meter.classList.add('warm')
        break
      // VERY WARM
      case isVeryWarmToHot:
        meter.classList.add('very-warm-to-hot')
        break
      case isVeryWarm:
        meter.classList.add('very-warm')
        break
      default:
        meter.classList.add('hot')
    }
  }

  // BACKGROUND VIDEO
  function displayBackgroundVideo(weatherData) {
    const loadingScreen = document.getElementById('loading-screen')
    const video = document.getElementById('background-video')

    let state = getWeatherState(weatherData).toLowerCase()
    if (state === 'haze') state = 'fog'
    video.src = `${state}.mp4`

    // SHOW LOADING SCREEN
    loadingScreen.classList.add('active')
    // HIDE LOADING SCREEN WHEN VIDEO CAN PLAY
    video.addEventListener('canplay', hideLoadingScreen)
  }

  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.removeEventListener('canplay', hideLoadingScreen)
    loadingScreen.classList.remove('active')
  }

  return { loadContent }
})()

export default dom
