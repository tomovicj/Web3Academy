// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IEzSwapFactory.sol";

import "./EzSwapPair.sol";

contract EzSwapFactory is IEzSwapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;


    function sortAddresses(
        address a,
        address b
    ) internal pure returns (address, address) {
        return a < b ? (a, b) : (b, a);
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();
        if (tokenA == tokenB) revert IdenticalAddresses(tokenA, tokenB);
        (address token0, address token1) = sortAddresses(tokenA, tokenB);
        if (getPair[token0][token1] != address(0))
            revert PairExists(token0, token1, getPair[token0][token1]);

        bytes memory bytecode = type(EzSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        if (pair == address(0)) revert InvalidPair();
        EzSwapPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // Store reverse mapping for convenience
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair);
        return pair;
    }
}
