import { debounce, remove } from 'lodash'
import weather from './weather'
// TODO: add visibility
// TODO: celsius to kelvin
// TODO: google location
// TODO: mobile optimization
// TODO: form validation ON SUBMIT
// TODO: 3600 offset for +-12/11 zones
// TODO: add FAVORITES
// TODO: add VIEW
// TODO: clean code
const dom = (() => {
  function loadContent() {
    showLoadingScreen()
    displayWeatherContentSubmit('Zagreb')
    initLocationSearch()
    initLocationAutocomplete()
  }

  // DEBOUNCE FUNCTIONs FOR AUTOCOMPLETE, IF LOCATION IS LOADED, THIS/AUTOCOMPLETE GETS CANCELED
  const onFinishTyping = debounce(displayAutocomplete, 750)

  // LOCATION SEARCH
  function initLocationSearch() {
    const form = document.getElementById('location-form')
    const searchButton = document.getElementById('search-button')

    form.addEventListener('submit', handleSearchSubmit)
    searchButton.addEventListener('click', handleSearchSubmit)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()

    onFinishTyping.cancel()
    showLoadingScreen()

    const locationInput = document.getElementById('location-input')
    const searchedLocation = locationInput.value
    displayWeatherContentSubmit(searchedLocation)
  }

  // LOCATION SEARCH AUTOCOMPLETE
  function initLocationAutocomplete() {
    const locationInput = document.getElementById('location-input')
    locationInput.addEventListener('input', handleAutocomplete)
  }

  function handleAutocomplete(e) {
    if (e.target.value === '') {
      hideSuggestions()
      hideSearchErrorMessage()
      return
    }
    const formattedSearch = formatInput(e.target.value)
    console.log(formattedSearch)
    onFinishTyping(formattedSearch)
  }

  async function displayAutocomplete(query) {
    const suggestions = await weather.getAutocompleteData(query)
    console.log(suggestions)
    loadSuggestions(suggestions)
    initSuggestions(suggestions)
  }

  function loadSuggestions(suggestions) {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')

    for (let i = 0; i < 5; i += 1) {
      // IF SUGGESTION OF i IS AVAILABLE, FILL ITS TEXT CONTENT AND DISPLAY IT'S ELEMENT
      if (suggestions[i]) {
        suggestionItems[i].textContent = getSuggestionText(
          suggestions[i].properties
        )
        showSuggestion(suggestionItems[i])
      }
      // IF SUGGESTION OF i IS NOT AVAILABLE HIDE IT'S ELEMENT
      else {
        hideSuggestion(suggestionItems[i])
      }
    }

    if (!suggestions.length) {
      showSearchErrorMessage()
    }
  }

  function getSuggestionText(suggestionObj) {
    // SUGGESTION TEXT
    const { name, country, region } = suggestionObj
    if (name === country) return name
    return `${name}, ${region}, ${country}`
  }

  function showSuggestion(el) {
    // SHOW SUGGESTION ELEMENT
    el.classList.add('active')
  }

  function hideSuggestion(el) {
    el.classList.remove('active')
  }

  function initSuggestions(suggestions) {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    suggestionItems.forEach((item) => {
      item.suggestions = suggestions
      item.removeEventListener('click', handleSuggestionClick)
      item.addEventListener('click', handleSuggestionClick)
    })
  }

  function handleSuggestionClick(e) {
    // GET COORDINATES FROM SUGGESTION LOCATION
    const { suggestions } = e.currentTarget
    const index = [...this.parentNode.children].indexOf(this)
    const [lon, lat] = suggestions[index].geometry.coordinates
    // GET ONLY MAIN LOCATION NAME
    const { name } = suggestions[index].properties
    // DISPLAY CONTENT
    showLoadingScreen()
    displayInInput(this.textContent)
    displayWeatherContentSuggestion({ lat, lon }, name)
  }

  function hideSuggestions() {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    onFinishTyping.cancel()
    suggestionItems.forEach((item) => {
      item.classList.remove('active')
    })
  }

  function displayInInput(location) {
    const locationInput = document.getElementById('location-input')
    locationInput.value = location
  }

  // FORM VALIDATION
  function formatInput(value) {
    const regex = /[^A-Za-z, -]/g
    let formattedValue = value.replace(regex, '')
    if (formattedValue.includes(',')) {
      formattedValue = formattedValue.substring(0, formattedValue.indexOf(','))
    }
    return formattedValue
  }

  function hideSearchErrorMessage() {
    const errorMessage = document.getElementById('error-message')
    errorMessage.classList.remove('active')
  }

  function showSearchErrorMessage(errorString) {
    const errorMessage = document.getElementById('error-message')
    if (errorString === 'invalid') {
      errorMessage.textContent = 'Please enter a valid city or country.'
    }
    if (errorString === 'missing') {
      errorMessage.textContent = 'Please enter a city or country.'
    }
    errorMessage.classList.add('active')
  }

  // DISPLAY ALL WEATHER CONTENT
  async function displayWeatherContentSubmit(location) {
    hideSuggestions()
    // await new Promise((resolve) => setTimeout(resolve, 950))
    const closestLocation = await weather.getAutocompleteData(location)
    console.log(closestLocation)

    if (!closestLocation.length || closestLocation === 'error') {
      if (!closestLocation.length && location === '')
        showSearchErrorMessage('missing')
      else showSearchErrorMessage('invalid')

      hideLoadingScreen()
    } else {
      hideSearchErrorMessage()
    }

    const [lon, lat] = closestLocation[0].geometry.coordinates
    const coords = { lat, lon }
    const weatherData = await weather.getForecastData(coords)
    const { name, country_code: countryCode } = closestLocation[0].properties
    weatherData.name = `${name}, ${countryCode}`
    // MAKE COUNTRY OPTIONAL FOR NON RECOGNIZED STATES SUCH AS KOSOVO

    console.log(weatherData)

    if (weatherData === 'error') {
      const error = true
      showSearchErrorMessage(null, error)
      hideLoadingScreen()
      return
    }
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
    displayDailyContent(weatherData)
    displayTechnicalContent(weatherData)
  }

  async function displayWeatherContentSuggestion(coords, cityName) {
    hideSuggestions()
    const weatherData = await weather.getForecastData(coords)
    weatherData.name = cityName
    console.log(weatherData)
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
    displayDailyContent(weatherData)
    displayTechnicalContent(weatherData)
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
    hourEl.textContent = `${+hour} h`
    hourEl.dataset.hourlyHour = ''
    hourEl.classList.add('hour-hour')

    const logoEl = document.createElement('img')
    logoEl.src = mainDesc
    logoEl.classList.add('hour-logo')

    const tempEl = document.createElement('p')
    tempEl.textContent = temp
    tempEl.dataset.hourTemp = ''
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
    tempMinEl.dataset.dayMinTemp = ''
    tempMinEl.classList.add('day-temp-min')

    const tempMaxEl = document.createElement('p')
    tempMaxEl.textContent = Math.round(day.temp.max)
    tempMaxEl.dataset.dayMaxTemp = ''
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

    unitSwitch(true)
    unitSwitch(true)
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
    indexEl.id = 'wind-value'
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
    indexEl.textContent = `${sunrise} h`
    indexEl.id = 'sunrise-value'
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
    indexEl.textContent = `${sunset} h`
    indexEl.id = 'sunset-value'
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

    const messageEl = document.createElement('p')
    messageEl.textContent = pressureMessage(pressure)
    messageEl.classList.add('card-text')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)
    card.appendChild(messageEl)

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

    if (windNumber < 1) return 'Calm, Smoke rises vertically.'
    if (windNumber < 4)
      return 'Light air, smoke drifts with air, weather vanes inactive.'
    if (windNumber < 8)
      return 'Light breeze, weather vanes active, wind felt on face, leaves rustle.'
    if (windNumber < 13)
      return 'Gentle breeze, leaves & small twigs move, light flags extend.'
    if (windNumber < 19)
      return 'Moderate breeze, dust & loose paper blows about.'
    if (windNumber < 25)
      return 'Fresh breeze, small trees sway, waves break on inland waters.'
    if (windNumber < 32)
      return 'Strong breeze, large branches sway, umbrellas difficult to use.'
    if (windNumber < 39)
      return 'Moderate gale, whole trees sway, difficult to walk against wind.'
    if (windNumber < 47)
      return 'Fresh gale, twigs broken off trees, walking against wind very difficult.'
    if (windNumber < 55)
      return 'Strong gale, slight damage to buildings, shingles blown off roof.'
    if (windNumber < 64)
      return 'Whole gale, trees uprooted, considerable damage to buildings.'
    if (windNumber < 73)
      return 'Storm, widespread damage, very rare occurrence.'
    return 'Hurricane, violent destruction.'
  }

  function pressureMessage(pressure) {
    const pressureValue = pressure.substring(0, pressure.indexOf(' '))
    if (+pressureValue > 1022) {
      return `Atmospheric pressure is high.`
    }
    if (+pressureValue > 1009 && +pressure <= 1022) {
      return `Atmospheric pressure is normal.`
    }
    return `Atmospheric pressure is low.`
  }

  // BACKGROUND VIDEO
  function displayBackgroundVideo(weatherData) {
    const video = document.getElementById('background-video')
    const source = video.src.split('/').pop()
    console.log(source)

    let state = getWeatherState(weatherData).toLowerCase()
    // HAZE, MIST AND FOG PLAY THE SAME VIDEO = FOG
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

  // LOADING SCREEN
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.removeEventListener('canplay', hideLoadingScreen)
    loadingScreen.classList.remove('active')
  }

  function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.classList.add('active')
  }

  // UNIT SWITCH

  function unitSwitch(bool) {
    // BOOL IS USED FOR NOT RUNNING THE FUNCTION ON LOAD
    if (!bool) return

    const wind = document.getElementById('wind-value')
    // IF METRIC SWITCH TO IMPERIAL, IF NOT METRIC SWITCH TO METRIC
    if (isMetric()) {
      wind.textContent = windToImperial(wind)
      allTimeToAmPm()
      allTempToFahrenheit()
    } else {
      wind.textContent = windToMetric(wind)
      allTimeToMilitary()
      allTempToMetric()
    }
  }

  function isMetric() {
    // 2 TESTS INCLUDED IN CASE ONE PART OF WEATHER DATA IS MISSING
    // HOUR UNIT TEST
    const hours = document.getElementById('hours-container')
    const hourTime = hours.children[1].children[0].textContent
    const hourTimeUnit = hourTime.charAt(hourTime.length - 1)
    console.log(hourTimeUnit)
    // WIND UNIT TEST
    const windSpeed = document.getElementById('wind-value')
    const windString = windSpeed.textContent
    const windUnit = windString.split(' ').pop()
    // TEST
    if (hourTimeUnit === 'h' || windUnit === 'km/h') return true
    return false
  }

  // IMPERIAL

  function windToImperial(windEl) {
    const windText = windEl.textContent
    const windValue = windText.substring(0, windText.indexOf(' '))
    let windImperial = Math.round((+windValue / 1.6) * 10) / 10
    windImperial = `${windImperial} mph`
    return windImperial
  }

  function allTimeToAmPm() {
    const sunrise = document.getElementById('sunrise-value')
    const sunset = document.getElementById('sunset-value')
    const hourlyHours = document.querySelectorAll('[data-hourly-hour]')

    sunrise.textContent = fullTimeToAmPm(sunrise.textContent)
    sunset.textContent = fullTimeToAmPm(sunset.textContent)
    hourlyHours.forEach((hour) => {
      hour.textContent = hourToAmPm(hour.textContent)
    })
  }

  function fullTimeToAmPm(time) {
    const timeForm = removeAlpha(time)
    let hour = timeForm.substring(0, timeForm.indexOf(':'))
    const minutes = timeForm.substring(timeForm.indexOf(':') + 1)
    if (+hour - 12 >= 0) {
      hour -= 12
      return `${hour}:${minutes} pm`
    }
    return `${hour}:${minutes} am`
  }

  function hourToAmPm(time) {
    let hour = removeAlpha(time)
    if (+hour - 12 >= 0) {
      hour -= 12
      return `${hour} pm`
    }
    return `${hour} am`
  }

  function allTempToFahrenheit() {
    const main = document.getElementById('temperature')
    const hourlyHoursTemps = document.querySelectorAll('[data-hour-temp]')
    const dailyMinTemps = document.querySelectorAll('[data-day-min-temp]')
    const dailyMaxTemps = document.querySelectorAll('[data-day-max-temp]')

    main.textContent = tempToFahrenheit(main.textContent)
    hourlyHoursTemps.forEach((hour) => {
      hour.textContent = tempToFahrenheit(hour.textContent)
    })
    dailyMinTemps.forEach((day) => {
      day.textContent = tempToFahrenheit(day.textContent)
    })
    dailyMaxTemps.forEach((day) => {
      day.textContent = tempToFahrenheit(day.textContent)
    })
  }

  function tempToFahrenheit(value) {
    return Math.round(+value * 1.8 + 32)
  }

  // METRIC

  function windToMetric(windEl) {
    const windText = windEl.textContent
    const windValue = windText.substring(0, windText.indexOf(' '))
    let windMetric = Math.round(+windValue * 1.6 * 10) / 10
    windMetric = `${windMetric} km/h`
    return windMetric
  }

  function allTimeToMilitary() {
    const sunrise = document.getElementById('sunrise-value')
    const sunset = document.getElementById('sunset-value')
    const hourlyHours = document.querySelectorAll('[data-hourly-hour]')

    sunrise.textContent = fullTimeToMilitary(sunrise.textContent)
    sunset.textContent = fullTimeToMilitary(sunset.textContent)
    hourlyHours.forEach((hour) => {
      hour.textContent = hourToMilitary(hour.textContent)
    })
  }

  function fullTimeToMilitary(time) {
    const [hours, minutesAmPm] = time.split(':')
    const minutes = minutesAmPm.slice(0, 2) // remove the "AM" or "PM" suffix from the minutes
    const amPm = minutesAmPm.slice(-2)
    // Convert the hours to an integer
    let militaryHours = parseInt(hours, 10)
    // If the time is in the afternoon (PM), add 12 to the hours
    if (amPm === 'PM' && militaryHours !== 12) {
      militaryHours += 12
    }
    // If the time is at midnight (12:00 AM), subtract 12 from the hours
    if (amPm === 'AM' && militaryHours === 12) {
      militaryHours = 0
    }

    return `${militaryHours}:${minutes} h`
  }

  function hourToMilitary(time) {
    const [hours, amPm] = time.split(':')
    // Convert the hours to an integer
    let militaryHours = parseInt(hours, 10)
    // If the time is in the afternoon (PM), add 12 to the hours
    if (amPm === 'PM' && militaryHours !== 12) {
      militaryHours += 12
    }
    // If the time is at midnight (12:00 AM), subtract 12 from the hours
    if (amPm === 'AM' && militaryHours === 12) {
      militaryHours = 0
    }

    return `${militaryHours} h`
  }

  function allTempToMetric() {
    const main = document.getElementById('temperature')
    const hourlyHoursTemps = document.querySelectorAll('[data-hour-temp]')
    const dailyMinTemps = document.querySelectorAll('[data-day-min-temp]')
    const dailyMaxTemps = document.querySelectorAll('[data-day-max-temp]')

    main.textContent = tempToMetric(main.textContent)
    hourlyHoursTemps.forEach((hour) => {
      hour.textContent = tempToMetric(hour.textContent)
    })
    dailyMinTemps.forEach((day) => {
      day.textContent = tempToMetric(day.textContent)
    })
    dailyMaxTemps.forEach((day) => {
      day.textContent = tempToMetric(day.textContent)
    })
  }

  function tempToMetric(temp) {
    const tempInt = parseInt(temp, 10)
    return Math.round(((tempInt - 32) * 0.5556 * 10) / 10).toString()
  }

  function removeAlpha(string) {
    const regex = /[^0-9:]/g
    return string.replace(regex, '')
  }

  return { loadContent }
})()

export default dom
