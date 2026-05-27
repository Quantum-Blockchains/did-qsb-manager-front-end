import { u8aToHex, u8aToString } from '@polkadot/util'

const bytesToString = value => {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    const text = u8aToString(Uint8Array.from(value))
    return text || u8aToHex(Uint8Array.from(value))
  } catch (error) {
    return u8aToHex(Uint8Array.from(value))
  }
}

export default function buildDidDocument(didValue, chainData) {
  if (!didValue || !chainData) return null

  const keys = Array.isArray(chainData.keys) ? chainData.keys : []
  const services = Array.isArray(chainData.services) ? chainData.services : []
  const activeKeys = keys.filter(key => !key?.revoked)

  const encodeUvarint = value => {
    const out = []
    let current = Number(value || 0)
    while (true) {
      let byte = current & 0x7f
      current >>= 7
      if (current !== 0) {
        byte |= 0x80
      }
      out.push(byte)
      if (current === 0) {
        break
      }
    }
    return Uint8Array.from(out)
  }

  const bytesToBase64Url = bytes => {
    if (!bytes?.length) return null
    let binary = ''
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte)
    })
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  const toPublicKeyMultibase = key => {
    const raw = Uint8Array.from(key?.public_key || [])
    const codec = key?.multicodec
    if (!Number.isInteger(codec) || raw.length === 0) {
      return null
    }
    const prefixed = new Uint8Array(encodeUvarint(codec).length + raw.length)
    prefixed.set(encodeUvarint(codec), 0)
    prefixed.set(raw, encodeUvarint(codec).length)
    const encoded = bytesToBase64Url(prefixed)
    return encoded ? `u${encoded}` : null
  }

  const verificationMethod = activeKeys.map(key => {
    const keyId = bytesToString(key.key_id)
    const controller = bytesToString(key.controller) || didValue

    return {
      id: keyId || `${didValue}#update`,
      type: 'Multikey',
      controller,
      publicKeyMultibase: toPublicKeyMultibase(key),
      roles: key.roles || [],
    }
  })

  const authentication = verificationMethod
    .filter(method => (method.roles || []).includes('Authentication'))
    .map(method => method.id)
  const assertionMethod = verificationMethod
    .filter(method => (method.roles || []).includes('AssertionMethod'))
    .map(method => method.id)
  const keyAgreement = verificationMethod
    .filter(method => (method.roles || []).includes('KeyAgreement'))
    .map(method => method.id)
  const capabilityInvocation = verificationMethod
    .filter(method => (method.roles || []).includes('CapabilityInvocation'))
    .map(method => method.id)
  const capabilityDelegation = verificationMethod
    .filter(method => (method.roles || []).includes('CapabilityDelegation'))
    .map(method => method.id)

  const normalizedServices = services.map(service => {
    const id = bytesToString(service.id)
    const type = bytesToString(service.service_type || service.serviceType)
    const endpoint = bytesToString(service.endpoint)

    return {
      id: id || '#service',
      type,
      serviceEndpoint: endpoint,
    }
  })

  const normalizedMetadata = Array.isArray(chainData.metadata)
    ? chainData.metadata.map(entry => ({
        key: bytesToString(entry.key),
        value: bytesToString(entry.value),
      }))
    : []

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1',
    ],
    id: didValue,
    version: chainData.version ?? null,
    deactivated: chainData.deactivated ?? false,
    verificationMethod,
    authentication,
    assertionMethod,
    keyAgreement,
    capabilityInvocation,
    capabilityDelegation,
    service: normalizedServices,
    metadata: normalizedMetadata,
  }
}
