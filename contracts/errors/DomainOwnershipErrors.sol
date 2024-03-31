// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract DomainOwnershipErrors {

    error UnauthorizedAccessError(address caller, string message);

    error DomainAlreadyRegisteredError(string domain, string message);

    error InsufficientFeeError(uint256 sent, string message);

    error NotOwnerError(address caller, string message);

    error WithdrawFailureError(uint256 amount, address recipient, string message);

    error DomainNameVerificationError(string name, string message);

}
