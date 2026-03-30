// api.js

// Novo: Mapa para os códigos climáticos (WMO Weather interpretation codes) do Open-Meteo para a Interface em português 
// com o respectivo ícone do Weather Icons (de acordo com dia/noite)
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
    99: { desc: 'Tempestade com granizo forte', iconDay: 'wi-day-snow-thunderstorm', iconNight: 'wi-night-alt-snow-thunderstorm' }
};

document.addEventListener('DOMContentLoaded', () => {
    // Componentes do HTML
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const searchCard = document.getElementById('search-card');
    const resultCard = document.getElementById('result-card');
    const errorMessage = document.getElementById('error-message');
    const temperatureSpan = document.getElementById('temperature');
    const locationNameSpan = document.getElementById('location-name');
    const searchButton = document.getElementById('search-button');
    const homeButton = document.getElementById('home-button');
    
    // Novos elementos visuais da melhoria
    const dateDisplay = document.getElementById('date-display');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherDescriptionSpan = document.getElementById('weather-description');
    const appBody = document.getElementById('app-body');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) return;

        hideError();
        setLoading(true);

        try {
            // ==========================================
            // ETAPA 1: Geocodificação (Obter Lat/Lon)
            // ==========================================
            let geoResponse;
            try {
                geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`);
            } catch (networkError) {
                // Tratando o erro específico de rede (CORS, sem internet em Fetch via catch)
                throw new Error('NETWORK_ERROR');
            }

            if (!geoResponse.ok) throw new Error('API_ERROR');

            const geoData = await geoResponse.json();

            // Controle para Cidades que não existem
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('CITY_NOT_FOUND');
            }

            const { latitude, longitude, name, country } = geoData.results[0];

            // ==========================================
            // ETAPA 2: Dados do Clima
            // ==========================================
            let weatherResponse;
            try {
                weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            } catch (networkError) {
                throw new Error('NETWORK_ERROR');
            }

            if (!weatherResponse.ok) throw new Error('API_ERROR');

            const weatherData = await weatherResponse.json();
            const current = weatherData.current_weather;
            const temperature = Math.round(current.temperature);
            const isDay = current.is_day === 1; // 1 = dia, 0 = noite
            const weatherCode = current.weathercode;

            // ==========================================
            // ETAPA 3: Montando Visuais e Tratamento 
            // ==========================================
            
            // Formatando e extraindo a Data Completa (Melhoria 1)
            const now = new Date();
            const fullDate = new Intl.DateTimeFormat('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }).format(now);

            // Obtendo propriedades do Clima traduzidas e mapeadas (Melhoria 2)
            const weatherInfo = weatherMap[weatherCode] || { 
                desc: 'Clima não especificado', 
                iconDay: 'wi-na', 
                iconNight: 'wi-na' 
            };
            
            const description = weatherInfo.desc;
            const iconClass = isDay ? weatherInfo.iconDay : weatherInfo.iconNight;

            // Modificando corpo para modo noturno (Melhoria 3)
            if (!isDay) {
                appBody.classList.add('night-mode');
            } else {
                appBody.classList.remove('night-mode');
            }

            // Exibindo tudo no Front-End
            showResult({
                temp: temperature,
                locationStr: `${name}, ${country}`,
                dateStr: fullDate,
                desc: description,
                iconClass: `wi ${iconClass}`
            });

        } catch (error) {
            console.error(error);
            // Mensagens específicas com base no Try-Catch customizado
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

    homeButton.addEventListener('click', () => {
        showSearch();
    });

    // Funções modulares de Interface
    function showError(customMessage) {
        if (customMessage) {
            errorMessage.textContent = customMessage;
        }
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = 'Cidade não encontrada. Tente novamente.'; // Status default
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
        
        // Atualiza a classe da tag <i> para referenciar o ícone do Weather Icons
        weatherIcon.className = data.iconClass;
        
        searchCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
    }

    function showSearch() {
        cityInput.value = '';
        hideError();
        
        resultCard.classList.add('hidden');
        searchCard.classList.remove('hidden');
        
        // Opcional: Reverter para as cores base do fundo ao voltar
        appBody.classList.remove('night-mode');
        
        cityInput.focus();
    }
});
