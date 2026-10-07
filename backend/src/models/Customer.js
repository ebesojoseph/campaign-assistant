import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require("sequelize");
import { CUSTOMER_STATUS, enumValues } from "../constants/index.js";

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  defaultValue: 0,
  get() {
    return Number(this.getDataValue(field)); // MySQL returns DECIMAL as string
  },
});

export default (sequelize) => {
  class Customer extends Model {}
  Customer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING(80), allowNull: false },
      lastName: { type: DataTypes.STRING(80), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(v) {
          this.setDataValue("email", String(v).trim().toLowerCase());
        },
      },
      phone: { type: DataTypes.STRING(32), allowNull: true },
      country: { type: DataTypes.STRING(56), allowNull: true },
      city: { type: DataTypes.STRING(80), allowNull: true },
      status: {
        type: DataTypes.ENUM(...enumValues(CUSTOMER_STATUS)),
        allowNull: false,
        defaultValue: CUSTOMER_STATUS.LEAD,
      },
      totalSpent: {
        type: DataTypes.VIRTUAL,
        async get() {
          return (
            (await sequelize.models.Transaction.sum("amount", {
              where: { customerId: this.id },
            })) || 0
          );
        },
      },
      orderCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      lastPurchaseAt: { type: DataTypes.DATE, allowNull: true },
      // Opted-out customers are never included in segments / campaign audiences.
      marketingOptIn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers",
      indexes: [
        { fields: ["status"] },
        { fields: ["country"] },
        { fields: ["last_purchase_at"] },
      ],
    },
  );
  return Customer;
};
