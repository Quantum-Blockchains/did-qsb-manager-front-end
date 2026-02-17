import React, { useEffect, useState } from 'react'
import { Grid, Modal, Button, Card, Menu } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'

function Main(props) {
  const { api } = useSubstrateState()
  const [metadata, setMetadata] = useState({ data: null, version: null })
  const [selectedModule, setSelectedModule] = useState(0)

  useEffect(() => {
    const getMetadata = async () => {
      try {
        const data = await api.rpc.state.getMetadata()
        setMetadata({ data, version: data.version })
      } catch (e) {
        console.error(e)
      }
    }
    getMetadata()
  }, [api.rpc.state])

  useEffect(() => {
    setSelectedModule(0)
  }, [metadata.data])

  const modules = metadata?.data?.asLatest?.pallets || []
  const selected = modules[selectedModule]
  const selectedName = selected?.name?.toString?.() || 'Runtime metadata'
  const selectedPayload =
    selected?.toJSON?.() || metadata?.data?.toJSON?.() || metadata?.data

  return (
    <Grid.Column>
      <Card className="status-card metadata-card">
        <Card.Content>
          <Card.Header>Metadata</Card.Header>
          <Card.Meta>
            <span>v{metadata.version}</span>
          </Card.Meta>
        </Card.Content>
        <Card.Content extra>
          <Modal trigger={<Button>Show Metadata</Button>}>
            <Modal.Header>Runtime Metadata</Modal.Header>
            <Modal.Content scrolling className="metadata-modal">
              <Modal.Description className="metadata-split">
                <div className="metadata-sidebar">
                  <Menu fluid vertical secondary>
                    {modules.length === 0 && (
                      <Menu.Item
                        active
                        content="Runtime"
                        onClick={() => setSelectedModule(0)}
                      />
                    )}
                    {modules.map((pallet, index) => {
                      const palletName =
                        pallet?.name?.toString?.() ||
                        String(pallet?.name || `Pallet ${index + 1}`)
                      return (
                        <Menu.Item
                          key={`${palletName}-${index}`}
                          active={selectedModule === index}
                          content={palletName}
                          onClick={() => setSelectedModule(index)}
                        />
                      )
                    })}
                  </Menu>
                </div>
                <div className="metadata-content">
                  <h4>{selectedName}</h4>
                  <pre>
                    <code>{JSON.stringify(selectedPayload, null, 2)}</code>
                  </pre>
                </div>
              </Modal.Description>
            </Modal.Content>
          </Modal>
        </Card.Content>
      </Card>
    </Grid.Column>
  )
}

export default function Metadata(props) {
  const { api } = useSubstrateState()
  return api.rpc && api.rpc.state && api.rpc.state.getMetadata ? (
    <Main {...props} />
  ) : null
}
