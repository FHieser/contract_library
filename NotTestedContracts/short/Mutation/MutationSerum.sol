// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MutationSerum is ERC1155, Ownable {
    using Strings for uint256;

    address private mutationContract;
    string private baseURI;
    string public baseExtension = ".json";
    uint256 public cost = 0.05 ether;
    uint256 public maxMintAmount = 5;
    uint256 public maxSupply = 1000;
    uint256 public serumSupplyCounter = 0;
    bool public paused = true;

    mapping(uint256 => bool) public validSerumTypes;

    event SetBaseURI(string indexed _baseURI);

    constructor(string memory _baseURI) ERC1155(_baseURI) {
        baseURI = _baseURI;
        validSerumTypes[1] = true;
        emit SetBaseURI(baseURI);
    }

    function mintSerum(uint256 _mintAmount) external payable {
        require(!paused, "Contract is paused");
        require(_mintAmount > 0, "Mint Amount needs to be bigger than 0");
        require(
            _mintAmount <= maxMintAmount,
            "Mint Amount exceeds the Maximum Allowed Mint Amount"
        );
        require(
            serumSupplyCounter + _mintAmount <= maxSupply,
            "Mint Amount exceeds the Available Mint Amount"
        );

        if (msg.sender != owner()) {
            require(
                msg.value >= cost * _mintAmount,
                "Value for minting-transaction is to low"
            );
        }

        _mint(msg.sender, 1, _mintAmount, "");
        serumSupplyCounter += _mintAmount;
    }

    function burnSerumForAddress(address burnFromTokenAddress) external {
        require(msg.sender == mutationContract, "Invalid burner address");
        _burn(burnFromTokenAddress, 1, 1); //SerumType:1 & Amount: 1
    }

    //only Owner
    function setMutationContractAddress(address mutationContractAddress)
        external
        onlyOwner
    {
        mutationContract = mutationContractAddress;
    }

    function setBaseUri(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        emit SetBaseURI(baseURI);
    }

    //only owner
    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyOwner {
        maxMintAmount = _newmaxMintAmount;
    }

    function setMaxSupply(uint256 _newMaxSupply) public onlyOwner {
        maxSupply = _newMaxSupply;
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

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        returns (string memory)
    {
        require(
            tokenId==1,
            "ERC721Metadata: URI query for nonexistent token"
        );

        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}
