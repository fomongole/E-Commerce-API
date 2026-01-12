import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Docs',
      version: '1.0.0',
      description: 'API Documentation for the E-Commerce Backend Project',
      contact: {
        name: 'Engineer Fred',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Look for comments in these files
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;