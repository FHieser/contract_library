// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there are a number of accounts (the admins) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the starting admin of the contract. This
 * can later be changed with {addAdmin and removeAdmin}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyAdmin`, which can be applied to your functions to restrict their use to
 * the Admin.
 */
abstract contract AdminMod is Ownable {
    mapping(address => bool) private _admins;

     /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _addAdmin(owner());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function isAdmin(address addressForTesting)
        public
        view
        virtual
        onlyAdmin
        returns (bool admin)
    {
        return _admins[addressForTesting];
    }

    /**
     * @dev Throws if called by any account other than the admin.
     */
    modifier onlyAdmin() {
        require(_admins[msg.sender], "AdminMod: caller is not an admin");
        _;
    }

    function addAdmin(address newAdmin) public virtual onlyAdmin {
        require(!_admins[newAdmin], "Address is already a admin.");

        _addAdmin(newAdmin);
    }

    function _addAdmin(address newAdmin) internal virtual {
        _admins[newAdmin] = true;
    }

    function removeAdmin(address adminToRemove) public virtual onlyAdmin {
        require(_admins[adminToRemove], "Adress is not an admin.");
        require(adminToRemove!=owner(), "The owner has to be an admin.");
        
        delete _admins[adminToRemove];
        
    }

    //newOwner will be declared as an admin
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        
        addAdmin(newOwner);
        _transferOwnership(newOwner);
    }
}


import "erc721a/contracts/ERC721A.sol";

contract MintAirdrop is ERC721A, AdminMod {
    using Strings for uint256;

    string baseURI;
    string public baseExtension = ".json";
    uint256 public cost = 0.05 ether;
    uint256 public maxSupply = 1000;
    uint256 public maxMintAmount = 20;
    bool public paused = true;

    address private developerAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        address _developerAddress

    ) ERC721A(_name, _symbol) {
        setBaseURI(_initBaseURI);
        developerAddress=_developerAddress;
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
    Airdrop function which take up a array of address, indvidual token amount and eth amount
    */
    function sendBatch(address[] calldata _recipients) public onlyAdmin {
        require(_recipients.length < maxSupply);

        for (uint256 i = 0; i < _recipients.length; i++) {
            _safeMint(_recipients[i], 1);
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
    function setCost(uint256 _newCost) public onlyAdmin {
        cost = _newCost;
    }

    function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyAdmin {
        maxMintAmount = _newmaxMintAmount;
    }

    function setBaseURI(string memory _newBaseURI) public onlyAdmin {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyAdmin
    {
        baseExtension = _newBaseExtension;
    }

    function flipPause() public onlyAdmin {
        paused = !paused;
    }

    function withdraw() public payable onlyOwner {
        (bool hs, ) = payable(developerAddress).call{
            value: (address(this).balance * 12) / 100
        }("");
        require(hs);
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}
