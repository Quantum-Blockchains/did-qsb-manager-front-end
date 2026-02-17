import React, { useState, useEffect } from 'react'

import {
  Menu,
  Button,
  Dropdown,
  Container,
  Icon,
  Image,
  Label,
  Input,
  Message,
  Modal,
} from 'semantic-ui-react'

import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { BN } from '@polkadot/util'

import { useSubstrate, useSubstrateState } from './substrate-lib'

const acctAddr = acct => (acct ? acct.address : '')

function Main() {
  const {
    setCurrentAccount,
    state: { keyring, currentAccount },
  } = useSubstrate()
  const { api, socket } = useSubstrateState()
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveAddress, setReceiveAddress] = useState('')
  const [receiveStatus, setReceiveStatus] = useState('')
  const [isSendingFunds, setIsSendingFunds] = useState(false)
  const [networkStatus, setNetworkStatus] = useState({
    peers: 0,
    latencyMs: null,
    current: 0,
    finalized: 0,
    sync: false,
  })
  const [nodeInfo, setNodeInfo] = useState({
    name: 'QSB Node',
    chain: '',
  })

  // Get the list of accounts we possess the private key for
  const keyringOptions = keyring.getPairs().map(account => ({
    key: account.address,
    value: account.address,
    text: account.meta.name.toUpperCase(),
    icon: 'user',
  }))

  const initialAddress =
    keyringOptions.length > 0 ? keyringOptions[0].value : ''

  // Set the initial address
  useEffect(() => {
    // `setCurrentAccount()` is called only when currentAccount is null (uninitialized)
    !currentAccount &&
      initialAddress.length > 0 &&
      setCurrentAccount(keyring.getPair(initialAddress))
  }, [currentAccount, setCurrentAccount, keyring, initialAddress])

  const onChange = addr => {
    setCurrentAccount(keyring.getPair(addr))
  }

  const sendFunds = async () => {
    setReceiveStatus('')

    if (!api) {
      setReceiveStatus('API is not ready yet.')
      return
    }

    if (!receiveAddress.trim()) {
      setReceiveStatus('Enter an account address.')
      return
    }

    setIsSendingFunds(true)

    try {
      await cryptoWaitReady()
      const tempKeyring = new Keyring({ type: 'sr25519' })
      const senderPair = tempKeyring.addFromUri('//Alice')

      const decimals = api.registry.chainDecimals?.[0] ?? 0
      const base = new BN(10).pow(new BN(decimals))
      let amount = base.div(new BN(100000))
      if (amount.isZero()) {
        amount = new BN(1)
      }

      await api.tx.balances
        .transferKeepAlive(receiveAddress.trim(), amount)
        .signAndSend(senderPair, result => {
          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                result.dispatchError.asModule
              )
              setReceiveStatus(
                `Transaction failed: ${decoded.section}.${decoded.name}`
              )
            } else {
              setReceiveStatus(
                `Transaction failed: ${result.dispatchError.toString()}`
              )
            }
            setIsSendingFunds(false)
            return
          }

          if (result.status.isFinalized) {
            setReceiveStatus('Transfer finalized.')
            setIsSendingFunds(false)
          }
        })
    } catch (error) {
      setReceiveStatus(`Failed to send: ${error.message}`)
      setIsSendingFunds(false)
    }
  }

  useEffect(() => {
    if (!api?.rpc?.system?.health) {
      return undefined
    }

    let finalizedUnsub = null
    let mounted = true
    const pollHealth = async () => {
      const startedAt = Date.now()
      try {
        const [health, hash] = await Promise.all([
          api.rpc.system.health(),
          api.rpc.chain.getFinalizedHead(),
        ])
        const block = await api.rpc.chain.getHeader(hash)
        if (!mounted) {
          return
        }
        setNetworkStatus(prev => ({
          ...prev,
          peers: health.peers?.toNumber?.() ?? Number(health.peers || 0),
          latencyMs: Date.now() - startedAt,
          finalized: block.number?.toNumber?.() ?? 0,
          sync: Boolean(health.isSyncing?.isTrue || health.isSyncing),
        }))
      } catch (error) {
        console.error(error)
      }
    }

    pollHealth()
    const pollId = setInterval(pollHealth, 10000)

    if (api.derive?.chain?.bestNumberFinalized) {
      api.derive.chain.bestNumberFinalized(number => {
        if (mounted) {
          setNetworkStatus(prev => ({ ...prev, finalized: number.toNumber() }))
        }
      })
        .then(unsub => {
          finalizedUnsub = unsub
        })
        .catch(console.error)
    }

    return () => {
      mounted = false
      clearInterval(pollId)
      if (finalizedUnsub) {
        finalizedUnsub()
      }
    }
  }, [api])

  useEffect(() => {
    if (!api?.derive?.chain?.bestNumber) {
      return undefined
    }
    let unsub = null
    api.derive.chain.bestNumber(number => {
      setNetworkStatus(prev => ({ ...prev, current: number.toNumber() }))
    })
      .then(value => {
        unsub = value
      })
      .catch(console.error)

    return () => unsub && unsub()
  }, [api])

  useEffect(() => {
    if (!api?.rpc?.system) {
      return undefined
    }
    let mounted = true
    const getInfo = async () => {
      try {
        const chain = await api.rpc.system.chain()
        if (!mounted) {
          return
        }
        setNodeInfo({
          name: 'QSB Node',
          chain: chain.toString(),
        })
      } catch (error) {
        console.error(error)
      }
    }

    getInfo()
    return () => {
      mounted = false
    }
  }, [api])

  const networkTone = networkStatus.sync
    ? 'warning'
    : networkStatus.latencyMs !== null && networkStatus.latencyMs > 1500
      ? 'degraded'
      : 'healthy'

  return (
    <Menu
      attached="top"
      tabular
      className="app-topbar"
    >
      <Container>
        <Menu.Menu className="topbar-left-zone">
          <div className="app-topbar-brand-menu">
            <Image
              src={`${process.env.PUBLIC_URL}/assets/substrate-logo.png`}
              size="mini"
              className="app-topbar-logo"
            />
            <div className="app-topbar-brand">
              <span className="app-topbar-brand-title">QSB Manager</span>
              <span className="app-topbar-brand-subtitle">DID Control Center</span>
            </div>
          </div>
          <div className="node-inline-info">
            <span className="node-inline-label">{nodeInfo.name}</span>
            <span className="node-inline-value">{nodeInfo.chain || '-'}</span>
            <span className="node-inline-separator">•</span>
            <span className="node-inline-rpc" title={socket}>
              RPC: {socket}
            </span>
          </div>
        </Menu.Menu>
        <Menu.Menu position="right" className="topbar-right-zone">
          <div className={`network-status-pill ${networkTone}`}>
            <span className="network-dot" />
            <span>{networkStatus.sync ? 'Syncing' : 'Online'}</span>
            <span className="network-divider">•</span>
            <span>
              {networkStatus.latencyMs === null
                ? '... ms'
                : `${networkStatus.latencyMs} ms`}
            </span>
            <span className="network-divider">•</span>
            <span>C#{networkStatus.current.toLocaleString('en-US')}</span>
            <span className="network-divider">•</span>
            <span>F#{networkStatus.finalized.toLocaleString('en-US')}</span>
          </div>

          <div className="account-control">
            <Button
              basic
              circular
              size="small"
              icon="user"
              color={currentAccount ? 'green' : 'red'}
              className="profile-button"
              title={acctAddr(currentAccount)}
            />
            <Dropdown
              search
              selection
              clearable
              className="account-dropdown"
              placeholder="Select account"
              options={keyringOptions}
              onChange={(_, dropdown) => {
                onChange(dropdown.value)
              }}
              value={acctAddr(currentAccount)}
            />
          </div>

          <BalanceAnnotation />

          <Button
            basic
            size="small"
            className="receive-funds-button"
            onClick={() => {
              setReceiveOpen(true)
              setReceiveStatus('')
            }}
          >
            Receive funds
          </Button>
        </Menu.Menu>
      </Container>
      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        size="small"
      >
        <Modal.Header>Receive funds</Modal.Header>
        <Modal.Content>
          <div style={{ marginBottom: '0.75em' }}>Account address</div>
          <Input
            fluid
            placeholder="Enter account address"
            value={receiveAddress}
            onChange={(_, data) => {
              setReceiveAddress(data.value)
              setReceiveStatus('')
            }}
          />
          {receiveStatus && (
            <Message
              info
              size="small"
              style={{ marginTop: '0.75em' }}
              content={receiveStatus}
            />
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            loading={isSendingFunds}
            disabled={isSendingFunds}
            onClick={sendFunds}
          >
            Receive
          </Button>
        </Modal.Actions>
      </Modal>
    </Menu>
  )
}

function BalanceAnnotation(props) {
  const { api, currentAccount } = useSubstrateState()
  const [accountBalance, setAccountBalance] = useState(0)

  // When account address changes, update subscriptions
  useEffect(() => {
    let unsubscribe

    // If the user has selected an address, create a new subscription
    currentAccount &&
      api.query.system
        .account(acctAddr(currentAccount), balance =>
          setAccountBalance(balance.data.free.toHuman())
        )
        .then(unsub => (unsubscribe = unsub))
        .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [api, currentAccount])

  return currentAccount ? (
    <Label pointing="left" className="balance-pill">
      <Icon name="money" color="green" />
      {accountBalance}
    </Label>
  ) : null
}

export default function AccountSelector(props) {
  const { api, keyring } = useSubstrateState()
  return keyring.getPairs && api.query ? <Main {...props} /> : null
}
