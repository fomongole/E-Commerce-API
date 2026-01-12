import app from './app';
import dotenv from 'dotenv';
import sequelize from './config/database';
import setupAssociations from './models/associations';
// Importing all the models to ensure they are registered with Sequelize
import './models/User';
import './models/Category';
import './models/Product';
import './models/Order';
import './models/OrderItem';
import './models/Cart';
import './models/CartItem';
import './models/Review';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    setupAssociations();

    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();