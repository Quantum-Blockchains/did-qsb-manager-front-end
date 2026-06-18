import React, { useCallback, useEffect, useState } from 'react'
import { Grid, Header, Icon } from 'semantic-ui-react'
import {
  base58Decode,
  base58Encode,
} from '@polkadot/util-crypto'
import { web3Enable, web3FromSource } from '@polkadot/extension-dapp'
import {
  hexToU8a,
  isHex,
  stringToHex,
  stringToU8a,
  u8aConcat,
  u8aToHex,
  u8aToString,
} from '@polkadot/util'

import { useSubstrateState } from './substrate-lib'
import config from './config'
import buildDidDocument, { buildDidResolutionError } from './did-data-storage/buildDidDocument'
import {
  DID_ADD_KEY_PREFIX,
  DID_REVOKE_KEY_PREFIX,
  DID_DEACTIVATE_PREFIX,
  DID_ADD_SERVICE_PREFIX,
  DID_REMOVE_SERVICE_PREFIX,
  DID_SET_METADATA_PREFIX,
  DID_REMOVE_METADATA_PREFIX,
  DID_UPDATE_ROLES_PREFIX,
  ROLE_OPTIONS,
} from './did-data-storage/constants'
import DidDetailsCard from './did-data-storage/components/DidDetailsCard'
import DidUpdateCard from './did-data-storage/components/DidUpdateCard'
import SchemaCard from './did-data-storage/components/SchemaCard'
import SidebarPanels from './did-data-storage/components/SidebarPanels'
import useSchemaActions from './did-data-storage/hooks/useSchemaActions'

