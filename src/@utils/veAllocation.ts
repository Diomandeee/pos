import { gql, OperationResult } from 'urql'
import { fetchData, getQueryContext } from './subgraph'
import axios from 'axios'
import networkdata from '../../content/networks-metadata.json'
import {
  getNetworkDataById,
  getNetworkType,
  NetworkType
} from '@hooks/useNetworkMetadata'

const AllLocked = gql`
  query AllLockedQuery {
    veOCEANs(first: 1000) {
      lockedAmount
    }
  }
`

const OwnAllocations = gql`
  query OwnAllocationsQuery($address: String) {
    veAllocations(where: { allocationUser: $address }) {
      id
      nftAddress
      allocated
    }
  }
`
const NftOwnAllocation = gql`
  query NftOwnAllocationQuery($address: String, $nftAddress: String) {
    veAllocations(
      where: { allocationUser: $address, nftAddress: $nftAddress }
    ) {
      allocated
    }
  }
`
const OceanLocked = gql`
  query OceanLockedQuery($address: ID!) {
    veOCEAN(id: $address) {
      id
      lockedAmount
      unlockTime
    }
  }
`

export interface TotalVe {
  totalLocked: number
  totalAllocated: number
}
export interface Allocation {
  nftAddress: string
  allocation: number
}

export interface AssetWithOwnAllocation {
  asset: AssetExtended
  allocation: string
}

export function getVeChainNetworkId(assetNetworkId: number): number {
  const networkData = getNetworkDataById(networkdata, assetNetworkId)
  const networkType = getNetworkType(networkData)
  if (networkType === NetworkType.Mainnet) return 1
  else return 5
}

export function getVeChainNetworkIds(assetNetworkIds: number[]): number[] {
  const veNetworkIds: number[] = []
  assetNetworkIds.forEach((x) => {
    const id = getVeChainNetworkId(x)
    veNetworkIds.indexOf(id) === -1 && veNetworkIds.push(id)
  })
  return veNetworkIds
}

export async function getNftOwnAllocation(
  userAddress: string,
  nftAddress: string,
  networkId: number
): Promise<number> {
  const veNetworkId = getVeChainNetworkId(networkId)
  const queryContext = getQueryContext(veNetworkId)
  const fetchedAllocation = await fetchData(
    NftOwnAllocation,
    { address: userAddress, nftAddress },
    queryContext
  )
  return fetchedAllocation.data?.veAllocations[0]?.allocated
}

export async function getTotalAllocatedAndLocked(): Promise<TotalVe> {
  const totals = {
    totalLocked: 0,
    totalAllocated: 0
  }

  const queryContext = getQueryContext(1)
  const fetchedLocked = await fetchData(AllLocked, {}, queryContext)
  fetchedLocked.data?.veOCEANs.forEach((x) => {
    totals.totalLocked += x.lockedAmount
  })
  const fetchedAllocations = await fetchData(OwnAllocations, {}, queryContext)

  fetchedAllocations.data?.veAllocations.forEach((x) => {
    totals.totalAllocated += x.allocated
  })

  return totals
}

export async function getLocked(
  userAddress: string,
  networkIds: number[]
): Promise<number> {
  const veNetworkIds = getVeChainNetworkIds(networkIds)
  let lockedAmount = 0
  for (let i = 0; i < veNetworkIds.length; i++) {
    const queryContext = getQueryContext(veNetworkIds[i])
    const fetchedLocked = await fetchData(
      OceanLocked,
      { address: userAddress },
      queryContext
    )
    lockedAmount += fetchedLocked.data?.veOCEAN?.lockedAmount || 0
  }
  return lockedAmount
}

export async function getOwnAllocations(
  networkIds: number[],
  userAddress: string
): Promise<Allocation[]> {
  const veNetworkIds = getVeChainNetworkIds(networkIds)
  const allocations: Allocation[] = []
  for (let i = 0; i < veNetworkIds.length; i++) {
    const queryContext = getQueryContext(veNetworkIds[i])
    const fetchedAllocations = await fetchData(
      OwnAllocations,
      { address: userAddress },
      queryContext
    )
    fetchedAllocations.data?.veAllocations.forEach((x) => {
      allocations.push({
        nftAddress: x.nftAddress,
        allocation: x.allocated
      })
    })
  }
  return allocations
}
