fetch('http://localhost:3001/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' })
})
.then(async (res) => {
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
})
.catch(console.error);
