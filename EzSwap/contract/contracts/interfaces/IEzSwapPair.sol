// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IEzSwapPair {
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    
    event LiquidityAdded(
        address indexed provider,
        uint amount0,
        uint amount1,
        uint liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint amount0,
        uint amount1,
        uint liquidity
    );

    error AlreadyInitialized();
    error InvalidToken();
    error ZeroAmount();
    error InsufficientLiquidity();
    error InsufficientLiquidityBalance(uint balance);
    error InsufficientInputAmount();

    function token0() external view returns (address);
    function token1() external view returns (address);
    function initialize(address, address) external;
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1);
    function addLiquidity(uint amount0, uint amount1) external returns (uint liquidity);
    function removeLiquidity(uint liquidity) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to) external;
}
