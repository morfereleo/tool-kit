import { useMemo, useState } from 'react'

/**
 * Tarifa base del freelancer: ingreso mensual deseado ÷ (horas facturables/semana × 4,33)
 * Compartido por todos los modelos de cotización.
 */
export function useBaseRate() {
  const [monthlyGoal, setMonthlyGoal] = useState('1500')
  const [billableHours, setBillableHours] = useState('25')
  const [rateOverride, setRateOverride] = useState('')

  const computed = useMemo(() => {
    const goal = parseFloat(monthlyGoal.replace(',', '.')) || 0
    const hrsWeek = parseFloat(billableHours.replace(',', '.')) || 0
    const baseRate = hrsWeek > 0 ? goal / (hrsWeek * 4.33) : 0
    const rate = parseFloat(rateOverride.replace(',', '.')) || baseRate
    return { goal, hrsWeek, baseRate, rate }
  }, [monthlyGoal, billableHours, rateOverride])

  return {
    monthlyGoal,
    setMonthlyGoal,
    billableHours,
    setBillableHours,
    rateOverride,
    setRateOverride,
    ...computed,
  }
}
