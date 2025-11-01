/**
 * Email content sanitization utilities
 * SEC-006: Prevent XSS and HTML injection in email content
 */

/**
 * Escape HTML special characters to prevent XSS
 * Converts <, >, &, ", ' to HTML entities
 */
export function escapeHtml(text: string): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Sanitize text for use in HTML email body
 * - Escapes HTML special characters
 * - Converts newlines to <br> tags safely
 */
export function sanitizeEmailContent(text: string): string {
  if (!text) return ''
  
  // First escape HTML to prevent XSS
  const escaped = escapeHtml(text)
  
  // Then convert newlines to <br> tags (safe after escaping)
  return escaped.replace(/\n/g, '<br>')
}

/**
 * Sanitize email address to prevent header injection
 * Removes control characters and newlines that could be used for header injection
 */
export function sanitizeEmailAddress(email: string): string {
  if (!email) return ''
  
  // Remove control characters, newlines, carriage returns
  return email.replace(/[\r\n\t\x00-\x1f\x7f]/g, '').trim()
}

/**
 * Sanitize email subject line
 * Removes HTML and control characters
 */
export function sanitizeEmailSubject(subject: string): string {
  if (!subject) return ''
  
  // Escape HTML and remove control characters
  return escapeHtml(subject).replace(/[\r\n\t\x00-\x1f\x7f]/g, '').trim()
}

/**
 * Sanitize all form fields for email sending
 */
export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export function sanitizeContactFormData(data: ContactFormData): ContactFormData {
  return {
    name: escapeHtml(data.name.trim()),
    email: sanitizeEmailAddress(data.email.trim()),
    subject: sanitizeEmailSubject(data.subject.trim()),
    message: sanitizeEmailContent(data.message.trim()),
  }
}

