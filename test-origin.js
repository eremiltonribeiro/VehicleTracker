#!/usr/bin/env node

const testTrip = {
  type: "trip",
  vehicleId: 1,
  driverId: 1,
  date: new Date().toISOString(),
  initialKm: 1000,
  finalKm: 1100,
  origin: "Rio de Janeiro - RJ",
  destination: "São Paulo - SP",
  reason: "Reunião de negócios",
  observations: "Viagem teste com origem e destino"
};

console.log("🧪 Testando schema de viagem com origem:");
console.log(JSON.stringify(testTrip, null, 2));

async function testTripCreation() {
  try {
    const response = await fetch('http://localhost:5000/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTrip)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Viagem criada com sucesso:");
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Erro ao criar viagem:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
  }
}

// Execute o teste se o script for executado diretamente
if (require.main === module) {
  testTripCreation();
}
