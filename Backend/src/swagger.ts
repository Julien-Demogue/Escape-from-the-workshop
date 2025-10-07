import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Escape-from-the-workshop API',
            version: '1.0.0',
            description: 'Documentation API'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local server' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
    },
    apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;