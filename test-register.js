fetch('http://localhost:3001/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin' })
})
.then(async (res) => {
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
})
.catch(console.error);
