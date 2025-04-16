const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app'); // adjust path to your express app

chai.use(chaiHttp);
const expect = chai.expect;

describe('GET /api/health', () => {
  it('should return 200 OK', (done) => {
    chai.request(app)
      .get('/api/health')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});
