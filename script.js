
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const message = document.getElementById("message");

const cityName = document.getElementById("city-name");
const weatherDescription = document.getElementById("weather-description");
const weatherIcon = document.getElementById("weather-icon");

const temperature = document.getElementById("temperature");
const temperatureUnit = document.getElementById("temperature-unit");
const unitToggle = document.getElementById("unit-toggle");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");

const forecastContainer = document.getElementById("forecast-container");

let currentTemperature = null;
let currentUnit = "C";
let forecastData = [];

// Convert Celsius to Fahrenheit
function convertTemperature(celsius) {
    if (currentUnit === "C") {
        return celsius;
    }

    return (celsius * 9 / 5) + 32;
}

// Format temperature
function formatTemperature(value) {
    return Math.round(convertTemperature(value));
}

// Weather descriptions
function getWeatherDescription(code) {
    const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Freezing drizzle",
        57: "Heavy freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Heavy thunderstorm with hail"
    };

    return descriptions[code] || "Unknown weather";
}

// Weather icons
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";

    if ([51, 53, 55, 56, 57].includes(code)) {
        return "🌦️";
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "🌧️";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "❄️";
    }

    if ([95, 96, 99].includes(code)) {
        return "⛈️";
    }

    return "🌡️";
}

// Update current temperature and forecast
function updateTemperature() {
    if (currentTemperature === null) return;

    temperature.textContent = formatTemperature(currentTemperature);

    temperatureUnit.textContent =
        currentUnit === "C" ? "°C" : "°F";

    unitToggle.textContent =
        currentUnit === "C" ? "Switch to °F" : "Switch to °C";

    renderForecast();
}

// Render 5-day forecast
function renderForecast() {
    forecastContainer.innerHTML = "";

    forecastData.forEach((day) => {
        const date = new Date(day.date + "T12:00:00");

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const description = getWeatherDescription(day.code);
        const icon = getWeatherIcon(day.code);

        const maxTemp = formatTemperature(day.max);
        const minTemp = formatTemperature(day.min);

        const card = document.createElement("div");
        card.className = "forecast-card";

        const dayElement = document.createElement("div");
        dayElement.className = "forecast-day";
        dayElement.textContent = dayName;

        const iconElement = document.createElement("div");
        iconElement.className = "forecast-icon";
        iconElement.textContent = icon;

        const descriptionElement = document.createElement("div");
        descriptionElement.className = "forecast-description";
        descriptionElement.textContent = description;

        const temperaturesElement = document.createElement("div");
        temperaturesElement.className = "forecast-temperatures";

        const maxElement = document.createElement("strong");
        maxElement.textContent = `${maxTemp}°`;

        const minElement = document.createElement("span");
        minElement.className = "forecast-min";
        minElement.textContent = `${minTemp}°`;

        temperaturesElement.append(maxElement, minElement);

        card.append(
            dayElement,
            iconElement,
            descriptionElement,
            temperaturesElement
        );

        forecastContainer.appendChild(card);
    });
}

// Get weather data
async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    searchButton.disabled = true;
    message.textContent = "Loading weather data...";

    try {
        // Step 1: Get city coordinates
        const geoUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Could not connect to location service.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        // Step 2: Get weather forecast
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh&forecast_days=5&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Could not retrieve weather data.");
        }

        const weatherData = await weatherResponse.json();

        // Step 3: Update current weather
        const currentWeather = weatherData.current;

        cityName.textContent =
            `${location.name}, ${location.country}`;

        weatherDescription.textContent =
            getWeatherDescription(currentWeather.weather_code);

        weatherIcon.textContent =
            getWeatherIcon(currentWeather.weather_code);

        currentTemperature = currentWeather.temperature_2m;

        humidity.textContent =
            `${currentWeather.relative_humidity_2m}%`;

        windSpeed.textContent =
            `${currentWeather.wind_speed_10m} km/h`;

        // Step 4: Save forecast data
        forecastData = weatherData.daily.time.map((date, index) => ({
            date: date,
            code: weatherData.daily.weather_code[index],
            max: weatherData.daily.temperature_2m_max[index],
            min: weatherData.daily.temperature_2m_min[index]
        }));

        // Step 5: Update screen
        updateTemperature();

        message.textContent = "";

    } catch (error) {
        message.textContent = error.message;

        cityName.textContent = "--";
        weatherDescription.textContent = "--";
        weatherIcon.textContent = "🌡️";

        temperature.textContent = "--";
        humidity.textContent = "--%";
        windSpeed.textContent = "-- km/h";

        currentTemperature = null;
        forecastData = [];
        forecastContainer.innerHTML = "";

    } finally {
        searchButton.disabled = false;
    }
}

// Search button
searchButton.addEventListener("click", getWeather);

// Search with Enter key
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        getWeather();
    }
});

// Switch between Celsius and Fahrenheit
unitToggle.addEventListener("click", () => {
    currentUnit = currentUnit === "C" ? "F" : "C";
    updateTemperature();
});

// Load default city
cityInput.value = "Tehran";
getWeather();
