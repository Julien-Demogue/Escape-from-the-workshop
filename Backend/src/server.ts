import express from 'express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});