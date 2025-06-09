// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IEzSwapFactory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair
    );

    error IdenticalAddresses(address tokenA, address tokenB);
    error ZeroAddress();
    error PairExists(address tokenA, address tokenB, address pair);
    error InvalidPair();

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}
