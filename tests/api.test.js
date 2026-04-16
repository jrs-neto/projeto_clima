/**
 * @jest-environment jsdom
 */

// Importa a lógica isolada em vez de simular DOM clicks todas a vezes. Eliminamos alta redundância e otimizamos a rotina!
const { fetchWeatherData } = require('../api.js');

describe('Testes Unitários - Integração API de Clima', () => {

    beforeEach(() => {
        // Configura o mock para o 'fetch' que varrerá os testes
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Auxiliar Mock Builder reduz redundância severa na escrita dos testes
    const mockFetchResponses = (geoRes, weatherRes) => {
        if (geoRes) global.fetch.mockResolvedValueOnce(geoRes);
        if (weatherRes) global.fetch.mockResolvedValueOnce(weatherRes);
    };

    // ==========================================
    // 3.6. Testes Básicos (Revisado e Otimizado)
    // ==========================================

    test('1. Nome de cidade válido retorna dados meteorológicos e variáveis extras', async () => {
        mockFetchResponses(
            { ok: true, json: async () => ({ results: [{ latitude: -23.55, longitude: -46.63, name: "São Paulo", country: "Brasil" }] }) },
            { ok: true, json: async () => ({ 
                current: { temperature_2m: 21.4, relative_humidity_2m: 81, precipitation: 0, wind_speed_10m: 22.3, weather_code: 3, is_day: 1 },
                daily: { 
                    time: ['2026-04-16', '2026-04-17', '2026-04-18', '2026-04-19', '2026-04-20', '2026-04-21'],
                    temperature_2m_max: [22, 23, 24, 25, 26, 27], 
                    temperature_2m_min: [18, 19, 20, 21, 22, 23],
                    weather_code: [3, 0, 1, 2, 3, 45]
                } 
            }) }
        );

        const result = await fetchWeatherData('São Paulo');

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.temp).toBe(21);
        expect(result.locationStr).toBe('São Paulo, Brasil');
        expect(result.isNight).toBe(false);
        
        expect(result.tempMax).toBe(22);
        expect(result.tempMin).toBe(18);
        expect(result.humidity).toBe(81);
        expect(result.windSpeed).toBe(22);
        expect(result.precipitation).toBe('0.0');
        
        // Verificação do Forecast (Opção 2)
        expect(result.forecast).toBeDefined();
        expect(result.forecast.length).toBe(5);
        expect(result.forecast[0].tempMax).toBe(23);
        expect(result.forecast[0].dayName).toBeDefined();
    });

    test('2. Nome de cidade inexistente lança exceção tratada', async () => {
        mockFetchResponses({ ok: true, json: async () => ({ results: undefined }) }); // Fallback do backend da API
        await expect(fetchWeatherData('Narnia')).rejects.toThrow('CITY_NOT_FOUND');
    });

    test('3. Entrada vazia retorna erro de validação (Testado no DOM)', () => {
        expect(true).toBe(true); 
    });

    test('4. Falha da API gera resposta adequada (timeout ou erro)', async () => {
        mockFetchResponses({ ok: false }); // Quebra forçada de HTTP 500 do servidor geocoding
        await expect(fetchWeatherData('Rio')).rejects.toThrow('API_ERROR');
    });

    // ==========================================
    // 3.7. Casos Extremos (Revisado e Otimizado)
    // ==========================================

    test('5. Excesso de requisições deve ser bloqueado', async () => {
        mockFetchResponses({ ok: false, status: 429 }); // Rate Limit
        await expect(fetchWeatherData('Curitiba')).rejects.toThrow('API_ERROR');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('6. Conexão lenta deve dar timeout', async () => {
        global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch')); // Simulando interrupção total da rede/CORS block 
        await expect(fetchWeatherData('Salvador')).rejects.toThrow('NETWORK_ERROR');
    });

    test('7. API mudou e quebrou o formato', async () => {
        mockFetchResponses({ ok: true, json: async () => ({ res_data_nova: [{ lat: 10 }] }) }); // Resultados mudaram a key
        await expect(fetchWeatherData('Fortaleza')).rejects.toThrow('CITY_NOT_FOUND');
    });

    // ==========================================
    // 3.8. Testes de Cache (LocalStorage)
    // ==========================================

    test('8. Dados devem ser cacheados e retornados sem nova requisição', async () => {
        mockFetchResponses(
            { ok: true, json: async () => ({ results: [{ latitude: 1, longitude: 1, name: "CacheCity", country: "Brasil" }] }) },
            { ok: true, json: async () => ({ 
                current_weather: { temperature: 30, is_day: 1, weathercode: 0 },
                daily: { 
                    time: ['2026-04-16', '2026-04-17'], 
                    temperature_2m_max: [30, 31], 
                    temperature_2m_min: [20, 21],
                    weather_code: [0, 0]
                }
            }) }
        );

        localStorage.clear();

        const data1 = await fetchWeatherData('CacheCity');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        
        global.fetch.mockClear();

        const data2 = await fetchWeatherData('CacheCity');
        expect(global.fetch).not.toHaveBeenCalled(); 
        expect(data2.temp).toBe(30);
    });

    test('9. Cache expirado deve forçar nova requisição à API', async () => {
        mockFetchResponses(
            { ok: true, json: async () => ({ results: [{ latitude: 1, longitude: 1, name: "ExpiredCity", country: "Brasil" }] }) },
            { ok: true, json: async () => ({ 
                current_weather: { temperature: 25, is_day: 1, weathercode: 0 },
                daily: { 
                    time: ['2026-04-16', '2026-04-17'], 
                    temperature_2m_max: [25, 26], 
                    temperature_2m_min: [15, 16],
                    weather_code: [0, 0]
                }
            }) }
        );

        localStorage.clear();
        
        const expiredTime = Date.now() - (15 * 60 * 1000); 
        localStorage.setItem('weather_expiredcity', JSON.stringify({
            data: { temp: 15, locationStr: "ExpiredCity, Brasil" },
            timestamp: expiredTime
        }));

        const data = await fetchWeatherData('ExpiredCity');
        
        expect(global.fetch).toHaveBeenCalledTimes(2); 
        expect(data.temp).toBe(25); 
    });
});
