import React from 'react'
import { Button, Header, Segment } from 'semantic-ui-react'

export default function DeactivateSection({ isUpdatingDid, submitDeactivateDid }) {
  return (
    <Segment>
      <Header as="h4">Deactivate DID</Header>
      <Button
        negative
        type="button"
        onClick={submitDeactivateDid}
        loading={isUpdatingDid}
        disabled={isUpdatingDid}
      >
        Deactivate DID
      </Button>
    </Segment>
  )
}
