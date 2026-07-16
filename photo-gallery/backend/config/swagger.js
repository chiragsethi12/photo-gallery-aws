const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Photo Gallery API',
    version: '1.0.0',
    description: 'API documentation for the Photo Gallery backend service',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Scan routes files for @swagger comments
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
