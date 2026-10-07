import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require('sequelize');

export default (sequelize) => {
  class Segment extends Model {}
  Segment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      criteria: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      createdBy: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, modelName: 'Segment', tableName: 'segments' }
  );
  return Segment;
};
