import { ethers } from "hardhat"

export interface networkConfigItem {
    name?: string
    subscriptionId?: string 
    keepersUpdateInterval?: string 
    raffleEntranceFee?: string 
    callbackGasLimit?: string 
    vrfCoordinatorV2?: string
    gasLane?: string 
    ethUsdPriceFeed?: string
    mintFee?: string
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    5: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    31337: {
        name: "hardhat",
        raffleEntranceFee: ethers.utils.parseEther("0.01").toString(),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
        keepersUpdateInterval: "30",
        subscriptionId: "1",
    }
}

export const developmentChains = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
