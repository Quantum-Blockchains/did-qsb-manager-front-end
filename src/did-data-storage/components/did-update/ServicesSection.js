import React from 'react'
import { Button, Form, Header, Input, Message, Modal, Segment } from 'semantic-ui-react'

export default function ServicesSection(props) {
  const {
    services,
    didUpdateInput,
    isUpdatingDid,
    serviceIdInput,
    serviceTypeInput,
    serviceEndpointInput,
    isAddServiceModalOpen,
    setServiceIdInput,
    setServiceTypeInput,
    setServiceEndpointInput,
    setIsAddServiceModalOpen,
    clearDidUpdateMessages,
    submitRemoveServiceValue,
    submitAddService,
    compactValue,
    formatBytesHex,
    formatBytesText,
  } = props

  return (
    <Segment>
      <Header as="h4">Existing Services</Header>
      {services.length === 0 ? (
        <Message size="small" info content="No services found for this DID." />
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1em',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'stretch',
            gridAutoRows: '1fr',
          }}
        >
          {services.map((service, index) => {
            const serviceIdHex = formatBytesHex(service.id)
            const serviceIdText = formatBytesText(service.id)
            const serviceTypeText = formatBytesText(service.service_type)
            const endpointText = formatBytesText(service.endpoint)
            const ownerDid = didUpdateInput.trim()
            const serviceName = serviceIdText || serviceIdHex || '—'

            return (
              <Segment
                key={`${serviceIdHex}-${index}`}
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '120px',
                  margin: 0,
                }}
              >
                <div style={{ marginBottom: '.5em' }}>
                  <Header as="h5" style={{ marginBottom: 0 }}>
                    Service {index + 1}
                  </Header>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ wordBreak: 'break-word' }}>
                    <strong>Name:</strong>{' '}
                    <span title={`${ownerDid}#${serviceName}`}>
                      {compactValue(`${ownerDid}#${serviceName}`, 28, 18)}
                    </span>
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>
                    <strong>Type:</strong>{' '}
                    <span title={serviceTypeText || ''}>
                      {serviceTypeText ? compactValue(serviceTypeText, 28, 16) : '—'}
                    </span>
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>
                    <strong>Endpoint:</strong>{' '}
                    <span title={endpointText || ''}>
                      {endpointText ? compactValue(endpointText, 28, 16) : '—'}
                    </span>
                  </div>
                </div>
                <div className="key-action-row" style={{ marginTop: '.65rem' }}>
                  <Button
                    negative
                    type="button"
                    className="key-action-button key-action-danger"
                    onClick={() => submitRemoveServiceValue(serviceIdHex)}
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
          setServiceIdInput('')
          setServiceTypeInput('')
          setServiceEndpointInput('')
          setIsAddServiceModalOpen(true)
          clearDidUpdateMessages()
        }}
        disabled={isUpdatingDid}
        style={{ marginTop: '1.5em' }}
      >
        Add new service
      </Button>
      <Modal
        size="tiny"
        open={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        className="update-roles-modal"
      >
        <Modal.Header>Add new service</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Name</label>
              <Input
                fluid
                placeholder="Name"
                value={serviceIdInput}
                onChange={(_, changed) => {
                  setServiceIdInput(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Type</label>
              <Input
                fluid
                placeholder="Type"
                value={serviceTypeInput}
                onChange={(_, changed) => {
                  setServiceTypeInput(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
            <Form.Field>
              <label>Endpoint</label>
              <Input
                fluid
                placeholder="Endpoint"
                value={serviceEndpointInput}
                onChange={(_, changed) => {
                  setServiceEndpointInput(changed.value)
                  clearDidUpdateMessages()
                }}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button type="button" onClick={() => setIsAddServiceModalOpen(false)}>
            Cancel
          </Button>
          <Button
            primary
            type="button"
            onClick={async () => {
              const submitted = await submitAddService()
              if (submitted) {
                setIsAddServiceModalOpen(false)
              }
            }}
            loading={isUpdatingDid}
            disabled={isUpdatingDid}
          >
            Add service
          </Button>
        </Modal.Actions>
      </Modal>
    </Segment>
  )
}
