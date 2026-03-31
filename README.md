# Projeto de Previsão de Clima 🌤️

<br />

<div align="center">
	<img src="https://i.imgur.com/r9lrbPG.png" title="source: imgur.com" width="35%"/>
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/github/languages/top/jrs-neto/projeto_clima?style=flat-square" />
  <img src="https://img.shields.io/github/repo-size/jrs-neto/projeto_clima?style=flat-square" />
  <img src="https://img.shields.io/github/languages/count/jrs-neto/projeto_clima?style=flat-square" />
  <img src="https://img.shields.io/github/last-commit/jrs-neto/projeto_clima?style=flat-square" />
    <br />
  <img src="https://img.shields.io/github/issues/jrs-neto/projeto_clima?style=flat-square" />
  <img src="https://img.shields.io/github/issues-pr/jrs-neto/projeto_clima?style=flat-square" />
  <img src="https://img.shields.io/badge/bootcamp-Generation%20Brasil-orange?style=flat-square"/>
</div>

------

<br />

## 🎯 Sobre o Projeto

O aplicativo **Previsão do Tempo** tem como objetivo principal fornecer aos usuários informações meteorológicas precisas e atualizadas em tempo real de forma objetiva. Desenvolvido em **JavaScript Puro (Vanilla)**, o projeto foca em alta performance, responsividade gráfica e robustez de fluxo, utilizando as plataformas gratuitas da Open-Meteo.

<br />

## ✨ Funcionalidades Implementadas

- **Pesquisa por Cidades:** O usuário pode digitar o nome de qualquer cidade para obter a previsão do clima de forma ágil através de formulários clean.
- **Integração em 2 Etapas:** Consumo e cascateamento da *Geocoding API* para obter as coordenadas (Latitude/Longitude precisas do nome) e, em seguida, disparo na *Forecast API* para obter a previsão daquele exato local.
- **Modo Noturno Automático Dinâmico:** A interface gráfica se adapta com um tema de degradê escuro automaticamente se a métrica atual daquela cidade lida no momento da consulta indicar período noturno.
- **Ícones Atmosféricos Mapeados:** Interface reativa implementando a biblioteca de vetores *Weather Icons*, que alterna em dezenas de animações conforme o código meteorológico (sol pleno, chuva fraca, neve moderada, tempestade com granizo, etc).
- **Tratamento de Exceções Base (Modelo TRACI):** Informações de alertas em tela contra falhas do fornecimento de clima, perda intermitente de conexão ou limites abusivos.

<br />

## 🛠️ Tecnologias e Dependências

