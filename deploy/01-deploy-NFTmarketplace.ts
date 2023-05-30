import { network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains } from "../helper-hardhat-config"
import "dotenv/config"
import verify from "../utils/verify"

const deployNFTMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const nftMarketplace = await deploy("NFTMarketplace", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1
  })

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("------------- Verifying Contract ----------------------")
    await verify(nftMarketplace.address, [])
  }

  log("------------- NFTMarketplace deployed ----------------------")
}

export default deployNFTMarketplace

deployNFTMarketplace.tags = ["NFTMarketplace", "all"]
