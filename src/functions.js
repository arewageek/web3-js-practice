const { Web3 } = require('web3')
const Axios = require('axios')

// const axios = new Axios()

const provider = new Web3.providers.HttpProvider(process.env.INFURA_COMPLETE_URL)
const web3 = new Web3(provider)

const getABI = async contract => {
    const abi = await Axios.get('https://api.etherscan.io/api?module=contract&action=getabi&address=0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359')
    return JSON.parse(abi.data.result)
}

const contractData = async (contract, abi) => {
    const token = new web3.eth.Contract(abi, contract)

    const response = {
        totalSupply: token.methods
    }
    return token.methods.balanceOf('')
}

module.exports = {
    abi: getABI,
    contractData
}