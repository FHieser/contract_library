// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Revealable_Airdrop_PayableAddress is ERC721A, Ownable {
    using Strings for uint256;

    string baseURI;
    string public baseExtension = ".json";
    uint256 public cost = 0.05 ether;
    uint256 public maxSupply = 10000;
    uint256 public maxMintAmount = 20;
    bool public paused = false;
    bool public revealed = false;
    string public notRevealedUri;

    address private payoutAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri
    ) ERC721A(_name, _symbol) {
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
        payoutAddress = owner();
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mint(uint256 _mintAmount) public payable {
        require(!paused, "Contract is paused");
        require(_mintAmount > 0, "Mint Amount needs to be bigger than 0");
        require(
            _mintAmount <= maxMintAmount,
            "Mint Amount exceeds the Maximum Allowed Mint Amount"
        );
        require(
            totalSupply() + _mintAmount <= maxSupply,
            "Mint Amount exceeds the Available Mint Amount"
        );

        if (msg.sender != owner()) {
            require(
                msg.value >= cost * _mintAmount,
                "Value for minting-transaction is to low"
            );
        }

        _safeMint(msg.sender, _mintAmount);
    }

    /*
    Airdrop function which takes up an array of addresses and mints one NFT to each of them
    */
    function sendOneToEach(address[] calldata _recipients) public onlyOwner {
        require(
            _recipients.length + _currentIndex <= maxSupply,
            "Airdrop Amount exceeds the Available Airdrop Amount"
        );

        for (uint256 i = 0; i < _recipients.length; i++) {
            _safeMint(_recipients[i], 1);
        }
    }

    /*
    Airdrop function which takes up an array of addresses and mints them an individual amount of NFTs
    */
    function sendVariableToEach(
        address[] calldata _recipients,
        uint256[] calldata _individualTokenAmount
    ) public onlyOwner {
        require(
            _recipients.length == _individualTokenAmount.length,
            "The amount of recipients has to match the length of the individualTokenAmount array"
        );

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(
                _individualTokenAmount[i] + _currentIndex <= maxSupply,
                "Airdrop Amount exceeds the Available Airdrop Amount"
            );

            _safeMint(_recipients[i], _individualTokenAmount[i]);
        }
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

    function setMaxSupply(uint256 _newMaxSupply) public onlyOwner {
        maxSupply = _newMaxSupply;
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

    function setPayoutAddress(address _newPayoutAddress)
        public
        onlyOwner
    {
        payoutAddress = _newPayoutAddress;
    }

    function getPayoutAddress()
        public
        onlyOwner
        view
        returns (address _payoutAddress)
    {
        return payoutAddress;
    }

    function flipPause() public onlyOwner {
        paused = !paused;
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(payoutAddress).call{value: address(this).balance}(
            ""
        );
        require(os);
    }
}
