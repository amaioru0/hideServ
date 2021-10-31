// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HideServVault is Ownable, IERC721Receiver {
        
    constructor () {
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
  
    mapping (uint256 => TreasureDetails) treasureDetails;

    struct TreasureDetails {
        string contractStandard;
        IERC721 ERC721contract;
        address source;
        uint256 tokenId;
    }
    
    event NewTreasure(address nftContract, uint256 tokenId, string contractStandard);


    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) public virtual override returns (bytes4) {
     uint256 treasureId = _tokenIdCounter.current();
     
     address tokenOwner = IERC721(msg.sender).ownerOf(tokenId);
     require(tokenOwner == address(this), "Not a real transfer");
     
       treasureDetails[treasureId] = TreasureDetails({
            contractStandard: "ERC721",
            ERC721contract: IERC721(msg.sender),
            source: from,
            tokenId: tokenId
        });
        emit NewTreasure(msg.sender, treasureId, "ERC721");
       _tokenIdCounter.increment();
        return this.onERC721Received.selector;
    }

    
} 
