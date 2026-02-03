require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      
      // ✅ ADICIONE POOL DE CONEXÕES
      pool: {
        max: 20,          // Máximo de conexões simultâneas
        min: 5,           // Mínimo de conexões sempre ativas
        acquire: 30000,   // Tempo máximo para conseguir conexão
        idle: 10000       // Tempo antes de liberar conexão inativa
      },
      
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        // ✅ ADICIONE TIMEOUT
        statement_timeout: 10000  // Timeout de 10s por query
      },
      
      // ✅ OTIMIZAÇÕES ADICIONAIS
      benchmark: false,           // Desabilita medição de performance
      define: {
        freezeTableName: true,    // Não pluraliza nomes de tabelas
        timestamps: true          // Mantém createdAt/updatedAt
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        
        // ✅ ADICIONE POOL DE CONEXÕES (LOCAL)
        pool: {
          max: 20,
          min: 5,
          acquire: 30000,
          idle: 10000
        },
        
        dialectOptions: {
          statement_timeout: 10000
        },
        
        // ✅ OTIMIZAÇÕES ADICIONAIS
        benchmark: false,
        define: {
          freezeTableName: true,
          timestamps: true
        }
      }
    );

module.exports = {
  sequelize
};