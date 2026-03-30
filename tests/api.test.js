/**
 * @jest-environment jsdom
 */

// Importa o script da API para dentro do ambiente de testes do JSDOM
require('../api.js');

describe('Testes Unitários - App de Clima', () => {
    let cityInput, searchForm, errorMessage, resultCard, temperatureSpan, searchButton;

    beforeEach(() => {
        // 1. Configurar o DOM (simulando os elementos necessários do index.html)
        document.body.innerHTML = `
            <div id="app-body"></div>
            <form id="search-form">
                <input type="text" id="city-input" />
                <button type="submit" id="search-button">Buscar</button>
            </form>
            <div id="error-message" class="hidden"></div>
            <div id="search-card"></div>
            <div id="result-card" class="hidden"></div>
            <span id="temperature">--</span>
            <div id="location-name">--</div>
            <div id="date-display">--</div>
            <i id="weather-icon"></i>
            <div id="weather-description">--</div>
            <button id="home-button"></button>
        `;

        // Atribuir referências locais para controle de teste
        cityInput = document.getElementById('city-input');
        searchForm = document.getElementById('search-form');
        errorMessage = document.getElementById('error-message');
        resultCard = document.getElementById('result-card');
        temperatureSpan = document.getElementById('temperature');
        searchButton = document.getElementById('search-button');

        // Disparar o event listener de inicialização do nosso api.js
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Mock global do Fetch API padrão do navegador
        global.fetch = jest.fn();
    });

    afterEach(() => {
        // Limpar os mocks de rede após cada teste
        jest.restoreAllMocks();
    });

    // ==========================================
    // 3.6. Testes Básicos
    // ==========================================

    test('1. Nome de cidade válido retorna dados meteorológicos', async () => {
        // Mock da requisição de Geocoding (Obtendo Coordenadas)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: [{ latitude: -23.55, longitude: -46.63, name: "São Paulo", country: "Brasil" }]
            })
        });

        // Mock da requisição de Forecast (Obtendo Clima)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                current_weather: { temperature: 21, is_day: 1, weathercode: 3 }
            })
        });

        // Submetendo...
        cityInput.value = 'São Paulo';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        // Aguardando as chamadas assíncronas
        await new Promise(process.nextTick); 
        await new Promise(process.nextTick);

        // Asserts
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(temperatureSpan.textContent).toBe('21');
        expect(resultCard.classList.contains('hidden')).toBe(false);
    });

    test('2. Nome de cidade inexistente lança exceção tratada', async () => {
        // API devolveu array vazio da cidade
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: undefined }) 
        });

        cityInput.value = 'CidadeFantasma123';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(process.nextTick);

        expect(errorMessage.classList.contains('hidden')).toBe(false);
        expect(errorMessage.textContent).toContain('A cidade digitada não existe');
    });

    test('3. Entrada vazia retorna erro de validação', async () => {
        cityInput.value = '    '; // string em branco
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        // O return antecipado da função invalida a chamada
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('4. Falha da API gera resposta adequada (timeout ou erro)', async () => {
        // API fora do ar (ex: HTTP 500)
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        cityInput.value = 'Rio de Janeiro';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(process.nextTick);

        expect(errorMessage.classList.contains('hidden')).toBe(false);
        expect(errorMessage.textContent).toContain('serviços de clima estão indisponíveis');
    });

    // ==========================================
    // 3.7. Casos Extremos
    // ==========================================

    test('5. Excesso de requisições deve ser bloqueado', async () => {
        // Simulando HTTP 429 Too Many Requests
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 429
        });

        cityInput.value = 'Curitiba';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(process.nextTick);

        // Foi bloqueado ainda no primeiro bloco e falhou
        expect(global.fetch).toHaveBeenCalledTimes(1); 
        expect(errorMessage.classList.contains('hidden')).toBe(false);
        expect(errorMessage.textContent).toContain('serviços de clima estão indisponíveis');
    });

    test('6. Conexão lenta deve dar timeout', async () => {
        // A rede caiu (CORS block, ou Wi-fi desligou) e forçou queda no tryCatch (lança um erro literal de "Failed to fetch")
        global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        cityInput.value = 'Salvador';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(process.nextTick);

        // Tratamento da rede do bloco traci acionado
        expect(errorMessage.classList.contains('hidden')).toBe(false);
        expect(errorMessage.textContent).toContain('Sem conexão com a internet');
    });

    test('7. API mudou e quebrou o formato', async () => {
        // Formatamos o JSON modificado simulando quebra de retono no results array (Ex: data = [])
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ res_data_nova: [{ lat: 10, lon: 20 }] }) 
        });

        cityInput.value = 'Fortaleza';
        searchForm.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(process.nextTick);

        // Ao quebrar, o fallback processa como cidade inexistente pelo TRACI
        expect(errorMessage.classList.contains('hidden')).toBe(false);
        expect(errorMessage.textContent).toContain('A cidade digitada não existe');
    });
});