- **Módulo Front-End Estático:** HTML5 semântico, CSS3 Vars e JavaScript PURO (ES6+). Sem dependência de bibliotecas web adicionais (como React, Angular Vanilla é 100% suficiente).
- **Recursos Visuais:** Tipografia [Google Fonts (Inter)](https://fonts.google.com/) e iconografias [Weather Icons](https://erikflowers.github.io/weather-icons/).
- **Dependência de Análise (Desenvolvimento):** [Jest](https://jestjs.io/pt-BR/) e módulo acoplado `jest-environment-jsdom` utilizado exclusivamente para simulações e rotinas de Q&A (Quality Assurance).

<br />

## 🚀 Como Executar o Projeto (Instruções de Instalação e Uso)

Por conta de a aplicação ter sido inteiramente estruturada com arquivos nativos da web, é dispensável o uso de configurações e inicialização de servidores pesados.

1. **Clone do Repositório Localmente**
   Faça um diretório na sua máquina e utilize o git clone da pasta fonte do seu repositório:
   ```bash
   git clone https://github.com/jrs-neto/projeto_clima.git
   ```

2. **Abra e Use**
   Basta selecionar o arquivo raiz `index.html` e executá-lo num browser moderno de sua preferência (Google Chrome, Firefox, Microsoft Edge, Safari). Não requer npm configs para executar a UI.

3. **Consulte o Tempo**
   Centralizado pela página de Início, digite o nome de qualquer munícipio ou Estado mundial na caixa de Input e clique em **Buscar**.

<br />

## 🧪 Como Executar os Testes Unitários

As coberturas automatizadas de testes foram elaboradas através da ferramenta livre **Jest**. Para atestar as seguranças de integração, mock inputs das APIS (ex: Retornos de falha de conexão 500, status excedido de rotina 429 ou array ausente de dados da geologia), acompanhe as instruções:

1. **Configuração de Pacotes**
   No terminal raiz do seu projeto local recém-clonado, onde repousa o diretório de arquivos Node, faça a seguinte requisição para injetar os simuladores e ferramentas (apenas um uso):
   ```bash
   npm install --save-dev jest-environment-jsdom
   ```

2. **Rotina de Validação Automática**
   Constatada e atestada a instalação da pasta Node Modules:
   ```bash
   npm test
   ```

<br />

## 📖 Documentação da API Climatológica Secundária (via JSDoc)

O script principal do projeto (`api.js`) detém de forma modular e isolada toda a mecânica de manipulação sistêmica e de dados (API). Esse *coração* do app encontra-se documentado sob as regras oficiais de **JSDoc** na função auto-suficiente: `fetchWeatherData()`

```javascript
/**
 * Realiza a busca e o tratamento dos dados meteorológicos de uma cidade específica.
 * Consome a Geocoding API para traduzir o nome da cidade em coordenadas geográficas, 
 * validando perdas sistêmicas, e a Forecast API para descobrir o clima atual do alvo.
 * 
 * @async
 * @function fetchWeatherData
 * @param {string} city - Nome da cidade a ser pesquisada (exemplo: "São Paulo").
 * @returns {Promise<{temp: number, locationStr: string, dateStr: string, desc: string, iconClass: string, isNight: boolean}>}
 * Promessa resolvida com os dados climáticos devidamente formatados e traduzidos para a injestão segura dos campos gráficos da UI (DOM).
 * 
 * @throws {Error} Lança TypeError 'NETWORK_ERROR' se a requisição falhar estritamente por falta de TCP de rede (CORS/Offline).
 * @throws {Error} Lança 'API_ERROR' se o servidor Open-Meteo responder com erros em massa (Status >= 400 ou Rate Limit Blocked 429).
 * @throws {Error} Lança 'CITY_NOT_FOUND' se a API devolver arrays ilegítimos (A pesquisa ikke contém a cidade).
 * 
 * @example
 * // Exemplo simples do encadear de blocos
 * try {
 *     const data = await fetchWeatherData("Paris");
 *     console.log(data.temp);         // Retorno: 15
 *     console.log(data.desc);         // Retorno: "Céu limpo"
 *     console.log(data.locationStr);  // Retorno: "Paris, France"
 *     console.log(data.isNight);      // Retorno: false
 * } catch (error) {
 *     if (error.message === 'CITY_NOT_FOUND') {
 *         alert("Esta cidade não existe ou é inválida.");
 *     } else {
 *         console.error("Erro Crítico de Rotina de Busca:", error.message);
 *     }
 * }
 */
```

<br />

## 🤝 Contribuições

Este projeto possui fins educacionais e de desenvolvimento, mas contribuições são muito bem-vindas. Você pode contribuir de várias formas:

- Abrindo uma **issue**
- Enviando um **pull request**
- Sugerindo melhorias no código ou na interface
- Compartilhando com pessoas que estão aprendendo **JavaScript**

<br />

## ⚖️ Licença de Distribuição

Este projeto está licenciado sob a licença **MIT**. Sinta-se livre para estudar, modificar e reutilizar o código. Total liberdade para alterações visuais, distribuições próprias de clonagem ou melhorias por desenvolvedores da Web!

<br />

## 📞 Contato

Desenvolvido por [**José**](https://github.com/jrs-neto)
Para dúvidas, sugestões ou colaborações, utilize as **issues do GitHub** ou entre em contato diretamente pelo perfil.
