import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

/* ================== MONGODB ================== */
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });

/* ================== MODEL ================== */
interface ICoin {
  name: string;
  symbol: string;
  price: number;
  change_1h: number;
  change_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
}

const CoinSchema = new mongoose.Schema<ICoin>({
  name: String,
  symbol: String,
  price: Number,
  change_1h: Number,
  change_24h: Number,
  market_cap: Number,
  volume_24h: Number,
  circulating_supply: Number,
});

CoinSchema.index({ market_cap: -1 });

const Coin = mongoose.model<ICoin>('Coin', CoinSchema);

/* ================== REDIS (SAFE) ================== */
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

redis?.on('connect', () => console.log('✅ Redis connected'));
redis?.on('error', err => console.error('❌ Redis error', err));

/* ================== API KEY ================== */
const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key === process.env.API_KEY) return next();
  return res.status(403).json({ error: 'Invalid API Key' });
};

/* ================== UTILS ================== */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ================== FETCH COINS ================== */
async function fetchCoins(): Promise<number> {
  const coins: ICoin[] = [];
  const totalPages = 90;

  for (let page = 1; page <= totalPages; page++) {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}` +
      `&sparkline=false&price_change_percentage=1h,24h`;

    try {
      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      if (!data.length) break;

      coins.push(
        ...data.map((c: any) => ({
          name: c.name,
          symbol: c.symbol,
          price: c.current_price,
          change_1h: c.price_change_percentage_1h_in_currency ?? 0,
          change_24h: c.price_change_percentage_24h ?? 0,
          market_cap: c.market_cap,
          volume_24h: c.total_volume,
          circulating_supply: c.circulating_supply,
        }))
      );

      console.log(`✅ Page ${page}`);
      await sleep(1500);
    } catch (err) {
      console.warn(`⚠️ Page ${page} skipped`);
      await sleep(5000);
    }
  }

  await Coin.deleteMany({});
  await Coin.insertMany(coins);

  if (redis) {
    await redis.set('coins_all', JSON.stringify(coins), 'EX', 300);
  }

  console.log(`🔥 ${coins.length} coins saved`);
  return coins.length;
}

/* ================== CRON ================== */
cron.schedule('*/10 * * * *', async () => {
  console.log('⏱ Cron started');
  await fetchCoins();
});

/* ================== ROUTES ================== */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/coins', apiKeyMiddleware, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const coins = await Coin.find({})
    .sort({ market_cap: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ page, limit, count: coins.length, data: coins });
});

/* ================== START SERVER ================== */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
