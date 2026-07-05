async function checkDebug() {
  const url = 'https://abundant-vibrancy-production-d857.up.railway.app/api/debug-env';
  
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log('\n--- DEPLOYMENT ACTIVE ---');
        console.log(JSON.stringify(data.env, null, 2));
        return;
      }
    } catch (e) {
      // ignore
    }
    console.log('Waiting for deployment... (' + (i+1) + '/20)');
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('Timeout waiting for deployment');
}
checkDebug();
