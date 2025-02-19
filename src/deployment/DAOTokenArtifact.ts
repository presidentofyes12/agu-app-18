// src/deployment/DAOTokenArtifact.ts
export const DAOTokenArtifact = {
  abi: [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "dao",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "isPermanent",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "BidSettled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "allocation",
				"type": "uint256"
			}
		],
		"name": "DailyAllocationUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "settlementPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalVolume",
				"type": "uint256"
			}
		],
		"name": "DailySettlementCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "oldPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newPrice",
				"type": "uint256"
			}
		],
		"name": "PriceUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "UserStatusChanged",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "ANNUAL_SUPPLY",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "DAILY_SUPPLY",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MARKET_PORTION",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PER_USER_BASE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "activeDaoList",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "activeUserCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "activeUserIndex",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "activeUserPosition",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "anonymousTransactions",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "publicKeyHash",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "creationTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "claimed",
				"type": "bool"
			},
			{
				"internalType": "bytes32",
				"name": "conditionHash",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "calculateDailyAllocation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "calculateMarketImpact",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "txHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "condition",
				"type": "bytes"
			}
		],
		"name": "claimAnonymousTransaction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "publicKeyHash",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "conditionHash",
				"type": "bytes32"
			}
		],
		"name": "createAnonymousTransaction",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "teamId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "daoId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "createMarketplaceListing",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "createTeam",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "currentDailyPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "dailyAllocation",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "daoAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "daoBiddingShares",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "daoPosInList",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "dao",
				"type": "address"
			}
		],
		"name": "getDaoLimit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "dao",
				"type": "address"
			}
		],
		"name": "getTotalDaoBids",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isActiveUser",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isDaoMember",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "lastActivity",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastAnnualMint",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastDailyPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "lastDistribution",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastUserBaseCalculation",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "listingCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "listings",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "teamId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "daoId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "performAnnualMint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "permanentBids",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPermanent",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isSettled",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPermanent",
				"type": "bool"
			}
		],
		"name": "placeBid",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "recordActivity",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "member",
				"type": "address"
			}
		],
		"name": "registerMember",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_daoAddress",
				"type": "address"
			}
		],
		"name": "setDAOAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teamCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "teams",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "valueCreated",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastActivityTimestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "temporaryBids",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPermanent",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isSettled",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "treasuryBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userTeams",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "txHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "condition",
				"type": "bytes"
			}
		],
		"name": "verifyTransactionClaim",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawTreasury",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
],
  bytecode: "0x60806040818152600480361015610014575f80fd5b5f92833560e01c90816306fdde03146125d057508063075f150c1461258b578063095ea7b3146124e25780630d893b1a1461247857806310ee294e146122f6578063166bab95146121fb57806318160ddd146121dc5780631c67211d1461219e5780632131c68c1461217557806323b872dd146120835780632f7c88f514611fcd578063313ce56714611fb1578063313dab2014611f9257806331c536f614611f5a5780633ed2b77a14611f0f5780634127281514611d255780634202d21414611ed157806344b50bfc14611e9957806348a3781714611e7357806349de2b1a14611d2a5780634ec5040414611d25578063515a50d314611c9a578063520c683814611c7b5780635da544ad14611a2a578063601108fc146118dd57806370a08231146118a6578063728e9ecc14611887578063803bc87f146118685780638201db18146118305780638a59d847146115f85780638caa0083146115d95780638d5f3c111461147857806391cd695d1461099f578063952eff651461095f57806395d89b411461085b57806395dc7c7f14610823578063965afa891461076b578063a3976a011461074a578063a4f602e5146106ae578063a9059cbb1461067d578063a9b07c261461065e578063ae3492c61461062c578063af8818d01461060c578063c2784943146105df578063dd62ed3e14610596578063de74e57b14610531578063e2a99c4614610512578063e41c8398146104ea578063ef7e235b146104cb578063f07e96b314610493578063f43040641461045b578063f4598cfd146104385763fcb4888e14610267575f80fd5b34610434576020908160031936011261043057610282612709565b9033855260118352838520546010548110908161040c575b50156103d5575060018060a01b031690818452600d81528284209060019360ff19928584825416179055600a825284818720556102de6102d933612b23565b612a4c565b838652601b82528086208584825460ff811615610379575b50505050838652601882524281872055601b8252808620805460ff81161561031c578780f35b5f805160206131aa83398151915294879116179055601c548652600e8252808620846001600160601b0360a01b825416179055610366601c54858852600f845280838920556129a2565b601c5551428152a35f8080808080808780f35b16179055601c548652600e8252808620846001600160601b0360a01b8254161790556103b2601c54858852600f845280838920556129a2565b601c5584845f805160206131aa833981519152848451428152a35f8584826102f6565b835162461bcd60e51b815290810183905260116024820152704e6f7420616e206163746976652044414f60781b6044820152606490fd5b6104169150612803565b905460039190911b1c6001600160a01b031633145f61029a565b8380fd5b8280fd5b505034610457578160031936011261045757602090601d549051908152f35b5080fd5b5050346104575760203660031901126104575760209181906001600160a01b03610483612709565b168152600a845220549051908152f35b5050346104575760203660031901126104575760209181906001600160a01b036104bb612709565b1681526018845220549051908152f35b5050346104575781600319360112610457576020906007549051908152f35b50503461045757602090610509610500366127b3565b93929092612f6a565b90519015158152f35b5050346104575781600319360112610457576020906008549051908152f35b509034610434576020366003190112610434578060ff9160c094843581526014602052208054936001820154926002830154916003840154930154938151968752602087015285015260608401528181161515608084015260081c16151560a0820152f35b505034610457578060031936011261045757806020926105b4612709565b6105bc612723565b6001600160a01b0391821683526001865283832091168252845220549051908152f35b50503461045757602036600319011261045757602090610605610600612709565b6129b0565b9051908152f35b5050346104575781600319360112610457576020905164141dd760008152f35b503461043457602036600319011261043457358252600e6020908152918190205490516001600160a01b039091168152f35b5050346104575781600319360112610457576020906016549051908152f35b5050346104575780600319360112610457576020906106a761069d612709565b60243590336128a6565b5160018152f35b509134610747576020366003190112610747578235601e546401b984112f908181029181830414901517156107345764174876e800900491670de0b6b3a764000090818302918383041483151715610721576020856106058661071b6107148888612a1b565b9180612a1b565b90612a2e565b634e487b7160e01b815260118652602490fd5b634e487b7160e01b835260118552602483fd5b80fd5b50503461045757816003193601126104575760209051651cb3950c70008152f35b503461043457602036600319011261043457610785612709565b60125491906001600160a01b03908184166107ee57169283156107b55750506001600160a01b0319161760125580f35b906020606492519162461bcd60e51b83528201526013602482015272496e76616c69642044414f206164647265737360681b6044820152fd5b845162461bcd60e51b8152602081850152600f60248201526e111053c8185b1c9958591e481cd95d608a1b6044820152606490fd5b5050346104575760203660031901126104575760209181906001600160a01b0361084b612709565b1681526017845220549051908152f35b50919034610457578160031936011261045757805191809380549160019083821c92828516948515610955575b60209586861081146109425785895290811561091e57506001146108c6575b6108c287876108b8828c0383612884565b51918291826126c2565b0390f35b81529295507f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b5b82841061090b57505050826108c2946108b892820101945f806108a7565b80548685018801529286019281016108ed565b60ff19168887015250505050151560051b83010192506108b8826108c25f806108a7565b634e487b7160e01b845260228352602484fd5b93607f1693610888565b50346104345760203660031901126104345735916010548310156107475750610989602092612803565b905491519160018060a01b039160031b1c168152f35b5091346107475780600319360112610747576109bd6102d933612b23565b601d54916201518092838101808211611465576109dc90421015612a8e565b62127500810180911161073457421015611335575b670de0b6b3a7640000936007548015158061132a575b6112cc575b506401b984112f9480860290868204036112b957670de0b6b3a7640000900490601c94610a3a865484612a1b565b878102908082048914811517156112a657610a5e9064174876e80080930490612981565b9764141dd76000808a10611274575b506008988954600755875b8954811015610ad957808952600e6020908152888a20546001600160a01b0316808b52601b8252898b2054610ab893929060ff16610abd575b50506129a2565b610a78565b81610aca8b601a94612ac6565b8c525242898b20555f80610ab1565b50919397509195935080601e55610e108551968288527f58c3fe4f561c8c51a47f84938c2043649a09ae6f2132c7047b9a3668c3917c8e60208099a1610b216102d933612b23565b4206116112315781810291818304149015171561121e57949192940493829183955b601054871015610c8557610b5687612803565b9054600391821b1c6001600160a01b0316808752600b885284872090969093919291815b8554811015610c6c5760ff85610b908389612739565b5001548d1c161580610c4e575b610bb0575b610bab906129a2565b610b7a565b96610be4610bab9186610bc38b8a612739565b5001805461ff001916610100179055610bdc8a89612739565b505490612981565b97610bfb610bf28289612739565b50548b306128a6565b8a8a7f9e7fd281b1dce2314e2103ce01aebc9ab4b6c9407341a2df5b9fa74d32900c448a610c29858c612739565b5054610c35868d612739565b5094600180960154908351928352820152a39050610ba2565b5083610c65610c5d8389612739565b50548a612981565b1115610b9d565b50989196509250610c7d91506129a2565b959093610b43565b8785878593829383601054905b8181106111d85750610ca386612d2e565b95610cb088519788612884565b808752610cbf601f1991612d2e565b01855b81811061119f57505084855b8281106110a35750505083955b8551871015610dc557845b610cf1888851612d0d565b5f198101908111610db257811015610d9d5784610d0e8289612d1a565b5101516001820190818311610d8a5790610d3d929187610d2e838c612d1a565b51015111610d42575b506129a2565b610ce6565b610d8390610d50838b612d1a565b51610d5b828c612d1a565b51610d66858d612d1a565b52610d71848c612d1a565b50610d7c828c612d1a565b5289612d1a565b508a610d37565b634e487b7160e01b885260118b52602488fd5b50919095610daa906129a2565b959091610cdb565b634e487b7160e01b875260118a52602487fd5b879394928692845b845181108061109a575b15610ea25782610de78287612d1a565b51511015610e9a578486610dfb8383612d1a565b51515b86610e12610e0c8686612d1a565b51612d46565b8c83610e2d575b505050505050610e28906129a2565b610dcd565b90817f9e7fd281b1dce2314e2103ce01aebc9ab4b6c9407341a2df5b9fa74d32900c449392610e7689610e6588610e289c9b9e612d0d565b9c610e718987306128a6565b612d1a565b5101518351958652908501526001600160a01b031692a3905084868a86818c610e19565b848684610dfe565b509250509192610eb0612e43565b91849185601054905b818110611019575050610ece6102d933612b23565b8315610fe65760075480610f49575b5050947f945c1c4e99aa89f648fbfe3df471b916f719e16d960fcec0737d4d56bd6968388487857f3478244af5961cc56eefb1d3486a4e3c4d1051e49100fb0efc408aa68a17b15298995491826007555581519081528584820152a18351928352820152a142601d5580f35b80851115610fd757610f5b8186612d0d565b620f424090818102918183041490151715610fc4576123f091610f7d91612a2e565b11610f885780610edd565b845162461bcd60e51b815290810187905260166024820152755072696365206368616e676520746f6f206c6172676560501b6044820152606490fd5b634e487b7160e01b885260118352602488fd5b610fe18582612d0d565b610f5b565b845162461bcd60e51b8152908101879052600d60248201526c496e76616c696420707269636560981b6044820152606490fd5b61102281612803565b9054600391821b1c6001600160a01b03168952600b8a528789208054918a5b83811061105a5750505050611055906129a2565b610eb9565b60ff826110678386612739565b500154891c16611080575b61107b906129a2565b611041565b9761109261107b91610bdc8b86612739565b989050611072565b50821515610dd7565b836110b1829a96959a612803565b9054600391821b1c6001600160a01b03168952600c88528689208054929091908a908c908b905b8684106110f857505050505050506110ef906129a2565b97929397610cce565b84908c6111058689612739565b5060ff9384910154831c161561112c575b5050505050611124906129a2565b8b8a8e6110d8565b938a93610d3793879c9389611192986111486111249b8e612739565b509080519561115687612868565b82548752600183015490870152600282015490860152015490828216151560608501521c161515608082015261118c8383612d1a565b52612d1a565b9590508b8a5f8f8c611116565b859089959499516111af81612868565b8881528883820152888782015288606082015288608082015282828b0101520197929397610cc2565b9561120f611215916111ed899a96959a612803565b905460039190911b1c6001600160a01b03168852600c87528588205490612981565b966129a2565b96919296610c92565b634e487b7160e01b835260118652602483fd5b845162461bcd60e51b8152808801879052601960248201527f4f75747369646520736574746c656d656e742077696e646f77000000000000006044820152606490fd5b8981039081116112935761128a90600654612981565b6006555f610a6d565b634e487b7160e01b885260118552602488fd5b634e487b7160e01b875260118452602487fd5b634e487b7160e01b845260118252602484fd5b6008959195548281029080820484149015171561131757906112ed91612a2e565b908110156113115761130881670de0b6b3a764000092612a1b565b04935b5f610a0c565b9361130b565b634e487b7160e01b855260118752602485fd5b506008541515610a07565b90918291621274ff19420192428411935b601c80548084101561145457838852600e9160209183835260018060a01b039081888c20541694858c52601885528a898d20549061142a5787111561143e575f199282840192831161142a579082918d9384528187528a84205416918984528a8420926001600160601b0360a01b9381858254161790558452898b600f95868a5220558d528552888c20908154169055848b5283528987812055601b8352868a2060ff198154169055815480156114175701905584514281528892915f805160206131aa83398151915291a3611346565b634e487b7160e01b8b5260118c5260248bfd5b50634e487b7160e01b8c5260118d5260248cfd5b5050505050509061144e906129a2565b90611346565b505050509092915042601d556109f1565b634e487b7160e01b845260118652602484fd5b508290346104575761149861148c366127b3565b92849594929192612f6a565b156115a65782526019602052828220818101805460ff8116611571576003830154628e6200810180911161155e5742116115315760018301546001600160a01b031693338590036114fe575060ff19166001179055600201546114fb91306128a6565b80f35b606490602088519162461bcd60e51b8352820152600d60248201526c139bdd081c9958da5c1a595b9d609a1b6044820152fd5b855162461bcd60e51b81526020818601526007602482015266115e1c1a5c995960ca1b6044820152606490fd5b634e487b7160e01b865260118552602486fd5b855162461bcd60e51b8152602081860152600f60248201526e105b1c9958591e4818db185a5b5959608a1b6044820152606490fd5b835162461bcd60e51b8152602081840152600d60248201526c496e76616c696420636c61696d60981b6044820152606490fd5b5050346104575781600319360112610457576020906015549051908152f35b50903461043457826003193601126104345733835260209260178452818120546117fc576116276015546129a2565b92836015558251908582019067ffffffffffffffff9183811083821117611763578552838352845161165881612868565b8681528781019384528581018581526060820142815260808301916001958684528a895260138c528989209451855586850197519788519182116117e957600160401b988983116117d6578d908b84848054928282558383106117a3575b505050509181899694929897959301908c52878c208a8d5b848110611776575050505050611701955051600285015551600384015551151591019060ff801983541691151516179055565b85845260138752818585200191825493841015611763578301808355831015611750575082528482200180546001600160a01b0319163390811790915581526017845281902082905551908152f35b634e487b7160e01b845260329052602483fd5b634e487b7160e01b855260418252602485fd5b9193959750919395979860018060a01b03855116940193818401550191889593918f989795938b906116ce565b808e93928792522092830192015b8281106117c257505084848e6116b6565b90919293508d815501908f92918b906117b1565b634e487b7160e01b8b526041885260248bfd5b634e487b7160e01b8a526041875260248afd5b5091606492519162461bcd60e51b8352820152600f60248201526e416c726561647920696e207465616d60881b6044820152fd5b5050346104575760203660031901126104575760209181906001600160a01b03611858612709565b168152600f845220549051908152f35b5050346104575781600319360112610457576020906009549051908152f35b505034610457578160031936011261045757602090601c549051908152f35b5050346104575760203660031901126104575760209181906001600160a01b036118ce612709565b16815280845220549051908152f35b50919034610457576060366003190112610457578235918281526020936013855260ff81848420015416156119f757338252601785528383832054036119c2576119bc916119a586926119316016546129a2565b9687938460165587519161194483612838565b85835286830190815288830190602435825289606085019360443585526014608087019a828c5260a088019a60018c5283525220935184555160018401555160028301555160038201550192511515839060ff801983541691151516179055565b51815461ff00191690151560081b61ff0016179055565b51908152f35b825162461bcd60e51b8152908101859052600f60248201526e2737ba103a32b0b69036b2b6b132b960891b6044820152606490fd5b825162461bcd60e51b8152908101859052600d60248201526c5465616d20696e61637469766560981b6044820152606490fd5b50346104345760603660031901126104345780359060249081359360449182359081151593848303611c7757338952602095600d875260ff858b20541615611c4557611a7533612ca4565b8415611bde576103e8601e54048910611bad576019810281810460191482151715611b9b57606490048911611b6657611ab689611ab1336129b0565b612981565b11611b31575050505b15611af9576114fb94338752600b845281872093825195611adf87612868565b865285015242908401526060830152836080830152612c15565b90506114fb93338652600c835281862092825194611b1686612868565b85528401524290830152836060830152836080830152612c15565b845162461bcd60e51b815292830187905260119083015270115e18d959591cc8111053c81b1a5b5a5d607a1b90820152606490fd5b855162461bcd60e51b815280850189905260118184015270115e18d959591cc80c8d49481b1a5b5a5d607a1b81850152606490fd5b634e487b7160e01b8c5260118552828cfd5b855162461bcd60e51b8152808501899052600d818401526c109a59081d1bdbc81cdb585b1b609a1b81850152606490fd5b600381029080820460031490151715611c33578811611bff57505050611abf565b845162461bcd60e51b81529283018790526010908301526f115e18d959591cc80cde081b1a5b5a5d60821b90820152606490fd5b50634e487b7160e01b8a526011835289fd5b845162461bcd60e51b8152928301879052600e908301526d2737ba102220a79036b2b6b132b960911b90820152606490fd5b8880fd5b505034610457578160031936011261045757602090601e549051908152f35b505034610457578060031936011261045757611cb4612709565b6001600160a01b03168252600b602052808220805460243591908210156104305790611cdf91612739565b5080546001820154600283015460039093015493519182526020820152604081019190915260ff8083161515606083015260089290921c9091161515608082015260a090f35b612766565b5091903461045757608036600319011261045757823591611d49612723565b60443591338152602094818652838583205410611e39576119bc939291611e2e879860059388518a8101908282526001600160601b03198860601b168b82015288605482015242607482015260748152611da281612868565b519020998a948a51978893611db685612838565b84528284019060018060a01b0380911682528c808601938c85526019606088019642885260a060808a0199848b52019b6064358d528352522099518a5560018a019151166001600160601b0360a01b8254161790555160028801555160038701555115159085019060ff801983541691151516179055565b5191015530336128a6565b845162461bcd60e51b81528088018790526014602482015273496e73756666696369656e742062616c616e636560601b6044820152606490fd5b50503461045757602036600319011261045757602090610605611e94612709565b612ca4565b5050346104575760203660031901126104575760209181906001600160a01b03611ec1612709565b168152601a845220549051908152f35b5050346104575760203660031901126104575760209160ff9082906001600160a01b03611efc612709565b168152601b855220541690519015158152f35b503461043457602036600319011261043457816080938235815260136020522080549260ff600283015493600384015493015416928151948552602085015283015215156060820152f35b5050346104575760203660031901126104575760209181906001600160a01b03611f82612709565b1681526011845220549051908152f35b5050346104575781600319360112610457576020906006549051908152f35b5050346104575781600319360112610457576020905160128152f35b5050346104575760208060031936011261043457601890611fec612709565b611ff86102d933612b23565b6001600160a01b0316808552601b8252838520805460ff811615612024575b5050845252429082205580f35b60ff19166001179055601c80548652600e835284862080546001600160a01b0319168317905554818652600f8352848620819055612061906129a2565b601c556001815f805160206131aa833981519152848751428152a35f80612017565b5082346107475760603660031901126107475761209e612709565b6120a6612723565b916044359360018060a01b038316808352600160205286832033845260205286832054915f1983036120e1575b6020886106a78989896128a6565b86831061214957811561213257331561211b575082526001602090815286832033845281529186902090859003905582906106a7876120d3565b8751634a1406b160e11b8152908101849052602490fd5b875163e602df0560e01b8152908101849052602490fd5b8751637dc7a0d960e11b8152339181019182526020820193909352604081018790528291506060010390fd5b50503461045757816003193601126104575760125490516001600160a01b039091168152602090f35b5050346104575760203660031901126104575760209160ff9082906001600160a01b036121c9612709565b168152600d855220541690519015158152f35b5050346104575781600319360112610457576020906002549051908152f35b5082903461045757816003193601126104575761221a6102d933612b23565b612229601e54601c5490612a1b565b6002549061223a6006548093612d0d565b90808210156122b3579061224d91612d0d565b91818311612278575090612264816114fb93612d0d565b6006556012546001600160a01b0316612ac6565b606490602086519162461bcd60e51b83528201526015602482015274496e73756666696369656e7420747265617375727960581b6044820152fd5b855162461bcd60e51b8152602081860152601860248201527f53756666696369656e7420737570706c792065786973747300000000000000006044820152606490fd5b5090346104345782600319360112610434576123146102d933612b23565b6009546301e187f981018091116124655761233190421015612a8e565b600254651cb3950c7000928382018092116124525766038d7ea4c68000821161241a57601c546401b984112f9080820291820481036124075764052c8c338d0290808204600314901517156123f4576006541061238c578480f35b30156123dd57506002553083528260205280832082815401905551908152817fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60203093a3426009555f8080808480f35b825163ec442f0560e01b8152908101859052602490fd5b634e487b7160e01b865260118252602486fd5b634e487b7160e01b875260118352602487fd5b606490602084519162461bcd60e51b8352820152601260248201527114dd5c1c1b1e4818d85c081c995858da195960721b6044820152fd5b634e487b7160e01b855260119052602484fd5b634e487b7160e01b845260118352602484fd5b509034610434576020366003190112610434578060c0938335815260196020522080549260018060a01b0360018301541692600283015490600560ff60038601549486015416940154948151968752602087015285015260608401521515608083015260a0820152f35b50346104345781600319360112610434576124fb612709565b602435903315612574576001600160a01b031691821561255d57508083602095338152600187528181208582528752205582519081527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925843392a35160018152f35b8351634a1406b160e11b8152908101859052602490fd5b835163e602df0560e01b8152808401869052602490fd5b5050346104575780600319360112610457576125a5612709565b6001600160a01b03168252600c602052808220805460243591908210156104305790611cdf91612739565b9291905034610430578360031936011261043057600354600181811c91869082811680156126b8575b60209586861082146126a55750848852908115612683575060011461262a575b6108c286866108b8828b0383612884565b929550600383527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b82841061267057505050826108c2946108b892820101945f612619565b8054868501880152928601928101612653565b60ff191687860152505050151560051b83010192506108b8826108c25f612619565b634e487b7160e01b845260229052602483fd5b93607f16936125f9565b602080825282518183018190529093925f5b8281106126f557505060409293505f838284010152601f8019910116010190565b8181018601518482016040015285016126d4565b600435906001600160a01b038216820361271f57565b5f80fd5b602435906001600160a01b038216820361271f57565b8054821015612752575f5260205f209060021b01905f90565b634e487b7160e01b5f52603260045260245ffd5b3461271f575f36600319011261271f5760206040516401b984112f8152f35b9181601f8401121561271f5782359167ffffffffffffffff831161271f576020838186019501011161271f57565b90606060031983011261271f576004359167ffffffffffffffff9160243583811161271f57826127e591600401612785565b9390939260443591821161271f576127ff91600401612785565b9091565b6010548110156127525760105f527f1b6847dc741a1b0cd08d278845f9d819d87b734759afb55fe2de5cb82a9ae67201905f90565b60c0810190811067ffffffffffffffff82111761285457604052565b634e487b7160e01b5f52604160045260245ffd5b60a0810190811067ffffffffffffffff82111761285457604052565b90601f8019910116810190811067ffffffffffffffff82111761285457604052565b916001600160a01b038084169283156129695716928315612951575f908382528160205260408220549083821061291f575091604082827fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef958760209652828652038282205586815220818154019055604051908152a3565b60405163391434e360e21b81526001600160a01b03919091166004820152602481019190915260448101839052606490fd5b60405163ec442f0560e01b81525f6004820152602490fd5b604051634b637e8f60e11b81525f6004820152602490fd5b9190820180921161298e57565b634e487b7160e01b5f52601160045260245ffd5b5f19811461298e5760010190565b6001600160a01b03165f908152600b60205260408120805490825b8281106129d85750505090565b60ff60036129e68385612739565b50015460081c1615612a01575b6129fc906129a2565b6129cb565b92612a136129fc91610bdc8685612739565b9390506129f3565b8181029291811591840414171561298e57565b8115612a38570490565b634e487b7160e01b5f52601260045260245ffd5b15612a5357565b60405162461bcd60e51b8152602060048201526013602482015272145d5bdc9d5b481b9bdd081858da1a595d9959606a1b6044820152606490fd5b15612a9557565b60405162461bcd60e51b8152602060048201526009602482015268546f6f206561726c7960b81b6044820152606490fd5b6001600160a01b0316908115612951577fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef602082612b075f94600254612981565b60025584845283825260408420818154019055604051908152a3565b6001600160a01b039081165f908152601b60209081526040808320549092919060ff1615612bdc579281928294601c54955b868110612b9d5750505050620f424091828102928184041490151715612b895750620a2c2a91612b8491612a2e565b101590565b634e487b7160e01b81526011600452602490fd5b808552600e82528383862054168552600a825282852054612bc7575b612bc2906129a2565b612b55565b94612bd4612bc2916129a2565b959050612bb9565b60649083519062461bcd60e51b82526004820152601360248201527250726f706f736572206e6f742061637469766560681b6044820152fd5b8054600160401b81101561285457612c3291600182018155612739565b919091612c915760806003612c8f938351815560208401516001820155604084015160028201550191612c7760608201511515849060ff801983541691151516179055565b0151815461ff00191690151560081b61ff0016179055565b565b634e487b7160e01b5f525f60045260245ffd5b6001600160a01b03165f908152600a602052604090205460018110612cd557612cd1606491601e54612a1b565b0490565b60405162461bcd60e51b815260206004820152601060248201526f42656c6f77203125206d696e696d756d60801b6044820152606490fd5b9190820391821161298e57565b80518210156127525760209160051b010190565b67ffffffffffffffff81116128545760051b60200190565b601054905f5b828110612d8c5760405162461bcd60e51b8152602060048201526011602482015270109a5908111053c81b9bdd08199bdd5b99607a1b6044820152606490fd5b612d9581612803565b60018060a01b0391549060031b1c16805f52602090600c8252604091825f20905f938254945b858110612dd657505050505050612dd1906129a2565b612d4c565b6002612de28286612739565b500154828901511480612e2e575b80612e14575b612e0857612e03906129a2565b612dbb565b50505050935050505090565b506001612e218286612739565b5001548389015114612df6565b50612e398185612739565b5054885114612df0565b5f8081601054905b818110612e6e5750508015612e6657612e6391612a2e565b90565b505060085490565b612e7781612803565b9054600391821b1c6001600160a01b03165f908152600b6020526040812080549290915b838110612eb45750505050612eaf906129a2565b612e4b565b60ff82612ec18386612739565b50015460081c16612edb575b612ed6906129a2565b612e9b565b9596612f1c612f11612ed692612f0b612ef48b88612739565b50546001612f028d8a612739565b50015490612a1b565b90612981565b98610bdc8986612739565b969050612ecd565b92919267ffffffffffffffff82116128545760405191612f4e601f8201601f191660200184612884565b82948184528183011161271f578281602093845f960137010152565b9391905f9480865260196020526040938487209560058701548015159081613042575b506130385792612fe69697949282612fcc88612fdd97612fd7968251948592602084019788528484013781018a83820152036020810184520182612884565b519020923691612f24565b9061305e565b90949194613126565b81519160208301936001600160601b03199060601b168452601483528083019183831067ffffffffffffffff84111761302457505251902090541490565b634e487b7160e01b81526041600452602490fd5b5050505050505090565b905061304f368484612f24565b6020815191012014155f612f8d565b815191906041830361308e576130879250602082015190606060408401519301515f1a90613098565b9192909190565b50505f9160029190565b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841161311b57926020929160ff6080956040519485521684840152604083015260608201525f92839182805260015afa1561310f5780516001600160a01b0381161561310657918190565b50809160019190565b604051903d90823e3d90fd5b5050505f9160039190565b60048110156131955780613138575050565b600181036131525760405163f645eedf60e01b8152600490fd5b600281036131735760405163fce698f760e01b815260048101839052602490fd5b60031461317d5750565b602490604051906335e2f38360e21b82526004820152fd5b634e487b7160e01b5f52602160045260245ffdfefe95b7566a64915a53f97c4006299b7121549cae0faa5cf597d710f6ccaff110a26469706673582212209f13afc63720b119db2f640ed128624ccc3e8d8c7642d8187a59acd80e81c09f64736f6c63430008140033" // Add your bytecode here
};
