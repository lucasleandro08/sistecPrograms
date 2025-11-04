import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig.js';

/**
 * Configura o Swagger UI no Express
 * @param {Express} app - Instância do Express
 */
const setupSwagger = (app) => {
  // Customização do Swagger UI com as cores do seu branding
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { 
        background-color: #0b1b3a; 
        padding: 16px 0;
      }
      .swagger-ui .topbar-wrapper img {
        content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><text x="0" y="20" font-family="Arial" font-size="18" fill="%23d4af37" font-weight="bold">Sistec API</text></svg>');
      }
      .swagger-ui .info .title {
        color: #0b1b3a;
        font-size: 36px;
      }
      .swagger-ui .info .description {
        color: #555;
        line-height: 1.6;
      }
      .swagger-ui .opblock-tag {
        border-color: #d4af37;
        color: #0b1b3a;
        font-size: 18px;
      }
      .swagger-ui .opblock-tag:hover {
        background: rgba(212, 175, 55, 0.1);
      }
      .swagger-ui .opblock {
        border-color: #e0e0e0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 16px;
        border-radius: 8px;
      }
      .swagger-ui .opblock .opblock-summary {
        border-radius: 8px;
      }
      .swagger-ui .btn.authorize {
        background-color: #d4af37;
        border-color: #d4af37;
        color: #0b1b3a;
        font-weight: bold;
      }
      .swagger-ui .btn.authorize:hover {
        background-color: #c19b2f;
        border-color: #c19b2f;
      }
      .swagger-ui .btn.execute {
        background-color: #0b1b3a;
        border-color: #0b1b3a;
        color: #fff;
      }
      .swagger-ui .btn.execute:hover {
        background-color: #0a1530;
        border-color: #0a1530;
      }
      .swagger-ui .response-col_status {
        color: #d4af37;
        font-weight: bold;
      }
      .swagger-ui .opblock.opblock-post {
        border-color: #49cc90;
        background: rgba(73, 204, 144, 0.05);
      }
      .swagger-ui .opblock.opblock-get {
        border-color: #61affe;
        background: rgba(97, 175, 254, 0.05);
      }
      .swagger-ui .opblock.opblock-put {
        border-color: #fca130;
        background: rgba(252, 161, 48, 0.05);
      }
      .swagger-ui .opblock.opblock-delete {
        border-color: #f93e3e;
        background: rgba(249, 62, 62, 0.05);
      }
      .swagger-ui .scheme-container {
        background: #fafafa;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
    `,
    customSiteTitle: "API Sistec - Documentação Interativa",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 3,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      }
    }
  };

  // Rota principal do Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Rota para obter a especificação JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger configurado com sucesso!');
};

// ← REMOVA esta linha (se tiver):
// export const setupSwagger = (app) => { ... }

// ← Deixe APENAS isso:
export default setupSwagger;
