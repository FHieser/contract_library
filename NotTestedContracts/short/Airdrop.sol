// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

//import "erc721a/contracts/ERC721A.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";

contract Airdrop is ERC721A, Ownable {
using Strings for uint256;

  string baseURI;
  string public baseExtension = ".json";
  uint256 public maxSupply = 800;

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _initBaseURI
  ) ERC721A(_name, _symbol) {
    setBaseURI(_initBaseURI);
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721AMetadata: URI query for nonexistent token"
    );
    
    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    baseExtension = _newBaseExtension;
  }

  /*
    Airdrop function which take up a array of address, indvidual token amount and eth amount
   */
   function sendBatch(address[] calldata _recipients) onlyOwner public{
        require(_recipients.length<maxSupply);
                 
        for (uint i = 0; i < _recipients.length; i++) {
            _safeMint(_recipients[i], 1);
        }
   }

   
  function withdraw() public payable onlyOwner {
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
    }
}
