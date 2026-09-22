async function testRegistration() {
  try {
    const res = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Test Shop Bot',
        shopAddress: 'Test Address',
        shopRegisterNumber: '123456',
        email: 'botshop@yaalu.lk',
        mobile: '+94711111112',
        ownerName: 'Bot Owner',
        ownerIdNumber: '999999999V',
        fullName: 'Bot Owner',
        address: 'Test Address',
        role: 'SHOP'
      })
    });
    const data = await res.json();
    console.log('Register Response:', data);
  } catch (e) {
    console.error('Register Error:', e.message);
  }
}

testRegistration();
