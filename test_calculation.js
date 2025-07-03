// Teste simples para verificar o cálculo de meses
function calculateMonthsDifference(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  return years * 12 + months + 1; // +1 para incluir ambos os meses (início e fim)
}

// Teste: jun/25 a jun/26
const startDate = new Date(2025, 5, 1); // Junho 2025 (mês 5)
const endDate = new Date(2026, 5, 1);   // Junho 2026 (mês 5)

const monthsDiff = calculateMonthsDifference(startDate, endDate);
console.log(`De jun/25 a jun/26: ${monthsDiff} meses`);

// Listar os meses para verificar
console.log('Meses incluídos:');
for (let i = 0; i < monthsDiff; i++) {
  const currentDate = new Date(startDate);
  currentDate.setMonth(startDate.getMonth() + i);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  console.log(`${monthNames[currentDate.getMonth()]}/${currentDate.getFullYear()}`);
}

console.log('\n---\n');

// Teste: jan/24 a dez/24
const startDate2 = new Date(2024, 0, 1); // Janeiro 2024 (mês 0)
const endDate2 = new Date(2024, 11, 1);  // Dezembro 2024 (mês 11)

const monthsDiff2 = calculateMonthsDifference(startDate2, endDate2);
console.log(`De jan/24 a dez/24: ${monthsDiff2} meses`);

// Listar os meses para verificar
console.log('Meses incluídos:');
for (let i = 0; i < monthsDiff2; i++) {
  const currentDate = new Date(startDate2);
  currentDate.setMonth(startDate2.getMonth() + i);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  console.log(`${monthNames[currentDate.getMonth()]}/${currentDate.getFullYear()}`);
}

// Teste: mar/24 a fev/25
const startDate3 = new Date(2024, 2, 1); // Março 2024 (mês 2)
const endDate3 = new Date(2025, 1, 1);   // Fevereiro 2025 (mês 1)

const monthsDiff3 = calculateMonthsDifference(startDate3, endDate3);
console.log(`De mar/24 a fev/25: ${monthsDiff3} meses`); 