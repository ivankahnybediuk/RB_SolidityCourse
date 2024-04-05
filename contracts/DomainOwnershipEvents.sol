// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract DomainOwnershipEvents {

    event DomainRegisteredEvent(string domain, address indexed owner, uint256 timestamp);

    event RegistrationFeeChange(uint256 oldFee, uint256 newFee, uint256 timestamp);
}
