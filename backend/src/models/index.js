import { sequelize } from '../config/database.js';
import defineUser from './User.js';
import defineRefreshToken from './RefreshToken.js';
import defineCustomer from './Customer.js';
import defineCustomerTransaction from './CustomerTransaction.js';
import defineSegment from './Segment.js';
import defineCampaign from './Campaign.js';


export const User = defineUser(sequelize);
export const RefreshToken = defineRefreshToken(sequelize);
export const Customer = defineCustomer(sequelize);
export const CustomerTransaction = defineCustomerTransaction(sequelize);
export const Segment = defineSegment(sequelize);
export const Campaign = defineCampaign(sequelize);

// ---- Associations ----
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Customer.hasMany(CustomerTransaction, { foreignKey: 'customerId', as: 'transactions', onDelete: 'CASCADE' });
CustomerTransaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'CustomerTransactions' });

User.hasMany(Segment, { foreignKey: 'createdBy', as: 'segments', onDelete: 'SET NULL' });
Segment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns', onDelete: 'SET NULL' });
Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Segment.hasMany(Campaign, { foreignKey: 'segmentId', as: 'campaigns', onDelete: 'SET NULL' });
Campaign.belongsTo(Segment, { foreignKey: 'segmentId', as: 'segment' });

export { sequelize };
