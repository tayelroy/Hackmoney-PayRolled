// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayrollDistributor
 * @notice Distributes Native USDC (Gas Token on Arc) to multiple recipients.
 * @dev Stateless contract for gas efficiency.
 */
contract PayrollDistributor {
    /// @notice Emitted when a batch payroll is executed
    /// @param from The address initiating the payroll
    /// @param totalAmount The total value distributed
    /// @param count The number of recipients
    event PayrollExecuted(address indexed from, uint256 totalAmount, uint256 count);

    /**
     * @notice Distributes native coins to multiple addresses with specific interactions.
     * @param targets The list of recipient addresses
     * @param datas The list of calldata to send to each recipient (can be empty)
     * @param values The list of native coin amounts to send to each recipient
     */
    function batchPay(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external payable { // No nonReentrant needed as we follow checks-effects-interactions and it's stateless
        require(targets.length == values.length, "Array length mismatch: targets vs values");
        require(datas.length == values.length, "Array length mismatch: datas vs values");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
        }

        require(msg.value >= totalValue, "Insufficient funds sent");

        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Transfer failed");
        }

        // Refund dust
        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            require(success, "Refund failed");
        }

        emit PayrollExecuted(msg.sender, totalValue, targets.length);
    }
}
