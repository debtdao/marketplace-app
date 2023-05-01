export default {
    "unlock-protocol": {
        "name": "Unlock Protocol",
        "desc": "PLatform for creating NFT-gated subscriptions, memberships, and event tickets.",
        "icon": "unlock-protocol",
        "networks": ['mainnet', 'gnosis', 'polygon', 'arbitrum', 'optimism'],

        // Revenue Contract - PublicLock.sol       
        "claimFuncSignature": "withdraw(address,address,uint)",
        "claimFuncSelector": "0xa31cfa81",
        // other managers cant remove others so must whitelist `renounceLockManager()`
        // for Operator to call after transfering ownership
        "transferFuncSignature": "addLockManager(address)",
        "transferFuncSelector": "0xd2503485"
    },
    "superfluid": {
        "name": "Superfluid",
        "desc": "Asset streaming protocol bringing subscriptions, salaries, vesting, and rewards to DAOs and crypto-native businesses worldwide.",
        "icon": "superflui",
        "networks": ['mainnet', 'gnosis', 'polygon', 'arbitrum', 'optimism'],

        // Revenue Contract - Super Token        
        "claimFuncSignature": "burn(uint256,bytes)",
        // burns Super Token to receive underlying token
        "claimFuncSelector": "0xfe9d9303",

        "transferFuncSignature": "authorizeOperator(address)",
        // superfluid payments are more like "at will employment" contracts
        // receipients have no control of stream. custom super tokens can change that
        // this should only be called if you are distributing money which probably shouldnt be in a Spigot
        "transferFuncSelector": "0x959b8c3f"
    },
    "custom": {
        "name": "Custom",
        "desc": "Input function selector byte code manually",
        "icon": "spigot",
        "claimFuncSelector": "0x",
        "transferFuncSelector": "0x"
    }
}