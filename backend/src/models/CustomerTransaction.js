import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require('sequelize');

export default (sequelize) => {
  class CustomerTransaction extends Model {}
  CustomerTransaction.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      customerId: { type: DataTypes.UUID, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
      category: { type: DataTypes.STRING(80), allowNull: true },
      purchasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'CustomerTransaction',
      tableName: 'customer_transactions',
      indexes: [{ fields: ['customer_id', 'purchased_at'] }],
    }
  );
  return CustomerTransaction;
};
