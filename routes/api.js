'use strict';


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){


       const stock = req.query.stock;

      if (!stock) {
        return res.json({ error: 'Falta el parámetro stock' });
      }

      try {

        const response = await fetch(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
        );

        const data = await response.json();

        return res.json({
          stockData: {
            stock: data.symbol,
            price: data.latestPrice,
            likes: 0
          }
        });

      } catch (error) {
        return res.json({ error: 'No se pudo obtener el precio' });
      }
      
      
    });
    
};
