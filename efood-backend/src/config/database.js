require('dotenv').config();

const useSSL = !!process.env.DATABASE_URL;

const baseConfig = {
  dialect: 'postgres',
  logging: false
};

module.exports = {
  development: {
    ...baseConfig,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },

  production: process.env.DATABASE_URL
    ? {
        ...baseConfig,
        url: process.env.DATABASE_URL
      }
    : {
        ...baseConfig,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      },

  test: {
    ...baseConfig
  }
};
