# Real-Time-Finance-Data

**Real-Time-Finance-Data** est une API en temps réel pour récupérer les données des cryptomonnaies, avec stockage MongoDB, caching Redis, et possibilité d’interroger via RapidAPI ou Zyla API. Le projet est construit avec **Node.js, TypeScript, Express, Docker, et GitHub Actions** pour CI/CD.

---

## 🛠️ Fonctionnalités

- Récupération des **coins en temps réel** depuis CoinGecko
- Recherche par **id** ou **name** de coin
- Stockage dans **MongoDB** avec tri par market cap
- Caching rapide avec **Redis**
- Mise à jour automatique via **cron toutes les 10 minutes**
- API sécurisée avec **API Key**
- Routes admin pour :  
  - `/admin/fetch-now` : fetch manuel  
  - `/admin/coins/all` : lister toutes les coins  
  - `/admin/count` : nombre de coins  

- Routes publiques :  
  - `/coins?page=1&limit=100`  
  - `/coins/search?id=xxx` ou `/coins/search?name=bitcoin`  
  - `/api/external/:coin` pour RapidAPI/Zyla  

---

## ⚡ Stack technique

- **Backend** : Node.js + TypeScript + Express  
- **Base de données** : MongoDB  
- **Cache** : Redis (Upstash)  
- **Containerisation** : Docker + Docker Compose  
- **CI/CD** : GitHub Actions  
- **Sécurité** : Helmet, Rate Limiter, API Key  

---

## 🚀 Installation locale

1. Cloner le repo :

```bash
git clone https://github.com/Moufidzakaria/Real-Time-Finanece-Data.git
cd Real-Time-Finanece-Data
