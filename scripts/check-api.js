import http from 'http';

function checkApi() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const ok = await checkApi();
if (!ok) {
  console.error('\n[LearnHub] API is not running on http://localhost:5000');
  console.error('  From project root run:  npm run dev');
  console.error('  Or in another terminal:  cd server && npm run dev\n');
  process.exit(1);
}
