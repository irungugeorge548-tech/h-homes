// Rent maths. Rent for a month is owed from the start of that month and is due on dueDay.
// balance = rent x months so far (including the move-in month) - everything paid.
const MIN_PART = 100; // smallest Lipa Mdogo Mdogo instalment (KES)

function monthsSoFar(startDate, now = new Date()) {
  const s = new Date(startDate);
  return Math.max(1, (now.getFullYear() - s.getFullYear()) * 12 + (now.getMonth() - s.getMonth()) + 1);
}

function summary(tenancy, payments, now = new Date()) {
  const paid = payments.filter((p) => p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0);
  const owed = tenancy.rentAmount * monthsSoFar(tenancy.startDate, now);
  const balance = Math.max(0, Math.round((owed - paid) * 100) / 100);
  const credit = Math.max(0, Math.round((paid - owed) * 100) / 100);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const due = new Date(now.getFullYear(), now.getMonth(), Math.min(tenancy.dueDay, lastDay));
  let nextDue = due;
  if (balance === 0) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(tenancy.dueDay, new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()));
  const late = balance > 0 && now.getTime() > due.getTime() + 86400000 - 1;
  return { paid, owed, balance, credit, nextDue: nextDue.toISOString(), late, minPart: Math.min(MIN_PART, balance || MIN_PART) };
}

module.exports = { MIN_PART, monthsSoFar, summary };
