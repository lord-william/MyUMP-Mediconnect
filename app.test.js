// app.test.js
const request = require('supertest');
const app = require('./app'); // <<< Change to require('./app')

describe('GET /', () => {
  it('should return the landing page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    // You can't check the *exact* HTML content easily,
    // so let's check for the Content-Type to confirm it's an HTML file.
    expect(res.headers['content-type']).toContain('text/html'); 
  });
});