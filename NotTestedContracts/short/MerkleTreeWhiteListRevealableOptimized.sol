// SPDX-License-Identifier: MIT

// File: contracts/ReavealableNFT.sol

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RevealableWhitelistOptimizedContract is ERC721A, Ownable {
    using Strings for uint256;

    address private developerAddress;
    uint16 private developerPercentage;

    string baseURI;
    string public baseExtension = ".json";

    uint256 public cost = 0.05 ether;
    uint256 public maxSupply = 10000;
    uint256 public maxMintAmount = 20;

    bool public paused = false;

    bool public revealed = false;
    string public notRevealedUri;

    // Calculated from `merkle_tree.js`
    bytes32 private merkleRoot;
    bool public whiteListActive = true;

    mapping(address => bool) public whitelistClaimed;

    constructor(
        address _developerAddress,
        uint16 _developerPercentage,
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri,
        bytes32 _merkleRoot
    ) ERC721A(_name, _symbol) {
        developerAddress = _developerAddress;
        developerPercentage = _developerPercentage;
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
        setMerkleRoot(_merkleRoot);
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mint(bytes32[] calldata _merkleProof, uint256 _mintAmount)
        public
        payable
    {
        uint256 supply = totalSupply();
        require(!paused, "Contract is paused");
        require(_mintAmount > 0, "Mint Amount needs to be bigger than 0");
        require(
            _mintAmount <= maxMintAmount,
            "Mint Amount exceeds the Maximum Allowed Mint Amount"
        );
        require(
            supply + _mintAmount <= maxSupply,
            "Mint Amount exceeds the Available Mint Amount"
        );

        //MerkleTree Whitelist
        if (whiteListActive) {
            require(!whitelistClaimed[msg.sender], "Address already claimed");
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(
                MerkleProof.verify(_merkleProof, merkleRoot, leaf),
                "Invalid Merkle Proof"
            );
            whitelistClaimed[msg.sender] = true;
        }

        //Owner mints for free
        if (msg.sender != owner()) {
            require(
                msg.value >= cost * _mintAmount,
                "Value for minting-transaction is to low"
            );
        }

        _safeMint(msg.sender, _mintAmount);
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

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyOwner {
        maxMintAmount = _newmaxMintAmount;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    //MerkleTree Root
    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setWhiteListActive(bool _state) public onlyOwner {
        whiteListActive = _state;
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
    }

    //Return the funds to the owner of the contract
    function withdraw() public payable onlyOwner {
        (bool hs, ) = payable(developerAddress).call{
            value: (address(this).balance * developerPercentage) / 100
        }("");
        require(hs);

        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}