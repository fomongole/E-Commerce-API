import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Order extends Model {
  public id!: number;
  public total!: number;
  public status!: 'pending' | 'paid' | 'shipped' | 'cancelled';
  public userId!: number;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'cancelled'),
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'orders',
  }
);

export default Order;