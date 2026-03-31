/**
 * @fileoverview Lógica isolada para consumo da API Open-Meteo e manipulação do DOM do app de Clima.
 */

const weatherMap = {
    0: { desc: 'Céu limpo', iconDay: 'wi-day-sunny', iconNight: 'wi-night-clear' },
    1: { desc: 'Maior parte claro', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' },
    2: { desc: 'Parcialmente nublado', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' },
    3: { desc: 'Nublado', iconDay: 'wi-cloudy', iconNight: 'wi-cloudy' },
    45: { desc: 'Neblina', iconDay: 'wi-day-fog', iconNight: 'wi-night-fog' },
    48: { desc: 'Nevoeiro', iconDay: 'wi-day-fog', iconNight: 'wi-night-fog' },
    51: { desc: 'Garoa leve', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    53: { desc: 'Garoa', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    55: { desc: 'Garoa forte', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    61: { desc: 'Chuva leve', iconDay: 'wi-day-rain', iconNight: 'wi-night-alt-rain' },
    63: { desc: 'Chuva', iconDay: 'wi-day-rain', iconNight: 'wi-night-alt-rain' },
    65: { desc: 'Chuva forte', iconDay: 'wi-day-rain', iconNight: 'wi-night-alt-rain' },
    71: { desc: 'Neve leve', iconDay: 'wi-day-snow', iconNight: 'wi-night-alt-snow' },
    73: { desc: 'Neve', iconDay: 'wi-day-snow', iconNight: 'wi-night-alt-snow' },
    75: { desc: 'Neve forte', iconDay: 'wi-day-snow', iconNight: 'wi-night-alt-snow' },
    80: { desc: 'Pancadas de chuva leve', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    81: { desc: 'Pancadas de chuva', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    82: { desc: 'Pancadas de chuva forte', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    95: { desc: 'Tempestade', iconDay: 'wi-day-thunderstorm', iconNight: 'wi-night-alt-thunderstorm' },
    96: { desc: 'Tempestade com granizo', iconDay: 'wi-day-snow-thunderstorm', iconNight: 'wi-night-alt-snow-thunderstorm' },
    99: { desc: 'Tempestade forte', iconDay: 'wi-day-snow-thunderstorm', iconNight: 'wi-night-alt-snow-thunderstorm' }
};

/**
 * Realiza a busca e o tratamento dos dados meteorológicos de uma cidade específica.
 * Consome a Geocoding API para traduzir o nome da cidade em coordenadas, validando perdas sistêmicas,
 * e a Forecast API para buscar o clima atual daquelas coordenadas.
 * 
 * @async
 * @function fetchWeatherData
 * @param {string} city - Nome da cidade a ser pesquisada (exemplo: "São Paulo").
 * @returns {Promise<{temp: number, tempMax: number, tempMin: number, humidity: number, windSpeed: number, precipitation: string, locationStr: string, dateStr: string, desc: string, iconClass: string, isNight: boolean}>}
 * Promessa resolvida com os dados climáticos formatados e traduzidos para a UI.
 * 
 * @throws {Error} Lança 'NETWORK_ERROR' se a requisição falhar estritamente por falta de conectividade ou CORS.
 * @throws {Error} Lança 'API_ERROR' se o servidor Open-Meteo responder com erros (ex: falhas gerais ou Rate Limit 429).
 * @throws {Error} Lança 'CITY_NOT_FOUND' se a pesquisa não retornar resultados válidos na geolocalização.
 * 
 * @example
 * // Utilização típica dentro de um bloco Async Try-Catch para alimentar o Frontend:
 * try {
 *     const data = await fetchWeatherData("Paris");
 *     console.log(data.temp);         // Ex: 15
 *     console.log(data.desc);         // Ex: "Céu limpo"
 *     console.log(data.locationStr);  // Ex: "Paris, France"
 * } catch (error) {
 *     if (error.message === 'CITY_NOT_FOUND') {
 *         console.error("Cidade ausente!");
 *     }
 * }
 */
async function fetchWeatherData(city) {
    const cacheKey = `weather_${city.toLowerCase()}`;
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

    if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data; // Retorna do cache se não expirado
                }
            } catch (e) {
                // Em caso de erro ao ler do localStorage, ignora a re-consulta
                console.warn("Falha ao ler cache, efetuando nova busca.", e);
            }
        }
    }

    let geoResponse;
    try {
        geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`);
    } catch (networkError) {
        throw new Error('NETWORK_ERROR');
    }

    if (!geoResponse.ok) throw new Error('API_ERROR');

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error('CITY_NOT_FOUND');
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    let weatherResponse;
    try {
        weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
    } catch (networkError) {
        throw new Error('NETWORK_ERROR');
    }

    if (!weatherResponse.ok) {
        throw new Error('API_ERROR');
    }

    const weatherData = await weatherResponse.json();
    
    // Tratamento híbrido para manter compatibilidade estrita com testes antigos usando current_weather
    const current = weatherData.current || weatherData.current_weather || {};
    const daily = weatherData.daily || {};
    
    const isDay = current.is_day === 1;

    // Variáveis Meteorológicas Adicionais
    const tempValue = current.temperature_2m ?? current.temperature ?? 0;
    const weatherCode = current.weather_code ?? current.weathercode;
    
    const humidity = current.relative_humidity_2m ?? 0;
    const windSpeed = current.wind_speed_10m ?? 0;
    const precipitation = current.precipitation ?? 0;
    
    const tempMax = daily.temperature_2m_max ? daily.temperature_2m_max[0] : tempValue;
    const tempMin = daily.temperature_2m_min ? daily.temperature_2m_min[0] : tempValue;

    // Formatação de Datas
    const now = new Date();
    const fullDate = new Intl.DateTimeFormat('pt-BR', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    }).format(now);

    const weatherInfo = weatherMap[weatherCode] || { desc: 'Clima não especificado', iconDay: 'wi-na', iconNight: 'wi-na' };
    
    const result = {
        temp: Math.round(tempValue),
        tempMax: Math.round(tempMax),
        tempMin: Math.round(tempMin),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        precipitation: Number(precipitation).toFixed(1),
        locationStr: `${name}, ${country}`,
        dateStr: fullDate,
        desc: weatherInfo.desc,
        iconClass: `wi ${isDay ? weatherInfo.iconDay : weatherInfo.iconNight}`,
        isNight: !isDay
    };

    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: result,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn("Não foi possível salvar no cache térmico do LocalStorage", e);
        }
    }

    return result;
}

// Inicia as propriedades de UI apenas se manipuladas no Navegador
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const searchForm = document.getElementById('search-form');
        const cityInput = document.getElementById('city-input');
        const searchCard = document.getElementById('search-card');
        const resultCard = document.getElementById('result-card');
        const errorMessage = document.getElementById('error-message');
        const temperatureSpan = document.getElementById('temperature');
        const locationNameSpan = document.getElementById('location-name');
        const searchButton = document.getElementById('search-button');
        const homeButton = document.getElementById('home-button');
        const dateDisplay = document.getElementById('date-display');
        const weatherIcon = document.getElementById('weather-icon');
        const weatherDescriptionSpan = document.getElementById('weather-description');
        const appBody = document.getElementById('app-body');
        
        // Elementos avançados
        const tempMaxSpan = document.getElementById('temp-max');
        const tempMinSpan = document.getElementById('temp-min');
        const humiditySpan = document.getElementById('humidity-detail');
        const windSpan = document.getElementById('wind-detail');
        const precipSpan = document.getElementById('precip-detail');

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const city = cityInput.value.trim();
            if (!city) return;

            hideError();
            setLoading(true);

            try {
                // A funcionalidade inteira foi extraída! O código de manipulação gráfica de DOM agora fica incrivelmente legível;
                const data = await fetchWeatherData(city);
                
                if (data.isNight) appBody.classList.add('night-mode');
                else appBody.classList.remove('night-mode');

                showResult(data);
            } catch (error) {
                console.error(error);
                if (error.message === 'NETWORK_ERROR') {
                    showError('Sem conexão com a internet ou rede bloqueada.');
                } else if (error.message === 'API_ERROR') {
                    showError('Os serviços de clima estão indisponíveis no momento.');
                } else if (error.message === 'CITY_NOT_FOUND') {
                    showError('A cidade digitada não existe. Verifique o nome.');
                } else {
                    showError('Aconteceu um erro inesperado. Tente novamente.');
                }
            } finally {
                setLoading(false);
            }
        });

        homeButton.addEventListener('click', () => showSearch());

        // Escopo gráfico abstraído
        function showError(customMessage) {
            if (customMessage) errorMessage.textContent = customMessage;
            errorMessage.classList.remove('hidden');
        }

        function hideError() {
            errorMessage.classList.add('hidden');
            errorMessage.textContent = 'Cidade não encontrada. Tente novamente.'; 
        }

        function setLoading(isLoading) {
            searchButton.textContent = isLoading ? 'Buscando...' : 'Buscar';
            searchButton.disabled = isLoading;
        }

        function showResult(data) {
            temperatureSpan.textContent = data.temp;
            locationNameSpan.textContent = data.locationStr;
            dateDisplay.textContent = data.dateStr;
            weatherDescriptionSpan.textContent = data.desc;
            weatherIcon.className = data.iconClass;
            
            // Injeção de variáveis avançadas
            if (tempMaxSpan) tempMaxSpan.textContent = `${data.tempMax}º`;
            if (tempMinSpan) tempMinSpan.textContent = `${data.tempMin}º`;
            if (humiditySpan) humiditySpan.textContent = `${data.humidity}%`;
            if (windSpan) windSpan.textContent = `${data.windSpeed} km/h`;
            if (precipSpan) precipSpan.textContent = `${data.precipitation} mm`;
            
            searchCard.classList.add('hidden');
            resultCard.classList.remove('hidden');
        }

        function showSearch() {
            cityInput.value = '';
            hideError();
            resultCard.classList.add('hidden');
            searchCard.classList.remove('hidden');
            appBody.classList.remove('night-mode');
            cityInput.focus();
        }
    });
}

// Exportando os módulos criados para uso seguro nos testes do NodeJS nativo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchWeatherData, weatherMap };
}
