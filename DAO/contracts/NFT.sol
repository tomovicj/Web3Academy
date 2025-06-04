// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    uint256 private lastNftId;
    uint256 public mintPrice = 0.01 ether;
    string private tokenUri;

    error AlreadyHaveNFT();
    error NotEnoughFunds();
    error NFTNotFound(uint256 id);

    constructor(address _owner, string memory _tokenUri) ERC721("W3A DAO - NFT", "W3ADAO") Ownable(_owner) {
        tokenUri = _tokenUri;
        mint(_owner);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId > lastNftId || tokenId < 1) revert NFTNotFound(tokenId);
        return tokenUri;
    }

    function mint(address _receiver) private returns(uint256) {
        uint256 _id = ++lastNftId;
        _safeMint(_receiver, _id);
        return _id;
    }

    function mintMembership(address _receiver) external payable returns(uint256) {
        if (balanceOf(_receiver) != 0) revert AlreadyHaveNFT();
        if (msg.value < mintPrice) revert NotEnoughFunds();

        return mint(_receiver);
    }

    function changeMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function changeTokenUri(string calldata _newTokenUri) external onlyOwner {
        tokenUri = _newTokenUri;
    }

    function withdraw(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
}

