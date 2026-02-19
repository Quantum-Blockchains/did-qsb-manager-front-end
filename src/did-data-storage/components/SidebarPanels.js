import React from 'react'
import { Button, Card, Message } from 'semantic-ui-react'

export default function SidebarPanels(props) {
  const {
    activeFeature,
    didUpdateSection,
    setActiveFeature,
    setDidUpdateSection,
    schemaAction,
    setSchemaAction,
    auditTimeline,
  } = props

  return (
    <>
      <Card fluid className="sidebar-card">
        <Card.Content>
          <Card.Header>DID Actions</Card.Header>
          <Card.Meta>Identity management actions.</Card.Meta>
        </Card.Content>
        <Card.Content>
          <Button
            fluid
            basic
            className={`quick-action-button${activeFeature === 'DID details' ? ' active' : ''}`}
            onClick={() => setActiveFeature('DID details')}
          >
            Resolve DID
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'DID update' && didUpdateSection === 'Keys' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('DID update')
              setDidUpdateSection('Keys')
            }}
          >
            Manage Keys
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'DID update' && didUpdateSection === 'Services' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('DID update')
              setDidUpdateSection('Services')
            }}
          >
            Manage Services
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'DID update' && didUpdateSection === 'Metadata' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('DID update')
              setDidUpdateSection('Metadata')
            }}
          >
            Manage Metadata
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'DID update' && didUpdateSection === 'Deactivate DID'
                ? ' active'
                : ''
            }`}
            onClick={() => {
              setActiveFeature('DID update')
              setDidUpdateSection('Deactivate DID')
            }}
          >
            Deactivate DID
          </Button>
        </Card.Content>
      </Card>

      <Card fluid className="sidebar-card">
        <Card.Content>
          <Card.Header>Schema Actions</Card.Header>
          <Card.Meta>Schema editor and preview tools.</Card.Meta>
        </Card.Content>
        <Card.Content>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'Schema' && schemaAction === 'register' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('Schema')
              setSchemaAction('register')
            }}
          >
            Register Schema
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'Schema' && schemaAction === 'preview' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('Schema')
              setSchemaAction('preview')
            }}
          >
            Preview Schema
          </Button>
          <Button
            fluid
            basic
            className={`quick-action-button${
              activeFeature === 'Schema' && schemaAction === 'deprecate' ? ' active' : ''
            }`}
            onClick={() => {
              setActiveFeature('Schema')
              setSchemaAction('deprecate')
            }}
          >
            Deprecate Schema
          </Button>
        </Card.Content>
      </Card>

      <Card fluid className="sidebar-card timeline-card">
        <Card.Content>
          <Card.Header>Audit Timeline</Card.Header>
          <Card.Meta>Latest DID and schema actions in this session.</Card.Meta>
        </Card.Content>
        <Card.Content>
          {auditTimeline.length === 0 ? (
            <Message
              info
              size="small"
              content="No actions yet. Resolve a DID or submit an update."
            />
          ) : (
            <div className="audit-list">
              {auditTimeline.map(entry => (
                <div key={entry.id} className={`audit-item ${entry.entryType}`}>
                  <div className="audit-item-head">
                    <span>{entry.details}</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString('en-US')}</span>
                  </div>
                  <div className="audit-item-meta">
                    {entry.did ? `DID: ${entry.did}` : 'DID: -'}
                    {entry.block ? ` | Block: ${entry.block}` : ''}
                    {entry.txHash ? ` | Tx: ${entry.txHash.slice(0, 10)}...` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </>
  )
}
