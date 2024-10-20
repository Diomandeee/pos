import { gql, OperationResult } from 'urql'
import { fetchData, getQueryContext } from './subgraph'

import {
  getErrorMessage,
  LoggerInstance,
  ProviderFees,
  ProviderInstance
} from '@oceanprotocol/lib'
import { getFixedBuyPrice } from './ocean/fixedRateExchange'
import Decimal from 'decimal.js'
import {
  consumeMarketOrderFee,
  publisherMarketOrderFee,
  customProviderUrl
} from '../../app.config'
import { Signer } from 'ethers'
import { toast } from 'react-toastify'

const tokenPriceQuery = gql`
  query TokenPriceQuery($datatokenId: ID!, $account: String) {
    token(id: $datatokenId) {
      id
      symbol
      name
      templateId
      publishMarketFeeAddress
      publishMarketFeeToken
      publishMarketFeeAmount
      orders(
        where: { payer: $account }
        orderBy: createdTimestamp
        orderDirection: desc
      ) {
        tx
        serviceIndex
        createdTimestamp
        providerFee
        reuses(orderBy: createdTimestamp, orderDirection: desc) {
          id
          caller
          createdTimestamp
          tx
          block
        }
      }
      dispensers {
        id
        active
        isMinter
        maxBalance
        token {
          id
          name
          symbol
        }
      }
      fixedRateExchanges {
        id
        exchangeId
        price
        publishMarketSwapFee
        baseToken {
          symbol
          name
          address
          decimals
        }
        datatoken {
          symbol
          name
          address
        }
        active
      }
    }
  }
`

function getAccessDetailsFromTokenPrice(): AccessDetails {
  const accessDetails = {} as AccessDetails

  return accessDetails
}

/**
 * This will be used to get price including fees before ordering
 * @param {AssetExtended} asset
 * @return {Promise<OrdePriceAndFee>}
 */
export async function getOrderPriceAndFees(
  asset: AssetExtended,
  accountId: string,
  signer?: Signer,
  providerFees?: ProviderFees
): Promise<OrderPriceAndFees> {
  const orderPriceAndFee = {
    price: String(asset?.stats?.price?.value || '0'),
    publisherMarketOrderFee: publisherMarketOrderFee || '0',
    publisherMarketFixedSwapFee: '0',
    consumeMarketOrderFee: consumeMarketOrderFee || '0',
    consumeMarketFixedSwapFee: '0',
    providerFee: {
      providerFeeAmount: '0'
    },
    opcFee: '0'
  } as OrderPriceAndFees

  // fetch provider fee
  let initializeData
  try {
    initializeData =
      !providerFees &&
      (await ProviderInstance.initialize(
        asset?.id,
        asset?.services[0].id,
        0,
        accountId,
        customProviderUrl || asset?.services[0].serviceEndpoint
      ))
  } catch (error) {
    const message = getErrorMessage(JSON.parse(error.message))
    LoggerInstance.error('[Initialize Provider] Error:', message)
    toast.error(message)
  }
  orderPriceAndFee.providerFee = providerFees || initializeData.providerFee

  // fetch price and swap fees
  if (asset?.accessDetails?.type === 'fixed') {
    const fixed = await getFixedBuyPrice(
      asset?.accessDetails,
      asset?.chainId,
      signer
    )
    orderPriceAndFee.price = fixed.baseTokenAmount
    orderPriceAndFee.opcFee = fixed.oceanFeeAmount
    orderPriceAndFee.publisherMarketFixedSwapFee = fixed.marketFeeAmount
    orderPriceAndFee.consumeMarketFixedSwapFee = fixed.consumeMarketFeeAmount
  }

  // calculate full price, we assume that all the values are in ocean, otherwise this will be incorrect
  orderPriceAndFee.price = new Decimal(+orderPriceAndFee.price || 0)
    .add(new Decimal(+orderPriceAndFee?.consumeMarketOrderFee || 0))
    .add(new Decimal(+orderPriceAndFee?.publisherMarketOrderFee || 0))
    .toString()

  return orderPriceAndFee
}

/**
 * @param {number} chainId
 * @param {string} datatokenAddress
 * @param {number} timeout timout of the service, this is needed to return order details
 * @param {string} account account that wants to buy, is needed to return order details
 * @returns {Promise<AccessDetails>}
 */
export async function getAccessDetailsAndPricing(
  chainId: number,
  datatokenAddress: string,
  timeout: number,
  account: string
): Promise<AccessDetails> {
  const query = tokenPriceQuery
  const variables = {
    datatokenId: datatokenAddress,
    account
  }

  const context = getQueryContext(chainId)
  const result: OperationResult = await fetchData(query, variables, context)

  if (result.error) {
    LoggerInstance.error('[getAccessDetailsAndPricing] Error:', result.error)
    return {} as AccessDetails
  }

  const { token } = result.data
  const accessDetails = getAccessDetailsFromTokenPrice()

  return accessDetails

  // return accessDetails
}
