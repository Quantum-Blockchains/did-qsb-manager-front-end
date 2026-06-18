import React from 'react'
import { Button, Form, Header, Input, Message, Modal, Segment, TextArea } from 'semantic-ui-react'
import { ROLE_OPTIONS } from '../../constants'

export default function KeysSection(props) {
  const {
    keys,
    isUpdatingDid,
    addKeyMaterialType,
    addKeyPublicKey,
    addKeyIdSuffix,
    addKeyController,
    addKeyRoles,
    isAddKeyModalOpen,
    isKeyPreviewModalOpen,
    selectedKeyPreview,
    updateRolesKeyId,
    updateRolesValues,
    isUpdateRolesModalOpen,
    setAddKeyMaterialType,
    setAddKeyPublicKey,
    setAddKeyIdSuffix,
    setAddKeyController,
    setAddKeyRoles,
    setIsAddKeyModalOpen,
    setIsKeyPreviewModalOpen,
    setSelectedKeyPreview,
    setUpdateRolesKeyId,
    setUpdateRolesValues,
    setIsUpdateRolesModalOpen,
    clearDidUpdateMessages,
    submitRevokeKeyValue,
    submitUpdateRoles,
    submitAddKey,
    toggleUpdateRole,
    toggleAddKeyRole,
    compactRawForDisplay,
    compactValue,
    formatBytesText,
    normalizeRoles,
    getKeyMaterialType,
    getKeyMaterialHex,
  } = props

  return (
    <Segment>
      <Header as="h4">Existing keys</Header>
      {keys.length === 0 ? (
        <Message size="small" info content="No keys found for this DID." />
      ) : (
        keys.map((key, index) => {
          const keyMaterialType = getKeyMaterialType(key)
          const keyMaterialHex = getKeyMaterialHex(key)
          const keyIdText = formatBytesText(key.key_id)
          const roles = normalizeRoles(key.roles)
          const isRevoked = Boolean(key.revoked)

          return (
            <Segment key={`${keyMaterialHex}-${index}`}>
              <Header as="h5">Key {index + 1}</Header>
              <div className="key-detail-row">
                <span className="key-detail-label">Material:</span>
                <span className="key-detail-value">
                  <span className="key-role-chip">{keyMaterialType}</span>
                </span>
              </div>
              <div className="key-detail-row">
                <span className="key-detail-label">Key ID:</span>
                <span className="key-detail-value" title={keyIdText}>
                  {keyIdText ? (
                    <span className="compact-inline-value">{compactValue(keyIdText)}</span>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="key-detail-row">
                <span className="key-detail-label">
                  {keyMaterialType === 'Jwk' ? 'JWK bytes:' : 'Public key:'}
                </span>
                <span className="key-detail-value" title={keyMaterialHex}>
                  {keyMaterialHex ? (
                    <span className="compact-inline-value">{compactValue(keyMaterialHex)}</span>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="key-detail-row">
                <span className="key-detail-label">Roles:</span>
                <span className="key-detail-value">
                  {roles.length ? (
                    <span className="key-role-list">
                      {roles.map(role => (
                        <span key={`${keyMaterialHex}-${role}`} className="key-role-chip">
                          {role}
                        </span>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="key-detail-row">
                <span className="key-detail-label">Status:</span>
                <span className="key-detail-value">
                  <span className={`key-status-badge ${isRevoked ? 'revoked' : 'active'}`}>
                    {isRevoked ? 'revoked' : 'active'}
                  </span>
                </span>
              </div>
              <div className="key-action-row">
                <Button
                  type="button"
                  className="key-action-button key-action-secondary"
                  onClick={() => {
                    setSelectedKeyPreview({
                      index: index + 1,
                      keyMaterialType,
                      keyIdText,
                      publicKeyHex: keyMaterialHex,
                      roles,
                      isRevoked,
                      rawKey: compactRawForDisplay(key),
                    })
                    setIsKeyPreviewModalOpen(true)
                  }}
                  disabled={isUpdatingDid}
                  style={{ marginTop: '.5em' }}
                >
                  Preview
                </Button>
                <Button
                  negative
                  type="button"
                  className="key-action-button key-action-danger"
                  onClick={() => submitRevokeKeyValue(keyIdText)}
                  loading={isUpdatingDid}
                  disabled={isUpdatingDid || isRevoked}
                  style={{ marginTop: '.5em' }}
                >
                  Revoke
                </Button>
                <Button
                  type="button"
                  className="key-action-button key-action-secondary"
                  onClick={() => {
                    setUpdateRolesKeyId(keyIdText)
                    setUpdateRolesValues(roles)
                    setIsUpdateRolesModalOpen(true)
                    clearDidUpdateMessages()
                  }}
                  disabled={isUpdatingDid || isRevoked}
                  title={isRevoked ? 'Revoked key cannot be updated' : undefined}
                  style={{ marginTop: '.5em' }}
                >
                  Update roles
                </Button>
              </div>
            </Segment>
          )
        })
      )}

      <Modal
        size="small"
        open={isKeyPreviewModalOpen}
        onClose={() => setIsKeyPreviewModalOpen(false)}
        className="key-preview-modal"
      >
        <Modal.Header>
          Key preview
          {selectedKeyPreview?.index ? ` #${selectedKeyPreview.index}` : ''}
        </Modal.Header>
        <Modal.Content scrolling>
          <div className="key-detail-row">
            <span className="key-detail-label">Key ID:</span>
            <span className="key-detail-value">
              <div className="modal-key-value" title={selectedKeyPreview?.keyIdText || ''}>
                {selectedKeyPreview?.keyIdText || '—'}
              </div>
            </span>
          </div>
          <div className="key-detail-row">
            <span className="key-detail-label">
              {selectedKeyPreview?.keyMaterialType === 'Jwk' ? 'JWK bytes:' : 'Public key:'}
            </span>
            <span className="key-detail-value">
              <div className="modal-key-value" title={selectedKeyPreview?.publicKeyHex || ''}>
                {selectedKeyPreview?.publicKeyHex || '—'}
              </div>
            </span>
          </div>
          <div className="key-detail-row">
            <span className="key-detail-label">Roles:</span>
            <span className="key-detail-value">
              {selectedKeyPreview?.roles?.length ? (
                <span className="key-role-list">
                  {selectedKeyPreview.roles.map(role => (
                    <span key={`preview-${role}`} className="key-role-chip">
                      {role}
                    </span>
                  ))}
                </span>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="key-detail-row">
            <span className="key-detail-label">Status:</span>
            <span className="key-detail-value">
              <span
                className={`key-status-badge ${
                  selectedKeyPreview?.isRevoked ? 'revoked' : 'active'
                }`}
              >
                {selectedKeyPreview?.isRevoked ? 'revoked' : 'active'}
              </span>
            </span>
          </div>
          <Segment className="key-preview-raw-segment">
            <Header as="h5">Raw key data</Header>
            <pre className="schema-preview-code">
              <code>{JSON.stringify(selectedKeyPreview?.rawKey || {}, null, 2)}</code>
            </pre>
          </Segment>
        </Modal.Content>
        <Modal.Actions>
          <Button type="button" onClick={() => setIsKeyPreviewModalOpen(false)}>
            Close
          </Button>
        </Modal.Actions>
      </Modal>

      <Modal
        size="tiny"
        open={isUpdateRolesModalOpen}
        onClose={() => setIsUpdateRolesModalOpen(false)}
        className="update-roles-modal"
      >
        <Modal.Header>Update key roles</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Key ID</label>
              <div className="modal-key-value" title={updateRolesKeyId}>
                {compactValue(updateRolesKeyId, 36, 20)}
              </div>
            </Form.Field>
            <Form.Field>
              <label>Roles</label>
              <div className="role-chip-grid">
                {ROLE_OPTIONS.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    className={`role-chip${updateRolesValues.includes(role.value) ? ' active' : ''}`}
                    onClick={() => toggleUpdateRole(role.value)}
                  >
                    {role.text}
                  </button>
                ))}
              </div>
              <div className="role-chip-hint">Click to toggle roles for this key.</div>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button type="button" onClick={() => setIsUpdateRolesModalOpen(false)}>
            Cancel
          </Button>
          <Button
            primary
            type="button"
            onClick={async () => {
              const submitted = await submitUpdateRoles()
              if (submitted) {
                setIsUpdateRolesModalOpen(false)
              }
            }}
            loading={isUpdatingDid}
            disabled={isUpdatingDid}
          >
            Update roles
          </Button>
        </Modal.Actions>
      </Modal>

      <Button
        primary
        type="button"
        onClick={() => {
          setAddKeyMaterialType('Multikey')
          setAddKeyPublicKey('')
          setAddKeyIdSuffix('')
          setAddKeyController('')
          setAddKeyRoles([])
          setIsAddKeyModalOpen(true)
          clearDidUpdateMessages()
        }}
        disabled={isUpdatingDid}
        style={{ marginTop: '1.5em' }}
      >
        Add key
      </Button>
      <Modal
        size="tiny"
        open={isAddKeyModalOpen}
        onClose={() => setIsAddKeyModalOpen(false)}
        className="update-roles-modal"
      >
        <Modal.Header>Add new key</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Key material</label>
              <Button.Group size="small" className="key-material-toggle">
                <Button
                  type="button"
                  active={addKeyMaterialType === 'Multikey'}
                  onClick={() => {
                    setAddKeyMaterialType('Multikey')
                    clearDidUpdateMessages()
                  }}
                >
                  Multikey
                </Button>
                <Button
                  type="button"
                  active={addKeyMaterialType === 'Jwk'}
                  onClick={() => {
                    setAddKeyMaterialType('Jwk')
                    setAddKeyRoles(prev => prev.filter(role => role !== 'CapabilityInvocation'))
                    clearDidUpdateMessages()
                  }}
                >
                  JWK
                </Button>
              </Button.Group>
              {addKeyMaterialType === 'Jwk' ? (
                <TextArea
                  rows={6}
                  placeholder='{"kty":"OKP","crv":"Ed25519","x":"..."}'
                  value={addKeyPublicKey}
                  onChange={(_, changed) => {
                    setAddKeyPublicKey(changed.value)
                    clearDidUpdateMessages()
                  }}
                />
              ) : (
                <Input
                  fluid
                  placeholder="Multikey (u...)"
                  value={addKeyPublicKey}
                  onChange={(_, changed) => {
                    setAddKeyPublicKey(changed.value)
                    clearDidUpdateMessages()
                  }}
                />
              )}
              <div className="role-chip-hint">
                {addKeyMaterialType === 'Jwk'
                  ? 'JWK must be a JSON object. CapabilityInvocation is disabled for JWK.'
                  : 'Multikey must start with u and contain a valid multicodec-prefixed public key.'}
              </div>
            </Form.Field>
            <Form.Field>
              <label>Key ID suffix (optional)</label>
              <Input
                fluid
                placeholder="#key-1 or key-1"
                value={addKeyIdSuffix}
                onChange={(_, changed) => {
                  setAddKeyIdSuffix(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Controller DID (optional)</label>
              <Input
                fluid
                placeholder="did:qsb:..."
                value={addKeyController}
                onChange={(_, changed) => {
                  setAddKeyController(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Roles</label>
              <div className="role-chip-grid">
                {ROLE_OPTIONS.map(role => (
                  <button
                    key={`add-${role.value}`}
                    type="button"
                    className={`role-chip${addKeyRoles.includes(role.value) ? ' active' : ''}`}
                    disabled={addKeyMaterialType === 'Jwk' && role.value === 'CapabilityInvocation'}
                    onClick={() => toggleAddKeyRole(role.value)}
                  >
                    {role.text}
                  </button>
                ))}
              </div>
              <div className="role-chip-hint">Click to toggle roles for the new key.</div>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button type="button" onClick={() => setIsAddKeyModalOpen(false)}>
            Cancel
          </Button>
          <Button
            primary
            type="button"
            onClick={async () => {
              const submitted = await submitAddKey()
              if (submitted) {
                setIsAddKeyModalOpen(false)
              }
            }}
            loading={isUpdatingDid}
            disabled={isUpdatingDid}
          >
            Add key
          </Button>
        </Modal.Actions>
      </Modal>
    </Segment>
  )
}
