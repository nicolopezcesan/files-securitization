import { registerAs } from '@nestjs/config';

export default registerAs('configs', () => ({
  app: {
    port: process.env.PORT,
    env: process.env.ENVIRONMENT,
  },
  blockchain: {
    url: process.env.BLOCKCHAIN_URL,
  },
}));
