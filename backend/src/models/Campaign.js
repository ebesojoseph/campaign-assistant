import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DataTypes, Model } = require('sequelize');
import { CAMPAIGN_STATUS, CHANNELS, TONES, enumValues } from '../constants/index.js';

export default (sequelize) => {
  class Campaign extends Model {}
  Campaign.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      objective: { type: DataTypes.TEXT, allowNull: false },
      channel: { type: DataTypes.ENUM(...enumValues(CHANNELS)), allowNull: false },
      tone: { type: DataTypes.ENUM(...enumValues(TONES)), allowNull: false },
      status: { type: DataTypes.ENUM(...enumValues(CAMPAIGN_STATUS)), allowNull: false, defaultValue: CAMPAIGN_STATUS.DRAFT },
      subject: { type: DataTypes.STRING(255), allowNull: true },
      preheader: { type: DataTypes.STRING(255), allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      callToAction: { type: DataTypes.STRING(120), allowNull: true },
      rationale: { type: DataTypes.TEXT, allowNull: true },
      aiMetadata: { type: DataTypes.JSON, allowNull: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
      segmentId: { type: DataTypes.UUID, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Campaign',
      tableName: 'campaigns',
      indexes: [{ fields: ['status'] }, { fields: ['channel'] }, { fields: ['segment_id'] }, { fields: ['created_by'] }],
    }
  );
  return Campaign;
};
