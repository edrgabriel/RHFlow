fetch('http://localhost:3001/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "João da Silva",
    cargo: "Operador",
    cpf: "12345678901",
    companyId: "0fb374f9-f7c0-4f53-b6d7-a2a4b72b1528",
    admissionProcess: {}
  })
}).then(res => res.json().then(data => ({ status: res.status, data })))
  .then(res => console.log('Result:', res))
  .catch(err => console.error('Error:', err));
