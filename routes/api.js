'use strict';

const crypto = require('crypto');
const Stock = require('../models/Stock');

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        let { stock, like } = req.query;

        if (!stock) {
          return res.json({ error: 'Falta el parámetro stock' });
        }

        const likeFlag = like === 'true';

        // IP anonimizada
        const rawIp = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
        const hashedIp = crypto
          .createHash('sha256')
          .update(String(rawIp))
          .digest('hex');

        // Normalizar a array
        if (!Array.isArray(stock)) {
          stock = [stock];
        }

        // Solo permitimos 1 o 2 stocks
        if (stock.length > 2) {
          return res.json({ error: 'Máximo 2 stocks permitidos' });
        }

        // Helper: obtiene precio + actualiza likes en DB para un símbolo
        const handleOneStock = async (symbolRaw) => {
          const symbol = String(symbolRaw).toUpperCase();

          // 1. Precio desde la API de FCC
          const response = await fetch(
            `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
          );
          const data = await response.json();

          if (!data || !data.symbol) {
            throw new Error('Stock inválido');
          }

          // 2. Buscar o crear en Mongo
          let stockDoc = await Stock.findOne({ stock: symbol });
          if (!stockDoc) {
            stockDoc = new Stock({
              stock: symbol,
              likes: 0,
              ips: []
            });
          }

          // 3. Like (si corresponde)
          if (likeFlag) {
            if (!stockDoc.ips.includes(hashedIp)) {
              stockDoc.likes += 1;
              stockDoc.ips.push(hashedIp);
            }
          }

          await stockDoc.save();

          return {
            stock: symbol,
            price: data.latestPrice,
            likes: stockDoc.likes
          };
        };

        // === 1 STOCK ===
        if (stock.length === 1) {
          const one = await handleOneStock(stock[0]);

          return res.json({
            stockData: {
              stock: one.stock,
              price: one.price,
              likes: one.likes
            }
          });
        }

        // === 2 STOCKS ===
        const [first, second] = await Promise.all([
          handleOneStock(stock[0]),
          handleOneStock(stock[1])
        ]);

        const relLikes1 = first.likes - second.likes;
        const relLikes2 = second.likes - first.likes;

        return res.json({
          stockData: [
            {
              stock: first.stock,
              price: first.price,
              rel_likes: relLikes1
            },
            {
              stock: second.stock,
              price: second.price,
              rel_likes: relLikes2
            }
          ]
        });

      } catch (error) {
        console.error(error);
        return res.json({ error: 'Error interno al procesar la solicitud' });
      }
    });

};
