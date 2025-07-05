import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 5177,
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;