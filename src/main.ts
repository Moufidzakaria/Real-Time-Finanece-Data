import fetch from 'node-fetch';
import fs from 'fs';

(async () => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h'
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const rawData: any = await res.json(); // FIX TS18046

    if (!Array.isArray(rawData)) throw new Error('Invalid API response');

    const coins = rawData.map((c: any) => ({
      name: c.name,
      symbol: c.symbol,
      price: c.current_price,
      change_1h: c.price_change_percentage_1h_in_currency?.toFixed(2) + '%',
      change_24h: c.price_change_percentage_24h?.toFixed(2) + '%',
      market_cap: c.market_cap,
      volume_24h: c.total_volume,
      circulating_supply: c.circulating_supply,
    }));

    fs.writeFileSync('coins.json', JSON.stringify(coins, null, 2));
    console.log('Coins saved to coins.json');

  } catch (err) {
    console.error('Error fetching coins:', err);
  }
})();
