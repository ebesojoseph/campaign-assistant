process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite'; // MySQL is used everywhere else; sqlite keeps the suite hermetic
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789-0123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-9876543210-9876543210';
process.env.OPENAI_API_KEY = '';
