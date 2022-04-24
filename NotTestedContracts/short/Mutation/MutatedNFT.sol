// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//Interface to Link up the Serum Contract
interface IMutationSerum {
    function burnSerumForAddress(address burnFromTokenAddress) external;

    function balanceOf(address account, uint256 id)
        external
        view
        returns (uint256);
}

//Interface to Link up the original NFT Contract that gets to be mutated
interface IOriginContract {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract MutatedNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string baseURI;
    string public baseExtension = ".json";
    string public notRevealedUri;

    bool public paused = true;
    bool public revealed = false;
    IMutationSerum private immutable serum;
    IOriginContract private immutable origin;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri,
        address _mutationSerumAddress,
        address _collectionToMutateAddress
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
        serum = IMutationSerum(_mutationSerumAddress);
        origin = IOriginContract(_collectionToMutateAddress);
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mutate(uint256 tokenID) external {
        require(!paused, "Contract is paused");
        require(!_exists(tokenID), "NFT is already mutated");

        require(
            origin.ownerOf(tokenID) == msg.sender,
            "Must own the NFT you're attempting to mutate"
        );
        require(
            serum.balanceOf(msg.sender, 1) > 0,
            "Must own at least one serum to mutate"
        );

        serum.burnSerumForAddress(msg.sender);
        _safeMint(msg.sender, tokenID);
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
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    //only owner
    function reveal() public onlyOwner {
        revealed = true;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    function flipPause() public onlyOwner {
        paused = !paused;
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}
