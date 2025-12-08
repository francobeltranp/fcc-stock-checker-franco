const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000);

  let likesGOOG;     // para comprobar que no se duplican likes
  let relLikesPair;  // para comprobar rel_likes con dos stocks

  // 1) Viewing one stock: GET request to /api/stock-prices/
  test('Viewing one stock: GET request to /api/stock-prices', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');

        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);

        done();
      });
  });

  // 2) Viewing one stock and liking it: GET request to /api/stock-prices/
  test('Viewing one stock and liking it: GET request to /api/stock-prices', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);

        // guardamos likes para el siguiente test
        likesGOOG = res.body.stockData.likes;
        assert.isAtLeast(likesGOOG, 1);

        done();
      });
  });

  // 3) Viewing the same stock and liking it again: like should not increase
  test('Viewing the same stock and liking it again: like should not increase', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);

        // debe ser igual al valor anterior
        assert.equal(res.body.stockData.likes, likesGOOG);

        done();
      });
  });

  // 4) Viewing two stocks: GET request to /api/stock-prices/
  test('Viewing two stocks: GET request to /api/stock-prices', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [s1, s2] = res.body.stockData;

        assert.equal(s1.stock, 'GOOG');
        assert.equal(s2.stock, 'MSFT');

        assert.property(s1, 'price');
        assert.property(s2, 'price');
        assert.property(s1, 'rel_likes');
        assert.property(s2, 'rel_likes');

        assert.isNumber(s1.price);
        assert.isNumber(s2.price);
        assert.isNumber(s1.rel_likes);
        assert.isNumber(s2.rel_likes);

        // suelen esperar que la suma de rel_likes sea 0
        assert.equal(s1.rel_likes + s2.rel_likes, 0);

        // guardamos para comparar en el siguiente test
        relLikesPair = {
          goog: s1.rel_likes,
          msft: s2.rel_likes,
        };

        done();
      });
  });

  // 5) Viewing two stocks and liking them: GET request to /api/stock-prices/
  test('Viewing two stocks and liking them: GET request to /api/stock-prices', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [s1, s2] = res.body.stockData;

        assert.equal(s1.stock, 'GOOG');
        assert.equal(s2.stock, 'MSFT');

        assert.property(s1, 'price');
        assert.property(s2, 'price');
        assert.property(s1, 'rel_likes');
        assert.property(s2, 'rel_likes');

        assert.isNumber(s1.price);
        assert.isNumber(s2.price);
        assert.isNumber(s1.rel_likes);
        assert.isNumber(s2.rel_likes);

        // la suma de rel_likes debe seguir siendo 0
        assert.equal(s1.rel_likes + s2.rel_likes, 0);

        done();
      });
  });
});
