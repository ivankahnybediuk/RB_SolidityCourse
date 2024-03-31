// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../errors/DomainOwnershipErrors.sol";
import "../events/DomainOwnershipEvents.sol";

/// @title Domain Ownership Manager
/// @dev This contract provides service of domain registration
contract DomainOwnershipManager is DomainOwnershipErrors, DomainOwnershipEvents {

    address public owner;

    uint256 public registrationFee = 0.00001 ether;

    mapping(string => address) public domainToOwner;

    mapping(address => string[]) public ownerToDomains;

    constructor() {
        owner = msg.sender;
    }

    /// @dev Checks if the caller is contract owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwnerError(msg.sender, "Caller is not the owner");
        _;
    }

    /** @dev Function that stores relation between domain and address of owner in _domainToOwner and array of
    * owners domains in _ownerToDomains. If domains name is already registered DomainAlreadyRegistered error is reverted
    */
    function registerDomain(string calldata domain) public payable {

        bytes memory domainBytes = bytes(domain);
        for (uint i = 0; i < domainBytes.length; i++) {
            // Check each character to ensure it's a letter or number
            bytes1 char = domainBytes[i];
            bool isDigit = char >= 0x30 && char <= 0x39; // '0' to '9'
            bool isUpper = char >= 0x41 && char <= 0x5A; // 'A' to 'Z'
            bool isLower = char >= 0x61 && char <= 0x7A; // 'a' to 'z'
            if (!(isDigit || isUpper || isLower)) {
                revert DomainNameVerificationError(domain, "Invalid domain name format");
            }
        }

        if (domainToOwner[domain] != address(0)) {
            revert DomainAlreadyRegisteredError(domain, "Domain name is already registered");
        }

        if (msg.value != registrationFee) {
            revert InsufficientFeeError(msg.value, "Insufficient registration fee!");
        }

        domainToOwner[domain] = msg.sender;
        ownerToDomains[msg.sender].push(domain);

        emit DomainRegisteredEvent(domain, msg.sender, block.timestamp);
    }

    /// @dev Let owner to change the registration fee
    function changeTheFee(uint256 newFee) public onlyOwner {
        registrationFee = newFee;
    }

    /// @dev Let to withdraw the contract's balance to the contact owner
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success,) = owner.call{value: amount}("");

        if (!success) {
            revert WithdrawFailureError(amount, msg.sender, "Failed to send Ether");
        }
    }

    function getDomainsForOwner(address domainOwner) public view returns (string[] memory) {
        return ownerToDomains[domainOwner];
    }

}

