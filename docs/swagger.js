const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DAV School',
      version: '1.0.0',
      description: '',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: '/' }]
  },
  apis: ['./routes/DAV_Routes/*.js']
};

module.exports = swaggerJsdoc(options);