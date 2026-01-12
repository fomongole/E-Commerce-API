import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import Product from './Product';

class OrderItem extends Model {
  public id!: number;
  public quantity!: number;
  public price!: number; 
  public orderId!: number;
  public productId!: number;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: Order,
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: false,
  }
);

export default OrderItem;