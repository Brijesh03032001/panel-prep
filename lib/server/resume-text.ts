// pdf-parse's index.js runs a self-test when bundled, so import the implementation directly.
// @ts-expect-error -- no types for the internal path
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

const MAX_CHARS = 12_000

export async function extractResumeText(file: File | null, pasted: string | null): Promise<string> {
  let text = pasted?.trim() ?? ''
  if (!text && file && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) throw new Error('That PDF is over 8 MB. Try exporting a lighter copy.')
    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await pdfParse(buffer)
    text = String(parsed.text ?? '')
  }
  text = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (text.length < 80) throw new Error("We couldn't read enough text from that resume. Try pasting it instead.")
  return redactPII(text).slice(0, MAX_CHARS)
}

// The AI never needs contact details to run an interview, so strip them before anything leaves the server.
export function redactPII(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[phone]')
    .replace(/\bhttps?:\/\/\S+/gi, '[link]')
    .replace(/\b(?:www\.)?(?:linkedin|github)\.com\/\S+/gi, '[link]')
    .replace(/\b\d{1,5}\s+[A-Za-z0-9.\s]{2,30}\s(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Blvd|Way|Court|Ct)\b\.?/gi, '[address]')
}
