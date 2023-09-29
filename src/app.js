const { Block } = require('bitcore-lib')
const express = require('express')
const {Web3} = require('web3')
require('dotenv').config()

const ContractAbi = require('./abi.json')
const contractAddress = process.env.CONTRACT

const funcs = require('./functions')

const app = express()

const ganache = 'localhost:8595'
const port = process.env.PORT || 5000   

const httpProvider = new Web3.providers.HttpProvider(process.env.INFURA_COMPLETE_URL)  
const web3Http = new Web3(httpProvider)

// const wsProvider = new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL)
// const web3ws = new Web3(wsProvider)

let web3 = web3Http;

// const switchProvider = () => {
//     if(web3 == web3Http){
//         web3 = web3ws
//     }
//     else if(web3 == web3ws){
//         web3 = web3Http
//     }
//     else{
//         web3 = web3Http
//     }
// }

// web3ws.on('error', (e) => {
//     console.error('Websocket Provider Error: ', e)
//     switchProvider()
// })
// web3ws.on('end', () => {
//     console.log('Websocket Connection Closed')
//     switchProvider()
// })

app.get('/', async (req, res) => {
    const accounts = await web3.eth.getAccounts()
    res.json(accounts)
})

app.get('/balance', async(req, res) => {
    const balanceInWei = await web3ws.eth.getBalance(req.query.account)
    const balanceInEth = await web3ws.utils.fromWei(balanceInWei, 'ether')
    // res.send(balanceInWei)
    console.log(`Balance in Wei: ${balanceInWei} wei`)
    console.log(`Balance in Ethers  : ${balanceInEth} eth`)

    res.status(200).json({
        eth: balanceInEth
    })
})

app.get('/balance/ws', async (req, res) => {
    try{
        // get initial balance
        let balanceInWei = await web3.eth.getBalance(req.query.account)
        let txHash

        // subscription
        const sub = {
            address: req.query.account,
            topic: [null]
        }
        
        // get live balance from subscription
        web3.eth.subscribe('logs', {...sub}, async (error, result) => {
            if(error){
                console.log(error)
            }
            else{
                txHash = result
                const balance = await web3.eth.getBalance(req.query.account)
                balanceInWei = balance


                console.log({
                    ethBalance: await web3.utils.fromWei(balanceInEth, 'ether')
                })
                res.json({
                    ethBalance: await web3.utils.fromWei(balanceInEth, 'ether')
                })
            }
        })

        const balanceInEth = await web3.utils.fromWei(balanceInWei, 'ether')

        response = ({
            ethBalance: balanceInEth,
            weiBalance: balanceInWei,
        })

        console.log(response)
        // res.json({
        //     ethBalance: balanceInEth
        // })
    }
    catch(e){
        console.log("An error occurred", e)
    }
})

app.get('/transactions', async (req, res) => {
    // const subscription = web3.subsc
})

app.get('/abi', async (req, res) => {
    const contract = req.query.contract

    const abi = await funcs.abi(contract)
    
    const data = await funcs.contractData(contract, abi)

    console.log(data)
    res.json(data) 
})


app.get('/send', async (req, res) => {
    const { query } = req
    const amount = query.amount
    const weiAmount = await web3.utils.toWei(amount, 'ether')


    const balance = web3.eth.getBalance(query.from)

    if(balance < weiAmount){
        res.status(400).json({error: "Insufficient balance"})
    }
    
    const transactionObject = {
        from: query.from,   
        to: query.to,
        value: weiAmount,
        gas: 21000,
        gasPrice: '0x1000000000',
        nonce: `${await web3.eth.getTransactionCount(query.from, 'latest')}`
    }

    // res.send(await web3.)
    const signedTx = await web3.eth.accounts.signTransaction(transactionObject, 'b14094f07864c502c0ecd2003730f778d167b4b44cf7a77541cf1405cbddc13a')
        // .on('transactionHash', (transactionHash) => {
        //     console.log('Transaction hash:', transactionHash);
        //     res.json({ transactionHash });
        // })
        // .on('error', (error) => {
        //     // console.error('Error sending transaction:', error.reason);
        //     res.status(500).json({ error: 'Transaction failed', note: error.reason });
        // });

        
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    console.log(receipt)

})

app.get('/wallet/create', async (req, res) => {
    const account = web3.eth.accounts.create()
    res.json(account)
    console.log(account)
})

app.get('/transactions', async (req, res) => {
    const { query } = req
    const wallet = query.wallet

    const block = await web3.eth.getBlock('latest')
    const blockNumber = block.number

    if(blockNumber != null){
        for(let trxHash of block.transactions){
            console.log(trxHash)
            const transaction = await web3.eth.getTransaction(trxHash)
            console.log(transaction)
        }
    }
    
    // console.log(transactions)
})

app.get('/token/info', async (req, res) => {
    const contractAddress = req.query.contract

    const abi = await funcs.abi(contractAddress)
    
    // console.log(abi)
    // res.json(abi)
    // return;
    const contract = new web3.eth.Contract(ContractAbi, process.env.CONTRACT_ADDRESS)
    const methods = await contract.methods
    
    const token = await methods.totalSupply().call()
    // console.log(token)
    // return
    const tokenInEth = await web3.utils.fromWei(token, 'ether')
    console.log(`There's a total supply of ${tokenInEth} Ethers`)
    res.json(`There's a total supply of ${Number(tokenInEth)} Ethers`)
})

app.listen(port, () => {
    console.log(`Listening on Port: ${port}`)
})