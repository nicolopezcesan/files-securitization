//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Contract {
    string public storedData;

    function set(string memory _data) public {
        storedData = _data;
    }

    function get() public view returns (string memory) {
        return storedData;
    }
}