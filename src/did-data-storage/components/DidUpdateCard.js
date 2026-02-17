import React from 'react'
import { Card, Dropdown, Form, Message } from 'semantic-ui-react'
import KeysSection from './did-update/KeysSection'
import ServicesSection from './did-update/ServicesSection'
import MetadataSection from './did-update/MetadataSection'
import DeactivateSection from './did-update/DeactivateSection'

export default function DidUpdateCard(props) {
  const {
    didUpdateInput,
    didOptions,
    isLoadingDids,
    isLoadingDidUpdate,
    didUpdateSection,
    didUpdateChainData,
    isUpdatingDid,
    addKeyPublicKey,
    addKeyRoles,
    isAddKeyModalOpen,
    isKeyPreviewModalOpen,
    selectedKeyPreview,
    updateRolesPublicKey,
    updateRolesValues,
    isUpdateRolesModalOpen,
    serviceIdInput,
    serviceTypeInput,
    serviceEndpointInput,
    isAddServiceModalOpen,
    metadataKeyInput,
    metadataValueInput,
    isMetadataModalOpen,
    metadataModalMode,
    setDidUpdateInput,
    setDidOptions,
    setAddKeyPublicKey,
    setAddKeyRoles,
    setIsAddKeyModalOpen,
    setIsKeyPreviewModalOpen,
    setSelectedKeyPreview,
    setUpdateRolesPublicKey,
    setUpdateRolesValues,
    setIsUpdateRolesModalOpen,
    setServiceIdInput,
    setServiceTypeInput,
    setServiceEndpointInput,
    setIsAddServiceModalOpen,
    setMetadataKeyInput,
    setMetadataValueInput,
    setIsMetadataModalOpen,
    setMetadataModalMode,
    clearDidUpdateMessages,
    submitRevokeKeyValue,
    submitUpdateRoles,
    submitAddKey,
    submitRemoveServiceValue,
    submitAddService,
    submitRemoveMetadataValue,
    submitSetMetadata,
    submitDeactivateDid,
    toggleUpdateRole,
    toggleAddKeyRole,
    compactRawForDisplay,
    compactValue,
    formatBytesHex,
    formatBytesText,
    normalizeRoles,
  } = props

  const keys = Array.isArray(didUpdateChainData?.keys) ? didUpdateChainData.keys : []
  const services = Array.isArray(didUpdateChainData?.services) ? didUpdateChainData.services : []
  const metadata = Array.isArray(didUpdateChainData?.metadata) ? didUpdateChainData.metadata : []

  const actionHeaderMap = {
    Keys: {
      title: 'Manage Keys',
      meta: 'Add, revoke, and update DID verification keys.',
    },
    Services: {
      title: 'Manage Services',
      meta: 'Add and remove DID service endpoints.',
    },
    Metadata: {
      title: 'Manage Metadata',
      meta: 'Set, update, and remove DID metadata entries.',
    },
    'Deactivate DID': {
      title: 'Deactivate DID',
      meta: 'Permanently deactivate this DID on-chain.',
    },
  }

  const actionHeader = actionHeaderMap[didUpdateSection] || {
    title: 'DID Actions',
    meta: 'Manage DID keys, services, and metadata on-chain.',
  }

  return (
    <Card fluid className="did-panel">
      <Card.Content>
        <Card.Header>{actionHeader.title}</Card.Header>
        <Card.Meta>{actionHeader.meta}</Card.Meta>
      </Card.Content>
      <Card.Content>
        <Form>
          <Form.Field>
            <label>Target DID</label>
            <small className="field-hint">
              Pick a DID from extension storage or paste `did:qsb:...`.
            </small>
            <Dropdown
              fluid
              selection
              search
              allowAdditions
              className="did-input-dropdown"
              placeholder="DID"
              options={didOptions}
              loading={isLoadingDids}
              value={didUpdateInput}
              onAddItem={(_, { value }) => {
                const newValue = String(value || '').trim()
                if (!newValue) {
                  return
                }
                setDidOptions(prev => {
                  if (prev.some(option => option.value === newValue)) {
                    return prev
                  }
                  return [...prev, { key: newValue, value: newValue, text: newValue }]
                })
              }}
              onChange={(_, changed) => {
                setDidUpdateInput(changed.value)
                clearDidUpdateMessages()
              }}
            />
          </Form.Field>
        </Form>

        {isLoadingDidUpdate && (
          <Message
            info
            size="small"
            style={{ marginTop: '.5em' }}
            content="Loading DID data..."
          />
        )}

        {didUpdateSection === 'Keys' && (
          <KeysSection
            keys={keys}
            isUpdatingDid={isUpdatingDid}
            addKeyPublicKey={addKeyPublicKey}
            addKeyRoles={addKeyRoles}
            isAddKeyModalOpen={isAddKeyModalOpen}
            isKeyPreviewModalOpen={isKeyPreviewModalOpen}
            selectedKeyPreview={selectedKeyPreview}
            updateRolesPublicKey={updateRolesPublicKey}
            updateRolesValues={updateRolesValues}
            isUpdateRolesModalOpen={isUpdateRolesModalOpen}
            setAddKeyPublicKey={setAddKeyPublicKey}
            setAddKeyRoles={setAddKeyRoles}
            setIsAddKeyModalOpen={setIsAddKeyModalOpen}
            setIsKeyPreviewModalOpen={setIsKeyPreviewModalOpen}
            setSelectedKeyPreview={setSelectedKeyPreview}
            setUpdateRolesPublicKey={setUpdateRolesPublicKey}
            setUpdateRolesValues={setUpdateRolesValues}
            setIsUpdateRolesModalOpen={setIsUpdateRolesModalOpen}
            clearDidUpdateMessages={clearDidUpdateMessages}
            submitRevokeKeyValue={submitRevokeKeyValue}
            submitUpdateRoles={submitUpdateRoles}
            submitAddKey={submitAddKey}
            toggleUpdateRole={toggleUpdateRole}
            toggleAddKeyRole={toggleAddKeyRole}
            compactRawForDisplay={compactRawForDisplay}
            compactValue={compactValue}
            formatBytesHex={formatBytesHex}
            normalizeRoles={normalizeRoles}
          />
        )}

        {didUpdateSection === 'Services' && (
          <ServicesSection
            services={services}
            didUpdateInput={didUpdateInput}
            isUpdatingDid={isUpdatingDid}
            serviceIdInput={serviceIdInput}
            serviceTypeInput={serviceTypeInput}
            serviceEndpointInput={serviceEndpointInput}
            isAddServiceModalOpen={isAddServiceModalOpen}
            setServiceIdInput={setServiceIdInput}
            setServiceTypeInput={setServiceTypeInput}
            setServiceEndpointInput={setServiceEndpointInput}
            setIsAddServiceModalOpen={setIsAddServiceModalOpen}
            clearDidUpdateMessages={clearDidUpdateMessages}
            submitRemoveServiceValue={submitRemoveServiceValue}
            submitAddService={submitAddService}
            compactValue={compactValue}
            formatBytesHex={formatBytesHex}
            formatBytesText={formatBytesText}
          />
        )}

        {didUpdateSection === 'Metadata' && (
          <MetadataSection
            metadata={metadata}
            isUpdatingDid={isUpdatingDid}
            metadataKeyInput={metadataKeyInput}
            metadataValueInput={metadataValueInput}
            isMetadataModalOpen={isMetadataModalOpen}
            metadataModalMode={metadataModalMode}
            setMetadataKeyInput={setMetadataKeyInput}
            setMetadataValueInput={setMetadataValueInput}
            setIsMetadataModalOpen={setIsMetadataModalOpen}
            setMetadataModalMode={setMetadataModalMode}
            clearDidUpdateMessages={clearDidUpdateMessages}
            submitRemoveMetadataValue={submitRemoveMetadataValue}
            submitSetMetadata={submitSetMetadata}
            compactValue={compactValue}
            formatBytesHex={formatBytesHex}
            formatBytesText={formatBytesText}
          />
        )}

        {didUpdateSection === 'Deactivate DID' && (
          <DeactivateSection
            isUpdatingDid={isUpdatingDid}
            submitDeactivateDid={submitDeactivateDid}
          />
        )}
      </Card.Content>
    </Card>
  )
}
