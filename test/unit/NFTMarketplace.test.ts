import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { assert, expect } from "chai"
import { NFTMarketplace, BasicNFT } from "../../typechain-types"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NFTMarketplace", () => {
      let nftMarketplace: NFTMarketplace,
        basicNft: BasicNFT,
        deployer,
        player,
        user
      const PRICE = ethers.utils.parseEther("0.1")
      const TOKEN_ID = 0
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        const accounts = await ethers.getSigners()
        player = accounts[0]
        user = accounts[1]
        await deployments.fixture(["all"])
        const nftMarketplaceDeployment = await deployments.get("NFTMarketplace")
        const basicNFTDeployment = await deployments.get("BasicNFT")
        nftMarketplace = await ethers.getContractAt(
          "NFTMarketplace",
          nftMarketplaceDeployment.address
        )
        basicNft = await ethers.getContractAt(
          "BasicNFT",
          basicNFTDeployment.address
        )
      })

      describe("Lists", function () {
        beforeEach(async () => {
          await basicNft.mintNFT()
        })
        it("should succeed and later be purchased", async () => {
          await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

          // now we will have to connect a player to buy the newly listed NFT
          const playerConnectedNFTMarketplace = await nftMarketplace.connect(
            player
          )
          await playerConnectedNFTMarketplace.buyItem(
            basicNft.address,
            TOKEN_ID,
            { value: PRICE }
          )
          const deployerProceeds = await nftMarketplace.getProceeds(deployer)
          const newOwner = await basicNft.ownerOf(TOKEN_ID) // this function is part of the ERC721 standard
          assert(newOwner.toString() === player.address)
          assert(deployerProceeds.toString() === PRICE.toString())
        })

        it("should succeed but fails at 0ETH payment and hit revert error (less than price)", async () => {
          await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

          // now we will have to connect a player to buy the newly listed NFT
          const playerConnectedNFTMarketplace = await nftMarketplace.connect(
            player
          )
          await expect(
            playerConnectedNFTMarketplace.buyItem(basicNft.address, TOKEN_ID, {
              value: ethers.utils.parseEther("0"),
            })
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__PriceIsBelowPrice"
          )
        })

        it("should fail when NFT is listed at 0", async function () {
          await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          await expect(
            nftMarketplace.listItem(
              basicNft.address,
              TOKEN_ID,
              ethers.utils.parseEther("0")
            )
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__PriceMustBeAboveZero"
          )
        })

        it("should hit error since listing does not belong to the owner and thus not listed", async function () {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NFTNotApproved"
          )
        })
      })

      describe("Cancel", function () {
        beforeEach(async () => {
          await basicNft.mintNFT()
          await basicNft.approve(nftMarketplace.address, TOKEN_ID)
        })
        it("should cancel the listing when owner and listing is present", async function () {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          expect(
            await nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
          ).to.emit(nftMarketplace, "ItemCanceled")
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          )
          assert(listing.price.toString() === "0")
        })

        // it("reverts if anyone but the owner tries to call", async function () {
        //     await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
        //     nftMarketplace = nftMarketplace.connect(user)
        //     await basicNft.approve(await user.getAddress(), TOKEN_ID)
        //     await expect(
        //         nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
        //     ).to.be.revertedWith("NotOwner")
        // })

        it("should revert when there is no listing", async function () {
          const error = `NFTMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
          console.log('err', error)
          expect(
            await nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith(error)
        })
      })

      describe("Update", function () {
        beforeEach(async () => {
          await basicNft.mintNFT()
          await basicNft.approve(nftMarketplace.address, TOKEN_ID)
        })
        it("should update pricing when owner and listing is made", async function () {
          const newPrice = ethers.utils.parseEther("0.2")
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await nftMarketplace.updatePriceListing(
            basicNft.address,
            TOKEN_ID,
            newPrice
          )
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          )
          assert(listing.price.toString() === newPrice.toString())
        })
      })

      describe("Withdraw", function () {})
    })
