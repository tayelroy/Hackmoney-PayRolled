How to go from "Employee Database" → Solidity Arrays
Solidity doesn't understand your JavaScript "Employee Objects." It expects Three Separate Parallel Arrays (Lists).

You need to "unzip" your list of employees.

Step A: Your "Database" (Frontend State)
Imagine your React app has this list of employees you want to pay:

TypeScript
// This is what your "Database" looks like in JavaScript
const employees = [
  {
    id: "alice",
    wallet: "0x7099...79C8", // Alice's Wallet
    amount: "100",           // 100 USDC
    routeData: "0x"          // "0x" means direct pay. If bridging, this comes from LI.FI
  },
  {
    id: "bob",
    wallet: "0x3C44...93BC", // Bob's Wallet
    amount: "500",           // 500 USDC
    routeData: "0x"
  }
];
Step B: The Transformation (The "Unzip")
You use the JavaScript .map() function to pull out the columns into separate arrays.

TypeScript
import { parseUnits } from 'viem';

// 1. Create the 'targets' array (Who gets the call?)
// If bridging, this might be the Bridge Address. If direct, it's the User Address.
const targets = employees.map(emp => emp.wallet); 
// Result: ["0x7099...", "0x3C44..."]

// 2. Create the 'datas' array (Instructions)
const datas = employees.map(emp => emp.routeData); 
// Result: ["0x", "0x"]

// 3. Create the 'values' array (Money)
// IMPORTANT: You must convert "100" to "100000000" (wei/decimals)
const values = employees.map(emp => parseUnits(emp.amount, 18)); 
// Result: [100000000000000000000n, 500000000000000000000n]
Step C: Sending it to the Contract (Wagmi)
Now you pass those three distinct variables into your writeContract hook.

TypeScript
writeContract({
  address: PAYROLL_CONTRACT_ADDRESS,
  abi: PayrollABI,
  functionName: 'batchPay',
  args: [
    targets,  // address[]
    datas,    // bytes[]
    values    // uint256[]
  ],
  value: totalSum // You must send the TOTAL sum of USDC with the transaction!
});
Crucial Note on value: Because your Solidity function is payable and checks require(msg.value >= totalValue), you must calculate the sum of all payments in your frontend and attach it to the transaction as the value override, or the transaction will revert.