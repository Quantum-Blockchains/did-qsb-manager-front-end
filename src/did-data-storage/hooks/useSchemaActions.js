import { useEffect, useState } from 'react'
import { base58Decode, base58Encode, blake2AsU8a } from '@polkadot/util-crypto'
import {
  hexToU8a,
  isHex,
  stringToHex,
  stringToU8a,
  u8aConcat,
  u8aToHex,
  u8aToString,
} from '@polkadot/util'

const SCHEMA_MATERIAL_PREFIX = 'QSB_SCHEMA'

export default function useSchemaActions({
  api,
  currentAccount,
  activeFeature,
  schemaDidInput,
  normalizeDidInput,
  getFromAccount,
  wrapSignerWithDid,
  addToast,
  addAuditEntry,
}) {
  const [schemaUrlInput, setSchemaUrlInput] = useState('')
  const [schemaJsonInput, setSchemaJsonInput] = useState('')
  const [schemaJsonError, setSchemaJsonError] = useState('')
  const [schemaFetchError, setSchemaFetchError] = useState('')
  const [isFetchingSchema, setIsFetchingSchema] = useState(false)
  const [schemaIdValue, setSchemaIdValue] = useState('')
  const [schemaAction, setSchemaAction] = useState('register')
  const [schemaPreviewIdInput, setSchemaPreviewIdInput] = useState('')
  const [schemaPreviewError, setSchemaPreviewError] = useState('')
  const [schemaPreviewRecord, setSchemaPreviewRecord] = useState(null)
  const [isLoadingSchemaPreview, setIsLoadingSchemaPreview] = useState(false)
  const [schemaEntriesForDid, setSchemaEntriesForDid] = useState([])
  const [schemaEntriesError, setSchemaEntriesError] = useState('')
  const [isLoadingSchemaEntries, setIsLoadingSchemaEntries] = useState(false)
  const [isDeprecatingSchema, setIsDeprecatingSchema] = useState(false)
  const [isCreatingSchema, setIsCreatingSchema] = useState(false)

  useEffect(() => {
    if (schemaEntriesError) {
      addToast('error', schemaEntriesError)
      setSchemaEntriesError('')
    }
  }, [addToast, schemaEntriesError])

  useEffect(() => {
    if (schemaPreviewError) {
      addToast('error', schemaPreviewError)
      setSchemaPreviewError('')
    }
  }, [addToast, schemaPreviewError])

  useEffect(() => {
    if (schemaFetchError) {
      addToast('error', schemaFetchError)
      setSchemaFetchError('')
    }
  }, [addToast, schemaFetchError])

  const decodeHexBytesToText = value => {
    if (!value || typeof value !== 'string' || !isHex(value)) {
      return value || ''
    }
    try {
      return u8aToString(hexToU8a(value))
    } catch (error) {
      return value
    }
  }

  const normalizeSchemaIdInput = rawValue => {
    const trimmed = String(rawValue || '').trim()
    if (!trimmed) {
      return { error: 'Enter schema id.' }
    }
    const idPart = trimmed.startsWith('did:qsb:schema:')
      ? trimmed.slice('did:qsb:schema:'.length)
      : trimmed
    try {
      const decoded = base58Decode(idPart)
      if (decoded.length !== 32) {
        return { error: 'Schema id must decode to 32 bytes.' }
      }
      return {
        schemaId: `did:qsb:schema:${idPart}`,
        schemaHex: u8aToHex(decoded),
      }
    } catch (error) {
      return { error: 'Invalid schema id format.' }
    }
  }

  const normalizeSchemaRecord = (schemaId, recordCodec) => {
    if (!recordCodec) {
      return null
    }

    const json = recordCodec.toJSON ? recordCodec.toJSON() : recordCodec
    const version = Number(json?.version ?? 0)
    const deprecated = Boolean(json?.deprecated)
    const issuerDidHex = json?.issuerDid || json?.issuer_did || ''
    const schemaHash = json?.schemaHash || json?.schema_hash || ''
    const schemaUriHex = json?.schemaUri || json?.schema_uri || ''

    return {
      schemaId,
      version,
      deprecated,
      issuerDidHex,
      issuerDidText: decodeHexBytesToText(issuerDidHex),
      schemaHash,
      schemaUriHex,
      schemaUriText: decodeHexBytesToText(schemaUriHex),
    }
  }

  const buildSchemaId = schemaJson => {
    if (!api?.genesisHash) {
      return ''
    }
    const schemaBytes = stringToU8a(schemaJson)
    const material = u8aConcat(
      stringToU8a(SCHEMA_MATERIAL_PREFIX),
      api.genesisHash.toU8a(),
      schemaBytes
    )
    const schemaId = blake2AsU8a(material, 256)
    return `did:qsb:schema:${base58Encode(schemaId)}`
  }

  useEffect(() => {
    if (activeFeature !== 'Schema') {
      return
    }

    const didRaw = schemaDidInput.trim()
    if (!didRaw) {
      setSchemaEntriesForDid([])
      return
    }

    if (!api?.query?.schema?.schemas?.entries) {
      setSchemaEntriesForDid([])
      setSchemaEntriesError('Schema storage query is not available in this runtime.')
      return
    }

    const normalizedDid = normalizeDidInput(didRaw)
    if (normalizedDid.error) {
      setSchemaEntriesForDid([])
      setSchemaEntriesError(normalizedDid.error)
      return
    }

    let cancelled = false
    const loadSchemas = async () => {
      setIsLoadingSchemaEntries(true)
      setSchemaEntriesError('')
      try {
        const issuerDidHex = stringToHex(normalizedDid.did).toLowerCase()
        const entries = await api.query.schema.schemas.entries()
        const matched = []

        entries.forEach(([storageKey, entryValue]) => {
          const recordCodec = entryValue?.isSome ? entryValue.unwrap() : entryValue
          if (!recordCodec || entryValue?.isNone) {
            return
          }

          const schemaHex = storageKey?.args?.[0]?.toHex
            ? storageKey.args[0].toHex()
            : ''
          if (!schemaHex || !isHex(schemaHex)) {
            return
          }

          const schemaId = `did:qsb:schema:${base58Encode(hexToU8a(schemaHex))}`
          const record = normalizeSchemaRecord(schemaId, recordCodec)
          if (!record?.issuerDidHex) {
            return
          }

          if (String(record.issuerDidHex).toLowerCase() === issuerDidHex) {
            matched.push(record)
          }
        })

        if (!cancelled) {
          setSchemaEntriesForDid(matched)
          const previewInMatched = matched.some(item => item.schemaId === schemaPreviewIdInput)
          if (matched.length === 0) {
            setSchemaPreviewRecord(null)
          } else if (schemaAction !== 'register' && (!schemaPreviewIdInput.trim() || !previewInMatched)) {
            setSchemaPreviewIdInput(matched[0].schemaId)
            setSchemaPreviewRecord(matched[0])
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSchemaEntriesForDid([])
          setSchemaEntriesError(`Failed to load schemas: ${error.message}`)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSchemaEntries(false)
        }
      }
    }

    loadSchemas()

    return () => {
      cancelled = true
    }
  }, [activeFeature, api, schemaAction, schemaDidInput, schemaPreviewIdInput])

  const ensureSchemaReady = () => {
    if (!api) {
      addToast('error', 'API is not ready yet.')
      return false
    }
    if (!currentAccount) {
      addToast('error', 'Select an account before submitting.')
      return false
    }
    return true
  }

  const submitSchemaTx = async (tx, statusLabel, didForSignature, setLoading) => {
    const fromAccount = await getFromAccount()
    if (!fromAccount) {
      addToast('error', 'Unable to sign the transaction.')
      return
    }

    setLoading(true)
    addToast('info', statusLabel)

    try {
      const [addressOrPair, options] = fromAccount
      const hasInjectedSigner = Boolean(options?.signer)
      const signer = hasInjectedSigner
        ? wrapSignerWithDid(options.signer, didForSignature)
        : undefined

      const signPromise = hasInjectedSigner
        ? tx.signAndSend(addressOrPair, { ...options, signer }, result => {
          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                result.dispatchError.asModule
              )
              addToast('error', `Transaction failed: ${decoded.section}.${decoded.name}`)
              addAuditEntry('error', `Schema tx failed: ${decoded.section}.${decoded.name}`)
            } else {
              addToast('error', `Transaction failed: ${result.dispatchError.toString()}`)
              addAuditEntry('error', `Schema tx failed: ${result.dispatchError.toString()}`)
            }
            setLoading(false)
            return
          }

          if (result.status.isFinalized) {
            addToast(
              'info',
              `Transaction finalized. Block: ${result.status.asFinalized.toString()}`
            )
            addAuditEntry('success', 'Schema transaction finalized.', {
              block: result.status.asFinalized.toString(),
              txHash: result.txHash?.toString?.() || null,
            })
            setLoading(false)
          }
        })
        : tx.signAndSend(...fromAccount, result => {
          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                result.dispatchError.asModule
              )
              addToast('error', `Transaction failed: ${decoded.section}.${decoded.name}`)
              addAuditEntry('error', `Schema tx failed: ${decoded.section}.${decoded.name}`)
            } else {
              addToast('error', `Transaction failed: ${result.dispatchError.toString()}`)
              addAuditEntry('error', `Schema tx failed: ${result.dispatchError.toString()}`)
            }
            setLoading(false)
            return
          }

          if (result.status.isFinalized) {
            addToast(
              'info',
              `Transaction finalized. Block: ${result.status.asFinalized.toString()}`
            )
            addAuditEntry('success', 'Schema transaction finalized.', {
              block: result.status.asFinalized.toString(),
              txHash: result.txHash?.toString?.() || null,
            })
            setLoading(false)
          }
        })

      await signPromise
    } catch (error) {
      addToast('error', `Failed to submit: ${error.message}`)
      addAuditEntry('error', `Schema submit failed: ${error.message}`)
      setLoading(false)
    }
  }

  const fetchSchemaFromUrl = async () => {
    const normalizedDid = normalizeDidInput(schemaDidInput)
    if (normalizedDid.error) {
      setSchemaFetchError(normalizedDid.error)
      return false
    }

    const rawUrl = schemaUrlInput.trim()
    if (!rawUrl) {
      setSchemaFetchError('Enter schema URL first.')
      return false
    }

    try {
      new URL(rawUrl)
    } catch (error) {
      setSchemaFetchError('Schema URL must be a valid absolute URL.')
      return false
    }

    setIsFetchingSchema(true)
    setSchemaJsonError('')
    setSchemaFetchError('')

    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/schema+json, application/json, text/plain;q=0.9, */*;q=0.1',
        },
      })

      if (!response.ok) {
        setSchemaFetchError(`Failed to fetch schema: HTTP ${response.status}.`)
        setSchemaJsonInput('')
        setSchemaIdValue('')
        return false
      }

      const rawSchema = await response.text()
      if (!rawSchema.trim()) {
        setSchemaFetchError('Fetched schema is empty.')
        setSchemaJsonInput('')
        setSchemaIdValue('')
        return false
      }

      try {
        JSON.parse(rawSchema)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON.'
        setSchemaJsonError(message)
        setSchemaJsonInput('')
        setSchemaIdValue('')
        return false
      }

      setSchemaJsonInput(rawSchema)
      setSchemaIdValue(buildSchemaId(rawSchema))
      return true
    } catch (error) {
      setSchemaFetchError(`Failed to fetch schema: ${error.message}`)
      setSchemaJsonInput('')
      setSchemaIdValue('')
      return false
    } finally {
      setIsFetchingSchema(false)
    }
  }

  const loadSchemaPreview = async rawSchemaId => {
    if (!api?.query?.schema?.schemas) {
      setSchemaPreviewError('Schema storage query is not available in this runtime.')
      setSchemaPreviewRecord(null)
      return
    }

    const normalized = normalizeSchemaIdInput(rawSchemaId)
    if (normalized.error) {
      setSchemaPreviewError(normalized.error)
      setSchemaPreviewRecord(null)
      return
    }

    setIsLoadingSchemaPreview(true)
    setSchemaPreviewError('')
    try {
      const result = await api.query.schema.schemas(normalized.schemaHex)
      const recordCodec = result?.isSome ? result.unwrap() : result
      if (!recordCodec || result?.isNone) {
        setSchemaPreviewRecord(null)
        setSchemaPreviewError('Schema not found.')
        return
      }
      const normalizedRecord = normalizeSchemaRecord(normalized.schemaId, recordCodec)
      setSchemaPreviewRecord(normalizedRecord)
      setSchemaPreviewIdInput(normalized.schemaId)
    } catch (error) {
      setSchemaPreviewRecord(null)
      setSchemaPreviewError(`Failed to load schema: ${error.message}`)
    } finally {
      setIsLoadingSchemaPreview(false)
    }
  }

  const submitCreateSchema = async () => {
    if (!ensureSchemaReady()) {
      return
    }

    const didValue = normalizeDidInput(schemaDidInput)
    if (didValue.error) {
      addToast('error', didValue.error)
      return
    }

    if (!schemaUrlInput.trim()) {
      addToast('error', 'Enter a schema URL.')
      return
    }

    if (!schemaJsonInput.trim()) {
      addToast('error', 'Enter a JSON schema.')
      return
    }

    try {
      JSON.parse(schemaJsonInput)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON.'
      setSchemaJsonError(message)
      addToast('error', `Invalid JSON: ${message}`)
      return
    }

    const schemaId = buildSchemaId(schemaJsonInput)
    setSchemaIdValue(schemaId)

    if (!api?.tx?.schema?.registerSchema) {
      addToast('error', 'Schema pallet is not available in this runtime.')
      return
    }

    const schemaJsonHex = stringToHex(schemaJsonInput)
    const schemaUrlHex = stringToHex(schemaUrlInput.trim())
    const issuerDidHex = stringToHex(didValue.did)

    await submitSchemaTx(
      api.tx.schema.registerSchema(
        schemaJsonHex,
        schemaUrlHex,
        issuerDidHex,
        new Uint8Array()
      ),
      'Registering schema...',
      didValue.did,
      setIsCreatingSchema
    )
  }

  const submitDeprecateSchema = async () => {
    if (!ensureSchemaReady()) {
      return
    }

    const didValue = normalizeDidInput(schemaDidInput)
    if (didValue.error) {
      addToast('error', didValue.error)
      return
    }

    if (!api?.tx?.schema?.deprecateSchema) {
      addToast('error', 'deprecateSchema is not available in this runtime.')
      return
    }

    const normalizedSchemaId = normalizeSchemaIdInput(schemaPreviewIdInput)
    if (normalizedSchemaId.error) {
      setSchemaPreviewError(normalizedSchemaId.error)
      return
    }

    const issuerDidHex = stringToHex(didValue.did)
    if (
      schemaPreviewRecord?.issuerDidHex &&
      String(schemaPreviewRecord.issuerDidHex).toLowerCase() !== issuerDidHex.toLowerCase()
    ) {
      addToast('error', 'Issuer DID mismatch for selected schema.')
      return
    }

    try {
      await submitSchemaTx(
        api.tx.schema.deprecateSchema(
          normalizedSchemaId.schemaId,
          issuerDidHex,
          new Uint8Array()
        ),
        'Deprecating schema...',
        didValue.did,
        setIsDeprecatingSchema
      )
      addAuditEntry('warning', 'Schema deprecation submitted.', {
        did: didValue.did,
      })
    } finally {
      setIsDeprecatingSchema(false)
    }
  }

  return {
    schemaUrlInput,
    schemaJsonInput,
    schemaJsonError,
    isFetchingSchema,
    schemaIdValue,
    schemaAction,
    schemaPreviewIdInput,
    schemaPreviewRecord,
    schemaEntriesForDid,
    isLoadingSchemaEntries,
    isLoadingSchemaPreview,
    isDeprecatingSchema,
    isCreatingSchema,
    setSchemaAction,
    setSchemaUrlInput,
    setSchemaJsonInput,
    setSchemaJsonError,
    setSchemaIdValue,
    setSchemaPreviewIdInput,
    fetchSchemaFromUrl,
    loadSchemaPreview,
    submitCreateSchema,
    submitDeprecateSchema,
  }
}
