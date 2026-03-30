// api.js

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const searchCard = document.getElementById('search-card');
    const resultCard = document.getElementById('result-card');
    const errorMessage = document.getElementById('error-message');
    const temperatureSpan = document.getElementById('temperature');
    const locationNameSpan = document.getElementById('location-name');
    const homeButton = document.getElementById('home-button');
    const searchButton = document.getElementById('search-button');

    // Event Viewer para a submissão do formulário
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) return;

        // Reinicia e limpa os estados de tela
        hideError();
        setLoading(true);

        try {
            // Passo 1: Obter as coordenadas (Latitude e Longitude) via Geocoding API do Open-Meteo
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`);
            
            if (!geoResponse.ok) {
                throw new Error('Falha na comunicação com o serviço de Geolocalização.');
            }

            const geoData = await geoResponse.json();

            // Caso a cidade não seja listada nas respostas
            if (!geoData.results || geoData.results.length === 0) {
                showError();
                setLoading(false);
                return;
            }

            const location = geoData.results[0];
            const latitude = location.latitude;
            const longitude = location.longitude;
            const cityName = location.name;
            const countryName = location.country;

            // Passo 2: Buscar os dados climáticos atuais a partir das coordenadas
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            
            if (!weatherResponse.ok) {
                throw new Error('Falha na comunicação com o serviço de Clima.');
            }

            const weatherData = await weatherResponse.json();
            
            // Arredonda a temperatura para melhorar a visualização (ex: 21º)
            const temperature = Math.round(weatherData.current_weather.temperature);

            // Passo 3: Transitar para a tela de Resultado atualizando a interface
            showResult(temperature, `${cityName}, ${countryName}`);

        } catch (error) {
            console.error('Erro na obtenção dos dados:', error);
            showError();
        } finally {
            setLoading(false);
        }
    });

    // Ação do Botão Voltar (Home)
    homeButton.addEventListener('click', () => {
        showSearch();
    });

    /**
     * Funções Utilitárias para Controles de Interface
     */

    function showError() {
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            searchButton.textContent = 'Buscando...';
            searchButton.disabled = true;
        } else {
            searchButton.textContent = 'Buscar';
            searchButton.disabled = false;
        }
    }

    // Alimenta os dados com a temperatura e a localização e altera exibição dos cartões
    function showResult(temp, location) {
        temperatureSpan.textContent = temp;
        locationNameSpan.textContent = location;
        
        searchCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
    }

    // Retorna para o cartão inicial, limpa o placeholder e restabelece os elementos
    function showSearch() {
        cityInput.value = '';
        hideError();
        
        resultCard.classList.add('hidden');
        searchCard.classList.remove('hidden');
        
        // Foca novamente no input para o usuário poder digitar logo de cara
        cityInput.focus();
    }
});
