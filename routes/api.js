'use strict';

const crypto = require('crypto');
const Stock = require('../models/Stock');

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {

      try {
        const { stock, like } = req.query;

        if (!stock) {
          return res.json({ error: 'Falta el parámetro stock' });
        }

        const symbol = String(stock).toUpperCase();

      
        const response = await fetch(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
        );
        const data = await response.json();

        if (!data || !data.symbol) {
          return res.json({ error: 'Stock inválido' });
        }

     
        const rawIp = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
        const hashedIp = crypto
          .createHash('sha256')
          .update(String(rawIp))
          .digest('hex');

        
        let stockDoc = await Stock.findOne({ stock: symbol });
        if (!stockDoc) {
          stockDoc = new Stock({
            stock: symbol,
            likes: 0,
            ips: []
          });
        }

        
        if (like === 'true') {
          if (!stockDoc.ips.includes(hashedIp)) {
            stockDoc.likes += 1;
            stockDoc.ips.push(hashedIp);
          }
        }

       
        await stockDoc.save();

        
        return res.json({
          stockData: {
            stock: symbol,
            price: data.latestPrice,
            likes: stockDoc.likes
          }
        });

      } catch (error) {
        console.error(error);
        return res.json({ error: 'Error interno al procesar la solicitud' });
      }

    });

};