export default function DidDataStorage() {
  const { api, currentAccount } = useSubstrateState()
  const [didDetailsInput, setDidDetailsInput] = useState('')
  const [didDetailsError, setDidDetailsError] = useState('')
  const [didDetailsStatus, setDidDetailsStatus] = useState('')
  const [didDetailsDocument, setDidDetailsDocument] = useState(null)
  const [didDetailsRaw, setDidDetailsRaw] = useState(null)
  const [didDetailsView, setDidDetailsView] = useState('didDocument')
  const [isResolvingDid, setIsResolvingDid] = useState(false)
  const [didUpdateInput, setDidUpdateInput] = useState('')
  const [addKeyMaterialType, setAddKeyMaterialType] = useState('Multikey')
  const [addKeyPublicKey, setAddKeyPublicKey] = useState('')
  const [addKeyIdSuffix, setAddKeyIdSuffix] = useState('')
  const [addKeyController, setAddKeyController] = useState('')
  const [addKeyRoles, setAddKeyRoles] = useState([])
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false)
  const [isKeyPreviewModalOpen, setIsKeyPreviewModalOpen] = useState(false)
  const [selectedKeyPreview, setSelectedKeyPreview] = useState(null)
  const [updateRolesKeyId, setUpdateRolesKeyId] = useState('')
  const [updateRolesValues, setUpdateRolesValues] = useState([])
  const [isUpdateRolesModalOpen, setIsUpdateRolesModalOpen] = useState(false)
  const [serviceIdInput, setServiceIdInput] = useState('')
  const [serviceTypeInput, setServiceTypeInput] = useState('')
  const [serviceEndpointInput, setServiceEndpointInput] = useState('')
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
  const [metadataKeyInput, setMetadataKeyInput] = useState('')
  const [metadataValueInput, setMetadataValueInput] = useState('')
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false)
  const [metadataModalMode, setMetadataModalMode] = useState('add')
  const [didUpdateError, setDidUpdateError] = useState('')
  const [didUpdateStatus, setDidUpdateStatus] = useState('')
  const [isUpdatingDid, setIsUpdatingDid] = useState(false)
  const [activeFeature, setActiveFeature] = useState('DID details')
  const [didOptions, setDidOptions] = useState([])
  const [didOptionsError, setDidOptionsError] = useState('')
  const [isLoadingDids, setIsLoadingDids] = useState(false)
  const [walletStatus, setWalletStatus] = useState('unknown')
  const [walletError, setWalletError] = useState('')
  const [didUpdateSection, setDidUpdateSection] = useState('Keys')
  const [didUpdateChainData, setDidUpdateChainData] = useState(null)
  const [didUpdateLoadError, setDidUpdateLoadError] = useState('')
  const [isLoadingDidUpdate, setIsLoadingDidUpdate] = useState(false)
  const [schemaDidInput, setSchemaDidInput] = useState('')
  const [toasts, setToasts] = useState([])
  const [auditTimeline, setAuditTimeline] = useState([])

  const addToast = useCallback((type, content) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts(prev => [...prev, { id, type, content }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4500)
  }, [])

  const addAuditEntry = useCallback((entryType, details, data = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const timestamp = new Date().toISOString()
    setAuditTimeline(prev => [
      {
        id,
        entryType,
        details,
        timestamp,
        ...data,
      },
      ...prev,
    ].slice(0, 12))
  }, [])

  useEffect(() => {
    if (didDetailsError) {
      addToast('error', didDetailsError)
      setDidDetailsError('')
    }
  }, [addToast, didDetailsError])

  useEffect(() => {
    if (!didDetailsStatus || didDetailsStatus === 'Resolving DID...') {
      return
    }
    addToast('info', didDetailsStatus)
    setDidDetailsStatus('')
  }, [addToast, didDetailsStatus])

  useEffect(() => {
    if (didUpdateError) {
      addToast('error', didUpdateError)
      setDidUpdateError('')
    }
  }, [addToast, didUpdateError])

  useEffect(() => {
    if (!didUpdateStatus) {
      return
    }
    addToast('info', didUpdateStatus)
    setDidUpdateStatus('')
  }, [addToast, didUpdateStatus])

  useEffect(() => {
    if (didOptionsError) {
      addToast('error', didOptionsError)
      setDidOptionsError('')
    }
  }, [addToast, didOptionsError])

  useEffect(() => {
    if (walletError) {
      addToast('error', walletError)
    }
  }, [addToast, walletError])

  useEffect(() => {
    if (didUpdateLoadError) {
      addToast('error', didUpdateLoadError)
      setDidUpdateLoadError('')
    }
  }, [addToast, didUpdateLoadError])

  const isWalletDisconnectError = error => {
    const message = error instanceof Error ? error.message : String(error || '')
    return /disconnected port|extension context invalidated|receiving end does not exist|message channel closed/i.test(message)
  }

  const markWalletConnected = () => {
    setWalletStatus('connected')
    setWalletError('')
  }

  const markWalletDisconnected = (reason, clearCachedDids = true) => {
    setWalletStatus('disconnected')
    setWalletError(reason || 'Wallet disconnected. Reconnect wallet and try again.')
    if (clearCachedDids) {
      setDidOptions([])
    }
  }

  const enableWalletExtensions = async () => {
    setWalletStatus('checking')
    try {
      const extensions = await web3Enable(config.APP_NAME)
      if (!extensions.length) {
        throw new Error('No wallet extension enabled.')
      }
      markWalletConnected()
      return extensions
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      markWalletDisconnected(`Wallet connection failed: ${message}`)
      throw error
    }
  }

  const getDidsSigningExtension = async () => {
    const extensions = await enableWalletExtensions()
    const extension = extensions.find(item => item?.dids?.sign)

    if (!extension?.dids?.sign) {
      const message = 'Wallet does not support DID signing.'
      markWalletDisconnected(message, false)
      throw new Error(message)
    }

    return extension
  }

  const walletStatusMessage = () => {
    if (walletStatus === 'checking') {
      return 'Checking wallet connection...'
    }
    if (walletStatus === 'connected') {
      return 'Wallet connected.'
    }
    if (walletStatus === 'disconnected') {
      return walletError || 'Wallet disconnected. Reconnect wallet and try again.'
    }
    return ''
  }

  const normalizeDidInput = rawValue => {
    const value = rawValue.trim()
    if (!value) {
      return { error: 'Enter a DID.' }
    }

    const embeddedMatch = value.match(/did:qsb:[A-Za-z0-9]+/)
    if (embeddedMatch) {
      const normalizedDid = embeddedMatch[0]
      const didIdPart = normalizedDid.slice('did:qsb:'.length)
      try {
        const decoded = base58Decode(didIdPart)
        if (decoded.length !== 32) {
          return { error: 'DID must decode to 32 bytes.' }
        }
        return {
          did: normalizedDid,
          didId: didIdPart,
          didIdLength: decoded.length,
          didIdHex: u8aToHex(decoded),
        }
      } catch (error) {
        return { error: 'Invalid DID format. Use did:qsb:<id>.' }
      }
    }

    if (isHex(value)) {
      const bytes = hexToU8a(value)
      if (bytes.length !== 32) {
        return { error: 'Hex DID must be 32 bytes.' }
      }
      const didIdPart = base58Encode(bytes)
      const did = `did:qsb:${didIdPart}`
      return {
        did,
        didId: didIdPart,
        didIdLength: bytes.length,
        didIdHex: u8aToHex(bytes),
      }
    }

    if (value.startsWith('did:qsb:')) {
      const normalizedDid = value
      const didIdPart = normalizedDid.slice('did:qsb:'.length)
      try {
        const decoded = base58Decode(didIdPart)
        if (decoded.length !== 32) {
          return { error: 'DID must decode to 32 bytes.' }
        }
        return {
          did: normalizedDid,
          didId: didIdPart,
          didIdLength: decoded.length,
          didIdHex: u8aToHex(decoded),
        }
      } catch (error) {
        return { error: 'Invalid DID format. Use did:qsb:<id>.' }
      }
    }

    if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) {
      try {
        const decoded = base58Decode(value)
        if (decoded.length !== 32) {
          return { error: 'DID must decode to 32 bytes.' }
        }
        return {
          did: `did:qsb:${value}`,
          didId: value,
          didIdLength: decoded.length,
          didIdHex: u8aToHex(decoded),
        }
      } catch (error) {
        return { error: 'Invalid DID format. Use did:qsb:<id>.' }
      }
    }

    return { error: 'Invalid DID format. Use did:qsb:<id> or 0x<32-byte>.' }
  }

  const formatBytesHex = value => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return u8aToHex(Uint8Array.from(value))
  }

  const formatBytesText = value => {
    if (!value) return ''
    if (typeof value === 'string') return value
    try {
      return u8aToString(Uint8Array.from(value))
    } catch (error) {
      return ''
    }
  }

  const compactValue = (value, head = 22, tail = 14) => {
    if (!value || value.length <= head + tail + 3) {
      return value
    }
    return `${value.slice(0, head)}...${value.slice(-tail)}`
  }

  const normalizeRoles = roles =>
    (Array.isArray(roles) ? roles : [])
      .map(role => {
        if (typeof role === 'string') {
          return role
        }
        if (typeof role === 'number') {
          return ROLE_OPTIONS[role]?.value
        }
        if (role && typeof role === 'object') {
          const [key] = Object.keys(role)
          return key || null
        }
        return null
      })
      .filter(Boolean)

  const compactRawForDisplay = value => {
    if (Array.isArray(value)) {
      const isByteArray = value.every(
        item => Number.isInteger(item) && item >= 0 && item <= 255
      )
      if (isByteArray) {
        return u8aToHex(Uint8Array.from(value))
      }
      return value.map(item => compactRawForDisplay(item))
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).reduce((acc, [key, nested]) => {
        acc[key] = compactRawForDisplay(nested)
        return acc
      }, {})
    }

    return value
  }

  const resolveDidDetails = async () => {
    const provider = api?._rpcCore?.provider
    if (!provider) {
      setDidDetailsError('RPC provider is not ready yet.')
      return
    }

    const normalized = normalizeDidInput(didDetailsInput)
    if (normalized.error) {
      setDidDetailsError('')
      setDidDetailsDocument(buildDidResolutionError('invalidDid'))
      setDidDetailsRaw(null)
      setDidDetailsStatus('DID resolved with error: invalidDid.')
      addAuditEntry('warning', 'DID resolve returned invalidDid.', {
        did: didDetailsInput.trim(),
      })
      return
    }

    setDidDetailsError('')
    setDidDetailsStatus('Resolving DID...')
    setIsResolvingDid(true)
    setDidDetailsDocument(null)
    setDidDetailsRaw(null)
    setDidDetailsView('didDocument')

    try {
      const response = await provider.send('did_getByString', [normalized.did])
      const rpcResult = response?.result ?? response
      if (!rpcResult) {
        setDidDetailsDocument(buildDidResolutionError('notFound'))
        setDidDetailsRaw(null)
        setDidDetailsStatus('DID resolved with error: notFound.')
        addAuditEntry('warning', 'DID lookup returned no document.', {
          did: normalized.did,
        })
        return
      }
      setDidDetailsRaw(rpcResult)
      setDidDetailsDocument(buildDidDocument(normalized.did, rpcResult))
      setDidDetailsStatus('DID resolved successfully.')
      addAuditEntry('success', 'DID resolved.', {
        did: normalized.did,
      })
    } catch (error) {
      setDidDetailsStatus('DID resolved with error: internalError.')
      setDidDetailsError('')
      setDidDetailsDocument(buildDidResolutionError('internalError'))
      addAuditEntry('error', `DID resolve failed: ${error.message}`, {
        did: normalized.did,
      })
    } finally {
      setIsResolvingDid(false)
    }
  }

  const renderDidDetailsCard = () => (
    <DidDetailsCard
      didDetailsError={didDetailsError}
      didDetailsStatus={didDetailsStatus}
      didDetailsInput={didDetailsInput}
      didDetailsDocument={didDetailsDocument}
      didDetailsRaw={compactRawForDisplay(didDetailsRaw)}
      didDetailsView={didDetailsView}
      didOptions={didOptions}
      isLoadingDids={isLoadingDids}
      walletStatus={walletStatus}
      walletStatusMessage={walletStatusMessage()}
      reloadWalletDids={loadDidsFromExtension}
      isResolvingDid={isResolvingDid}
      setDidDetailsInput={setDidDetailsInput}
      setDidDetailsError={setDidDetailsError}
      setDidDetailsStatus={setDidDetailsStatus}
      setDidDetailsView={setDidDetailsView}
      setDidOptions={setDidOptions}
      resolveDidDetails={resolveDidDetails}
      jsonSyntaxHighlight={jsonSyntaxHighlight}
    />
  )

  const clearDidUpdateMessages = () => {
    if (didUpdateError) {
      setDidUpdateError('')
    }
    if (didUpdateStatus) {
      setDidUpdateStatus('')
    }
  }

  const toggleUpdateRole = roleValue => {
    setUpdateRolesValues(prev => {
      if (prev.includes(roleValue)) {
        return prev.filter(role => role !== roleValue)
      }
      return [...prev, roleValue]
    })
    clearDidUpdateMessages()
  }

  const toggleAddKeyRole = roleValue => {
    if (addKeyMaterialType === 'Jwk' && roleValue === 'CapabilityInvocation') {
      setDidUpdateError('JWK key material cannot be assigned CapabilityInvocation.')
      return
    }
    setAddKeyRoles(prev => {
      if (prev.includes(roleValue)) {
        return prev.filter(role => role !== roleValue)
      }
      return [...prev, roleValue]
    })
    clearDidUpdateMessages()
  }

  const toU8aInput = value => {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    if (isHex(trimmed)) {
      return trimmed
    }
    return stringToHex(trimmed)
  }

  const normalizeServiceIdInput = (value, did) => {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return null
    }

    if (isHex(trimmed)) {
      return trimmed
    }

    if (trimmed.startsWith('did:qsb:')) {
      return stringToHex(trimmed)
    }

    if (trimmed.startsWith('#')) {
      return stringToHex(trimmed)
    }

    return stringToHex(`#${trimmed}`)
  }

  const toDidUrlBytes = value => {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return null
    }
    return stringToHex(trimmed)
  }

  const jsonSyntaxHighlight = value => {
    const json = JSON.stringify(value, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return json.replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d+)?(?:[eE][+\\-]?\\d+)?)/g,
      match => {
        let color = '#6b7280'
        if (match.startsWith('"') && match.endsWith(':')) {
          color = '#e06c75'
        } else if (match.startsWith('"')) {
          color = '#98c379'
        } else if (match === 'true' || match === 'false') {
          color = '#56b6c2'
        } else if (match === 'null') {
          color = '#c678dd'
        } else {
          color = '#d19a66'
        }
        return `<span style="color:${color}">${match}</span>`
      }
    )
  }

  const getFromAccount = async () => {
    if (!currentAccount) {
      return null
    }

    const {
      address,
      meta: { source, isInjected },
    } = currentAccount

    if (!isInjected) {
      return [currentAccount]
    }

    const injector = await web3FromSource(source)
    return [address, { signer: injector.signer }]
  }

  const loadDidsFromExtension = async () => {
    setIsLoadingDids(true)
    setDidOptionsError('')

    try {
      const extensions = await enableWalletExtensions()
      const didRecords = []
      let hasDidsSupport = false

      for (const extension of extensions) {
        if (extension?.dids?.list) {
          hasDidsSupport = true
          const list = await extension.dids.list()
          didRecords.push(...(list || []))
        }
      }

      if (!hasDidsSupport) {
        setDidOptions([])
        markWalletDisconnected('Extension does not expose DID storage.', false)
        setDidOptionsError('Extension does not expose DID storage.')
        return
      }

      const uniqueRecords = new Map()
      didRecords.forEach(record => {
        if (record?.did && !uniqueRecords.has(record.did)) {
          uniqueRecords.set(record.did, record)
        }
      })

      const options = Array.from(uniqueRecords.values()).map(record => ({
        key: record.did,
        value: record.did,
        text: record.name ? `${record.name} (${record.did})` : record.did,
      }))

      setDidOptions(options)
      markWalletConnected()
      if (options.length === 0) {
        setDidOptionsError('No DIDs found in extension storage.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setDidOptions([])
      if (isWalletDisconnectError(error)) {
        markWalletDisconnected('Wallet disconnected. Reconnect wallet and try again.')
      }
      setDidOptionsError(`Failed to load DIDs: ${message}`)
    } finally {
      setIsLoadingDids(false)
    }
  }

  useEffect(() => {
    if (activeFeature === 'DID update' || activeFeature === 'DID details') {
      loadDidsFromExtension()
    }
  }, [activeFeature])

  const loadDidUpdateDetails = useCallback(async () => {
    if (activeFeature !== 'DID update') {
      return
    }

    if (!didUpdateInput.trim()) {
      setDidUpdateChainData(null)
      setDidUpdateLoadError('')
      return
    }

    const provider = api?._rpcCore?.provider
    if (!provider) {
      setDidUpdateLoadError('RPC provider is not ready yet.')
      setDidUpdateChainData(null)
      return
    }

    const normalized = normalizeDidInput(didUpdateInput)
    if (normalized.error) {
      setDidUpdateLoadError(normalized.error)
      setDidUpdateChainData(null)
      return
    }

    setIsLoadingDidUpdate(true)
    setDidUpdateLoadError('')

    try {
      const response = await provider.send('did_getByString', [normalized.did])
      const rpcResult = response?.result ?? response
      setDidUpdateChainData(rpcResult)
    } catch (error) {
      setDidUpdateChainData(null)
      setDidUpdateLoadError(`Failed to load DID data: ${error.message}`)
    } finally {
      setIsLoadingDidUpdate(false)
    }
  }, [activeFeature, api, didUpdateInput])

  useEffect(() => {
    if (activeFeature !== 'DID update') {
      return
    }

    const timeout = setTimeout(() => {
      loadDidUpdateDetails()
    }, 300)

    return () => clearTimeout(timeout)
  }, [activeFeature, didUpdateInput, loadDidUpdateDetails])

  const ensureApiReady = () => {
    if (!api) {
      setDidUpdateError('API is not ready yet.')
      return false
    }
    if (!currentAccount) {
      setDidUpdateError('Select an account before submitting.')
      return false
    }
    return true
  }

  const ensureDidValue = () => {
    const normalized = normalizeDidInput(didUpdateInput)
    if (normalized.error) {
      setDidUpdateError(normalized.error)
      return null
    }
    return normalized.did
  }

  const requestDidPassword = async (did, payload) => {
    const extension = await getDidsSigningExtension()
    try {
      await extension.dids.sign({ did, payload })
      markWalletConnected()
    } catch (error) {
      if (isWalletDisconnectError(error)) {
        markWalletDisconnected('Wallet disconnected. Reconnect wallet and try again.')
      }
      throw error
    }
  }

  const normalizeDidSignature = rawSignature => {
    if (!rawSignature) {
      return null
    }

    if (typeof rawSignature === 'string') {
      if (isHex(rawSignature)) {
        return rawSignature
      }
      const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
      if (base64Pattern.test(rawSignature)) {
        try {
          const decoded = atob(rawSignature)
          const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0))
          return u8aToHex(bytes)
        } catch (error) {
          return stringToHex(rawSignature)
        }
      }
      return stringToHex(rawSignature)
    }

    if (rawSignature instanceof Uint8Array) {
      return u8aToHex(rawSignature)
    }

    if (Array.isArray(rawSignature)) {
      return u8aToHex(Uint8Array.from(rawSignature))
    }

    if (typeof rawSignature === 'object') {
      if (typeof rawSignature.toHex === 'function') {
        return rawSignature.toHex()
      }

      const candidate =
        rawSignature.signature ??
        rawSignature.signatureHex ??
        rawSignature.didSignature ??
        rawSignature.signed ??
        rawSignature.result?.signature ??
        null

      return normalizeDidSignature(candidate)
    }

    return null
  }

  const requestDidSignature = async (did, payloadBytes) => {
    const extension = await getDidsSigningExtension()

    const payloadHex = u8aToHex(payloadBytes)
    const signRequest = {
      did,
      payload: payloadHex,
    }
    let rawSignature
    try {
      rawSignature = await extension.dids.sign(signRequest)
      markWalletConnected()
    } catch (error) {
      if (isWalletDisconnectError(error)) {
        markWalletDisconnected('Wallet disconnected. Reconnect wallet and try again.')
      }
      throw error
    }
    const didSignature = normalizeDidSignature(rawSignature)

    if (!didSignature) {
      throw new Error('Extension returned an invalid DID signature.')
    }

    return didSignature
  }

  const requestDidSignatureForUpdate = async (did, payloadBytes, actionLabel) => {
    try {
      return await requestDidSignature(did, payloadBytes)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setDidUpdateStatus('')
      setIsUpdatingDid(false)
      setDidUpdateError(`${actionLabel} failed during DID signing: ${message}`)
      addAuditEntry('error', `${actionLabel} signing failed: ${message}`, {
        did,
      })
      return null
    }
  }

  const buildSetMetadataDidPayload = (didValue, entry) => {
    // Build payload from call argument codecs to mirror pallet verification exactly:
    // prefix || did_id.encode() || entry.encode()
    const call = api.tx.did.setMetadata(didValue, entry, '0x')
    const didIdEncoded = call.method.args[0].toU8a()
    const entryEncoded = call.method.args[1].toU8a()
    const prefix = stringToU8a(DID_SET_METADATA_PREFIX)
    const payload = u8aConcat(prefix, didIdEncoded, entryEncoded)

    return payload
  }

  const buildDidPayload = (prefixValue, call) => {
    // Payload expected by pallet: prefix || all call args except did_signature
    const prefix = stringToU8a(prefixValue)
    const encodedArgs = call.method.args
      .slice(0, Math.max(0, call.method.args.length - 1))
      .map(arg => arg.toU8a())

    return u8aConcat(prefix, ...encodedArgs)
  }

  const decodeBase64Url = value => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  }

  const decodeUvarint = bytes => {
    let result = 0
    let shift = 0
    for (let index = 0; index < bytes.length; index += 1) {
      const byte = bytes[index]
      result |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) {
        return { value: result, length: index + 1 }
      }
      shift += 7
      if (shift > 53) {
        break
      }
    }
    return null
  }

  const validateKnownMultikeyLength = (codec, publicKeyLength) => {
    const knownLengths = {
      0x1210: [1312],
      0x1211: [1952],
      0x1212: [2592],
      0x00ed: [32],
      0x1200: [33, 65],
      0x1201: [33, 65],
    }
    const allowed = knownLengths[codec]
    return !allowed || allowed.includes(publicKeyLength)
  }

  const parseMultikeyInput = value => {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return { error: 'Enter Multikey key material.' }
    }
    if (!trimmed.startsWith('u')) {
      return { error: 'Multikey must start with "u".' }
    }
    if (trimmed.length === 1) {
      return { error: 'Multikey is missing encoded key bytes.' }
    }

    let decoded
    try {
      decoded = decodeBase64Url(trimmed.slice(1))
    } catch (error) {
      return { error: 'Multikey must be base64url encoded after the "u" prefix.' }
    }

    const codec = decodeUvarint(decoded)
    if (!codec || codec.length >= decoded.length) {
      return { error: 'Multikey must contain a multicodec prefix and public key bytes.' }
    }

    const publicKeyLength = decoded.length - codec.length
    if (!validateKnownMultikeyLength(codec.value, publicKeyLength)) {
      return { error: `Invalid Multikey length for codec 0x${codec.value.toString(16)}.` }
    }

    return {
      type: 'Multikey',
      codec: codec.value,
      publicKeyLength,
      callValue: stringToHex(trimmed),
    }
  }

  const parseJwkInput = value => {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return { error: 'Enter JWK key material.' }
    }

    let jsonText = trimmed
    if (isHex(trimmed)) {
      try {
        jsonText = u8aToString(hexToU8a(trimmed))
      } catch (error) {
        return { error: 'JWK hex input must decode to UTF-8 JSON.' }
      }
    }

    let parsed
    try {
      parsed = JSON.parse(jsonText)
    } catch (error) {
      return { error: 'JWK must be valid JSON.' }
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { error: 'JWK must be a JSON object.' }
    }
    if (!parsed.kty || typeof parsed.kty !== 'string') {
      return { error: 'JWK must include string field "kty".' }
    }

    const normalizedJson = JSON.stringify(parsed)
    const bytes = stringToU8a(normalizedJson)
    if (!bytes.length) {
      return { error: 'JWK must not be empty.' }
    }

    return {
      type: 'Jwk',
      callValue: u8aToHex(bytes),
    }
  }

  const parseAddKeyMaterial = () => {
    if (addKeyMaterialType === 'Jwk') {
      if (addKeyRoles.includes('CapabilityInvocation')) {
        return { error: 'JWK key material cannot be assigned CapabilityInvocation.' }
      }
      return parseJwkInput(addKeyPublicKey)
    }
    return parseMultikeyInput(addKeyPublicKey)
  }

  const didAddKeyUsesKeyMaterialInput = () => {
    const args = api?.tx?.did?.addKey?.meta?.args || []
    const materialArg = args[2]
    const argName = materialArg?.name?.toString?.() || ''
    const argType = materialArg?.type?.toString?.() || ''
    return /key_?material/i.test(argName) || /KeyMaterialInput/i.test(argType)
  }

  const toAddKeyCallMaterial = parsedMaterial => {
    if (!didAddKeyUsesKeyMaterialInput()) {
      if (parsedMaterial.type === 'Jwk') {
        return {
          error: 'Connected runtime does not expose KeyMaterialInput, so JWK keys cannot be added.',
        }
      }
      return { value: parsedMaterial.callValue }
    }

    return {
      value:
        parsedMaterial.type === 'Jwk'
          ? { Jwk: parsedMaterial.callValue }
          : { Multikey: parsedMaterial.callValue },
    }
  }

  const getKeyMaterialInfo = key => {
    const keyMaterial = key?.key_material || key?.keyMaterial || null
    const multikey = keyMaterial?.Multikey || keyMaterial?.multikey || null
    const jwk = keyMaterial?.Jwk || keyMaterial?.jwk || null

    if (multikey) {
      return {
        type: 'Multikey',
        publicKey: multikey.public_key || multikey.publicKey || [],
        multicodec: multikey.multicodec,
      }
    }

    if (jwk) {
      const publicKeyJwk = jwk.public_key_jwk || jwk.publicKeyJwk || jwk
      return {
        type: 'Jwk',
        publicKeyJwk,
      }
    }

    return {
      type: 'Multikey',
      publicKey: key?.public_key || key?.publicKey || [],
      multicodec: key?.multicodec,
    }
  }

  const getKeyMaterialType = key => getKeyMaterialInfo(key).type

  const getKeyMaterialHex = key => {
    const material = getKeyMaterialInfo(key)
    return material.type === 'Jwk'
      ? formatBytesHex(material.publicKeyJwk)
      : formatBytesHex(material.publicKey)
  }

  const wrapSignerWithDid = (signer, did) => {
    if (!did || !signer?.signPayload) {
      return signer
    }

    return {
      ...signer,
      signPayload: async payload => {
        await requestDidPassword(did, payload)
        return signer.signPayload(payload)
      },
    }
  }

  const {
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
  } = useSchemaActions({
    api,
    currentAccount,
    activeFeature,
    schemaDidInput,
    normalizeDidInput,
    getFromAccount,
    wrapSignerWithDid,
    addToast,
    addAuditEntry,
  })

  const submitTx = async (tx, statusLabel, didForSignature) => {
    const fromAccount = await getFromAccount()
    if (!fromAccount) {
      setDidUpdateError('Unable to sign the transaction.')
      return
    }

    setDidUpdateError('')
    setDidUpdateStatus(statusLabel)
    setIsUpdatingDid(true)

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
              setDidUpdateError(
                `Transaction failed: ${decoded.section}.${decoded.name}`
              )
              addAuditEntry(
                'error',
                `Tx failed: ${decoded.section}.${decoded.name}`,
                { did: didUpdateInput.trim() || null }
              )
            } else {
              setDidUpdateError(
                `Transaction failed: ${result.dispatchError.toString()}`
              )
              addAuditEntry(
                'error',
                `Tx failed: ${result.dispatchError.toString()}`,
                { did: didUpdateInput.trim() || null }
              )
            }
            setDidUpdateStatus('')
            setIsUpdatingDid(false)
            return
          }

          if (result.status.isFinalized) {
            setDidUpdateStatus(
              `Transaction finalized. Block: ${result.status.asFinalized.toString()}`
            )
            addAuditEntry('success', 'Transaction finalized.', {
              did: didUpdateInput.trim() || null,
              block: result.status.asFinalized.toString(),
              txHash: result.txHash?.toString?.() || null,
            })
            setIsUpdatingDid(false)
            loadDidUpdateDetails()
          } else {
            setDidUpdateStatus(
              `Current transaction status: ${result.status.type}`
            )
          }
        })
        : tx.signAndSend(...fromAccount, result => {
          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                result.dispatchError.asModule
              )
              setDidUpdateError(
                `Transaction failed: ${decoded.section}.${decoded.name}`
              )
              addAuditEntry(
                'error',
                `Tx failed: ${decoded.section}.${decoded.name}`,
                { did: didUpdateInput.trim() || null }
              )
            } else {
              setDidUpdateError(
                `Transaction failed: ${result.dispatchError.toString()}`
              )
              addAuditEntry(
                'error',
                `Tx failed: ${result.dispatchError.toString()}`,
                { did: didUpdateInput.trim() || null }
              )
            }
            setDidUpdateStatus('')
            setIsUpdatingDid(false)
            return
          }

          if (result.status.isFinalized) {
            setDidUpdateStatus(
              `Transaction finalized. Block: ${result.status.asFinalized.toString()}`
            )
            addAuditEntry('success', 'Transaction finalized.', {
              did: didUpdateInput.trim() || null,
              block: result.status.asFinalized.toString(),
              txHash: result.txHash?.toString?.() || null,
            })
            setIsUpdatingDid(false)
            loadDidUpdateDetails()
          } else {
            setDidUpdateStatus(
              `Current transaction status: ${result.status.type}`
            )
          }
        })

      await signPromise
    } catch (error) {
      setDidUpdateStatus('')
      setDidUpdateError(`Failed to submit: ${error.message}`)
      addAuditEntry('error', `Submit failed: ${error.message}`, {
        did: didUpdateInput.trim() || null,
      })
      setIsUpdatingDid(false)
    }
  }

  const submitAddKey = async () => {
    if (!ensureApiReady()) {
      return false
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return false
    }

    const parsedMaterial = parseAddKeyMaterial()
    if (parsedMaterial.error) {
      setDidUpdateError(parsedMaterial.error)
      return false
    }

    if (!addKeyRoles.length) {
      setDidUpdateError('Select at least one role.')
      return false
    }

    const keyIdSuffixRaw = String(addKeyIdSuffix || '').trim()
    const keyIdSuffix = keyIdSuffixRaw ? toU8aInput(keyIdSuffixRaw) : null
    if (keyIdSuffixRaw && !keyIdSuffix) {
      setDidUpdateError('Invalid key id suffix.')
      return false
    }

    const controllerRaw = String(addKeyController || '').trim()
    const controllerNormalized = controllerRaw
      ? normalizeDidInput(controllerRaw.startsWith('did:') ? controllerRaw : `did:qsb:${controllerRaw}`)
      : null
    if (controllerRaw && controllerNormalized?.error) {
      setDidUpdateError(`Invalid controller DID: ${controllerNormalized.error}`)
      return false
    }
    const controller = controllerRaw ? toU8aInput(controllerNormalized.did) : null
    const materialForCall = toAddKeyCallMaterial(parsedMaterial)
    if (materialForCall.error) {
      setDidUpdateError(materialForCall.error)
      return false
    }

    const payload = buildDidPayload(
      DID_ADD_KEY_PREFIX,
      api.tx.did.addKey(didValue, keyIdSuffix, materialForCall.value, addKeyRoles, controller, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Adding key')
    if (!didSignature) {
      return false
    }

    await submitTx(
      api.tx.did.addKey(didValue, keyIdSuffix, materialForCall.value, addKeyRoles, controller, didSignature),
      'Adding key...',
      null
    )
    return true
  }

  const submitRevokeKeyValue = async keyIdValue => {
    if (!ensureApiReady()) {
      return
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return
    }

    const keyId = toDidUrlBytes(keyIdValue)
    if (!keyId) {
      setDidUpdateError('Enter a key id to revoke.')
      return
    }

    const payload = buildDidPayload(
      DID_REVOKE_KEY_PREFIX,
      api.tx.did.revokeKey(didValue, keyId, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Revoking key')
    if (!didSignature) {
      return
    }

    await submitTx(
      api.tx.did.revokeKey(didValue, keyId, didSignature),
      'Revoking key...',
      null
    )
  }

  const submitDeactivateDid = async () => {
    if (!ensureApiReady()) {
      return
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return
    }

    const payload = buildDidPayload(
      DID_DEACTIVATE_PREFIX,
      api.tx.did.deactivateDid(didValue, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Deactivating DID')
    if (!didSignature) {
      return
    }

    await submitTx(
      api.tx.did.deactivateDid(didValue, didSignature),
      'Deactivating DID...',
      null
    )
  }

  const submitAddService = async () => {
    if (!ensureApiReady()) {
      return false
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return false
    }

    const serviceId = normalizeServiceIdInput(serviceIdInput, didValue)
    if (!serviceId) {
      setDidUpdateError('Enter a service id.')
      return false
    }

    const serviceType = toU8aInput(serviceTypeInput)
    if (!serviceType) {
      setDidUpdateError('Enter a service type.')
      return false
    }

    const endpoint = toU8aInput(serviceEndpointInput)
    if (!endpoint) {
      setDidUpdateError('Enter a service endpoint.')
      return false
    }

    const service = {
      id: serviceId,
      service_type: serviceType,
      endpoint,
    }

    const payload = buildDidPayload(
      DID_ADD_SERVICE_PREFIX,
      api.tx.did.addService(didValue, service, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Adding service')
    if (!didSignature) {
      return false
    }

    await submitTx(
      api.tx.did.addService(didValue, service, didSignature),
      'Adding service...',
      null
    )
    return true
  }

  const submitRemoveServiceValue = async serviceIdValue => {
    if (!ensureApiReady()) {
      return
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return
    }

    const serviceId = toU8aInput(serviceIdValue)
    if (!serviceId) {
      setDidUpdateError('Enter a service id to remove.')
      return
    }

    const payload = buildDidPayload(
      DID_REMOVE_SERVICE_PREFIX,
      api.tx.did.removeService(didValue, serviceId, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Removing service')
    if (!didSignature) {
      return
    }

    await submitTx(
      api.tx.did.removeService(didValue, serviceId, didSignature),
      'Removing service...',
      null
    )
  }

  const submitSetMetadata = async () => {
    if (!ensureApiReady()) {
      return false
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return false
    }

    const key = toU8aInput(metadataKeyInput)
    if (!key) {
      setDidUpdateError('Enter a metadata key.')
      return false
    }

    const value = toU8aInput(metadataValueInput)
    if (!value) {
      setDidUpdateError('Enter a metadata value.')
      return false
    }

    const entry = {
      key,
      value,
    }

    const payload = buildSetMetadataDidPayload(didValue, entry)
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Setting metadata')
    if (!didSignature) {
      return false
    }
    await submitTx(
      api.tx.did.setMetadata(didValue, entry, didSignature),
      'Setting metadata...',
      null
    )
    return true
  }

  const submitRemoveMetadataValue = async keyValue => {
    if (!ensureApiReady()) {
      return
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return
    }

    const key = toU8aInput(keyValue)
    if (!key) {
      setDidUpdateError('Enter a metadata key to remove.')
      return
    }

    const payload = buildDidPayload(
      DID_REMOVE_METADATA_PREFIX,
      api.tx.did.removeMetadata(didValue, key, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Removing metadata')
    if (!didSignature) {
      return
    }

    await submitTx(
      api.tx.did.removeMetadata(didValue, key, didSignature),
      'Removing metadata...',
      null
    )
  }

  const submitUpdateRoles = async () => {
    if (!ensureApiReady()) {
      return false
    }

    const didValue = ensureDidValue()
    if (!didValue) {
      return false
    }

    const keyId = toDidUrlBytes(updateRolesKeyId)
    if (!keyId) {
      setDidUpdateError('Enter key id.')
      return false
    }

    const knownKeys = Array.isArray(didUpdateChainData?.keys)
      ? didUpdateChainData.keys
      : []
    const matchedKey = knownKeys.find(
      key => formatBytesText(key.key_id) === String(updateRolesKeyId || '').trim()
    )
    if (matchedKey?.revoked) {
      setDidUpdateError('Revoked key cannot be updated.')
      return false
    }
    if (
      updateRolesValues.includes('CapabilityInvocation') &&
      matchedKey &&
      getKeyMaterialType(matchedKey) === 'Jwk'
    ) {
      setDidUpdateError('JWK key material cannot be assigned CapabilityInvocation.')
      return false
    }

    if (!updateRolesValues.length) {
      setDidUpdateError('Select at least one role.')
      return false
    }

    const payload = buildDidPayload(
      DID_UPDATE_ROLES_PREFIX,
      api.tx.did.updateRoles(didValue, keyId, updateRolesValues, '0x')
    )
    const didSignature = await requestDidSignatureForUpdate(didValue, payload, 'Updating roles')
    if (!didSignature) {
      return false
    }

    await submitTx(
      api.tx.did.updateRoles(
        didValue,
        keyId,
        updateRolesValues,
        didSignature
      ),
      'Updating roles...',
      null
    )
    return true
  }

  const renderDidUpdateCard = () => (
    <DidUpdateCard
      didUpdateInput={didUpdateInput}
      didOptions={didOptions}
      isLoadingDids={isLoadingDids}
      walletStatus={walletStatus}
      walletStatusMessage={walletStatusMessage()}
      reloadWalletDids={loadDidsFromExtension}
      isLoadingDidUpdate={isLoadingDidUpdate}
      didUpdateSection={didUpdateSection}
      didUpdateChainData={didUpdateChainData}
      isUpdatingDid={isUpdatingDid}
      addKeyMaterialType={addKeyMaterialType}
      addKeyPublicKey={addKeyPublicKey}
      addKeyIdSuffix={addKeyIdSuffix}
      addKeyController={addKeyController}
      addKeyRoles={addKeyRoles}
      isAddKeyModalOpen={isAddKeyModalOpen}
      isKeyPreviewModalOpen={isKeyPreviewModalOpen}
      selectedKeyPreview={selectedKeyPreview}
      updateRolesKeyId={updateRolesKeyId}
      updateRolesValues={updateRolesValues}
      isUpdateRolesModalOpen={isUpdateRolesModalOpen}
      serviceIdInput={serviceIdInput}
      serviceTypeInput={serviceTypeInput}
      serviceEndpointInput={serviceEndpointInput}
      isAddServiceModalOpen={isAddServiceModalOpen}
      metadataKeyInput={metadataKeyInput}
      metadataValueInput={metadataValueInput}
      isMetadataModalOpen={isMetadataModalOpen}
      metadataModalMode={metadataModalMode}
      setDidUpdateInput={setDidUpdateInput}
      setDidOptions={setDidOptions}
      setAddKeyMaterialType={setAddKeyMaterialType}
      setAddKeyPublicKey={setAddKeyPublicKey}
      setAddKeyIdSuffix={setAddKeyIdSuffix}
      setAddKeyController={setAddKeyController}
      setAddKeyRoles={setAddKeyRoles}
      setIsAddKeyModalOpen={setIsAddKeyModalOpen}
      setIsKeyPreviewModalOpen={setIsKeyPreviewModalOpen}
      setSelectedKeyPreview={setSelectedKeyPreview}
      setUpdateRolesKeyId={setUpdateRolesKeyId}
      setUpdateRolesValues={setUpdateRolesValues}
      setIsUpdateRolesModalOpen={setIsUpdateRolesModalOpen}
      setServiceIdInput={setServiceIdInput}
      setServiceTypeInput={setServiceTypeInput}
      setServiceEndpointInput={setServiceEndpointInput}
      setIsAddServiceModalOpen={setIsAddServiceModalOpen}
      setMetadataKeyInput={setMetadataKeyInput}
      setMetadataValueInput={setMetadataValueInput}
      setIsMetadataModalOpen={setIsMetadataModalOpen}
      setMetadataModalMode={setMetadataModalMode}
      clearDidUpdateMessages={clearDidUpdateMessages}
      submitRevokeKeyValue={submitRevokeKeyValue}
      submitUpdateRoles={submitUpdateRoles}
      submitAddKey={submitAddKey}
      submitRemoveServiceValue={submitRemoveServiceValue}
      submitAddService={submitAddService}
      submitRemoveMetadataValue={submitRemoveMetadataValue}
      submitSetMetadata={submitSetMetadata}
      submitDeactivateDid={submitDeactivateDid}
      toggleUpdateRole={toggleUpdateRole}
      toggleAddKeyRole={toggleAddKeyRole}
      compactRawForDisplay={compactRawForDisplay}
      compactValue={compactValue}
      formatBytesHex={formatBytesHex}
      formatBytesText={formatBytesText}
      normalizeRoles={normalizeRoles}
      getKeyMaterialType={getKeyMaterialType}
      getKeyMaterialHex={getKeyMaterialHex}
    />
  )

  const renderSchemaCard = () => {
    return (
      <SchemaCard
        didOptions={didOptions}
        isLoadingDids={isLoadingDids}
        walletStatus={walletStatus}
        walletStatusMessage={walletStatusMessage()}
        reloadWalletDids={loadDidsFromExtension}
        schemaAction={schemaAction}
        schemaDidInput={schemaDidInput}
        schemaUrlInput={schemaUrlInput}
        schemaJsonInput={schemaJsonInput}
        schemaJsonError={schemaJsonError}
        isFetchingSchema={isFetchingSchema}
        schemaIdValue={schemaIdValue}
        schemaPreviewIdInput={schemaPreviewIdInput}
        schemaPreviewRecord={schemaPreviewRecord}
        schemaEntriesForDid={schemaEntriesForDid}
        isLoadingSchemaEntries={isLoadingSchemaEntries}
        isLoadingSchemaPreview={isLoadingSchemaPreview}
        isDeprecatingSchema={isDeprecatingSchema}
        isCreatingSchema={isCreatingSchema}
        setDidOptions={setDidOptions}
        setSchemaDidInput={setSchemaDidInput}
        setSchemaUrlInput={setSchemaUrlInput}
        setSchemaJsonInput={setSchemaJsonInput}
        setSchemaJsonError={setSchemaJsonError}
        setSchemaIdValue={setSchemaIdValue}
        setSchemaPreviewIdInput={setSchemaPreviewIdInput}
        fetchSchemaFromUrl={fetchSchemaFromUrl}
        submitCreateSchema={submitCreateSchema}
        submitDeprecateSchema={submitDeprecateSchema}
        loadSchemaPreview={loadSchemaPreview}
      />
    )
  }

  const renderFeatureContent = () => {
    if (activeFeature === 'DID details') {
      return renderDidDetailsCard()
    }

    if (activeFeature === 'DID update') {
      return renderDidUpdateCard()
    }

    return renderSchemaCard()
  }

  return (
    <Grid.Column width={16} className="did-control-center">
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <span className="toast-text">
              {toast.content}
            </span>
            <button
              type="button"
              onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
              className="toast-close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Header as="h2" dividing className="did-title">
        <Icon name="cogs" color="grey" />
        <Header.Content>DID Control Center</Header.Content>
      </Header>
      <div className="did-layout">
        <aside className="did-sidebar">
          <SidebarPanels
            activeFeature={activeFeature}
            didUpdateSection={didUpdateSection}
            setActiveFeature={setActiveFeature}
            setDidUpdateSection={setDidUpdateSection}
            schemaAction={schemaAction}
            setSchemaAction={setSchemaAction}
            auditTimeline={auditTimeline}
          />
        </aside>
        <div>
          {renderFeatureContent()}
        </div>
      </div>
    </Grid.Column>
  )
}
