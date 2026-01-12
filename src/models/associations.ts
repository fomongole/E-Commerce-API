import User from './User';
import Product from './Product';
import Category from './Category';
import Review from './Review';
import Order from './Order';
import OrderItem from './OrderItem';
import Cart from './Cart';
import CartItem from './CartItem';

export default function setupAssociations() {
  // --- User & Cart ---
  User.hasOne(Cart, { foreignKey: 'userId' });
  Cart.belongsTo(User, { foreignKey: 'userId' });

  // --- Cart & CartItems ---
  Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
  CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
  CartItem.belongsTo(Product, { foreignKey: 'productId' });

  // --- Products & Categories ---
  Category.hasMany(Product, { foreignKey: 'categoryId' });
  Product.belongsTo(Category, { foreignKey: 'categoryId' });

  // --- Products & Reviews ---
  Product.hasMany(Review, { foreignKey: 'productId' });
  Review.belongsTo(Product, { foreignKey: 'productId' });

  // --- Users & Reviews ---
  User.hasMany(Review, { foreignKey: 'userId' });
  Review.belongsTo(User, { foreignKey: 'userId' });

  // --- Users & Orders ---
  User.hasMany(Order, { foreignKey: 'userId' });
  Order.belongsTo(User, { foreignKey: 'userId' });

  // --- Orders & OrderItems ---
  Order.hasMany(OrderItem, { foreignKey: 'orderId' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

  // --- Products & OrderItems ---
  Product.hasMany(OrderItem, { foreignKey: 'productId' });
  OrderItem.belongsTo(Product, { foreignKey: 'productId' });
}