// Convert the backend response into the small, predictable shape the UI displays.
export function mapPredictionResponse(response) {
  if (!response || typeof response !== 'object') throw new Error('The prediction service returned an unexpected response.')

  // TODO: UPDATE THESE PROPERTY NAMES AFTER THE BACKEND RESPONSE CONTRACT IS FINALIZED.
  const prediction = response.prediction ?? response.result ?? response.label
  const rawConfidence = response.confidence ?? response.score
  const rawProcessingTime = response.processingTime ?? response.processing_time
  if (typeof prediction !== 'string' || !prediction.trim()) throw new Error('The prediction response did not contain a tumor category.')

  // Preserve the server value instead of assuming it is a 0-to-1 decimal.
  const confidence = rawConfidence === undefined || rawConfidence === null ? null : rawConfidence
  const confidenceDisplay = confidence === null ? null : typeof confidence === 'number' && confidence >= 0 && confidence <= 1 ? `${(confidence * 100).toFixed(1)}%` : String(confidence)
  const processingTime = rawProcessingTime === undefined || rawProcessingTime === null ? null : rawProcessingTime
  return { prediction: prediction.trim(), confidence, confidenceDisplay, processingTime, processingTimeDisplay: processingTime === null ? null : `${processingTime} s` }
}
