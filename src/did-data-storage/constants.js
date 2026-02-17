const DID_ADD_KEY_PREFIX = 'QSB_DID_ADD_KEY'
const DID_REVOKE_KEY_PREFIX = 'QSB_DID_REVOKE_KEY'
const DID_DEACTIVATE_PREFIX = 'QSB_DID_DEACTIVATE'
const DID_ADD_SERVICE_PREFIX = 'QSB_DID_ADD_SERVICE'
const DID_REMOVE_SERVICE_PREFIX = 'QSB_DID_REMOVE_SERVICE'
const DID_SET_METADATA_PREFIX = 'QSB_DID_SET_METADATA'
const DID_REMOVE_METADATA_PREFIX = 'QSB_DID_REMOVE_METADATA'
const DID_UPDATE_ROLES_PREFIX = 'QSB_DID_UPDATE_ROLES'

const ROLE_OPTIONS = [
  { key: 'Authentication', text: 'Authentication', value: 'Authentication' },
  {
    key: 'AssertionMethod',
    text: 'AssertionMethod',
    value: 'AssertionMethod',
  },
  { key: 'KeyAgreement', text: 'KeyAgreement', value: 'KeyAgreement' },
  {
    key: 'CapabilityInvocation',
    text: 'CapabilityInvocation',
    value: 'CapabilityInvocation',
  },
  {
    key: 'CapabilityDelegation',
    text: 'CapabilityDelegation',
    value: 'CapabilityDelegation',
  },
]

export {
  DID_ADD_KEY_PREFIX,
  DID_REVOKE_KEY_PREFIX,
  DID_DEACTIVATE_PREFIX,
  DID_ADD_SERVICE_PREFIX,
  DID_REMOVE_SERVICE_PREFIX,
  DID_SET_METADATA_PREFIX,
  DID_REMOVE_METADATA_PREFIX,
  DID_UPDATE_ROLES_PREFIX,
  ROLE_OPTIONS,
}
