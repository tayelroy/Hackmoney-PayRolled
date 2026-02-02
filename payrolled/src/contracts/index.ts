export const PAYROLL_DISTRIBUTOR_ADDRESS = '0xeDc9Fe2E7A557eA17D94fc15Cf07eD54E2F0379C';

export const PAYROLL_DISTRIBUTOR_ABI = [
    {
        "type": "function",
        "name": "batchPay",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "datas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "event",
        "name": "PayrollExecuted",
        "inputs": [
            {
                "name": "from",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "totalAmount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "count",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    }
] as const;
