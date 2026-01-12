import express, { Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import cartRoutes from './routes/cartRoutes';
import userRoutes from './routes/userRoutes';
import swaggerSpec from './config/swagger';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { notFound, errorHandler } from './middlewares/errorMiddleware';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(morgan('dev'));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }); // 100 req/15min
app.use(limiter);

app.use(express.json());

// Public Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('E-Commerce API is running with TypeScript!');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;