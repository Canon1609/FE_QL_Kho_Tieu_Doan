// GIS keeps a single callback per page. Route each credential to the currently
// mounted button rather than re-initializing the global GIS client on navigation.
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
let scriptPromise
let initialized = false
let receiver = null

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-google-identity-services]')
    if (!script) {
      script = document.createElement('script')
      script.dataset.googleIdentityServices = 'true'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
    }
    const cleanup = () => { script.removeEventListener('load', loaded); script.removeEventListener('error', failed) }
    const loaded = () => {
      cleanup()
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else failed()
    }
    const failed = () => {
      cleanup()
      script.remove()
      scriptPromise = null // allow retry on a later mount
      reject(new Error('Google Identity Services unavailable'))
    }
    script.addEventListener('load', loaded)
    script.addEventListener('error', failed)
    if (!script.isConnected) document.head.append(script)
    if (window.google?.accounts?.id) loaded()
  })
  return scriptPromise
}

export async function renderGoogleButton(element, onCredential, isActive) {
  if (!clientId) throw new Error('Google Sign-In is not configured')
  const gis = await loadScript()
  // A navigation/StrictMode cleanup may have unmounted this button while GIS loaded.
  if (!isActive()) return () => {}
  if (!initialized) {
    gis.initialize({
      client_id: clientId,
      callback: response => {
        if (typeof response?.credential === 'string' && response.credential) receiver?.(response.credential)
      },
      auto_select: false,
    })
    initialized = true
  }
  receiver = onCredential
  element.replaceChildren()
  gis.renderButton(element, { theme: 'outline', size: 'large', text: 'signin_with', width: 260 })
  return () => {
    // StrictMode's obsolete mount must not clear a newer mount's button.
    if (receiver === onCredential) { receiver = null; element.replaceChildren() }
  }
}
