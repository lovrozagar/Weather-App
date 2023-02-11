import { debounce } from 'lodash'
import weather from './weather'
// TODO: chance of rain round
// TODO: pressure message
// TODO: add visibility
// TODO: celsius to kelvin
// TODO: google location
// TODO: mobile optimization
// TODO: form validation
// TODO: 3600 offset for +-12/11 zones
// TODO: when searching location recommendations appear
// TODO: add FAVORITES
// TODO: add view
const dom = (() => {
  function loadContent() {
    showLoadingScreen()
    displayWeatherContent('Zagreb')
    initLocationSearch()
    initSuggestions()
    initLocationAutocomplete()
  }

  // DEBOUNCE FUNCTION FOR AUTOCOMPLETE, IF LOCATION IS LOADED, THIS/AUTOCOMPLETE GETS CANCELED
  const onFinishTyping = debounce(displaySuggestions, 750)

  // LOCATION SEARCH

  function initLocationSearch() {
    const locationInput = document.getElementById('location-input')
    const form = document.getElementById('location-form')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      onFinishTyping.cancel()
      showLoadingScreen()
      displayWeatherContent(locationInput.value)
      setTimeout(hideSuggestions, 900)
    })
    const searchButton = document.getElementById('search-button')
    searchButton.addEventListener('click', (e) => {
      e.preventDefault()
      onFinishTyping.cancel()
      showLoadingScreen()
      displayWeatherContent(locationInput.value)
    })
  }

  // LOCATION SEARCH AUTOCOMPLETE
  function initLocationAutocomplete() {
    const locationInput = document.getElementById('location-input')
    locationInput.addEventListener('input', () => {
      if (locationInput.value === '') hideSuggestions()
      else onFinishTyping(locationInput.value)
    })
  }

  function getSuggestionsURL(location) {
    return `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&sort=-population&namePrefix=${location}`
  }

  function getSuggestionsBody() {
    return {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'feafa1d619mshe17ed83e5e7db1dp1a5622jsn3b2f188ddc6c',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
      },
    }
  }

  async function displaySuggestions(location) {
    const response = await fetch(
      getSuggestionsURL(location),
      getSuggestionsBody()
    )
    const suggestions = await response.json()
    loadSuggestions(suggestions)
  }

  function loadSuggestions(suggestions) {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')

    for (let i = 0; i < 5; i += 1) {
      if (suggestions.data[i]) {
        suggestionItems[i].classList.add('active')
        suggestionItems[i].textContent = `${suggestions.data[i].name}, `
        suggestionItems[i].textContent += `${suggestions.data[i].country}`
      } else {
        suggestionItems[i].classList.remove('active')
      }
    }
  }

  function initSuggestions() {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    suggestionItems.forEach((item) => {
      item.addEventListener('click', searchBySuggestion)
    })
  }

  function searchBySuggestion() {
    const locationInput = document.getElementById('location-input')
    locationInput.value = this.textContent
    const cityName = this.textContent.substring(
      0,
      this.textContent.indexOf(',')
    )
    displayWeatherContent(cityName)
  }

  function hideSuggestions() {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    suggestionItems.forEach((item) => {
      item.classList.remove('active')
    })
  }

  // DISPLAY ALL WEATHER CONTENT
  async function displayWeatherContent(cityName) {
    const weatherData = await weather.getWeatherData(cityName)
    console.log(weatherData)
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
    displayDailyContent(weatherData)
    displayTechnicalContent(weatherData)
    hideSuggestions()
  }

  // MAIN WEATHER CONTENT
  function displayMainContent(weatherData) {
    const locationMain = document.getElementById('location')
    const temperatureMain = document.getElementById('temperature')
    const descriptionMain = document.getElementById('description')
    const feelsLikeMain = document.getElementById('main-feels-like')

    locationMain.textContent = getLocationNameMain(weatherData)
    temperatureMain.textContent = getTemperatureMain(weatherData)
    descriptionMain.textContent = getDescriptionMain(weatherData)
    feelsLikeMain.textContent = getFeelsLikeMain(weatherData)
  }

  function getLocationNameMain(weatherData) {
    return weatherData.name
  }
  function getTemperatureMain(weatherData) {
    return Math.round(weatherData.current.temp)
  }
  function getFeelsLikeMain(weatherData) {
    return `feels like: ${Math.round(weatherData.current.feels_like)}`
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

    // ADD TITLE AND ICON
    const title = document.createElement('p')
    title.textContent = 'hourly forecast'
    const icon = document.createElement('img')
    icon.classList.add('icon', 'forecast-hours')
    icon.src = 'forecast.svg'
    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon', 'hours')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)
    hoursContainer.appendChild(titleAndIcon)

    // ADD HOUR ITEMS
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
    const sunriseNoOffset = hour.dt + 3600
    const sunriseSeconds = weatherData.daily[1].sunrise
    const sunsetSeconds = weatherData.current.sunset
    // IF SUN NOT VISIBLE GET NIGHT LOGO SRC
    if (
      sunriseNoOffset > sunsetSeconds &&
      sunriseNoOffset <= sunriseSeconds &&
      (mainDesc === 'clear.svg' || mainDesc === 'clouds.svg')
    )
      mainDesc = `night_${mainDesc}`
    // GET HOURS ITEM TEMP
    const itemTemp = Math.round(hour.temp)
    loadHourItem(itemHour, mainDesc, itemTemp)
  }
  function loadHourItem(hour, mainDesc, temp) {
    const hourEl = document.createElement('p')
    hourEl.textContent = `${+hour}h`
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
  function secondsToHourAndMinutes(seconds) {
    const date = new Date(null)
    date.setSeconds(seconds)
    const hour = +date.toString().slice(16, 18)
    const doubleColon = date.toString().slice(18, 19)
    const minutes = +date.toString().slice(19, 21)
    return `${hour}${doubleColon}${minutes}`
  }

  // DAILY FORECAST CONTENT
  function displayDailyContent(weatherData) {
    const daysContainer = document.getElementById('days-container')
    clearContent(daysContainer)

    // ADD TITLE AND ICON
    const title = document.createElement('p')
    title.textContent = 'weekly forecast'
    const icon = document.createElement('img')
    icon.classList.add('icon', 'forecast-days')
    icon.src = 'forecast.svg'
    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)
    daysContainer.appendChild(titleAndIcon)

    // ADD DAY ITEMS
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

  // TECHNICAL CONTENT
  function displayTechnicalContent(weatherData) {
    const technicalContainer = document.getElementById('technical-container')
    clearContent(technicalContainer)
    // UVI
    const UVIndex = weatherData.current.uvi
    displayUVIndex(UVIndex, technicalContainer)
    // WIND
    // CONVERT FROM METERS PER SECOND TO KILOMETERS PER SECOND
    const windSpeed = Math.round(weatherData.current.wind_speed * 3.6 * 10) / 10
    const wind = `${windSpeed} km/h`
    displayWind(wind, technicalContainer)
    // HUMIDITY
    const humidity = `${weatherData.current.humidity}%`
    displayHumidity(humidity, technicalContainer)
    // CHANCE OF RAIN
    const chanceOfRain = `${Math.round(weatherData.daily[0].pop * 100)}%`
    displayChanceOfRain(chanceOfRain, technicalContainer)
    // SUNRISE
    const sunriseSeconds =
      weatherData.current.sunrise + weatherData.timezone_offset - 3600
    const sunrise = secondsToHourAndMinutes(sunriseSeconds)
    console.log(sunrise)
    displaySunrise(sunrise, technicalContainer)
    // SUNSET
    const sunsetSeconds =
      weatherData.current.sunset + weatherData.timezone_offset - 3600
    const sunset = secondsToHourAndMinutes(sunsetSeconds)
    displaySunset(sunset, technicalContainer)
    // PRESSURE
    const pressure = `${weatherData.current.pressure} hPa`
    displayPressure(pressure, technicalContainer)

    metricToImperial()
  }

  function displayUVIndex(UVIndex, container) {
    const title = document.createElement('p')
    title.textContent = 'UV index'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'uvSun.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = UVIndex
    indexEl.classList.add('card-value')

    const messageEl = document.createElement('p')
    messageEl.textContent = UVIndexMessage(UVIndex)
    messageEl.classList.add('card-text')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)
    card.appendChild(messageEl)

    container.appendChild(card)
  }

  function displayWind(wind, container) {
    const title = document.createElement('p')
    title.textContent = 'wind'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'wind.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = wind
    indexEl.id = 'wind'
    indexEl.classList.add('card-value')

    const messageEl = document.createElement('p')
    messageEl.textContent = windMessage(wind)
    messageEl.classList.add('card-text')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)
    card.appendChild(messageEl)

    container.appendChild(card)
  }

  function displayHumidity(humidity, container) {
    const title = document.createElement('p')
    title.textContent = 'humidity'

    const icon = document.createElement('img')
    icon.classList.add('icon', 'humidity')
    icon.src = 'humidity.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = humidity
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    container.appendChild(card)
  }

  function displayChanceOfRain(chanceOfRain, container) {
    const title = document.createElement('p')
    title.textContent = 'chance of rain'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'chanceOfRain.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = chanceOfRain
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    container.appendChild(card)
  }

  function displaySunrise(sunrise, container) {
    const title = document.createElement('p')
    title.textContent = 'sunrise'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'sunrise.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = sunrise
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    container.appendChild(card)
  }

  function displaySunset(sunset, container) {
    const title = document.createElement('p')
    title.textContent = 'sunset'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'sunset.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = sunset
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    container.appendChild(card)
  }

  function displayPressure(pressure, container) {
    const title = document.createElement('p')
    title.textContent = 'pressure'

    const icon = document.createElement('img')
    icon.classList.add('icon')
    icon.src = 'pressure.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = pressure
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    container.appendChild(card)
  }

  function UVIndexMessage(index) {
    if (index <= 0.99) return 'Very low, damage possibility is negligible'
    if (index <= 4) return 'Mild, sun protection may or may not be needed.'
    if (index <= 7) return 'High, sun protection is recommended'
    if (index > 7) return 'Very high, sun protection is highly recommended'
    return 'Very low'
  }

  function windMessage(wind) {
    let windNumber = wind.substring(0, wind.indexOf(' '))
    // IF NOT MPH TRANSFORM TO MPH, CHART USES MPH
    const unit = wind.split(' ').pop()
    if (unit === 'km/h') windNumber = +windNumber / 1.6
    console.log(unit)
    console.log(windNumber)

    if (windNumber < 1) return 'Calm, Smoke rises vertically'
    if (windNumber < 4)
      return 'Light air, smoke drifts with air, weather vanes inactive'
    if (windNumber < 8)
      return 'Light breeze, weather vanes active, wind felt on face, leaves rustle'
    if (windNumber < 13)
      return 'Gentle breeze, leaves & small twigs move, light flags extend'
    if (windNumber < 19)
      return 'Moderate breeze, dust & loose paper blows about'
    if (windNumber < 25)
      return 'Fresh breeze, small trees sway, waves break on inland waters'
    if (windNumber < 32)
      return 'Strong breeze, large branches sway, umbrellas difficult to use'
    if (windNumber < 39)
      return 'Moderate gale, whole trees sway, difficult to walk against wind'
    if (windNumber < 47)
      return 'Fresh gale, twigs broken off trees, walking against wind very difficult'
    if (windNumber < 55)
      return 'Strong gale, slight damage to buildings, shingles blown off roof'
    if (windNumber < 64)
      return 'Whole gale, trees uprooted, considerable damage to buildings'
    if (windNumber < 73) return 'Storm, widespread damage, very rare occurrence'
    return 'Hurricane, violent destruction'
  }

  // BACKGROUND VIDEO
  function displayBackgroundVideo(weatherData) {
    const video = document.getElementById('background-video')
    const source = video.src.split('/').pop()
    console.log(source)

    let state = getWeatherState(weatherData).toLowerCase()
    // HAZE AND FOG PLAY THE SAME VIDEO = FOG
    if (state === 'haze' || state === 'mist') state = 'fog'
    // IF WEATHER IS CLEAR OR CLOUDS AND ITS NIGHT, PLAY SPACE VIDEO
    const now = weatherData.current.dt
    const { sunrise, sunset } = weatherData.current
    if (
      (state === 'clear' || state === 'clouds') &&
      (now >= sunset || now < sunrise)
    ) {
      state = 'space'
    }
    // IF SAME VIDEO SHOULD BE LOADED RETURN
    if (source === state) {
      return
    }

    // LOAD VIDEO
    video.src = `${state}.mp4`

    // HIDE LOADING SCREEN WHEN VIDEO CAN PLAY
    video.addEventListener('canplay', hideLoadingScreen)
  }

  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.removeEventListener('canplay', hideLoadingScreen)
    loadingScreen.classList.remove('active')
  }

  function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.classList.add('active')
  }

  function metricToImperial() {
    // DOUBLE CHECK IN CASE ONE VALUE IS SOMEHOW NOT IN WEATHER DATA
    // const hour = document.querySelector(
    //   '#hours-container > .hour-item:first-of-type > p'
    // )
    // const hourUnit = hour.textContent.includes('h')
    const windSpeed = document.getElementById('wind')
    const windString = windSpeed.textContent
    const windValue = windString.substring(0, windString.indexOf(' '))
    const windUnit = windString.split(' ').pop()
    console.log(windValue)
    console.log(windUnit)
    // IF METRIC THEN CONVERT TO IMPERIAL
    if (windUnit === 'km/h') {
      windSpeed.textContent = Math.round((+windValue / 1.6) * 10) / 10
      windSpeed.textContent = `${windSpeed.textContent} mph`
    }
    console.log(windSpeed.textContent)
  }

  return { loadContent }
})()

export default dom
