// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NFTMarketplace__PriceMustBeAboveZero();
error NFTMarketplace__NFTNotApproved();
error NFTMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NFTMarketplace__OnlyOwner();
error NFTMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NFTMarketplace__PriceIsBelowPrice(
  address nftAddress,
  uint256 tokenId,
  uint256 price
);
error NFTMarketplace__ProceedsMustBeGreaterThanZero();
error NFTMarketplace__WithdrawFailed();

contract NFTMarketplace {
  struct Listing {
    uint256 price;
    address seller;
  }

  // NFTMarketplace variable
  // NFT Address to NFT Token ID to Listing
  mapping(address => mapping(uint256 => Listing)) private s_listings;

  // NFT Address to Amount of proceeds
  mapping(address => uint256) private s_proceeds;

  // Modifiers
  modifier notListed(
    address nftAddress,
    uint256 tokenId,
    address owner
  ) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if (listing.price > 0) {
      revert NFTMarketplace__AlreadyListed(nftAddress, tokenId);
    }
    _; // where logic is insterted after above checks
  }

  modifier isListed(address nftAddress, uint256 tokenId) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if (listing.price <= 0) {
      revert NFTMarketplace__NotListed(nftAddress, tokenId);
    }
    _; // where logic is insterted after above checks
  }

  modifier onlyOwner(
    address nftAddress,
    uint256 tokenId,
    address spender
  ) {
    IERC721 nftContract = IERC721(nftAddress);
    address owner = nftContract.ownerOf(tokenId);
    if (spender != msg.sender) {
      revert NFTMarketplace__OnlyOwner();
    }
    _; // where logic is insterted after above checks
  }

  // Events
  event ItemListing(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemSold(
    address indexed buyer,
    address indexed nftAddress,
    uint256 tokenId,
    uint256 price
  );

  event ItemCancelled(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId
  );

  event ItemPriceUpdated(
    address indexed seller,
    address indexed nftAddress,
    uint256 tokenId,
    uint256 price
  );

  function listItem(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  )
    external
    notListed(nftAddress, tokenId, msg.sender)
    onlyOwner(nftAddress, tokenId, msg.sender)
  {
    if (price <= 0) {
      revert NFTMarketplace__PriceMustBeAboveZero();
    }

    IERC721 nftContract = IERC721(nftAddress);
    if (nftContract.getApproved(tokenId) != address(this)) {
      revert NFTMarketplace__NFTNotApproved();
    }

    s_listings[nftAddress][tokenId] = Listing(price, msg.sender);

    emit ItemListing(msg.sender, nftAddress, tokenId, price);
  }

  function buyItem(
    address nftAddress,
    uint256 tokenId
  ) external payable isListed(nftAddress, tokenId) {
    Listing memory listedItem = s_listings[nftAddress][tokenId];
    if (msg.value < listedItem.price) {
      revert NFTMarketplace__PriceIsBelowPrice(
        nftAddress,
        tokenId,
        listedItem.price
      );
    }

    // Sending the money to the user is not the general practice, ETH prefers pull rather than push
    // Have the user withdraw the money
    s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;
    delete (s_listings[nftAddress][tokenId]);
    IERC721(nftAddress).safeTransferFrom(
      listedItem.seller,
      msg.sender,
      tokenId
    );

    // check to make sure the NFT was transferred (with safeTransferFrom)
    emit ItemSold(msg.sender, nftAddress, tokenId, listedItem.price);
  }

  function cancelItem(
    address nftAddress,
    uint256 tokenId
  )
    external
    onlyOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
  {
    delete (s_listings[nftAddress][tokenId]);

    emit ItemCancelled(msg.sender, nftAddress, tokenId);
  }

  function updatePriceListing(
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice
  )
    external
    onlyOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
  {
    s_listings[nftAddress][tokenId].price = newPrice;
    emit ItemPriceUpdated(msg.sender, nftAddress, tokenId, newPrice);
  }

  function withdrawProceeds()
    external
    payable
  {
    uint256 proceeds = s_proceeds[msg.sender];
    if (proceeds <= 0) {
        revert NFTMarketplace__ProceedsMustBeGreaterThanZero();
    }
    s_proceeds[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: proceeds}("");
    if (!success) {
        revert NFTMarketplace__WithdrawFailed();
    }
  }

  // Gettters

  function getListing(address nftAddress, uint256 tokenId)
    external
    view
    returns (Listing memory)
  {
    return s_listings[nftAddress][tokenId];
  }

  function getEarnings(address seller) external view returns (uint256) {
    return s_proceeds[seller];
  }
}
