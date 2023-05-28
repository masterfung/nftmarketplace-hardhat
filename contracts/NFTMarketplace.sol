// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NFTMarketplace__PriceMustBeAboveZero();
error NFTMarketplace__NFTNotApproved();
error NFTMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);

contract NFTMarketplace {
  struct Listing {
    uint256 price;
    address seller;
  }

  // NFTMarketplace variable
  mapping(address => mapping(uint256 => Listing)) private s_listings;

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

  // Events
  event ItemListing(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  function listItem(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  ) external notListed(nftAddress, tokenId, msg.sender) {
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
}
