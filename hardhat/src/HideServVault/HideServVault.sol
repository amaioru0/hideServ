// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import { ERC1155Receiver } from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/utils/ERC1155Receiver.sol";
import { IERC1155 } from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/IERC1155.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HideServVault is Ownable, IERC721Receiver, ERC1155Receiver  {
        
    constructor () {
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
  
    mapping (uint256 => TreasureDetails) treasureDetails;

    struct TreasureDetails {
        string contractStandard;
        IERC721 ERC721contract;
        IERC1155 ERC1155contract;
        uint256 value;
        address source;
        uint256 tokenId;
    }
    
    event NewTreasure(address nftContract, uint256 tokenId, string contractStandard, uint256 value);


    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) public virtual override returns (bytes4) {
     uint256 treasureId = _tokenIdCounter.current();
     
     address tokenOwner = IERC721(msg.sender).ownerOf(tokenId);
     require(tokenOwner == address(this), "Not a real transfer");
     
       treasureDetails[treasureId] = TreasureDetails({
            contractStandard: "ERC721",
            ERC721contract: IERC721(0x0000000000000000000000000000000000000000),
            ERC1155contract: IERC1155(msg.sender),
            value: 1,
            source: from,
            tokenId: tokenId
        });
        emit NewTreasure(msg.sender, treasureId, "ERC721", 1);
       _tokenIdCounter.increment();
        return this.onERC721Received.selector;
    }
    
      function onERC1155Received(address operator, address from, uint256 tokenId, uint256 value, bytes calldata data) external override returns(bytes4) {
            uint256 treasureId = _tokenIdCounter.current();
            address tokenOwner = IERC721(msg.sender).ownerOf(tokenId);
            
          treasureDetails[treasureId] = TreasureDetails({
            contractStandard: "ERC1155",
            ERC721contract: IERC721(0x0000000000000000000000000000000000000000),
            ERC1155contract: IERC1155(msg.sender),
            value: value,
            source: from,
            tokenId: tokenId
        });
        emit NewTreasure(msg.sender, treasureId, "ERC1155", value);
       _tokenIdCounter.increment();

            return this.onERC1155BatchReceived.selector;
        }

    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external override returns(bytes4) {
            return this.onERC1155BatchReceived.selector;
        }
} 
