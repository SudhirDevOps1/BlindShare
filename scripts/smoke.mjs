// Contextual healthz check
const targetUrl = process.argv[2] || 'http://localhost:3000';

async function check() {
  console.log(`Running smoke test against ${targetUrl}/api/health...`);
  try {
    const res = await fetch(`${targetUrl}/api/health`);
    if (!res.ok) throw new Error(`Healthcheck failed with status: ${res.status}`);
    const data = await res.json();
    console.log('Smoke test passed:', data);
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
}
check();
