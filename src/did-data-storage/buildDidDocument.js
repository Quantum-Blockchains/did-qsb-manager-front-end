import { base58Encode } from '@polkadot/util-crypto'
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

  const verificationMethod = keys.map((key, index) => {
    const material = Uint8Array.from(key.public_key || [])
    const methodId = `${didValue}#keys-${index + 1}`

    return {
      id: methodId,
      type: 'ML-DSA-44',
      controller: didValue,
      publicKeyMultibase: `z${base58Encode(material)}`,
      revoked: key.revoked || false,
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
    const name = bytesToString(service.id)
    const type = bytesToString(service.service_type || service.serviceType)
    const endpoint = bytesToString(service.endpoint)

    return {
      id: name ? `${didValue}#${name}` : `${didValue}#service`,
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
    '@context': ['https://www.w3.org/ns/did/v1'],
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
