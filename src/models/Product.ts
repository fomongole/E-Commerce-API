import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Category from './Category';

class Product extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stock!: number;
  public imageUrl!: string;
  public categoryId!: number;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    categoryId: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
  },
  { sequelize, tableName: 'products' }
);

export default Product;