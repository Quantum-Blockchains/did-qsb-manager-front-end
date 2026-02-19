import React from 'react'
import { Button, Form, Header, Input, Message, Modal, Segment } from 'semantic-ui-react'

export default function MetadataSection(props) {
  const {
    metadata,
    isUpdatingDid,
    metadataKeyInput,
    metadataValueInput,
    isMetadataModalOpen,
    metadataModalMode,
    setMetadataKeyInput,
    setMetadataValueInput,
    setIsMetadataModalOpen,
    setMetadataModalMode,
    clearDidUpdateMessages,
    submitRemoveMetadataValue,
    submitSetMetadata,
    compactValue,
    formatBytesHex,
    formatBytesText,
  } = props

  return (
    <Segment>
      <Header as="h4">Existing Metadata</Header>
      {metadata.length === 0 ? (
        <Message size="small" info content="No metadata found for this DID." />
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1em',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            alignItems: 'stretch',
            gridAutoRows: '1fr',
          }}
        >
          {metadata.map((entry, index) => {
            const keyHex = formatBytesHex(entry.key)
            const keyText = formatBytesText(entry.key)
            const valueText = formatBytesText(entry.value)

            return (
              <Segment
                key={`${keyHex}-${index}`}
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '120px',
                  margin: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '.5em',
                  }}
                >
                  <Header as="h5" style={{ marginBottom: 0 }}>
                    Entry {index + 1}
                  </Header>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ wordBreak: 'break-word' }}>
                    <strong>Key:</strong>{' '}
                    <span title={keyText || keyHex || ''}>
                      {keyText || keyHex ? compactValue(keyText || keyHex, 30, 16) : '—'}
                    </span>
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>
                    <strong>Value:</strong>{' '}
                    <span title={valueText || ''}>
                      {valueText ? compactValue(valueText, 30, 16) : '—'}
                    </span>
                  </div>
                </div>
                <div className="key-action-row" style={{ marginTop: '.65rem' }}>
                  <Button
                    type="button"
                    className="key-action-button key-action-secondary"
                    onClick={() => {
                      setMetadataModalMode('update')
                      setMetadataKeyInput(keyText || keyHex)
                      setMetadataValueInput(valueText)
                      setIsMetadataModalOpen(true)
                      clearDidUpdateMessages()
                    }}
                    disabled={isUpdatingDid}
                  >
                    Update
                  </Button>
                  <Button
                    negative
                    type="button"
                    className="key-action-button key-action-danger"
                    onClick={() => submitRemoveMetadataValue(keyHex)}
                    loading={isUpdatingDid}
                    disabled={isUpdatingDid}
                  >
                    Remove
                  </Button>
                </div>
              </Segment>
            )
          })}
        </div>
      )}

      <Button
        primary
        type="button"
        onClick={() => {
          setMetadataModalMode('add')
          setMetadataKeyInput('')
          setMetadataValueInput('')
          setIsMetadataModalOpen(true)
          clearDidUpdateMessages()
        }}
        disabled={isUpdatingDid}
        style={{ marginTop: '1.5em' }}
      >
        Add new metadata
      </Button>
      <Modal
        size="tiny"
        open={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        className="update-roles-modal"
      >
        <Modal.Header>
          {metadataModalMode === 'update' ? 'Update metadata' : 'Add new metadata'}
        </Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Key</label>
              <Input
                fluid
                placeholder="Key"
                readOnly={metadataModalMode === 'update'}
                value={metadataKeyInput}
                onChange={(_, changed) => {
                  setMetadataKeyInput(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Value</label>
              <Input
                fluid
                placeholder="Value"
                value={metadataValueInput}
                onChange={(_, changed) => {
                  setMetadataValueInput(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button type="button" onClick={() => setIsMetadataModalOpen(false)}>
            Cancel
          </Button>
          <Button
            primary
            type="button"
            onClick={async () => {
              const submitted = await submitSetMetadata()
              if (submitted) {
                setIsMetadataModalOpen(false)
              }
            }}
            loading={isUpdatingDid}
            disabled={isUpdatingDid}
          >
            {metadataModalMode === 'update' ? 'Update metadata' : 'Add metadata'}
          </Button>
        </Modal.Actions>
      </Modal>
    </Segment>
  )
}
