import React from 'react'
import { Button, Card, Dropdown, Form, Segment } from 'semantic-ui-react'

export default function DidDetailsCard(props) {
  const {
    didDetailsError,
    didDetailsStatus,
    didDetailsInput,
    didDetailsDocument,
    didDetailsRaw,
    didDetailsView,
    didOptions,
    isLoadingDids,
    isResolvingDid,
    setDidDetailsInput,
    setDidDetailsError,
    setDidDetailsStatus,
    setDidDetailsView,
    setDidOptions,
    resolveDidDetails,
    jsonSyntaxHighlight,
  } = props

  return (
    <Card fluid className="did-panel">
      <Card.Content>
        <Card.Header>DID details</Card.Header>
        <Card.Meta>Resolve DID via did_getByString RPC method.</Card.Meta>
      </Card.Content>
      <Card.Content>
        <Form>
          <Form.Group widths="equal">
            <Form.Field error={Boolean(didDetailsError)} width={14}>
              <label>Enter DID</label>
              <Dropdown
                fluid
                selection
                search
                allowAdditions
                className="did-input-dropdown"
                placeholder="DID"
                options={didOptions}
                loading={isLoadingDids}
                value={didDetailsInput}
                onAddItem={(_, { value }) => {
                  const newValue = String(value || '').trim()
                  if (!newValue) {
                    return
                  }
                  setDidOptions(prev => {
                    if (prev.some(option => option.value === newValue)) {
                      return prev
                    }
                    return [
                      ...prev,
                      { key: newValue, value: newValue, text: newValue },
                    ]
                  })
                }}
                onChange={(_, changed) => {
                  setDidDetailsInput(changed.value)
                  if (didDetailsError) {
                    setDidDetailsError('')
                  }
                  if (didDetailsStatus) {
                    setDidDetailsStatus('')
                  }
                }}
              />
            </Form.Field>
            <Form.Field
              width={2}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                primary
                type="button"
                onClick={resolveDidDetails}
                loading={isResolvingDid}
                disabled={isResolvingDid}
                style={{ width: '140px' }}
              >
                Resolve
              </Button>
            </Form.Field>
          </Form.Group>
        </Form>
        {(didDetailsDocument || didDetailsRaw) && (
          <Button.Group size="tiny" className="details-view-switch">
            <Button
              basic={didDetailsView !== 'didDocument'}
              primary={didDetailsView === 'didDocument'}
              onClick={() => setDidDetailsView('didDocument')}
            >
              DID Document
            </Button>
            <Button
              basic={didDetailsView !== 'raw'}
              primary={didDetailsView === 'raw'}
              onClick={() => setDidDetailsView('raw')}
            >
              Raw
            </Button>
          </Button.Group>
        )}
        {didDetailsDocument && didDetailsView === 'didDocument' && (
          <Segment
            style={{
              marginTop: '.75em',
              background: '#f9fafb',
              overflowX: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              dangerouslySetInnerHTML={{
                __html: jsonSyntaxHighlight(didDetailsDocument),
              }}
            >
            </pre>
          </Segment>
        )}
        {didDetailsRaw && didDetailsView === 'raw' && (
          <Segment
            style={{
              marginTop: '.75em',
              background: '#f9fafb',
              overflowX: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              dangerouslySetInnerHTML={{
                __html: jsonSyntaxHighlight(didDetailsRaw),
              }}
            >
            </pre>
          </Segment>
        )}
      </Card.Content>
    </Card>
  )
}
