export default function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? ""
}
