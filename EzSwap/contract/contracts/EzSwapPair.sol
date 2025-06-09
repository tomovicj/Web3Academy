// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IEzSwapPair.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract EzSwapPair is IEzSwapPair, ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint16 public constant MINIMUM_LIQUIDITY = 10 ** 3;
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;

    constructor() ERC20("EzSwap LP", "EzSLP") {}

    function initialize(address _token0, address _token1) external {
        if (token0 != address(0) || token1 != address(0))
            revert AlreadyInitialized();
        if (_token0 == address(0) || _token1 == address(0))
            revert InvalidToken();
        token0 = _token0;
        token1 = _token1;
    }

    function addLiquidity(
        uint amount0,
        uint amount1
    ) external nonReentrant returns (uint liquidity) {
        if (amount0 == 0 || amount1 == 0) revert ZeroAmount();

        (uint112 _reserve0, uint112 _reserve1) = (reserve0, reserve1);

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0Added = balance0 - _reserve0;
        uint amount1Added = balance1 - _reserve1;

        if (totalSupply() == 0) {
            uint _liquidity = Math.sqrt(amount0Added * amount1Added);
            _mint(address(this), MINIMUM_LIQUIDITY);
            liquidity = _liquidity - MINIMUM_LIQUIDITY;
        } else {
            liquidity = Math.min(
                (amount0Added * totalSupply()) / _reserve0,
                (amount1Added * totalSupply()) / _reserve1
            );
        }
        if (liquidity == 0) revert ZeroAmount();

        _mint(msg.sender, liquidity);

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);

        emit LiquidityAdded(msg.sender, amount0Added, amount1Added, liquidity);
    }

    function swap(
        uint amount0Out,
        uint amount1Out,
        address to
    ) external nonReentrant {
        if (amount0Out == 0 && amount1Out == 0) revert ZeroAmount();

        (uint112 _reserve0, uint112 _reserve1) = (reserve0, reserve1);

        if (amount0Out > _reserve0 || amount1Out > _reserve1)
            revert InsufficientLiquidity();

        if (amount0Out > 0) IERC20(token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).safeTransfer(to, amount1Out);

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0In = balance0 > (_reserve0 - amount0Out)
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint amount1In = balance1 > (_reserve1 - amount1Out)
            ? balance1 - (_reserve1 - amount1Out)
            : 0;

        if (amount0In == 0 && amount1In == 0) revert InsufficientInputAmount();

        if (balance0 * balance1 < uint(_reserve0) * uint(_reserve1))
            revert InsufficientInputAmount();

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);

        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function removeLiquidity(
        uint liquidity
    ) external nonReentrant returns (uint amount0, uint amount1) {
        if (liquidity == 0) revert ZeroAmount();

        uint _totalSupply = totalSupply();

        if (liquidity > (_totalSupply - MINIMUM_LIQUIDITY)) revert InsufficientLiquidityBalance(_totalSupply - MINIMUM_LIQUIDITY);

        uint112 _reserve0 = reserve0;
        uint112 _reserve1 = reserve1;

        amount0 = (uint(_reserve0) * liquidity) / _totalSupply;
        amount1 = (uint(_reserve1) * liquidity) / _totalSupply;

        if (amount0 == 0 && amount1 == 0) revert InsufficientLiquidity();

        _burn(msg.sender, liquidity);

        reserve0 -= _reserve0 - uint112(amount0);
        reserve1 -= _reserve1 - uint112(amount1);

        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);

        emit LiquidityRemoved(msg.sender, amount0, amount1, liquidity);
        return (amount0, amount1);
    }

    function getReserves() external view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }
}
