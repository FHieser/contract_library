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
