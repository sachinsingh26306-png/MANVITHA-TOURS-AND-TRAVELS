const { Sequelize } = require('sequelize');
require('dotenv').config();

let dialect = process.env.DB_DIALECT;
if (!dialect) {
  if (process.env.DB_HOST || process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL) {
    dialect = 'postgres';
  } else {
    dialect = 'sqlite';
  }
}

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
      foreign_keys: false // Disables foreign key checks to allow drops/syncs during dev
    }
  });
} else if (dialect === 'postgres') {
  const dbUrl = process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL;
  
  const dialectOptions = {};
  if (process.env.DB_SSL !== 'false') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false // Necessary for many cloud providers including Supabase
    };
  }

  if (dbUrl) {
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions
    });
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'postgres',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'manivtha_travels',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;