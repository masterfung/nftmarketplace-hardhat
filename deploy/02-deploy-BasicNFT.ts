import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../helper-hardhat-config";
import { network } from "hardhat";
import "dotenv/config";
import verify from "../utils/verify";

const deployBasicNFT: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
  ) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const basicNft = await deploy("BasicNFT", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("------------- Verifying Contract ----------------------")
        await verify(basicNft.address, []);
    }
    log("------------- BasicNFT deployed ----------------------")
}

export default deployBasicNFT

deployBasicNFT.tags = ["BasicNFT", "all"]