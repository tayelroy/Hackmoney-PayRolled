// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PayrollDistributor} from "../src/PayrollDistributor.sol";

contract DeployPayroll is Script {
    function run() external {
        vm.startBroadcast(); 
        PayrollDistributor payroll = new PayrollDistributor();
        console.log("PayrollDistributor deployed at:", address(payroll));
        vm.stopBroadcast();
    }
}
