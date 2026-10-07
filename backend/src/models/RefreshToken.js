import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require('sequelize');

export default (sequelize) => {
  class RefreshToken extends Model {}
  RefreshToken.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true }, // equals the JWT `jti`
      userId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      replacedBy: { type: DataTypes.UUID, allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
    }
  );
  return RefreshToken;
};
