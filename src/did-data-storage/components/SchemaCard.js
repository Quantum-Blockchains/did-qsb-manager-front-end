import React from 'react'
import { Button, Card, Dropdown, Form, Header, Input, Message, Segment } from 'semantic-ui-react'

const ACTION_META = {
  register: {
    title: 'Register Schema',
    meta: 'Register a new immutable schema record for a DID.',
  },
  preview: {
    title: 'Preview Schema',
    meta: 'Load and inspect schema record by id or from this DID list.',
  },
  deprecate: {
    title: 'Deprecate Schema',
    meta: 'Mark an existing schema as deprecated for this issuer DID.',
  },
}

const compactValue = (value, head = 24, tail = 14) => {
  if (!value || value.length <= head + tail + 3) {
    return value
  }
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

export default function SchemaCard(props) {
  const {
    didOptions,
    isLoadingDids,
    schemaAction,
    schemaDidInput,
    schemaUrlInput,
    schemaJsonInput,
    schemaJsonError,
    isFetchingSchema,
    schemaIdValue,
    schemaPreviewIdInput,
    schemaPreviewRecord,
    schemaEntriesForDid,
    isLoadingSchemaEntries,
    isLoadingSchemaPreview,
    isCreatingSchema,
    isDeprecatingSchema,
    setDidOptions,
    setSchemaDidInput,
    setSchemaUrlInput,
    setSchemaJsonInput,
    setSchemaJsonError,
    setSchemaIdValue,
    setSchemaPreviewIdInput,
    fetchSchemaFromUrl,
    submitCreateSchema,
    submitDeprecateSchema,
    loadSchemaPreview,
  } = props

  const actionMeta = ACTION_META[schemaAction] || ACTION_META.register

  const trimmedSchema = schemaJsonInput.trim()
  let parsedSchema = null
  let previewError = ''

  if (trimmedSchema) {
    try {
      parsedSchema = JSON.parse(schemaJsonInput)
    } catch (error) {
      previewError = error instanceof Error ? error.message : 'Invalid JSON.'
    }
  }

  const schemaOptions = schemaEntriesForDid.map(item => ({
    key: item.schemaId,
    value: item.schemaId,
    text: `${compactValue(item.schemaId, 24, 10)} • v${item.version} • ${item.deprecated ? 'deprecated' : 'active'}`,
  }))

  return (
    <Card fluid className="did-panel">
      <Card.Content>
        <Card.Header>{actionMeta.title}</Card.Header>
        <Card.Meta>{actionMeta.meta}</Card.Meta>
      </Card.Content>
      <Card.Content>
        <Form>
          <Form.Field>
            <label>Issuer DID</label>
            <Dropdown
              fluid
              selection
              search
              allowAdditions
              className="did-input-dropdown"
              placeholder="DID"
              options={didOptions}
              loading={isLoadingDids}
              value={schemaDidInput}
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
                setSchemaDidInput(changed.value)
                setSchemaJsonError('')
                setSchemaIdValue('')
              }}
            />
          </Form.Field>
        </Form>

        {(schemaAction === 'preview' || schemaAction === 'deprecate') && (
          <>
            {isLoadingSchemaEntries && (
              <Message info size="small" content="Loading existing schemas for selected DID..." />
            )}
            {!isLoadingSchemaEntries && schemaEntriesForDid.length === 0 && schemaDidInput.trim() && (
              <Message
                info
                size="small"
                content="No schemas found for this DID yet."
              />
            )}
            {schemaEntriesForDid.length > 0 && (
              <Form>
                <Form.Field>
                  <label>Schemas for selected DID</label>
                  <Dropdown
                    fluid
                    search
                    selection
                    className="did-input-dropdown"
                    placeholder="Pick existing schema"
                    options={schemaOptions}
                    value={schemaPreviewIdInput}
                    onChange={async (_, changed) => {
                      const selected = String(changed.value || '')
                      setSchemaPreviewIdInput(selected)
                      if (selected) {
                        await loadSchemaPreview(selected)
                      }
                    }}
                  />
                </Form.Field>
              </Form>
            )}

            <Form>
              <Form.Field>
                <label>Schema ID</label>
                <Input
                  fluid
                  placeholder="did:qsb:schema:..."
                  value={schemaPreviewIdInput}
                  onChange={(_, changed) => setSchemaPreviewIdInput(changed.value)}
                  action={{
                    icon: 'search',
                    content: 'Load',
                    onClick: async () => {
                      await loadSchemaPreview(schemaPreviewIdInput)
                    },
                    loading: isLoadingSchemaPreview,
                    disabled: isLoadingSchemaPreview,
                  }}
                />
              </Form.Field>
            </Form>

            {schemaPreviewRecord && (
              <Segment className="schema-preview-segment">
                <Header as="h5">Schema Record</Header>
                <div className="key-detail-row">
                  <span className="key-detail-label">Schema ID:</span>
                  <span className="key-detail-value" title={schemaPreviewRecord.schemaId}>
                    {compactValue(schemaPreviewRecord.schemaId, 28, 14)}
                  </span>
                </div>
                <div className="key-detail-row">
                  <span className="key-detail-label">Version:</span>
                  <span className="key-detail-value">{schemaPreviewRecord.version}</span>
                </div>
                <div className="key-detail-row">
                  <span className="key-detail-label">Status:</span>
                  <span className="key-detail-value">
                    <span className={`key-status-badge ${schemaPreviewRecord.deprecated ? 'revoked' : 'active'}`}>
                      {schemaPreviewRecord.deprecated ? 'deprecated' : 'active'}
                    </span>
                  </span>
                </div>
                <div className="key-detail-row">
                  <span className="key-detail-label">Issuer DID:</span>
                  <span className="key-detail-value" title={schemaPreviewRecord.issuerDidText || schemaPreviewRecord.issuerDidHex}>
                    {compactValue(schemaPreviewRecord.issuerDidText || schemaPreviewRecord.issuerDidHex, 28, 14)}
                  </span>
                </div>
                <div className="key-detail-row">
                  <span className="key-detail-label">Schema hash:</span>
                  <span className="key-detail-value" title={schemaPreviewRecord.schemaHash}>
                    {compactValue(schemaPreviewRecord.schemaHash, 24, 12)}
                  </span>
                </div>
                <div className="key-detail-row">
                  <span className="key-detail-label">Schema URI:</span>
                  <span className="key-detail-value" title={schemaPreviewRecord.schemaUriText || schemaPreviewRecord.schemaUriHex}>
                    {schemaPreviewRecord.schemaUriText || schemaPreviewRecord.schemaUriHex || '—'}
                  </span>
                </div>
              </Segment>
            )}
          </>
        )}

        {schemaAction === 'register' && (
          <Form>
            <Form.Field>
              <label>Schema URL</label>
              <Input
                placeholder="https://example.com/schema.json"
                value={schemaUrlInput}
                onChange={(_, changed) => {
                  setSchemaUrlInput(changed.value)
                  setSchemaJsonInput('')
                  setSchemaJsonError('')
                  setSchemaIdValue('')
                }}
                action={{
                  icon: 'download',
                  content: 'Fetch schema',
                  onClick: async () => {
                    await fetchSchemaFromUrl()
                  },
                  loading: isFetchingSchema,
                  disabled: isFetchingSchema,
                }}
              />
            </Form.Field>
            {schemaJsonError && (
              <Message negative size="small" content={`Schema JSON error: ${schemaJsonError}`} />
            )}
            <Message
              info
              size="small"
              content="Schema is fetched from URL and shown read-only. Schema ID depends on exact fetched JSON bytes."
            />
            <Segment className="schema-preview-segment">
              <Header as="h5">Fetched Schema (read-only)</Header>
              {!trimmedSchema && (
                <Message
                  info
                  size="small"
                  content="Provide schema URL and click Fetch schema."
                />
              )}
              {trimmedSchema && previewError && (
                <Message
                  negative
                  size="small"
                  content={`Preview unavailable: ${previewError}`}
                />
              )}
              {parsedSchema && (
                <pre className="schema-preview-code">
                  <code>{JSON.stringify(parsedSchema, null, 2)}</code>
                </pre>
              )}
            </Segment>
            <Form.Field>
              <label>Computed Schema ID</label>
              <Input
                fluid
                readOnly
                placeholder="Schema ID will appear after validation"
                value={schemaIdValue}
              />
            </Form.Field>
            <Button
              primary
              type="button"
              onClick={submitCreateSchema}
              loading={isCreatingSchema}
              disabled={isCreatingSchema || isFetchingSchema || !trimmedSchema || Boolean(previewError)}
            >
              Register schema
            </Button>
          </Form>
        )}

        {schemaAction === 'deprecate' && (
          <>
            <Message
              warning
              size="small"
              content="Deprecation is issuer-bound. Selected Issuer DID must match schema issuer DID."
            />
            <Button
              negative
              type="button"
              onClick={submitDeprecateSchema}
              loading={isDeprecatingSchema}
              disabled={isDeprecatingSchema || !schemaPreviewIdInput}
            >
              Deprecate schema
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  )
}
