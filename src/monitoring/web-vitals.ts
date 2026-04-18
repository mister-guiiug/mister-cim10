/**
 * Monitoring des Web Vitals pour mister-cim10
 */

interface Metric {
  name: string
  value: number
  id: string
  navigationType?: string
}

interface MetricWithRating extends Metric {
  rating: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Obtenir la note de performance d'une métrique
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  switch (metric.name) {
    case 'CLS':
      if (metric.value <= 0.1) return 'good'
      if (metric.value <= 0.25) return 'needs-improvement'
      return 'poor'
    default:
      return 'good'
  }
}

/**
 * Logger pour les Web Vitals
 */
function logMetric(metric: MetricWithRating): void {
  const metricWithRating = { ...metric, rating: getRating(metric) }

  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metricWithRating)
  }
}

/**
 * Initialiser le monitoring des Web Vitals
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals')

    onCLS(logMetric)
    onFID(logMetric)
    onFCP(logMetric)
    onLCP(logMetric)
    onTTFB(logMetric)
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error)
  }
}
