async function testCreateProduct() {
  try {
    const res = await fetch('http://localhost:3001/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token-bba5a6a8-a705-4683-b6b2-26bd0eef114d'
      },
      body: JSON.stringify({
        name: 'Test Product API',
        price: 250,
        unit: 'kg',
        stock: 10
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testCreateProduct();
